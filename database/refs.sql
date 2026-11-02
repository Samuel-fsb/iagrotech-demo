-- Reference data: subscription plans and promotion codes.
-- Safe to run on a fresh Neon database (idempotent via ON CONFLICT).
-- Does NOT contain admin users or demo passwords.
-- Run after schema.sql via: node database/setup.js --with-refs

INSERT INTO subscription_plans (id, code, name, plan_type, billing_cycle, price, trial_days)
VALUES
  ('00000000-0000-0000-0000-000000000021', 'free_30_days',    'Free 30 dias',    'FREE',    NULL,      0,      30),
  ('00000000-0000-0000-0000-000000000022', 'premium_monthly', 'Premium Mensal',  'PREMIUM', 'monthly', 49.90,  0),
  ('00000000-0000-0000-0000-000000000023', 'premium_anual',   'Premium Anual',   'PREMIUM', 'annual',  499.00, 0)
ON CONFLICT (id) DO UPDATE
  SET name   = EXCLUDED.name,
      price  = EXCLUDED.price,
      active = TRUE;

INSERT INTO promotion_codes (id, code, description, discount_type, discount_value, applies_to_plan_type, active)
VALUES
  ('00000000-0000-0000-0000-000000000051', 'AGRO10',    '10% de desconto no plano Premium',      'percent',      10, 'PREMIUM', TRUE),
  ('00000000-0000-0000-0000-000000000052', 'PREMIUM20', '20% de desconto no plano Premium',      'percent',      20, 'PREMIUM', TRUE),
  ('00000000-0000-0000-0000-000000000053', 'SAFRA50',   'R$ 50,00 de desconto no plano Premium', 'fixed_amount', 50, 'PREMIUM', TRUE)
ON CONFLICT (id) DO UPDATE
  SET description          = EXCLUDED.description,
      discount_type        = EXCLUDED.discount_type,
      discount_value       = EXCLUDED.discount_value,
      applies_to_plan_type = EXCLUDED.applies_to_plan_type,
      active               = EXCLUDED.active;
