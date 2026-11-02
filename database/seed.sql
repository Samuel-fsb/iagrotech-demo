-- Sample data for LOCAL DEVELOPMENT only.
-- Target: PostgreSQL 14+
-- Run after: schema.sql and refs.sql
-- Usage: node database/setup.js --with-seed
--
-- WARNING: Do NOT run this in production.
-- This file creates ONE local demo user (USER role, not ADMIN) with a
-- temporary password hash. The server will upgrade the hash on first login.
-- Register additional users through the application.

-- Demo user: role USER (never ADMIN), for local testing only.
-- Temporary password hash will be upgraded to PBKDF2 on first login.
-- Actual local-only password: change via the app after first login.
INSERT INTO users (id, name, email, phone, password_hash, plan, role, account_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Produtor Demonstração',
  'demo@iagrotech.local',
  '(16) 99999-0000',
  -- SHA-256 of a random local-only string; change password after first login via the app.
  -- This hash does NOT correspond to any known public string.
  'pbkdf2$120000$0000000000000000000000000000000a$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  'FREE',
  'USER',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO properties (id, owner_id, name, city, state, total_area, area_unit)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Sítio Boa Esperança',
  'Ribeirão Preto',
  'SP',
  12.5,
  'ha'
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      total_area = EXCLUDED.total_area;

INSERT INTO app_settings (id, property_id, notification_level, currency, locale, timezone)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000101', 'all', 'BRL', 'pt-BR', 'America/Sao_Paulo')
ON CONFLICT (property_id) DO UPDATE
  SET notification_level = EXCLUDED.notification_level,
      currency = EXCLUDED.currency,
      locale = EXCLUDED.locale,
      timezone = EXCLUDED.timezone;

INSERT INTO user_subscriptions (id, user_id, plan_id, status, trial_ends_at, current_period_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000021',
  'trial',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO UPDATE
  SET status                 = EXCLUDED.status,
      trial_ends_at          = EXCLUDED.trial_ends_at,
      current_period_ends_at = EXCLUDED.current_period_ends_at;

INSERT INTO plantations (
  id, property_id, culture, variety, planted_area, planting_date, expected_harvest_date,
  status, estimated_production, production_unit, seed_quantity, fertilization, applications, costs
) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Milho', 'AG 1051', 3.5, '2026-04-15', '2026-09-20', 'em_desenvolvimento', 24500, 'kg', 70, 'NPK 10-10-10 + cobertura nitrogenada', 'Monitoramento semanal', 6420),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Feijão', 'Carioca', 1.2, '2026-07-10', '2026-10-15', 'plantada', 2160, 'kg', 84, 'Correção de solo aplicada', 'Monitorar vaquinha e mosca-branca', 2380),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'Mandioca', 'IAC 576', 2.0, '2025-12-01', '2026-09-01', 'pronta_colheita', 36000, 'kg', NULL, NULL, NULL, 3950)
ON CONFLICT (id) DO UPDATE
  SET culture = EXCLUDED.culture,
      status  = EXCLUDED.status;

INSERT INTO livestock (id, property_id, type, breed, quantity, acquisition_date, feeding, vaccination, weighing, production)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'Bovinos de leite', 'Girolando', 18, '2026-01-12', 'Silagem, sal mineral e capim rotacionado', 'Aftosa em dia', 'Peso médio: 430 kg', '210 L/dia'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', 'Galinhas poedeiras', 'Hisex Brown', 120, '2026-03-05', 'Ração postura + milho triturado', NULL, NULL, '92 ovos/dia')
ON CONFLICT (id) DO UPDATE
  SET type     = EXCLUDED.type,
      quantity = EXCLUDED.quantity;

INSERT INTO inventory_items (id, property_id, name, category, quantity, unit, minimum_stock, location, expiration_date, status)
VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', 'NPK 10-10-10', 'fertilizantes', 5, 'kg', 30, 'Galpão 1', NULL, 'estoque_baixo'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000101', 'Semente de feijão carioca', 'sementes', 42, 'kg', 20, 'Depósito seco', '2027-01-15', 'normal'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101', 'Vacina clostridiose', 'medicamentos', 0, 'doses', 25, 'Geladeira veterinária', '2026-11-20', 'esgotado')
ON CONFLICT (id) DO UPDATE
  SET quantity = EXCLUDED.quantity,
      status   = EXCLUDED.status;

