import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { pool, query } from './db.js';

dotenv.config();

const app = express();
// Render provides PORT; fall back to API_PORT or 3000 for local dev
const port = Number(process.env.PORT || process.env.API_PORT || 3000);
const PRIVACY_POLICY_VERSION = '2026-08-27';
const TERMS_VERSION = '2026-08-27';

// SESSION TTL: 7 days
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Build the set of allowed CORS origins.
 * In production, only the configured CLIENT_URL is accepted.
 * In local dev (NODE_ENV !== 'production'), also allow localhost variants.
 */
function buildAllowedOrigins() {
  const origins = new Set();
  const clientUrl = (process.env.CLIENT_URL || '').trim().replace(/\/$/, '');
  if (clientUrl) origins.add(clientUrl);

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://127.0.0.1:5173');
    origins.add('http://localhost:5173');
    // Also allow any local port for flexibility in dev
    origins.add('http://127.0.0.1:5174');
    origins.add('http://localhost:5174');
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g., curl, Render health checks)
    if (!origin) {
      callback(null, true);
      return;
    }

    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.has(cleanOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
}));
app.use(express.json());

const PASSWORD_HASH_PREFIX = 'pbkdf2';

function legacyHashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 120000;
  const digest = crypto.pbkdf2Sync(String(password), salt, iterations, 64, 'sha512').toString('hex');
  return `${PASSWORD_HASH_PREFIX}$${iterations}$${salt}$${digest}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  if (!String(storedHash).startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return legacyHashPassword(password) === storedHash;
  }

  const [, iterations, salt, digest] = String(storedHash).split('$');
  const candidate = crypto.pbkdf2Sync(String(password), salt, Number(iterations), 64, 'sha512');
  if (Buffer.from(digest, 'hex').length !== candidate.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), candidate);
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * Persist session in user_sessions, store only the token hash.
 * Returns the raw token to send to the client.
 */
async function issueToken(userId, req) {
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await query(
    `INSERT INTO user_sessions (id, user_id, access_token_hash, user_agent, ip_address, expires_at)
     VALUES (:id, :userId, :tokenHash, :userAgent, :ipAddress, :expiresAt)`,
    {
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      userAgent: req?.headers?.['user-agent'] || null,
      ipAddress: req?.ip || null,
      expiresAt,
    },
  );

  return token;
}

/**
 * Validate a Bearer token against user_sessions.
 * Returns the user row or null.
 */
async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;

  const tokenHash = hashToken(token);

  const sessionRows = await query(
    `SELECT user_id FROM user_sessions
     WHERE access_token_hash = :tokenHash
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    { tokenHash },
  );

  if (!sessionRows[0]) return null;

  const rows = await query('SELECT * FROM users WHERE id = :userId LIMIT 1', { userId: sessionRows[0].user_id });
  return rows[0] || null;
}

async function requireAdmin(req, res, next) {
  try {
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return res.status(401).json({ message: 'Acesso administrativo exige login.' });
    }

    if (authUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Apenas administradores podem acessar esta área.' });
    }

    req.authUser = authUser;
    next();
  } catch (error) {
    next(error);
  }
}

async function requireAuthenticated(req, res, next) {
  try {
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return res.status(401).json({ message: 'Login obrigatório para acessar este recurso.' });
    }

    if (authUser.account_status === 'blocked') {
      return res.status(403).json({ message: 'Usuário bloqueado. Procure o administrador.' });
    }

    req.authUser = authUser;
    next();
  } catch (error) {
    next(error);
  }
}

function calculateRemainingDays(subscription) {
  const endDate = subscription?.current_period_ends_at || subscription?.trial_ends_at;
  if (!endDate) return 0;

  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function mapUser(row, propertyName, subscription = null) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    photoUrl: row.photo_url,
    plan: row.plan,
    role: row.role,
    accountStatus: row.account_status,
    propertyName,
    subscriptionStatus: subscription?.status,
    planName: subscription?.plan_name,
    billingCycle: subscription?.billing_cycle,
    trialEndsAt: subscription?.trial_ends_at,
    currentPeriodEndsAt: subscription?.current_period_ends_at,
    remainingDays: calculateRemainingDays(subscription),
  };
}

async function getUserPropertyName(userId) {
  const rows = await query(
    'SELECT name FROM properties WHERE owner_id = :userId ORDER BY created_at ASC LIMIT 1',
    { userId },
  );
  return rows[0]?.name;
}

async function getUserSubscription(userId) {
  const rows = await query(`
    SELECT
      us.status,
      us.trial_ends_at,
      us.current_period_ends_at,
      sp.name AS plan_name,
      sp.billing_cycle
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = :userId
    ORDER BY us.created_at DESC
    LIMIT 1
  `, { userId });

  return rows[0] || null;
}

function planCodeFromRequest(plan, billingCycle) {
  if (plan === 'FREE') return 'free_30_days';
  return billingCycle === 'annual' ? 'premium_annual' : 'premium_monthly';
}

function normalizePromoCode(code) {
  return String(code || '').trim().toUpperCase();
}

function applyDiscount(amount, promotion) {
  const value = Number(amount || 0);
  if (!promotion) return value;

  if (promotion.discount_type === 'percent') {
    return Math.max(0, value - (value * Number(promotion.discount_value) / 100));
  }

  return Math.max(0, value - Number(promotion.discount_value));
}

async function validatePromotionCode(code, planCode) {
  const normalizedCode = normalizePromoCode(code);
  if (!normalizedCode) return null;

  const rows = await query(`
    SELECT promo.*, plans.plan_type
    FROM promotion_codes promo
    JOIN subscription_plans plans ON plans.code = :planCode
    WHERE promo.code = :code
      AND promo.active = TRUE
      AND (promo.starts_at IS NULL OR promo.starts_at <= NOW())
      AND (promo.expires_at IS NULL OR promo.expires_at >= NOW())
      AND (promo.max_uses IS NULL OR promo.times_used < promo.max_uses)
    LIMIT 1
  `, { code: normalizedCode, planCode });

  const promotion = rows[0];
  if (!promotion) {
    const error = new Error('Código promocional inválido ou expirado.');
    error.statusCode = 400;
    throw error;
  }

  if (promotion.applies_to_plan_type !== 'ALL' && promotion.applies_to_plan_type !== promotion.plan_type) {
    const error = new Error('Código promocional não se aplica ao plano escolhido.');
    error.statusCode = 400;
    throw error;
  }

  return promotion;
}

async function applyPromotionToLatestPayment(userId, promotion) {
  if (!promotion) return;

  const rows = await query(`
    SELECT pay.id, pay.amount
    FROM subscription_payments pay
    JOIN user_subscriptions sub ON sub.id = pay.subscription_id
    WHERE sub.user_id = :userId
    ORDER BY pay.created_at DESC
    LIMIT 1
  `, { userId });

  const payment = rows[0];
  if (!payment) return;

  await query(
    `UPDATE subscription_payments
     SET amount = :amount,
         external_reference = :reference
     WHERE id = :paymentId`,
    {
      paymentId: payment.id,
      amount: applyDiscount(payment.amount, promotion),
      reference: `PROMO:${promotion.code}`,
    },
  );

  await query(
    'UPDATE promotion_codes SET times_used = times_used + 1 WHERE id = :promotionId',
    { promotionId: promotion.id },
  );
}

