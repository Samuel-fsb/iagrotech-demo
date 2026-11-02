-- IAgroTech database schema
-- Target: PostgreSQL 14+

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE plan_type_enum AS ENUM ('FREE', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'USER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status_enum AS ENUM ('active', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('pix', 'cartao_credito', 'boleto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pendente', 'pago', 'falhou', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type_enum AS ENUM ('percent', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE applies_to_plan_enum AS ENUM ('FREE', 'PREMIUM', 'ALL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plantation_status_enum AS ENUM ('planejada', 'plantada', 'em_desenvolvimento', 'pronta_colheita', 'colhida', 'finalizada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category_enum AS ENUM ('sementes', 'fertilizantes', 'defensivos', 'racao', 'medicamentos', 'ferramentas', 'pecas', 'combustivel', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status_enum AS ENUM ('normal', 'estoque_baixo', 'esgotado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_category_enum AS ENUM ('sementes', 'mudas', 'fertilizantes', 'defensivos', 'racao', 'medicamentos', 'combustivel', 'energia', 'agua', 'manutencao', 'equipamentos', 'mao_de_obra', 'transporte', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_payment_method_enum AS ENUM ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'transferencia', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_payment_status_enum AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_category_enum AS ENUM ('plantio', 'irrigacao', 'adubacao', 'aplicacao', 'inspecao', 'colheita', 'venda', 'manutencao', 'vacinacao', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_priority_enum AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calendar_status_enum AS ENUM ('pendente', 'em_andamento', 'concluida', 'atrasada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE article_category_enum AS ENUM ('noticias', 'cultivo', 'manejo', 'clima', 'mercado', 'pragas', 'sustentabilidade', 'pecuaria', 'tecnologia', 'educativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type_enum AS ENUM ('estoque', 'financeiro', 'producao', 'calendario', 'sistema', 'ia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_priority_enum AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_role_enum AS ENUM ('user', 'assistant', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_level_enum AS ENUM ('all', 'critical', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(160) NOT NULL,
  email       VARCHAR(180) NOT NULL UNIQUE,
  phone       VARCHAR(32),
  password_hash TEXT NOT NULL,
  photo_url   TEXT,
  plan        plan_type_enum NOT NULL DEFAULT 'FREE',
  role        user_role_enum NOT NULL DEFAULT 'USER',
  account_status account_status_enum NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_hash   TEXT NOT NULL,
  refresh_token_hash  TEXT,
  user_agent          TEXT,
  ip_address          VARCHAR(45),
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privacy_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version  VARCHAR(40) NOT NULL,
  terms_version   VARCHAR(40) NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  revoked_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(180) NOT NULL,
  city        VARCHAR(120),
  state       CHAR(2),
  total_area  NUMERIC(12, 2),
  area_unit   VARCHAR(12) NOT NULL DEFAULT 'ha',
  latitude    NUMERIC(10, 7),
  longitude   NUMERIC(10, 7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(80) NOT NULL,
  plan_type     plan_type_enum NOT NULL,
  billing_cycle billing_cycle_enum,
  price         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  trial_days    INT NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL REFERENCES subscription_plans(id),
  status                subscription_status_enum NOT NULL,
  starts_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at         TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id     UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  amount              NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency            CHAR(3) NOT NULL DEFAULT 'BRL',
  payment_method      payment_method_enum NOT NULL,
  status              payment_status_enum NOT NULL,
  paid_at             TIMESTAMPTZ,
  external_reference  VARCHAR(160),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_codes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  VARCHAR(40) NOT NULL UNIQUE,
  description           VARCHAR(180) NOT NULL,
  discount_type         discount_type_enum NOT NULL,
  discount_value        NUMERIC(14, 2) NOT NULL CHECK (discount_value >= 0),
  applies_to_plan_type  applies_to_plan_enum NOT NULL DEFAULT 'PREMIUM',
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at             TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  max_uses              INT,
  times_used            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plantations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  culture               VARCHAR(120) NOT NULL,
  variety               VARCHAR(120),
  planted_area          NUMERIC(12, 2) NOT NULL,
  planting_date         DATE NOT NULL,
  expected_harvest_date DATE,
  status                plantation_status_enum NOT NULL,
  estimated_production  NUMERIC(14, 2),
  actual_production     NUMERIC(14, 2),
  production_unit       VARCHAR(16) NOT NULL DEFAULT 'kg',
  seed_quantity         NUMERIC(14, 2),
  inputs                TEXT,
  fertilization         TEXT,
  applications          TEXT,
  costs                 NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livestock (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type             VARCHAR(120) NOT NULL,
  breed            VARCHAR(120),
  quantity         INT NOT NULL CHECK (quantity >= 0),
  acquisition_date DATE NOT NULL,
  feeding          TEXT,
  vaccination      TEXT,
  weighing         TEXT,
  production       TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name           VARCHAR(160) NOT NULL,
  category       inventory_category_enum NOT NULL,
  quantity       NUMERIC(14, 3) NOT NULL DEFAULT 0,
  unit           VARCHAR(24) NOT NULL,
  minimum_stock  NUMERIC(14, 3) NOT NULL DEFAULT 0,
  location       VARCHAR(160),
  expiration_date DATE,
  notes          TEXT,
  status         inventory_status_enum NOT NULL DEFAULT 'normal',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  plantation_id  UUID REFERENCES plantations(id) ON DELETE SET NULL,
  livestock_id   UUID REFERENCES livestock(id) ON DELETE SET NULL,
  description    VARCHAR(220) NOT NULL,
  category       expense_category_enum NOT NULL,
  amount         NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  expense_date   DATE NOT NULL,
  payment_method financial_payment_method_enum NOT NULL,
  payment_status financial_payment_status_enum NOT NULL DEFAULT 'pago',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  plantation_id  UUID REFERENCES plantations(id) ON DELETE SET NULL,
  livestock_id   UUID REFERENCES livestock(id) ON DELETE SET NULL,
  product        VARCHAR(160) NOT NULL,
  quantity       NUMERIC(14, 3) NOT NULL CHECK (quantity >= 0),
  unit           VARCHAR(24) NOT NULL,
  unit_price     NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  buyer          VARCHAR(180),
  revenue_date   DATE NOT NULL,
  payment_method financial_payment_method_enum NOT NULL,
  payment_status financial_payment_status_enum NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  plantation_id UUID REFERENCES plantations(id) ON DELETE SET NULL,
  livestock_id  UUID REFERENCES livestock(id) ON DELETE SET NULL,
  title         VARCHAR(180) NOT NULL,
  category      calendar_category_enum NOT NULL,
  event_date    DATE NOT NULL,
  event_time    TIME,
  priority      calendar_priority_enum NOT NULL,
  status        calendar_status_enum NOT NULL DEFAULT 'pendente',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS info_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(220) NOT NULL,
  summary      TEXT NOT NULL,
  content      TEXT NOT NULL,
  category     article_category_enum NOT NULL,
  image_url    TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source       VARCHAR(160),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID REFERENCES properties(id) ON DELETE CASCADE,
  type                alert_type_enum NOT NULL,
  title               VARCHAR(180) NOT NULL,
  message             TEXT NOT NULL,
  priority            alert_priority_enum NOT NULL,
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_type VARCHAR(80),
  related_entity_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(180) NOT NULL DEFAULT 'Nova conversa',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            ai_role_enum NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  notification_level notification_level_enum NOT NULL DEFAULT 'all',
  currency           CHAR(3) NOT NULL DEFAULT 'BRL',
  locale             VARCHAR(16) NOT NULL DEFAULT 'pt-BR',
  timezone           VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(code);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_codes_code_active ON promotion_codes(code, active);
CREATE INDEX IF NOT EXISTS idx_plantations_property_status ON plantations(property_id, status);
CREATE INDEX IF NOT EXISTS idx_livestock_property ON livestock(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_property_status ON inventory_items(property_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_property_date ON expenses(property_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenues_property_date ON revenues(property_id, revenue_date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_property_date ON calendar_events(property_id, event_date, status);
CREATE INDEX IF NOT EXISTS idx_articles_category_date ON info_articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_property_read ON alerts(property_id, is_read, priority);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);
