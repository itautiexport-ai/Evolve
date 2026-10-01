-- Habits table, tied to a user
CREATE TABLE IF NOT EXISTS habits (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  frequency ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  category VARCHAR(100) NOT NULL,
  streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Habit completion history, one row per date per habit
CREATE TABLE IF NOT EXISTS habit_history (
  id CHAR(36) PRIMARY KEY,
  habit_id CHAR(36) NOT NULL,
  entry_date DATE NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_history_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_habit_date (habit_id, entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
