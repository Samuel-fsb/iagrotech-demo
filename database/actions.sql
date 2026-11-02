-- SQL actions used by the system screens.
-- Target: MySQL 8.0+

USE iagrotech;

DELIMITER $$

DROP PROCEDURE IF EXISTS register_user_account$$
DROP PROCEDURE IF EXISTS create_financial_revenue$$
DROP PROCEDURE IF EXISTS update_financial_revenue$$
DROP PROCEDURE IF EXISTS delete_financial_revenue$$
DROP PROCEDURE IF EXISTS create_financial_expense$$
DROP PROCEDURE IF EXISTS update_financial_expense$$
DROP PROCEDURE IF EXISTS delete_financial_expense$$
DROP PROCEDURE IF EXISTS create_plantation$$
DROP PROCEDURE IF EXISTS update_plantation$$
DROP PROCEDURE IF EXISTS delete_plantation$$
DROP PROCEDURE IF EXISTS create_livestock_batch$$
DROP PROCEDURE IF EXISTS update_livestock_batch$$
DROP PROCEDURE IF EXISTS delete_livestock_batch$$
DROP PROCEDURE IF EXISTS create_inventory_item$$
DROP PROCEDURE IF EXISTS update_inventory_item$$
DROP PROCEDURE IF EXISTS delete_inventory_item$$
DROP PROCEDURE IF EXISTS create_calendar_event$$
DROP PROCEDURE IF EXISTS update_calendar_event$$
DROP PROCEDURE IF EXISTS delete_calendar_event$$
DROP PROCEDURE IF EXISTS create_info_article$$
DROP PROCEDURE IF EXISTS update_info_article$$
DROP PROCEDURE IF EXISTS delete_info_article$$
DROP PROCEDURE IF EXISTS create_alert$$
DROP PROCEDURE IF EXISTS update_alert$$
DROP PROCEDURE IF EXISTS delete_alert$$
DROP PROCEDURE IF EXISTS create_ai_message$$
DROP PROCEDURE IF EXISTS update_property_settings$$
DROP PROCEDURE IF EXISTS update_user_profile$$
DROP PROCEDURE IF EXISTS update_user_subscription_plan$$
DROP PROCEDURE IF EXISTS create_user_session$$
DROP PROCEDURE IF EXISTS logout_user_session$$

CREATE PROCEDURE register_user_account(
  IN p_name VARCHAR(160),
  IN p_email VARCHAR(180),
  IN p_phone VARCHAR(32),
  IN p_password_hash TEXT,
  IN p_property_name VARCHAR(180),
  IN p_plan_code VARCHAR(40),
  IN p_payment_method VARCHAR(32)
)
BEGIN
  DECLARE v_plan_id CHAR(36);
  DECLARE v_plan_type VARCHAR(20);
  DECLARE v_billing_cycle VARCHAR(20);
  DECLARE v_price DECIMAL(14, 2);
  DECLARE v_trial_days INT;
  DECLARE v_user_id CHAR(36);
  DECLARE v_subscription_id CHAR(36);

  SELECT id, plan_type, billing_cycle, price, trial_days
    INTO v_plan_id, v_plan_type, v_billing_cycle, v_price, v_trial_days
  FROM subscription_plans
  WHERE code = p_plan_code AND active = TRUE
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Subscription plan not found';
  END IF;

  SET v_user_id = UUID();
  INSERT INTO users (id, name, email, phone, password_hash, plan)
  VALUES (v_user_id, p_name, p_email, p_phone, p_password_hash, v_plan_type);

  INSERT INTO properties (owner_id, name)
  VALUES (v_user_id, COALESCE(NULLIF(p_property_name, ''), 'Minha propriedade'));

  SET v_subscription_id = UUID();
  INSERT INTO user_subscriptions (
    id, user_id, plan_id, status, trial_ends_at, current_period_ends_at
  )
  VALUES (
    v_subscription_id,
    v_user_id,
    v_plan_id,
    IF(v_plan_type = 'FREE', 'trial', 'active'),
    IF(v_plan_type = 'FREE', DATE_ADD(NOW(), INTERVAL v_trial_days DAY), NULL),
    CASE
      WHEN v_billing_cycle = 'monthly' THEN DATE_ADD(NOW(), INTERVAL 1 MONTH)
      WHEN v_billing_cycle = 'annual' THEN DATE_ADD(NOW(), INTERVAL 1 YEAR)
      ELSE DATE_ADD(NOW(), INTERVAL v_trial_days DAY)
    END
  );

  IF v_plan_type = 'PREMIUM' THEN
    INSERT INTO subscription_payments (subscription_id, amount, payment_method, status)
    VALUES (v_subscription_id, v_price, COALESCE(p_payment_method, 'pix'), 'pendente');
  END IF;

  SELECT * FROM users WHERE id = v_user_id;
