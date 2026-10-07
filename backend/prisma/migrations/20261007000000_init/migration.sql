-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `profile_image` VARCHAR(500) NULL,
    `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    `xp` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `study_streak` INTEGER NOT NULL DEFAULT 0,
    `daily_study_target` INTEGER NOT NULL DEFAULT 120,
    `preferred_study_start` VARCHAR(5) NOT NULL DEFAULT '17:00',
    `preferred_study_end` VARCHAR(5) NOT NULL DEFAULT '21:00',
    `last_study_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#4f46e5',
    `icon` VARCHAR(16) NOT NULL DEFAULT '📘',
    `exam_date` DATE NULL,
    `target_completion` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subjects_user_id_exam_date_idx`(`user_id`, `exam_date`),
    UNIQUE INDEX `subjects_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 3,
    `importance` INTEGER NOT NULL DEFAULT 3,
    `estimated_minutes` INTEGER NOT NULL DEFAULT 60,
    `understanding_percentage` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
    `next_revision_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `topics_subject_id_status_idx`(`subject_id`, `status`),
    INDEX `topics_next_revision_at_idx`(`next_revision_at`),
    UNIQUE INDEX `topics_subject_id_name_key`(`subject_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `topic_id` INTEGER NULL,
    `title` VARCHAR(180) NOT NULL,
    `notes` TEXT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `actual_minutes` INTEGER NULL,
    `status` ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `study_sessions_user_id_scheduled_at_idx`(`user_id`, `scheduled_at`),
    INDEX `study_sessions_subject_id_status_idx`(`subject_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mock_tests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mock_tests_subject_id_status_idx`(`subject_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_id` INTEGER NOT NULL,
    `prompt` TEXT NOT NULL,
    `options` JSON NOT NULL,
    `answer_index` INTEGER NOT NULL,
    `explanation` TEXT NULL,
    `points` INTEGER NOT NULL DEFAULT 1,

    INDEX `test_questions_test_id_idx`(`test_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `test_id` INTEGER NOT NULL,
    `answers` JSON NOT NULL,
    `score` INTEGER NOT NULL,
    `total_points` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `test_attempts_user_id_completed_at_idx`(`user_id`, `completed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(60) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(16) NOT NULL,
    `xp_reward` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `achievements_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `user_id` INTEGER NOT NULL,
    `achievement_id` INTEGER NOT NULL,
    `earned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_achievements_achievement_id_idx`(`achievement_id`),
    PRIMARY KEY (`user_id`, `achievement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_sessions` ADD CONSTRAINT `study_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_sessions` ADD CONSTRAINT `study_sessions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_sessions` ADD CONSTRAINT `study_sessions_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mock_tests` ADD CONSTRAINT `mock_tests_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_questions` ADD CONSTRAINT `test_questions_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `mock_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `mock_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievement_id_fkey` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