function dateOnly(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function timeOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function numberValue(value) {
  return Number(value ?? 0);
}

async function getPropertyIdFromUser(req, res) {
  const userId = req.authUser?.id;
  if (!userId) {
    res.status(401).json({ message: 'Login obrigatório.' });
    return null;
  }

  const rows = await query(
    'SELECT id FROM properties WHERE owner_id = :userId ORDER BY created_at ASC LIMIT 1',
    { userId },
  );

  if (!rows[0]) {
    res.status(404).json({ message: 'Propriedade do usuário não encontrada.' });
    return null;
  }

  return rows[0].id;
}

function mapRevenue(row) {
  return {
    id: row.id,
    product: row.product,
    quantity: numberValue(row.quantity),
    unit: row.unit,
    unitPrice: numberValue(row.unit_price),
    totalAmount: numberValue(row.total_amount),
    buyer: row.buyer,
    date: dateOnly(row.revenue_date),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpense(row) {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    amount: numberValue(row.amount),
    date: dateOnly(row.expense_date),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    plantationId: row.plantation_id || undefined,
    livestockId: row.livestock_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPlantation(row) {
  return {
    id: row.id,
    culture: row.culture,
    variety: row.variety,
    plantedArea: numberValue(row.planted_area),
    plantingDate: dateOnly(row.planting_date),
    expectedHarvestDate: dateOnly(row.expected_harvest_date),
    status: row.status,
    estimatedProduction: numberValue(row.estimated_production),
    actualProduction: numberValue(row.actual_production),
    seedQuantity: numberValue(row.seed_quantity),
    fertilization: row.fertilization,
    applications: row.applications,
    costs: numberValue(row.costs),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLivestock(row) {
  return {
    id: row.id,
    type: row.type,
    breed: row.breed,
    quantity: numberValue(row.quantity),
    date: dateOnly(row.acquisition_date),
    feeding: row.feeding,
    vaccination: row.vaccination,
    weighing: row.weighing,
    production: row.production,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInventoryItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: numberValue(row.quantity),
    unit: row.unit,
    minimumStock: numberValue(row.minimum_stock),
    location: row.location,
    expirationDate: dateOnly(row.expiration_date),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCalendarEvent(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: dateOnly(row.event_date),
    time: timeOnly(row.event_time),
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    plantationId: row.plantation_id || undefined,
    livestockId: row.livestock_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInfoArticle(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    imageUrl: row.image_url || undefined,
    source: row.source,
    publishedAt: row.published_at,
  };
}

function mapAlert(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    priority: row.priority,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
    relatedEntity: row.related_entity_type && row.related_entity_id
      ? { type: row.related_entity_type, id: row.related_entity_id }
      : undefined,
  };
}

function mapPropertySettings(row) {
  return {
    propertyName: row.name,
    totalArea: numberValue(row.total_area),
    city: row.city || '',
    state: row.state || '',
    notificationLevel: row.notification_level || 'all',
  };
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '');
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: monthKey(date),
      month: monthLabel(date),
      revenue: 0,
      expenses: 0,
      result: 0,
    };
  });
}

function productionProgress(status) {
  return {
    planejada: 10,
    plantada: 25,
    em_desenvolvimento: 68,
    pronta_colheita: 95,
    colhida: 100,
    finalizada: 100,
  }[status] ?? 0;
}

function inventoryStatus(quantity, minimumStock) {
  if (quantity <= 0) return 'esgotado';
  if (quantity <= minimumStock) return 'estoque_baixo';
  return 'normal';
}

// ============================================================
// HEALTH
// ============================================================

app.get('/api/health', async (_req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok');
    const connected = rows[0]?.ok === '1' || rows[0]?.ok === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      database: connected ? 'connected' : 'unknown',
    });
  } catch (err) {
    console.error('[health] DB check failed:', err.message);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// ============================================================
// PLANS
// ============================================================

app.get('/api/plans', async (_req, res) => {
  const plans = await query(
    'SELECT code, name, plan_type AS "planType", billing_cycle AS "billingCycle", price, trial_days AS "trialDays" FROM subscription_plans WHERE active = TRUE ORDER BY price ASC',
  );
  res.json(plans);
});

// ============================================================
// AUTH
// ============================================================

app.post('/api/auth/register', async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    propertyName,
    plan,
    billingCycle,
    paymentMethod,
    promoCode,
    privacyAccepted,
  } = req.body;

  if (!name || !email || !password || !plan) {
    return res.status(400).json({ message: 'Nome, e-mail, senha e plano são obrigatórios.' });
  }

  if (!privacyAccepted) {
    return res.status(400).json({ message: 'É necessário aceitar a Política de Privacidade e os Termos de Uso.' });
  }

  const planCode = planCodeFromRequest(plan, billingCycle);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const promotion = await validatePromotionCode(promoCode, planCode);

    // Lookup plan
    const planRows = await client.query(
      'SELECT id, plan_type, billing_cycle, price, trial_days FROM subscription_plans WHERE code = $1 AND active = TRUE LIMIT 1',
      [planCode],
    );
    const planRow = planRows.rows[0];
    if (!planRow) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Plano não encontrado.' });
    }

    // Create user
    const userId = crypto.randomUUID();
    const userRows = await client.query(
      `INSERT INTO users (id, name, email, phone, password_hash, plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, email, phone || null, hashPassword(password), planRow.plan_type],
    );
    const userRow = userRows.rows[0];

    // Create property
    await client.query(
      'INSERT INTO properties (id, owner_id, name) VALUES ($1, $2, $3)',
      [crypto.randomUUID(), userId, propertyName || 'Minha propriedade'],
    );

    // Create subscription
    const subscriptionId = crypto.randomUUID();
    const trialDays = planRow.trial_days;
    let trialEndsAt = null;
    let currentPeriodEndsAt = null;

    if (planRow.plan_type === 'FREE') {
      trialEndsAt = new Date(Date.now() + trialDays * 86400000).toISOString();
      currentPeriodEndsAt = trialEndsAt;
    } else if (planRow.billing_cycle === 'monthly') {
      currentPeriodEndsAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (planRow.billing_cycle === 'annual') {
      currentPeriodEndsAt = new Date(Date.now() + 365 * 86400000).toISOString();
    }

    const subStatus = planRow.plan_type === 'FREE' ? 'trial' : 'active';
    await client.query(
      `INSERT INTO user_subscriptions (id, user_id, plan_id, status, trial_ends_at, current_period_ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [subscriptionId, userId, planRow.id, subStatus, trialEndsAt, currentPeriodEndsAt],
    );

    // Create pending payment for premium plans
    if (planRow.plan_type === 'PREMIUM') {
      await client.query(
        `INSERT INTO subscription_payments (id, subscription_id, amount, payment_method, status)
         VALUES ($1, $2, $3, $4, 'pendente')`,
        [crypto.randomUUID(), subscriptionId, planRow.price, paymentMethod || 'pix'],
      );
    }

    // Privacy consent
    await client.query(
      `INSERT INTO privacy_consents (id, user_id, policy_version, terms_version, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        userId,
        PRIVACY_POLICY_VERSION,
        TERMS_VERSION,
        req.ip || null,
        req.headers['user-agent'] || null,
      ],
    );

    await client.query('COMMIT');

    await applyPromotionToLatestPayment(userId, promotion);
    const property = await getUserPropertyName(userId);
    const subscription = await getUserSubscription(userId);
    const accessToken = await issueToken(userId, req);
    res.status(201).json({
      accessToken,
      user: mapUser(userRow, property, subscription),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Não foi possível criar a conta.' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  const rows = await query('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
  const userRow = rows[0];

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
  }

  if (userRow.account_status === 'blocked') {
    return res.status(403).json({ message: 'Usuário bloqueado. Procure o administrador.' });
  }

  if (!String(userRow.password_hash).startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :userId', {
      passwordHash: hashPassword(password),
      userId: userRow.id,
    });
  }

  const property = await getUserPropertyName(userRow.id);
  const subscription = await getUserSubscription(userRow.id);
  const accessToken = await issueToken(userRow.id, req);
  res.json({
    accessToken,
    user: mapUser(userRow, property, subscription),
  });
});

app.post('/api/auth/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  const rows = await query('SELECT id FROM users WHERE email = :email LIMIT 1', { email });
  const userRow = rows[0];

  if (!userRow) {
    return res.json({ message: 'Se o e-mail existir, um código de recuperação será gerado.' });
  }

  const token = createToken();
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES (:id, :userId, :tokenHash, NOW() + INTERVAL '30 minutes')`,
    { id: crypto.randomUUID(), userId: userRow.id, tokenHash: hashToken(token) },
  );

  res.json({
    message: 'Código de recuperação gerado.',
    devResetToken: process.env.NODE_ENV === 'production' ? undefined : token,
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    return res.status(400).json({ message: 'E-mail, código e nova senha são obrigatórios.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const rows = await query(`
    SELECT prt.id, prt.user_id
    FROM password_reset_tokens prt
    INNER JOIN users u ON u.id = prt.user_id
    WHERE u.email = :email
      AND prt.token_hash = :tokenHash
      AND prt.used_at IS NULL
      AND prt.expires_at > NOW()
    ORDER BY prt.created_at DESC
    LIMIT 1
  `, { email, tokenHash: hashToken(token) });

  if (!rows[0]) {
    return res.status(400).json({ message: 'Código inválido ou expirado.' });
  }

  await query(
    'UPDATE users SET password_hash = :passwordHash WHERE id = :userId',
    { passwordHash: hashPassword(password), userId: rows[0].user_id },
  );
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id',
    { id: rows[0].id },
  );

  res.status(204).send();
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (token) {
      const tokenHash = hashToken(token);
      await query(
        'UPDATE user_sessions SET revoked_at = NOW() WHERE access_token_hash = :tokenHash AND revoked_at IS NULL',
        { tokenHash },
      );
    }
  } catch (err) {
    console.error('[logout] Error revoking session:', err.message);
  }
  res.status(204).send();
});

// ============================================================
// USER PROFILE
// ============================================================

app.get('/api/user/profile', requireAuthenticated, async (req, res) => {
  const userId = req.authUser.id;

  const rows = await query('SELECT * FROM users WHERE id = :userId LIMIT 1', { userId });
  const userRow = rows[0];
  if (!userRow) return res.status(404).json({ message: 'Usuário não encontrado.' });

  const property = await getUserPropertyName(userRow.id);
  const subscription = await getUserSubscription(userRow.id);
  res.json(mapUser(userRow, property, subscription));
});

app.put('/api/user/profile', requireAuthenticated, async (req, res) => {
  const userId = req.authUser.id;
  const { name, email, phone, propertyName } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }

  await query(
    'UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :userId',
    { userId, name, email, phone: phone || null },
  );

  if (propertyName) {
    // PostgreSQL does not support ORDER BY + LIMIT in UPDATE directly; use subquery
    await query(
      `UPDATE properties
       SET name = :propertyName
       WHERE id = (
         SELECT id FROM properties WHERE owner_id = :userId ORDER BY created_at ASC LIMIT 1
       )`,
      { userId, propertyName },
    );
  }

  const rows = await query('SELECT * FROM users WHERE id = :userId LIMIT 1', { userId });
  const property = await getUserPropertyName(userId);
  const subscription = await getUserSubscription(userId);
  res.json(mapUser(rows[0], property, subscription));
});

app.put('/api/user/plan', requireAuthenticated, async (req, res) => {
  const { plan, billingCycle, paymentMethod, promoCode } = req.body;
  const userId = req.authUser.id;

  if (!plan) {
    return res.status(400).json({ message: 'Plano é obrigatório.' });
  }

  const currentUserRows = await query('SELECT plan FROM users WHERE id = :userId LIMIT 1', { userId });
  const currentUser = currentUserRows[0];
  if (!currentUser) return res.status(404).json({ message: 'Usuário não encontrado.' });

  if (currentUser.plan === 'PREMIUM' && plan === 'FREE') {
    return res.status(400).json({ message: 'Usuário Premium não pode voltar para Free pelo perfil.' });
  }

  const planCode = planCodeFromRequest(plan, billingCycle);
  const promotion = await validatePromotionCode(promoCode, planCode);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planRows = await client.query(
      'SELECT id, plan_type, billing_cycle, price, trial_days FROM subscription_plans WHERE code = $1 AND active = TRUE LIMIT 1',
      [planCode],
    );
    const planRow = planRows.rows[0];
    if (!planRow) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Plano não encontrado.' });
    }

    // Get current period end to carry over
    const currentPeriodRows = await client.query(
      `SELECT MAX(current_period_ends_at) AS ends_at FROM user_subscriptions
       WHERE user_id = $1 AND status IN ('trial', 'active', 'past_due')`,
      [userId],
    );
    const periodBase = currentPeriodRows.rows[0]?.ends_at && new Date(currentPeriodRows.rows[0].ends_at) > new Date()
      ? new Date(currentPeriodRows.rows[0].ends_at)
      : new Date();

    // Cancel active subscriptions
    await client.query(
      `UPDATE user_subscriptions SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = $1 AND status IN ('trial', 'active', 'past_due')`,
      [userId],
    );

    // Update user plan
    await client.query('UPDATE users SET plan = $1 WHERE id = $2', [planRow.plan_type, userId]);

    // New subscription
    const subscriptionId = crypto.randomUUID();
    const trialDays = planRow.trial_days;
    let trialEndsAt = null;
    let currentPeriodEndsAt = null;

    if (planRow.plan_type === 'FREE') {
      trialEndsAt = new Date(periodBase.getTime() + trialDays * 86400000).toISOString();
      currentPeriodEndsAt = trialEndsAt;
    } else if (planRow.billing_cycle === 'monthly') {
      currentPeriodEndsAt = new Date(periodBase.getTime() + 30 * 86400000).toISOString();
    } else if (planRow.billing_cycle === 'annual') {
      currentPeriodEndsAt = new Date(periodBase.getTime() + 365 * 86400000).toISOString();
    }

    const subStatus = planRow.plan_type === 'FREE' ? 'trial' : 'active';
    await client.query(
      `INSERT INTO user_subscriptions (id, user_id, plan_id, status, trial_ends_at, current_period_ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [subscriptionId, userId, planRow.id, subStatus, trialEndsAt, currentPeriodEndsAt],
    );

    if (planRow.plan_type === 'PREMIUM') {
      await client.query(
        `INSERT INTO subscription_payments (id, subscription_id, amount, payment_method, status)
         VALUES ($1, $2, $3, $4, 'pendente')`,
        [crypto.randomUUID(), subscriptionId, planRow.price, paymentMethod || 'pix'],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await applyPromotionToLatestPayment(userId, promotion);
  const rows = await query('SELECT * FROM users WHERE id = :userId LIMIT 1', { userId });
  const property = await getUserPropertyName(userId);
  const subscription = await getUserSubscription(userId);
  res.json(mapUser(rows[0], property, subscription));
});

app.get('/api/user/privacy/export', requireAuthenticated, async (req, res) => {
  const userId = req.authUser.id;
  const propertyRows = await query('SELECT * FROM properties WHERE owner_id = :userId ORDER BY created_at ASC', { userId });
  const propertyIds = propertyRows.map((property) => property.id);
  const primaryPropertyId = propertyIds[0] || null;

  const [
    subscriptionRows,
    consentRows,
    revenuesRows,
    expensesRows,
    plantationsRows,
    livestockRows,
    inventoryRows,
    calendarRows,
    alertsRows,
  ] = await Promise.all([
    query('SELECT * FROM user_subscriptions WHERE user_id = :userId ORDER BY created_at DESC', { userId }),
    query('SELECT * FROM privacy_consents WHERE user_id = :userId ORDER BY accepted_at DESC', { userId }),
    primaryPropertyId ? query('SELECT * FROM revenues WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM expenses WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM plantations WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM livestock WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM inventory_items WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM calendar_events WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
    primaryPropertyId ? query('SELECT * FROM alerts WHERE property_id = :propertyId', { propertyId: primaryPropertyId }) : [],
  ]);

  res.json({
    exportedAt: new Date().toISOString(),
    user: mapUser(req.authUser, propertyRows[0]?.name, await getUserSubscription(userId)),
    properties: propertyRows,
    subscriptions: subscriptionRows,
    privacyConsents: consentRows,
    operations: {
      revenues: revenuesRows,
      expenses: expensesRows,
      plantations: plantationsRows,
      livestock: livestockRows,
      inventory: inventoryRows,
      calendar: calendarRows,
      alerts: alertsRows,
    },
  });
});

app.delete('/api/user/account', requireAuthenticated, async (req, res) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  await query('DELETE FROM users WHERE id = :userId', { userId: req.authUser.id });
  if (token) activeTokens.delete(token);
  res.status(204).send();
});

// ============================================================
// ADMIN
// ============================================================

function mapAdminUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    plan: row.plan,
    role: row.role || 'USER',
    accountStatus: row.account_status || 'active',
    propertyName: row.property_name,
    city: row.city,
    state: row.state,
    totalArea: numberValue(row.total_area),
    subscriptionStatus: row.subscription_status,
    planName: row.plan_name,
    billingCycle: row.billing_cycle,
    trialEndsAt: row.trial_ends_at,
    currentPeriodEndsAt: row.current_period_ends_at,
    plantationsCount: numberValue(row.plantations_count),
    livestockCount: numberValue(row.livestock_count),
    inventoryCount: numberValue(row.inventory_count),
    expensesTotal: numberValue(row.expenses_total),
    revenuesTotal: numberValue(row.revenues_total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const adminUserSelectSql = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.phone,
    u.plan,
    u.role,
    u.account_status,
    u.created_at,
    u.updated_at,
    p.name AS property_name,
    p.city,
    p.state,
    p.total_area,
    us.status AS subscription_status,
    sp.name AS plan_name,
    sp.billing_cycle,
    us.trial_ends_at,
    us.current_period_ends_at,
    COALESCE(pc.total, 0) AS plantations_count,
    COALESCE(lc.total, 0) AS livestock_count,
    COALESCE(ic.total, 0) AS inventory_count,
    COALESCE(et.total, 0) AS expenses_total,
    COALESCE(rt.total, 0) AS revenues_total
  FROM users u
  LEFT JOIN properties p ON p.owner_id = u.id
  LEFT JOIN LATERAL (
    SELECT id, plan_id, status, trial_ends_at, current_period_ends_at
    FROM user_subscriptions
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 1
  ) us ON TRUE
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
  LEFT JOIN (SELECT property_id, COUNT(*) total FROM plantations GROUP BY property_id) pc ON pc.property_id = p.id
  LEFT JOIN (SELECT property_id, COUNT(*) total FROM livestock GROUP BY property_id) lc ON lc.property_id = p.id
  LEFT JOIN (SELECT property_id, COUNT(*) total FROM inventory_items GROUP BY property_id) ic ON ic.property_id = p.id
  LEFT JOIN (SELECT property_id, SUM(amount) total FROM expenses GROUP BY property_id) et ON et.property_id = p.id
  LEFT JOIN (SELECT property_id, SUM(total_amount) total FROM revenues GROUP BY property_id) rt ON rt.property_id = p.id
`;

async function getAdminUserById(userId) {
  const rows = await query(
    `${adminUserSelectSql} WHERE u.id = :userId LIMIT 1`,
    { userId },
  );
  return rows[0] ? mapAdminUser(rows[0]) : null;
}

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  const rows = await query(`${adminUserSelectSql} ORDER BY u.created_at DESC`);

  const users = rows.map(mapAdminUser);
  res.json({
    users,
    summary: {
      totalUsers: users.length,
      premiumUsers: users.filter((user) => user.plan === 'PREMIUM').length,
      freeUsers: users.filter((user) => user.plan === 'FREE').length,
      blockedUsers: users.filter((user) => user.accountStatus === 'blocked').length,
    },
  });
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { name, email, phone, role, accountStatus, plan, billingCycle, paymentMethod } = req.body;

  await query(
    `UPDATE users
     SET name = :name,
         email = :email,
         phone = :phone,
         role = :role,
         account_status = :accountStatus
     WHERE id = :id`,
    {
      id: req.params.id,
      name,
      email,
      phone: phone || null,
      role: role || 'USER',
      accountStatus: accountStatus || 'active',
    },
  );

  if (plan) {
    const planCode = planCodeFromRequest(plan, billingCycle);
    const planRows = await query(
      'SELECT id, plan_type, billing_cycle, price, trial_days FROM subscription_plans WHERE code = :planCode AND active = TRUE LIMIT 1',
      { planCode },
    );
    const planRow = planRows[0];
    if (planRow) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE user_subscriptions SET status = 'cancelled', cancelled_at = NOW()
           WHERE user_id = $1 AND status IN ('trial', 'active', 'past_due')`,
          [req.params.id],
        );
        await client.query('UPDATE users SET plan = $1 WHERE id = $2', [planRow.plan_type, req.params.id]);
        const subscriptionId = crypto.randomUUID();
        const trialDays = planRow.trial_days;
        const now = new Date();
        let trialEndsAt = null;
        let currentPeriodEndsAt = null;

        if (planRow.plan_type === 'FREE') {
          trialEndsAt = new Date(now.getTime() + trialDays * 86400000).toISOString();
          currentPeriodEndsAt = trialEndsAt;
        } else if (planRow.billing_cycle === 'monthly') {
          currentPeriodEndsAt = new Date(now.getTime() + 30 * 86400000).toISOString();
        } else if (planRow.billing_cycle === 'annual') {
          currentPeriodEndsAt = new Date(now.getTime() + 365 * 86400000).toISOString();
        }

        const subStatus = planRow.plan_type === 'FREE' ? 'trial' : 'active';
        await client.query(
          `INSERT INTO user_subscriptions (id, user_id, plan_id, status, trial_ends_at, current_period_ends_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [subscriptionId, req.params.id, planRow.id, subStatus, trialEndsAt, currentPeriodEndsAt],
        );
        if (planRow.plan_type === 'PREMIUM') {
          await client.query(
            `INSERT INTO subscription_payments (id, subscription_id, amount, payment_method, status)
             VALUES ($1, $2, $3, $4, 'pendente')`,
            [crypto.randomUUID(), subscriptionId, planRow.price, paymentMethod || 'pix'],
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }

  const user = await getAdminUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json(user);
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM users WHERE id = :id', { id: req.params.id });
  res.status(204).send();
});

// ============================================================
// DASHBOARD
// ============================================================

app.get('/api/dashboard', requireAuthenticated, async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const [
    financialRows,
    chartRevenueRows,
    chartExpenseRows,
    productionRows,
    stockRows,
    eventRows,
    alertRows,
  ] = await Promise.all([
    query(`
      SELECT
        COALESCE((SELECT SUM(total_amount) FROM revenues WHERE property_id = :propertyId AND revenue_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS revenue,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE property_id = :propertyId AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS expenses
    `, { propertyId }),
    query(`
      SELECT TO_CHAR(revenue_date, 'YYYY-MM') AS month_key, SUM(total_amount) AS total
      FROM revenues
      WHERE property_id = :propertyId
        AND revenue_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY TO_CHAR(revenue_date, 'YYYY-MM')
    `, { propertyId }),
    query(`
      SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month_key, SUM(amount) AS total
      FROM expenses
      WHERE property_id = :propertyId
        AND expense_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
    `, { propertyId }),
    query(`
      SELECT id, culture, planted_area, status, planting_date, expected_harvest_date
      FROM plantations
      WHERE property_id = :propertyId
        AND status NOT IN ('colhida', 'finalizada')
      ORDER BY planting_date DESC
      LIMIT 6
    `, { propertyId }),
    query(`
      SELECT id, name, quantity, unit, minimum_stock, status
      FROM inventory_items
      WHERE property_id = :propertyId
        AND status IN ('estoque_baixo', 'esgotado')
      ORDER BY status DESC, name ASC
      LIMIT 4
    `, { propertyId }),
    query(`
      SELECT id, title, category, event_date, status, priority
      FROM calendar_events
      WHERE property_id = :propertyId
        AND status IN ('pendente', 'em_andamento', 'atrasada')
        AND event_date >= CURRENT_DATE
      ORDER BY event_date ASC, event_time ASC
      LIMIT 6
    `, { propertyId }),
    query(`
      SELECT id, type, title, message, priority, is_read, created_at
      FROM alerts
      WHERE property_id = :propertyId
        AND is_read = FALSE
      ORDER BY created_at DESC
      LIMIT 4
    `, { propertyId }),
  ]);

  const financial = {
    revenue: numberValue(financialRows[0]?.revenue),
    expenses: numberValue(financialRows[0]?.expenses),
    result: numberValue(financialRows[0]?.revenue) - numberValue(financialRows[0]?.expenses),
    profitMargin: numberValue(financialRows[0]?.revenue) > 0
      ? (numberValue(financialRows[0]?.revenue) - numberValue(financialRows[0]?.expenses)) / numberValue(financialRows[0]?.revenue)
      : 0,
  };

  const financialChart = lastMonths(6);
  const chartByKey = new Map(financialChart.map((item) => [item.key, item]));
  for (const row of chartRevenueRows) {
    const chartItem = chartByKey.get(row.month_key);
    if (chartItem) chartItem.revenue = numberValue(row.total);
  }
  for (const row of chartExpenseRows) {
    const chartItem = chartByKey.get(row.month_key);
    if (chartItem) chartItem.expenses = numberValue(row.total);
  }
  for (const item of financialChart) {
    item.result = item.revenue - item.expenses;
    delete item.key;
  }

  const productionAlerts = productionRows
    .filter((row) => row.status === 'pronta_colheita')
    .slice(0, 2)
    .map((row) => ({
      id: `plantation-${row.id}`,
      type: 'producao',
      title: `Colheita próxima - ${row.culture}`,
      message: `${row.culture} está pronta ou próxima para colheita.`,
      priority: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    }));

  const stockAlerts = stockRows.map((row) => ({
    id: `stock-${row.id}`,
    type: 'estoque',
    title: row.status === 'esgotado' ? `${row.name} esgotado` : `Estoque baixo de ${row.name}`,
    message: `${row.name}: ${numberValue(row.quantity)} ${row.unit}. Mínimo recomendado: ${numberValue(row.minimum_stock)} ${row.unit}.`,
    priority: row.status === 'esgotado' ? 'critical' : 'warning',
    read: false,
    createdAt: new Date().toISOString(),
  }));

  res.json({
    financial,
    financialChart,
    productions: productionRows.map((row) => ({
      id: row.id,
      culture: row.culture,
      area: numberValue(row.planted_area),
      status: row.status,
      plantingDate: dateOnly(row.planting_date),
      expectedHarvestDate: dateOnly(row.expected_harvest_date),
      progress: productionProgress(row.status),
    })),
    productionsCount: productionRows.length,
    stockAlerts: stockRows.length,
    upcomingActivities: eventRows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      date: dateOnly(row.event_date),
      status: row.status,
      priority: row.priority,
    })),
    alerts: [
      ...alertRows.map((row) => ({
        id: row.id,
        type: row.type === 'ia' ? 'sistema' : row.type,
        title: row.title,
        message: row.message,
        priority: row.priority,
        read: Boolean(row.is_read),
        createdAt: row.created_at,
      })),
      ...stockAlerts,
      ...productionAlerts,
    ].slice(0, 4),
  });
});

// ============================================================
// OPERATIONS — middleware
// ============================================================

app.use('/api/operations', requireAuthenticated);

// ============================================================
// FINANCIAL
// ============================================================

app.get('/api/operations/financial', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const [revenueRows, expenseRows] = await Promise.all([
    query('SELECT * FROM revenues WHERE property_id = :propertyId ORDER BY revenue_date DESC, created_at DESC', { propertyId }),
    query('SELECT * FROM expenses WHERE property_id = :propertyId ORDER BY expense_date DESC, created_at DESC', { propertyId }),
  ]);

  res.json({
    revenues: revenueRows.map(mapRevenue),
    expenses: expenseRows.map(mapExpense),
  });
});

app.post('/api/operations/revenues', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const id = crypto.randomUUID();
  const totalAmount = (data.quantity ?? 1) * (data.unitPrice ?? data.totalAmount ?? 0);
  const rows = await query(
    `INSERT INTO revenues (id, property_id, product, quantity, unit, unit_price, total_amount, buyer, revenue_date, payment_method, payment_status)
     VALUES (:id, :propertyId, :product, :quantity, :unit, :unitPrice, :totalAmount, :buyer, :date, :paymentMethod, :paymentStatus)
     RETURNING *`,
    {
      id,
      propertyId,
      product: data.product,
      quantity: data.quantity ?? 1,
      unit: data.unit || 'un',
      unitPrice: data.unitPrice ?? data.totalAmount ?? 0,
      totalAmount,
      buyer: data.buyer || null,
      date: data.date,
      paymentMethod: data.paymentMethod || 'pix',
      paymentStatus: data.paymentStatus || 'pago',
    },
  );
  res.status(201).json(mapRevenue(rows[0]));
});

app.put('/api/operations/revenues/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const totalAmount = (data.quantity ?? 1) * (data.unitPrice ?? data.totalAmount ?? 0);
  const rows = await query(
    `UPDATE revenues
     SET product = :product,
         quantity = :quantity,
         unit = :unit,
         unit_price = :unitPrice,
         total_amount = :totalAmount,
         buyer = :buyer,
         revenue_date = :date,
         payment_method = :paymentMethod,
         payment_status = :paymentStatus,
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      product: data.product,
      quantity: data.quantity ?? 1,
      unit: data.unit || 'un',
      unitPrice: data.unitPrice ?? data.totalAmount ?? 0,
      totalAmount,
      buyer: data.buyer || null,
      date: data.date,
      paymentMethod: data.paymentMethod || 'pix',
      paymentStatus: data.paymentStatus || 'pago',
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Receita não encontrada.' });
  res.json(mapRevenue(row));
});

app.delete('/api/operations/revenues/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM revenues WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

app.post('/api/operations/expenses', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const id = crypto.randomUUID();
  const rows = await query(
    `INSERT INTO expenses (id, property_id, plantation_id, livestock_id, description, category, amount, expense_date, payment_method, payment_status)
     VALUES (:id, :propertyId, :plantationId, :livestockId, :description, :category, :amount, :date, :paymentMethod, :paymentStatus)
     RETURNING *`,
    {
      id,
      propertyId,
      plantationId: data.plantationId || null,
      livestockId: data.livestockId || null,
      description: data.description,
      category: data.category || 'outros',
      amount: data.amount ?? 0,
      date: data.date,
      paymentMethod: data.paymentMethod || 'pix',
      paymentStatus: data.paymentStatus || 'pago',
    },
  );
  res.status(201).json(mapExpense(rows[0]));
});

app.put('/api/operations/expenses/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const rows = await query(
    `UPDATE expenses
     SET plantation_id = :plantationId,
         livestock_id = :livestockId,
         description = :description,
         category = :category,
         amount = :amount,
         expense_date = :date,
         payment_method = :paymentMethod,
         payment_status = :paymentStatus,
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      plantationId: data.plantationId || null,
      livestockId: data.livestockId || null,
      description: data.description,
      category: data.category || 'outros',
      amount: data.amount ?? 0,
      date: data.date,
      paymentMethod: data.paymentMethod || 'pix',
      paymentStatus: data.paymentStatus || 'pago',
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Despesa não encontrada.' });
  res.json(mapExpense(row));
});

app.delete('/api/operations/expenses/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM expenses WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// PLANTATIONS
// ============================================================

app.get('/api/operations/plantations', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const rows = await query('SELECT * FROM plantations WHERE property_id = :propertyId ORDER BY planting_date DESC, created_at DESC', { propertyId });
  res.json(rows.map(mapPlantation));
});

app.post('/api/operations/plantations', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const id = crypto.randomUUID();
  const rows = await query(
    `INSERT INTO plantations (id, property_id, culture, variety, planted_area, planting_date, expected_harvest_date, status, estimated_production, costs)
     VALUES (:id, :propertyId, :culture, :variety, :plantedArea, :plantingDate, :expectedHarvestDate, 'plantada', :estimatedProduction, :costs)
     RETURNING *`,
    {
      id,
      propertyId,
      culture: data.culture,
      variety: data.variety || null,
      plantedArea: data.plantedArea ?? 0,
      plantingDate: data.plantingDate,
      expectedHarvestDate: data.expectedHarvestDate || null,
      estimatedProduction: data.estimatedProduction || 0,
      costs: data.costs || 0,
    },
  );
  res.status(201).json(mapPlantation(rows[0]));
});

app.put('/api/operations/plantations/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const rows = await query(
    `UPDATE plantations
     SET culture = :culture,
         variety = :variety,
         planted_area = :plantedArea,
         planting_date = :plantingDate,
         expected_harvest_date = :expectedHarvestDate,
         estimated_production = :estimatedProduction,
         costs = COALESCE(:costs, costs),
         status = COALESCE(:status, status),
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      culture: data.culture,
      variety: data.variety || null,
      plantedArea: data.plantedArea ?? 0,
      plantingDate: data.plantingDate,
      expectedHarvestDate: data.expectedHarvestDate || null,
      estimatedProduction: data.estimatedProduction || 0,
      costs: data.costs || null,
      status: data.status || null,
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Plantação não encontrada.' });
  res.json(mapPlantation(row));
});

app.delete('/api/operations/plantations/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM plantations WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// LIVESTOCK
// ============================================================

app.get('/api/operations/livestock', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const rows = await query('SELECT * FROM livestock WHERE property_id = :propertyId ORDER BY acquisition_date DESC, created_at DESC', { propertyId });
  res.json(rows.map(mapLivestock));
});

app.post('/api/operations/livestock', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const id = crypto.randomUUID();
  const rows = await query(
    `INSERT INTO livestock (id, property_id, type, breed, quantity, acquisition_date, feeding, vaccination, weighing, production, notes)
     VALUES (:id, :propertyId, :type, :breed, :quantity, :date, :feeding, :vaccination, :weighing, :production, :notes)
     RETURNING *`,
    {
      id,
      propertyId,
      type: data.type,
      breed: data.breed || null,
      quantity: data.quantity ?? 0,
      date: data.date,
      feeding: data.feeding || null,
      vaccination: data.vaccination || null,
      weighing: data.weighing || null,
      production: data.production || null,
      notes: data.notes || null,
    },
  );
  res.status(201).json(mapLivestock(rows[0]));
});

app.put('/api/operations/livestock/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const rows = await query(
    `UPDATE livestock
     SET type = :type,
         breed = :breed,
         quantity = :quantity,
         acquisition_date = :date,
         feeding = :feeding,
         vaccination = :vaccination,
         weighing = :weighing,
         production = :production,
         notes = :notes,
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      type: data.type,
      breed: data.breed || null,
      quantity: data.quantity ?? 0,
      date: data.date,
      feeding: data.feeding || null,
      vaccination: data.vaccination || null,
      weighing: data.weighing || null,
      production: data.production || null,
      notes: data.notes || null,
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Criação não encontrada.' });
  res.json(mapLivestock(row));
});

app.delete('/api/operations/livestock/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM livestock WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// INVENTORY
// ============================================================

app.get('/api/operations/inventory', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const rows = await query('SELECT * FROM inventory_items WHERE property_id = :propertyId ORDER BY name ASC', { propertyId });
  res.json(rows.map(mapInventoryItem));
});

app.get('/api/operations/inventory/analytics', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const period = req.query.period === 'yearly' ? 'yearly' : 'monthly';
  const supplyCategoryFilter = "('sementes', 'mudas', 'fertilizantes', 'defensivos', 'racao', 'medicamentos', 'combustivel', 'equipamentos')";

  if (period === 'yearly') {
    const yearRows = await query(`
      SELECT
        EXTRACT(YEAR FROM expense_date)::TEXT AS label,
        COUNT(*) AS purchases,
        COALESCE(SUM(amount), 0) AS amount
      FROM expenses
      WHERE property_id = :propertyId
        AND category IN ${supplyCategoryFilter}
        AND expense_date >= CURRENT_DATE - INTERVAL '5 years'
      GROUP BY EXTRACT(YEAR FROM expense_date)
      ORDER BY EXTRACT(YEAR FROM expense_date) ASC
    `, { propertyId });

    const currentYear = new Date().getFullYear();
    const chart = Array.from({ length: 5 }, (_, index) => {
      const year = String(currentYear - 4 + index);
      const row = yearRows.find((item) => String(item.label) === year);
      return {
        label: year,
        purchases: numberValue(row?.purchases),
        amount: numberValue(row?.amount),
      };
    });

    res.json(chart);
    return;
  }

  const monthRows = await query(`
    SELECT
      TO_CHAR(expense_date, 'YYYY-MM') AS month_key,
      COUNT(*) AS purchases,
      COALESCE(SUM(amount), 0) AS amount
    FROM expenses
    WHERE property_id = :propertyId
      AND category IN ${supplyCategoryFilter}
      AND expense_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
    GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
    ORDER BY month_key ASC
  `, { propertyId });

  const chart = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1);
    const key = monthKey(date);
    const row = monthRows.find((item) => item.month_key === key);
    return {
      label: monthLabel(date),
      purchases: numberValue(row?.purchases),
      amount: numberValue(row?.amount),
    };
  });

  res.json(chart);
});

app.post('/api/operations/inventory', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const id = crypto.randomUUID();
  const qty = data.quantity ?? 0;
  const minStock = data.minimumStock ?? 0;
  const status = inventoryStatus(qty, minStock);
  const rows = await query(
    `INSERT INTO inventory_items (id, property_id, name, category, quantity, unit, minimum_stock, location, expiration_date, status)
     VALUES (:id, :propertyId, :name, :category, :quantity, :unit, :minimumStock, :location, :expirationDate, :status)
     RETURNING *`,
    {
      id,
      propertyId,
      name: data.name,
      category: data.category || 'outros',
      quantity: qty,
      unit: data.unit || 'un',
      minimumStock: minStock,
      location: data.location || null,
      expirationDate: data.expirationDate || null,
      status,
    },
  );
  res.status(201).json(mapInventoryItem(rows[0]));
});

app.put('/api/operations/inventory/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const qty = data.quantity ?? 0;
  const minStock = data.minimumStock ?? 0;
  const status = inventoryStatus(qty, minStock);
  const rows = await query(
    `UPDATE inventory_items
     SET name = :name,
         category = :category,
         quantity = :quantity,
         unit = :unit,
         minimum_stock = :minimumStock,
         location = :location,
         expiration_date = :expirationDate,
         status = :status,
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      name: data.name,
      category: data.category || 'outros',
      quantity: qty,
      unit: data.unit || 'un',
      minimumStock: minStock,
      location: data.location || null,
      expirationDate: data.expirationDate || null,
      status,
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Item de estoque não encontrado.' });
  res.json(mapInventoryItem(row));
});

app.delete('/api/operations/inventory/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM inventory_items WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// CALENDAR
// ============================================================

app.get('/api/operations/calendar', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const rows = await query('SELECT * FROM calendar_events WHERE property_id = :propertyId ORDER BY event_date ASC, event_time ASC', { propertyId });
  res.json(rows.map(mapCalendarEvent));
});

app.post('/api/operations/calendar', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const id = crypto.randomUUID();
  const rows = await query(
    `INSERT INTO calendar_events (id, property_id, plantation_id, livestock_id, title, category, event_date, event_time, priority, status, notes)
     VALUES (:id, :propertyId, :plantationId, :livestockId, :title, :category, :date, :time, :priority, 'pendente', :notes)
     RETURNING *`,
    {
      id,
      propertyId,
      plantationId: data.plantationId || null,
      livestockId: data.livestockId || null,
      title: data.title,
      category: data.category || 'outros',
      date: data.date,
      time: data.time || null,
      priority: data.priority || 'media',
      notes: data.notes || null,
    },
  );
  res.status(201).json(mapCalendarEvent(rows[0]));
});

app.put('/api/operations/calendar/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const data = req.body;
  const rows = await query(
    `UPDATE calendar_events
     SET plantation_id = :plantationId,
         livestock_id = :livestockId,
         title = :title,
         category = :category,
         event_date = :date,
         event_time = :time,
         priority = COALESCE(:priority, priority),
         status = COALESCE(:status, status),
         notes = :notes,
         updated_at = NOW()
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      plantationId: data.plantationId || null,
      livestockId: data.livestockId || null,
      title: data.title,
      category: data.category || 'outros',
      date: data.date,
      time: data.time || null,
      priority: data.priority || null,
      status: data.status || null,
      notes: data.notes || null,
    },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ message: 'Evento não encontrado.' });
  res.json(mapCalendarEvent(row));
});

app.delete('/api/operations/calendar/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM calendar_events WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// ARTICLES
// ============================================================

app.get('/api/operations/articles', async (_req, res) => {
  const rows = await query('SELECT * FROM info_articles ORDER BY published_at DESC, created_at DESC');
  res.json(rows.map(mapInfoArticle));
});

app.post('/api/operations/articles', requireAdmin, async (req, res) => {
  const data = req.body;
  const id = crypto.randomUUID();

  const rows = await query(
    `INSERT INTO info_articles (id, title, summary, content, category, source, image_url)
     VALUES (:id, :title, :summary, :content, :category, :source, :imageUrl)
     RETURNING *`,
    {
      id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category || 'educativo',
      source: data.source || 'IAgroTech Conteúdo',
      imageUrl: data.imageUrl || null,
    },
  );
  res.status(201).json(mapInfoArticle(rows[0]));
});

app.put('/api/operations/articles/:id', requireAdmin, async (req, res) => {
  const data = req.body;

  const rows = await query(
    `UPDATE info_articles
     SET title = :title,
         summary = :summary,
         content = :content,
         category = :category,
         source = :source,
         image_url = :imageUrl,
         updated_at = NOW()
     WHERE id = :id
     RETURNING *`,
    {
      id: req.params.id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category || 'educativo',
      source: data.source || 'IAgroTech Conteúdo',
      imageUrl: data.imageUrl || null,
    },
  );
  if (!rows[0]) return res.status(404).json({ message: 'Artigo não encontrado.' });
  res.json(mapInfoArticle(rows[0]));
});

app.delete('/api/operations/articles/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM info_articles WHERE id = :id', { id: req.params.id });
  res.status(204).send();
});

// ============================================================
// ALERTS
// ============================================================

app.get('/api/operations/alerts', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  const rows = await query(
    'SELECT * FROM alerts WHERE property_id = :propertyId ORDER BY is_read ASC, created_at DESC',
    { propertyId },
  );
  res.json(rows.map(mapAlert));
});

app.post('/api/operations/alerts', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const id = crypto.randomUUID();
  const rows = await query(
    `INSERT INTO alerts (id, property_id, type, title, message, priority, is_read, related_entity_type, related_entity_id)
     VALUES (:id, :propertyId, :type, :title, :message, :priority, :isRead, :relatedType, :relatedId)
     RETURNING *`,
    {
      id,
      propertyId,
      type: data.type || 'sistema',
      title: data.title,
      message: data.message,
      priority: data.priority || 'info',
      isRead: data.read ? true : false,
      relatedType: data.relatedEntity?.type || null,
      relatedId: data.relatedEntity?.id || null,
    },
  );

  res.status(201).json(mapAlert(rows[0]));
});

app.put('/api/operations/alerts/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  const rows = await query(
    `UPDATE alerts
     SET type = :type,
         title = :title,
         message = :message,
         priority = :priority,
         is_read = :isRead,
         related_entity_type = :relatedType,
         related_entity_id = :relatedId
     WHERE id = :id AND property_id = :propertyId
     RETURNING *`,
    {
      id: req.params.id,
      propertyId,
      type: data.type || 'sistema',
      title: data.title,
      message: data.message,
      priority: data.priority || 'info',
      isRead: data.read ? true : false,
      relatedType: data.relatedEntity?.type || null,
      relatedId: data.relatedEntity?.id || null,
    },
  );

  if (!rows[0]) return res.status(404).json({ message: 'Alerta não encontrado.' });
  res.json(mapAlert(rows[0]));
});

app.delete('/api/operations/alerts/:id', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;
  await query('DELETE FROM alerts WHERE id = :id AND property_id = :propertyId', { id: req.params.id, propertyId });
  res.status(204).send();
});

// ============================================================
// ASSISTANT
// ============================================================

app.post('/api/operations/assistant/recommendation', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const prompt = String(req.body.prompt || '').trim() || 'Gerar recomendação operacional.';
  const [stockRows, eventRows, alertRows, financialRows] = await Promise.all([
    query(
      `SELECT name, quantity, unit, minimum_stock
       FROM inventory_items
       WHERE property_id = :propertyId AND status IN ('estoque_baixo', 'esgotado')
       ORDER BY status DESC, name ASC
       LIMIT 3`,
      { propertyId },
    ),
    query(
      `SELECT title, event_date, priority
       FROM calendar_events
       WHERE property_id = :propertyId AND event_date >= CURRENT_DATE AND status IN ('pendente', 'em_andamento', 'atrasada')
       ORDER BY event_date ASC
       LIMIT 3`,
      { propertyId },
    ),
    query(
      `SELECT title, priority
       FROM alerts
       WHERE property_id = :propertyId AND is_read = FALSE
       ORDER BY priority DESC, created_at DESC
       LIMIT 3`,
      { propertyId },
    ),
    query(
      `SELECT
         COALESCE((SELECT SUM(total_amount) FROM revenues WHERE property_id = :propertyId AND revenue_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS revenue,
         COALESCE((SELECT SUM(amount) FROM expenses WHERE property_id = :propertyId AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS expenses`,
      { propertyId },
    ),
  ]);

  const financial = financialRows[0] || { revenue: 0, expenses: 0 };
  const result = numberValue(financial.revenue) - numberValue(financial.expenses);
  const recommendation = [
    `Análise criada com dados reais para: "${prompt.slice(0, 80)}"`,
    stockRows[0]
      ? `Prioridade 1: repor ${stockRows[0].name}; estoque atual ${numberValue(stockRows[0].quantity)} ${stockRows[0].unit}, mínimo ${numberValue(stockRows[0].minimum_stock)}.`
      : 'Prioridade 1: não há itens críticos de estoque cadastrados no momento.',
    eventRows[0]
      ? `Prioridade 2: acompanhar "${eventRows[0].title}" em ${dateOnly(eventRows[0].event_date)} com prioridade ${eventRows[0].priority}.`
      : 'Prioridade 2: não há atividades futuras pendentes no calendário.',
    alertRows[0]
      ? `Prioridade 3: resolver alerta "${alertRows[0].title}" (${alertRows[0].priority}).`
      : `Prioridade 3: resultado financeiro do mês está em ${result.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
  ];

  const conversationId = crypto.randomUUID();
  await query(
    'INSERT INTO ai_conversations (id, property_id, user_id, title) VALUES (:id, :propertyId, :userId, :title)',
    { id: conversationId, propertyId, userId: req.authUser.id, title: prompt.slice(0, 80) },
  );
  await query(
    `INSERT INTO ai_messages (id, conversation_id, role, content)
     VALUES (:id1, :conversationId, 'user', :prompt), (:id2, :conversationId, 'assistant', :answer)`,
    { id1: crypto.randomUUID(), id2: crypto.randomUUID(), conversationId, prompt, answer: recommendation.join('\n') },
  );

  res.json({ recommendation });
});

// ============================================================
// SETTINGS
// ============================================================

app.get('/api/operations/settings', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const rows = await query(
    `SELECT p.name, p.total_area, p.city, p.state, s.notification_level
     FROM properties p
     LEFT JOIN app_settings s ON s.property_id = p.id
     WHERE p.id = :propertyId
     LIMIT 1`,
    { propertyId },
  );

  if (!rows[0]) return res.status(404).json({ message: 'Propriedade não encontrada.' });
  res.json(mapPropertySettings(rows[0]));
});

app.put('/api/operations/settings', async (req, res) => {
  const propertyId = await getPropertyIdFromUser(req, res);
  if (!propertyId) return;

  const data = req.body;
  await query(
    `UPDATE properties
     SET name = :name,
         total_area = :totalArea,
         city = :city,
         state = :state,
         updated_at = NOW()
     WHERE id = :propertyId`,
    {
      propertyId,
      name: data.propertyName,
      totalArea: data.totalArea ?? 0,
      city: data.city || null,
      state: data.state || null,
    },
  );

  // PostgreSQL upsert
  await query(
    `INSERT INTO app_settings (id, property_id, notification_level)
     VALUES (:id, :propertyId, :notificationLevel)
     ON CONFLICT (property_id) DO UPDATE SET notification_level = EXCLUDED.notification_level`,
    { id: crypto.randomUUID(), propertyId, notificationLevel: data.notificationLevel || 'all' },
  );

  const rows = await query(
    `SELECT p.name, p.total_area, p.city, p.state, s.notification_level
     FROM properties p
     LEFT JOIN app_settings s ON s.property_id = p.id
     WHERE p.id = :propertyId
     LIMIT 1`,
    { propertyId },
  );

  res.json(mapPropertySettings(rows[0]));
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({ message: error.message || 'Erro interno do servidor.' });
});

app.listen(port, () => {
  console.log(`IAgroTech API running at http://localhost:${port}/api`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed CORS origins: ${[...allowedOrigins].join(', ') || '(none configured)'}`);
});