END$$

CREATE PROCEDURE create_financial_revenue(
  IN p_property_id CHAR(36),
  IN p_product VARCHAR(160),
  IN p_quantity DECIMAL(14, 3),
  IN p_unit VARCHAR(24),
  IN p_unit_price DECIMAL(14, 2),
  IN p_buyer VARCHAR(180),
  IN p_revenue_date DATE,
  IN p_payment_method VARCHAR(32),
  IN p_payment_status VARCHAR(24)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO revenues (id, property_id, product, quantity, unit, unit_price, buyer, revenue_date, payment_method, payment_status)
  VALUES (v_id, p_property_id, p_product, p_quantity, p_unit, p_unit_price, p_buyer, p_revenue_date, COALESCE(p_payment_method, 'pix'), COALESCE(p_payment_status, 'pago'));
  SELECT * FROM revenues WHERE id = v_id;
END$$

CREATE PROCEDURE update_financial_revenue(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_product VARCHAR(160),
  IN p_quantity DECIMAL(14, 3),
  IN p_unit VARCHAR(24),
  IN p_unit_price DECIMAL(14, 2),
  IN p_buyer VARCHAR(180),
  IN p_revenue_date DATE,
  IN p_payment_method VARCHAR(32),
  IN p_payment_status VARCHAR(24)
)
BEGIN
  UPDATE revenues
  SET product = p_product,
      quantity = p_quantity,
      unit = p_unit,
      unit_price = p_unit_price,
      buyer = p_buyer,
      revenue_date = p_revenue_date,
      payment_method = COALESCE(p_payment_method, payment_method),
      payment_status = COALESCE(p_payment_status, payment_status)
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM revenues WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_financial_revenue(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM revenues WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_financial_expense(
  IN p_property_id CHAR(36),
  IN p_description VARCHAR(220),
  IN p_category VARCHAR(32),
  IN p_amount DECIMAL(14, 2),
  IN p_expense_date DATE,
  IN p_payment_method VARCHAR(32),
  IN p_payment_status VARCHAR(24),
  IN p_plantation_id CHAR(36),
  IN p_livestock_id CHAR(36)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO expenses (id, property_id, plantation_id, livestock_id, description, category, amount, expense_date, payment_method, payment_status)
  VALUES (v_id, p_property_id, p_plantation_id, p_livestock_id, p_description, p_category, p_amount, p_expense_date, COALESCE(p_payment_method, 'pix'), COALESCE(p_payment_status, 'pago'));
  SELECT * FROM expenses WHERE id = v_id;
END$$

CREATE PROCEDURE update_financial_expense(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_description VARCHAR(220),
  IN p_category VARCHAR(32),
  IN p_amount DECIMAL(14, 2),
  IN p_expense_date DATE,
  IN p_payment_method VARCHAR(32),
  IN p_payment_status VARCHAR(24),
  IN p_plantation_id CHAR(36),
  IN p_livestock_id CHAR(36)
)
BEGIN
  UPDATE expenses
  SET plantation_id = p_plantation_id,
      livestock_id = p_livestock_id,
      description = p_description,
      category = p_category,
      amount = p_amount,
      expense_date = p_expense_date,
      payment_method = COALESCE(p_payment_method, payment_method),
      payment_status = COALESCE(p_payment_status, payment_status)
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM expenses WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_financial_expense(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM expenses WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_plantation(
  IN p_property_id CHAR(36),
  IN p_culture VARCHAR(120),
  IN p_variety VARCHAR(120),
  IN p_planted_area DECIMAL(12, 2),
  IN p_planting_date DATE,
  IN p_expected_harvest_date DATE,
  IN p_estimated_production DECIMAL(14, 2),
  IN p_costs DECIMAL(14, 2)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO plantations (id, property_id, culture, variety, planted_area, planting_date, expected_harvest_date, status, estimated_production, costs)
  VALUES (v_id, p_property_id, p_culture, p_variety, p_planted_area, p_planting_date, p_expected_harvest_date, 'plantada', p_estimated_production, COALESCE(p_costs, 0));
  SELECT * FROM plantations WHERE id = v_id;
END$$

CREATE PROCEDURE update_plantation(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_culture VARCHAR(120),
  IN p_variety VARCHAR(120),
  IN p_planted_area DECIMAL(12, 2),
  IN p_planting_date DATE,
  IN p_expected_harvest_date DATE,
  IN p_estimated_production DECIMAL(14, 2),
  IN p_costs DECIMAL(14, 2),
  IN p_status VARCHAR(32)
)
BEGIN
  UPDATE plantations
  SET culture = p_culture,
      variety = p_variety,
      planted_area = p_planted_area,
      planting_date = p_planting_date,
      expected_harvest_date = p_expected_harvest_date,
      estimated_production = p_estimated_production,
      costs = COALESCE(p_costs, costs),
      status = COALESCE(p_status, status)
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM plantations WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_plantation(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM plantations WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_livestock_batch(
  IN p_property_id CHAR(36),
  IN p_type VARCHAR(120),
  IN p_breed VARCHAR(120),
  IN p_quantity INT,
  IN p_acquisition_date DATE,
  IN p_feeding TEXT,
  IN p_vaccination TEXT,
  IN p_production TEXT
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO livestock (id, property_id, type, breed, quantity, acquisition_date, feeding, vaccination, production)
  VALUES (v_id, p_property_id, p_type, p_breed, p_quantity, p_acquisition_date, p_feeding, p_vaccination, p_production);
  SELECT * FROM livestock WHERE id = v_id;
END$$

CREATE PROCEDURE update_livestock_batch(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_type VARCHAR(120),
  IN p_breed VARCHAR(120),
  IN p_quantity INT,
  IN p_acquisition_date DATE,
  IN p_feeding TEXT,
  IN p_vaccination TEXT,
  IN p_production TEXT
)
BEGIN
  UPDATE livestock
  SET type = p_type,
      breed = p_breed,
      quantity = p_quantity,
      acquisition_date = p_acquisition_date,
      feeding = p_feeding,
      vaccination = p_vaccination,
      production = p_production
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM livestock WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_livestock_batch(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM livestock WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_inventory_item(
  IN p_property_id CHAR(36),
  IN p_name VARCHAR(160),
  IN p_category VARCHAR(32),
  IN p_quantity DECIMAL(14, 3),
  IN p_unit VARCHAR(24),
  IN p_minimum_stock DECIMAL(14, 3),
  IN p_location VARCHAR(160),
  IN p_expiration_date DATE
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  DECLARE v_status VARCHAR(24);
  SET v_status = CASE
    WHEN p_quantity <= 0 THEN 'esgotado'
    WHEN p_quantity <= p_minimum_stock THEN 'estoque_baixo'
    ELSE 'normal'
  END;
  INSERT INTO inventory_items (id, property_id, name, category, quantity, unit, minimum_stock, location, expiration_date, status)
  VALUES (v_id, p_property_id, p_name, p_category, p_quantity, p_unit, p_minimum_stock, p_location, p_expiration_date, v_status);
  SELECT * FROM inventory_items WHERE id = v_id;
END$$

CREATE PROCEDURE update_inventory_item(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_name VARCHAR(160),
  IN p_category VARCHAR(32),
  IN p_quantity DECIMAL(14, 3),
  IN p_unit VARCHAR(24),
  IN p_minimum_stock DECIMAL(14, 3),
  IN p_location VARCHAR(160),
  IN p_expiration_date DATE
)
BEGIN
  DECLARE v_status VARCHAR(24);
  SET v_status = CASE
    WHEN p_quantity <= 0 THEN 'esgotado'
    WHEN p_quantity <= p_minimum_stock THEN 'estoque_baixo'
    ELSE 'normal'
  END;
  UPDATE inventory_items
  SET name = p_name,
      category = p_category,
      quantity = p_quantity,
      unit = p_unit,
      minimum_stock = p_minimum_stock,
      location = p_location,
      expiration_date = p_expiration_date,
      status = v_status
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM inventory_items WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_inventory_item(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM inventory_items WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_calendar_event(
  IN p_property_id CHAR(36),
  IN p_title VARCHAR(180),
  IN p_category VARCHAR(32),
  IN p_event_date DATE,
  IN p_event_time TIME,
  IN p_priority VARCHAR(16),
  IN p_notes TEXT,
  IN p_plantation_id CHAR(36),
  IN p_livestock_id CHAR(36)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO calendar_events (id, property_id, plantation_id, livestock_id, title, category, event_date, event_time, priority, status, notes)
  VALUES (v_id, p_property_id, p_plantation_id, p_livestock_id, p_title, p_category, p_event_date, p_event_time, COALESCE(p_priority, 'media'), 'pendente', p_notes);
  SELECT * FROM calendar_events WHERE id = v_id;
END$$

CREATE PROCEDURE update_calendar_event(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_title VARCHAR(180),
  IN p_category VARCHAR(32),
  IN p_event_date DATE,
  IN p_event_time TIME,
  IN p_priority VARCHAR(16),
  IN p_notes TEXT,
  IN p_status VARCHAR(24),
  IN p_plantation_id CHAR(36),
  IN p_livestock_id CHAR(36)
)
BEGIN
  UPDATE calendar_events
  SET plantation_id = p_plantation_id,
      livestock_id = p_livestock_id,
      title = p_title,
      category = p_category,
      event_date = p_event_date,
      event_time = p_event_time,
      priority = COALESCE(p_priority, priority),
      status = COALESCE(p_status, status),
      notes = p_notes
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM calendar_events WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_calendar_event(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM calendar_events WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_info_article(
  IN p_title VARCHAR(220),
  IN p_summary TEXT,
  IN p_content TEXT,
  IN p_category VARCHAR(32),
  IN p_source VARCHAR(160),
  IN p_image_url TEXT
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO info_articles (id, title, summary, content, category, source, image_url)
  VALUES (v_id, p_title, p_summary, p_content, p_category, COALESCE(p_source, 'IAgroTech Conteúdo'), p_image_url);
  SELECT * FROM info_articles WHERE id = v_id;
END$$

CREATE PROCEDURE update_info_article(
  IN p_id CHAR(36),
  IN p_title VARCHAR(220),
  IN p_summary TEXT,
  IN p_content TEXT,
  IN p_category VARCHAR(32),
  IN p_source VARCHAR(160),
  IN p_image_url TEXT
)
BEGIN
  UPDATE info_articles
  SET title = p_title,
      summary = p_summary,
      content = p_content,
      category = p_category,
      source = COALESCE(p_source, source),
      image_url = p_image_url
  WHERE id = p_id;
  SELECT * FROM info_articles WHERE id = p_id;
END$$

CREATE PROCEDURE delete_info_article(IN p_id CHAR(36))
BEGIN
  DELETE FROM info_articles WHERE id = p_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_alert(
  IN p_property_id CHAR(36),
  IN p_type VARCHAR(24),
  IN p_title VARCHAR(180),
  IN p_message TEXT,
  IN p_priority VARCHAR(16),
  IN p_related_entity_type VARCHAR(80),
  IN p_related_entity_id CHAR(36)
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO alerts (id, property_id, type, title, message, priority, is_read, related_entity_type, related_entity_id)
  VALUES (v_id, p_property_id, p_type, p_title, p_message, COALESCE(p_priority, 'info'), FALSE, p_related_entity_type, p_related_entity_id);
  SELECT * FROM alerts WHERE id = v_id;
END$$

CREATE PROCEDURE update_alert(
  IN p_id CHAR(36),
  IN p_property_id CHAR(36),
  IN p_type VARCHAR(24),
  IN p_title VARCHAR(180),
  IN p_message TEXT,
  IN p_priority VARCHAR(16),
  IN p_is_read BOOLEAN,
  IN p_related_entity_type VARCHAR(80),
  IN p_related_entity_id CHAR(36)
)
BEGIN
  UPDATE alerts
  SET type = p_type,
      title = p_title,
      message = p_message,
      priority = COALESCE(p_priority, priority),
      is_read = COALESCE(p_is_read, is_read),
      related_entity_type = p_related_entity_type,
      related_entity_id = p_related_entity_id
  WHERE id = p_id AND property_id = p_property_id;
  SELECT * FROM alerts WHERE id = p_id AND property_id = p_property_id;
END$$

CREATE PROCEDURE delete_alert(IN p_id CHAR(36), IN p_property_id CHAR(36))
BEGIN
  DELETE FROM alerts WHERE id = p_id AND property_id = p_property_id;
  SELECT ROW_COUNT() > 0 AS deleted;
END$$

CREATE PROCEDURE create_ai_message(
  IN p_property_id CHAR(36),
  IN p_user_id CHAR(36),
  IN p_prompt TEXT,
  IN p_answer TEXT,
  IN p_conversation_id CHAR(36)
)
BEGIN
  DECLARE v_conversation_id CHAR(36);
  SET v_conversation_id = p_conversation_id;

  IF v_conversation_id IS NULL THEN
    SET v_conversation_id = UUID();
    INSERT INTO ai_conversations (id, property_id, user_id, title)
    VALUES (v_conversation_id, p_property_id, p_user_id, LEFT(p_prompt, 80));
  END IF;

  INSERT INTO ai_messages (conversation_id, role, content)
  VALUES
    (v_conversation_id, 'user', p_prompt),
    (v_conversation_id, 'assistant', p_answer);

  SELECT * FROM ai_conversations WHERE id = v_conversation_id;
END$$

CREATE PROCEDURE update_property_settings(
  IN p_property_id CHAR(36),
  IN p_property_name VARCHAR(180),
  IN p_city VARCHAR(120),
  IN p_state CHAR(2),
  IN p_total_area DECIMAL(12, 2),
  IN p_notification_level VARCHAR(24)
)
BEGIN
  UPDATE properties
  SET name = p_property_name,
      city = p_city,
      state = p_state,
      total_area = p_total_area
  WHERE id = p_property_id;

  INSERT INTO app_settings (property_id, notification_level)
  VALUES (p_property_id, COALESCE(p_notification_level, 'all'))
  ON DUPLICATE KEY UPDATE notification_level = VALUES(notification_level);

  SELECT * FROM properties WHERE id = p_property_id;
END$$

CREATE PROCEDURE update_user_profile(
  IN p_user_id CHAR(36),
  IN p_name VARCHAR(160),
  IN p_email VARCHAR(180),
  IN p_phone VARCHAR(32),
  IN p_photo_url TEXT
)
BEGIN
  UPDATE users
  SET name = p_name,
      email = p_email,
      phone = p_phone,
      photo_url = p_photo_url
  WHERE id = p_user_id;
  SELECT * FROM users WHERE id = p_user_id;
END$$

CREATE PROCEDURE update_user_subscription_plan(
  IN p_user_id CHAR(36),
  IN p_plan_code VARCHAR(40),
  IN p_payment_method VARCHAR(32)
)
BEGIN
  DECLARE v_plan_id CHAR(36);
  DECLARE v_plan_type VARCHAR(20);
  DECLARE v_billing_cycle VARCHAR(20);
  DECLARE v_price DECIMAL(14, 2);
  DECLARE v_trial_days INT;
  DECLARE v_subscription_id CHAR(36);
  DECLARE v_current_period_ends_at TIMESTAMP;
  DECLARE v_period_base TIMESTAMP;

  SELECT id, plan_type, billing_cycle, price, trial_days
    INTO v_plan_id, v_plan_type, v_billing_cycle, v_price, v_trial_days
  FROM subscription_plans
  WHERE code = p_plan_code AND active = TRUE
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Subscription plan not found';
  END IF;

  SELECT MAX(current_period_ends_at)
    INTO v_current_period_ends_at
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('trial', 'active', 'past_due');

  SET v_period_base = IF(
    v_current_period_ends_at IS NOT NULL AND v_current_period_ends_at > NOW(),
    v_current_period_ends_at,
    NOW()
  );

  UPDATE user_subscriptions
  SET status = 'cancelled',
      cancelled_at = NOW()
  WHERE user_id = p_user_id
    AND status IN ('trial', 'active', 'past_due');

  UPDATE users SET plan = v_plan_type WHERE id = p_user_id;

  SET v_subscription_id = UUID();
  INSERT INTO user_subscriptions (id, user_id, plan_id, status, trial_ends_at, current_period_ends_at)
  VALUES (
    v_subscription_id,
    p_user_id,
    v_plan_id,
    IF(v_plan_type = 'FREE', 'trial', 'active'),
    IF(v_plan_type = 'FREE', DATE_ADD(NOW(), INTERVAL v_trial_days DAY), NULL),
    CASE
      WHEN v_billing_cycle = 'monthly' THEN DATE_ADD(v_period_base, INTERVAL 1 MONTH)
      WHEN v_billing_cycle = 'annual' THEN DATE_ADD(v_period_base, INTERVAL 1 YEAR)
      ELSE DATE_ADD(v_period_base, INTERVAL v_trial_days DAY)
    END
  );

  IF v_plan_type = 'PREMIUM' THEN
    INSERT INTO subscription_payments (subscription_id, amount, payment_method, status)
    VALUES (v_subscription_id, v_price, COALESCE(p_payment_method, 'pix'), 'pendente');
  END IF;

  SELECT * FROM user_subscriptions WHERE id = v_subscription_id;
END$$

CREATE PROCEDURE create_user_session(
  IN p_user_id CHAR(36),
  IN p_access_token_hash TEXT,
  IN p_refresh_token_hash TEXT,
  IN p_user_agent TEXT,
  IN p_ip_address VARCHAR(45),
  IN p_expires_at TIMESTAMP
)
BEGIN
  DECLARE v_id CHAR(36) DEFAULT UUID();
  INSERT INTO user_sessions (id, user_id, access_token_hash, refresh_token_hash, user_agent, ip_address, expires_at)
  VALUES (v_id, p_user_id, p_access_token_hash, p_refresh_token_hash, p_user_agent, p_ip_address, COALESCE(p_expires_at, DATE_ADD(NOW(), INTERVAL 7 DAY)));
  SELECT * FROM user_sessions WHERE id = v_id;
END$$

CREATE PROCEDURE logout_user_session(IN p_session_id CHAR(36))
BEGIN
  UPDATE user_sessions SET revoked_at = NOW() WHERE id = p_session_id;
  SELECT * FROM user_sessions WHERE id = p_session_id;
END$$

DELIMITER ;
