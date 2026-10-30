-- Migration 011: User phone and approval status
ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN status ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved';

-- Preserve existing accounts as approved during migration
UPDATE users SET status = 'approved' WHERE status IS NULL OR status = '';