INSERT INTO expenses (id, property_id, plantation_id, livestock_id, description, category, amount, expense_date, payment_method, payment_status)
VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', NULL, 'Adubo NPK para milho', 'fertilizantes', 1280, '2026-08-12', 'pix', 'pago'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000101', NULL, '00000000-0000-0000-0000-000000000302', 'Ração para postura', 'racao', 940, '2026-08-18', 'boleto', 'pendente'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000101', NULL, NULL, 'Manutenção do trator', 'manutencao', 1650, '2026-08-21', 'cartao_credito', 'pago')
ON CONFLICT (id) DO UPDATE
  SET amount         = EXCLUDED.amount,
      payment_status = EXCLUDED.payment_status;

INSERT INTO revenues (id, property_id, plantation_id, livestock_id, product, quantity, unit, unit_price, total_amount, buyer, revenue_date, payment_method, payment_status)
VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000101', NULL, '00000000-0000-0000-0000-000000000301', 'Leite cru', 4260, 'L', 2.15, 9159.00, 'Laticínio Santa Clara', '2026-08-25', 'transferencia', 'pago'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000101', NULL, '00000000-0000-0000-0000-000000000302', 'Ovos caipiras', 184, 'dúzias', 14.5, 2668.00, 'Mercado Central', '2026-08-22', 'pix', 'pago')
ON CONFLICT (id) DO UPDATE
  SET quantity   = EXCLUDED.quantity,
      unit_price = EXCLUDED.unit_price;

INSERT INTO calendar_events (id, property_id, plantation_id, livestock_id, title, category, event_date, event_time, priority, status)
VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101', NULL, NULL, 'Irrigação das hortaliças', 'irrigacao', '2026-08-27', '06:30', 'media', 'pendente'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', NULL, 'Adubação do milho', 'adubacao', '2026-08-28', '08:00', 'alta', 'pendente'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000101', NULL, '00000000-0000-0000-0000-000000000301', 'Vacinação do gado', 'vacinacao', '2026-09-05', '14:00', 'urgente', 'pendente')
ON CONFLICT (id) DO UPDATE
  SET title  = EXCLUDED.title,
      status = EXCLUDED.status;

INSERT INTO info_articles (id, title, summary, content, category, source, published_at)
VALUES
  ('00000000-0000-0000-0000-000000000801', 'Boas práticas para reduzir perdas na colheita', 'Checklist de regulagem, logística e armazenagem para pequenos produtores.', 'Planejar janelas de colheita, revisar máquinas e medir umidade reduz perdas.', 'cultivo', 'IAgroTech Conteúdo', '2026-08-20 10:00:00'),
  ('00000000-0000-0000-0000-000000000802', 'Mercado do leite mantém demanda aquecida', 'Indicadores de compra favorecem produtores com controle de qualidade.', 'A gestão de volume, qualidade e custo alimentar continua determinante.', 'mercado', 'Boletim Rural', '2026-08-24 08:30:00'),
  ('00000000-0000-0000-0000-000000000803', 'Monitoramento climático no planejamento da safra', 'Como cruzar previsão, histórico e estágio da cultura nas decisões diárias.', 'Alertas por talhão ajudam a antecipar irrigação, aplicação e colheita.', 'clima', 'IAgroTech Conteúdo', '2026-08-25 16:45:00')
ON CONFLICT (id) DO UPDATE
  SET title   = EXCLUDED.title,
      summary = EXCLUDED.summary;

INSERT INTO alerts (id, property_id, type, title, message, priority, is_read, related_entity_type, related_entity_id)
VALUES
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000101', 'estoque',    'Fertilizante abaixo do mínimo', 'NPK 10-10-10 possui 5 kg em estoque. Mínimo recomendado: 30 kg.',    'warning',  FALSE, 'inventory_items', '00000000-0000-0000-0000-000000000401'),
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000101', 'calendario', 'Atividade crítica próxima',     'Vacinação do gado programada para 05/09 às 14:00.',                  'critical', FALSE, 'calendar_events', '00000000-0000-0000-0000-000000000503'),
  ('00000000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-000000000101', 'ia',         'Sugestão de compra',            'Repor vacina clostridiose antes da próxima janela sanitária.',        'info',     TRUE,  NULL,             NULL)
ON CONFLICT (id) DO UPDATE
  SET message  = EXCLUDED.message,
      priority = EXCLUDED.priority;
