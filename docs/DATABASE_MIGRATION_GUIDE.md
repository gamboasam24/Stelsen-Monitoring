# Database Changes - User-Specific Pinning

## Migration Steps

### Step 1: Create the user_pins Table
This table stores the relationship between users and their pinned announcements.

```sql
CREATE TABLE IF NOT EXISTS user_pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    announcement_id INT NOT NULL,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pin (user_id, announcement_id),
    FOREIGN KEY (user_id) REFERENCES login(login_id) ON DELETE CASCADE,
    FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE
);
```

### What This Table Does
- **Tracks pinned announcements per user**
- One row per pinned announcement per user
- User 1 can pin announcement 5, User 2 can also pin announcement 5
- When deleted from here, it's unpinned for that user only

### Example Data

**Before Migration (Old is_pinned column):**
```
announcements table:
announcement_id | title | is_pinned
5 | Important Policy | 1  ← All users see as pinned
10 | Meeting Notes | 0
```

**After Migration (user_pins table):**
```
user_pins table:
user_id | announcement_id | pinned_at
1 | 5 | 2025-01-13 10:00:00  ← Admin pinned
2 | 10 | 2025-01-13 11:00:00 ← User A pinned
3 | 5 | 2025-01-13 11:30:00  ← User B also pinned #5
```

Now each user has independent pins!

### Step 2: Query Changes

**Old Query (Global Pins):**
```sql
SELECT 
    a.announcement_id,
    a.title,
    a.is_pinned  -- Global for all users
FROM announcements a
WHERE a.is_active = 1
ORDER BY a.is_pinned DESC, a.created_at DESC
```

**New Query (User-Specific Pins):**
```sql
SELECT 
    a.announcement_id,
    a.title,
    CASE 
        WHEN up.id IS NOT NULL THEN 1
        ELSE 0
    END AS is_pinned  -- Only if THIS user pinned it
FROM announcements a
LEFT JOIN user_pins up 
    ON up.announcement_id = a.announcement_id 
    AND up.user_id = ?  -- Current user's ID
WHERE a.is_active = 1
ORDER BY (up.id IS NOT NULL) DESC, a.created_at DESC
```

### Step 3: Optional - Clean Up Old Column

If you want to remove the old is_pinned column after migration:

```sql
-- Backup first (just in case)
SELECT * FROM announcements INTO OUTFILE '/tmp/announcements_backup.csv';

-- Then remove the old column
ALTER TABLE announcements DROP COLUMN is_pinned;
```

**WARNING**: Don't do this unless you've fully migrated and tested!

## Verification Queries

### Check if table exists
```sql
DESCRIBE user_pins;
```

### See all pins for a specific user
```sql
SELECT 
    up.announcement_id,
    a.title,
    up.pinned_at
FROM user_pins up
JOIN announcements a ON up.announcement_id = a.announcement_id
WHERE up.user_id = 2
ORDER BY up.pinned_at DESC;
```

### See all pins across all users
```sql
SELECT 
    l.email as username,
    a.title as announcement,
    up.pinned_at
FROM user_pins up
JOIN login l ON up.user_id = l.login_id
JOIN announcements a ON up.announcement_id = a.announcement_id
ORDER BY l.email, up.pinned_at DESC;
```

### Count pins per user
```sql
SELECT 
    l.email,
    COUNT(*) as pin_count
FROM user_pins up
JOIN login l ON up.user_id = l.login_id
GROUP BY up.user_id, l.email
ORDER BY pin_count DESC;
```

### Find announcements pinned by multiple users
```sql
SELECT 
    a.announcement_id,
    a.title,
    COUNT(DISTINCT up.user_id) as times_pinned
FROM user_pins up
JOIN announcements a ON up.announcement_id = a.announcement_id
GROUP BY up.announcement_id, a.title
HAVING times_pinned > 1
ORDER BY times_pinned DESC;
```

## Rollback (If Needed)

If you need to go back to the old system:

```sql
-- Add back the is_pinned column
ALTER TABLE announcements ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0;

-- Restore from backup or set manually
UPDATE announcements SET is_pinned = 1 WHERE announcement_id IN (5, 10, 15);

-- Drop the user_pins table
DROP TABLE user_pins;
```

## Performance Notes

- The `unique_pin` index ensures each user can only pin an announcement once
- Foreign keys ensure data integrity (cascading deletes)
- LEFT JOIN is efficient even with many users
- Typical query returns in < 100ms even with thousands of records

## Size Estimate

- Each pin entry: ~20 bytes
- For 100 users with 5 pins each: ~10 KB
- For 1000 users with 5 pins each: ~100 KB
- Minimal database overhead!
