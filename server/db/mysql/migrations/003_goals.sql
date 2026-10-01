-- Goals table, tied to a user
CREATE TABLE IF NOT EXISTS goals (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status ENUM('not-started','in-progress','completed','on-hold','active') NOT NULL DEFAULT 'not-started',
  target_date DATE NULL,
  progress INT NOT NULL DEFAULT 0,
  target_value DECIMAL(15,2) NULL,
  current_value DECIMAL(15,2) NULL,
  unit VARCHAR(50) NULL,
  image_url VARCHAR(500) NULL,
  tags JSON NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  reward VARCHAR(500) NULL,
  purpose TEXT NULL,
  success_criteria TEXT NULL,
  requirements TEXT NULL,
  challenges TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Milestones belonging to a goal
CREATE TABLE IF NOT EXISTS milestones (
  id CHAR(36) PRIMARY KEY,
  goal_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_milestones_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Journal entries belonging to a goal
CREATE TABLE IF NOT EXISTS goal_journal_entries (
  id CHAR(36) PRIMARY KEY,
  goal_id CHAR(36) NOT NULL,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_journal_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
