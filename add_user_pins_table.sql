-- Create user_pins table for user-specific announcement pinning
-- This allows each user to have their own pinned announcements without affecting other users

CREATE TABLE IF NOT EXISTS user_pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    announcement_id INT NOT NULL,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pin (user_id, announcement_id),
    FOREIGN KEY (user_id) REFERENCES login(login_id) ON DELETE CASCADE,
    FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE
);

-- Optional: If you have old is_pinned data in announcements table that you want to migrate:
-- You can back up and clear the old is_pinned column after migration is complete
-- ALTER TABLE announcements DROP COLUMN is_pinned;
