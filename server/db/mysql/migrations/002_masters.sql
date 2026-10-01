-- Masters (mentor/mastery profiles) table, tied to a user for per-user 
-- progress tracking and multi-device sync
CREATE TABLE IF NOT EXISTS masters (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  level ENUM('Apprentice','Practitioner','Master','Grandmaster') NOT NULL DEFAULT 'Apprentice',
  progress INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  key_practices JSON NULL,
  color_theme ENUM('green','yellow','pink') NOT NULL DEFAULT 'green',
  icon VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_masters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
