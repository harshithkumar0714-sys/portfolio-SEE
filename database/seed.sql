USE smartstudy_db;

INSERT INTO achievements (code, name, description, icon, xp_reward)
VALUES
  ('first-session', 'First focus', 'Complete your first study session', '🎯', 25),
  ('streak-7', 'Seven-day streak', 'Study on seven consecutive days', '🔥', 100),
  ('test-taker', 'Test taker', 'Complete your first mock test', '📝', 25)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  xp_reward = VALUES(xp_reward);

-- Create an administrator using the application seed command instead of SQL:
-- passwords are bcrypt-hashed and must never be inserted as plaintext.
