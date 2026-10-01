-- Custom affirmation audio, tied to a user. Stores a file path/URL, 
-- not the raw audio data (audio files are saved on disk, not in the DB).
CREATE TABLE IF NOT EXISTS affirmation_audio (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_affirmation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_audio (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
