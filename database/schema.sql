CREATE DATABASE IF NOT EXISTS smartstudy_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartstudy_db;

-- Prisma's schema at backend/prisma/schema.prisma is the canonical relational
-- model. Create/update tables with `npm run db:migrate`; this script prepares
-- the database and documents the table and index layout for MySQL operators.
-- Prisma migrations preserve the full column definitions and foreign keys.

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_image VARCHAR(500) NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  study_streak INT NOT NULL DEFAULT 0,
  daily_study_target INT NOT NULL DEFAULT 120,
  preferred_study_start VARCHAR(5) NOT NULL DEFAULT '17:00',
  preferred_study_end VARCHAR(5) NOT NULL DEFAULT '21:00',
  last_study_date DATE NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#4f46e5',
  icon VARCHAR(16) NOT NULL DEFAULT '📘',
  exam_date DATE NULL,
  target_completion INT NOT NULL DEFAULT 100,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY subject_user_name (user_id, name),
  KEY subject_user_exam (user_id, exam_date),
  CONSTRAINT subjects_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS topics (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  difficulty INT NOT NULL DEFAULT 3,
  importance INT NOT NULL DEFAULT 3,
  estimated_minutes INT NOT NULL DEFAULT 60,
  understanding_percentage INT NOT NULL DEFAULT 0,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  next_revision_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY topic_subject_name (subject_id, name),
  KEY topic_subject_status (subject_id, status),
  KEY topic_revision (next_revision_at),
  CONSTRAINT topics_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_sessions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject_id INT NOT NULL,
  topic_id INT NULL,
  title VARCHAR(180) NOT NULL,
  notes TEXT NULL,
  scheduled_at DATETIME(3) NOT NULL,
  duration_minutes INT NOT NULL,
  actual_minutes INT NULL,
  status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  KEY session_user_schedule (user_id, scheduled_at),
  KEY session_subject_status (subject_id, status),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT sessions_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT sessions_topic_fk FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mock_tests (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  duration_minutes INT NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY test_subject_status (subject_id, status),
  CONSTRAINT tests_subject_fk FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS test_questions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  prompt TEXT NOT NULL,
  options JSON NOT NULL,
  answer_index INT NOT NULL,
  explanation TEXT NULL,
  points INT NOT NULL DEFAULT 1,
  KEY question_test (test_id),
  CONSTRAINT questions_test_fk FOREIGN KEY (test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS test_attempts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  answers JSON NOT NULL,
  score INT NOT NULL,
  total_points INT NOT NULL,
  completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY attempt_user_completed (user_id, completed_at),
  CONSTRAINT attempts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT attempts_test_fk FOREIGN KEY (test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS achievements (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(16) NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  earned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, achievement_id),
  KEY user_achievement_lookup (achievement_id),
  CONSTRAINT user_achievements_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_achievements_achievement_fk FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB;
