-- Migration 009: Permissions, Vision Boards, Manifestations, Preferences, and Schema Enhancements

-- Add category and vibe to gratitude entries
ALTER TABLE gratitude_entries ADD COLUMN category VARCHAR(100) NULL;
ALTER TABLE gratitude_entries ADD COLUMN vibe VARCHAR(50) NULL;

-- Add description to music tracks
ALTER TABLE music_tracks ADD COLUMN description TEXT NULL;

-- Module & Role Permissions per user
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id CHAR(36) PRIMARY KEY,
  access_masters TINYINT(1) NOT NULL DEFAULT 1,
  access_goals TINYINT(1) NOT NULL DEFAULT 1,
  access_goal_planner TINYINT(1) NOT NULL DEFAULT 1,
  access_vision_board TINYINT(1) NOT NULL DEFAULT 1,
  access_gratitude TINYINT(1) NOT NULL DEFAULT 1,
  access_habits TINYINT(1) NOT NULL DEFAULT 1,
  access_overall_dashboard TINYINT(1) NOT NULL DEFAULT 1,
  access_habits_dashboard TINYINT(1) NOT NULL DEFAULT 1,
  access_music TINYINT(1) NOT NULL DEFAULT 1,
  access_admin TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vision board persistence
CREATE TABLE IF NOT EXISTS vision_boards (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  center_quote VARCHAR(500) NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  board_owner VARCHAR(255) NULL,
  board_data JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vision_board_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Manifestations module persistence
CREATE TABLE IF NOT EXISTS manifestations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  current JSON NULL,
  accomplished_list JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_manifestations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User UI and system preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id CHAR(36) PRIMARY KEY,
  preferences JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin audit logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
