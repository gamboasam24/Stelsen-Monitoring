# Pin Feature - Quick Reference

## What Changed?
The announcement pin feature is now **user-specific** instead of global.

## Before (Old Way - Global Pins)
```
Admin pins "New Policy" → Everyone sees it pinned ❌
User sees Admin's pin even if they don't want to ❌
```

## After (New Way - User-Specific Pins)
```
Admin pins "New Policy" → Only appears pinned in Admin's view ✓
User A pins "Meeting Updates" → Only appears pinned in User A's view ✓
User B sees no pins unless they pin something ✓
```

## How to Use

### To Pin an Announcement
1. Find an announcement you want to pin
2. Click the **pin icon** (usually top-right of announcement)
3. The announcement moves to the top of your list
4. Only YOU see it pinned - other users see it in normal order

### To Unpin an Announcement
1. Look for pinned announcements at the top of your list
2. Click the **pin icon** again (it will be highlighted/red)
3. The announcement returns to normal order
4. No effect on other users' pins

## Database Structure

### user_pins table
| Column | Type | Purpose |
|--------|------|---------|
| id | INT | Primary key |
| user_id | INT | Which user pinned it |
| announcement_id | INT | Which announcement |
| pinned_at | TIMESTAMP | When it was pinned |

### Example Data
```
user_id: 1 (Admin) → pinned announcement_id: 5
user_id: 2 (User A) → pinned announcement_id: 8
user_id: 3 (User B) → pinned announcement_id: 5, 10
```

Each user has their own independent pins!

## API Endpoint

### Pin/Unpin Request
```json
POST /backend/announcements.php
{
  "action": "pin",
  "id": 5,
  "pinned": true
}
```

### Response
```json
{
  "status": "success",
  "message": "Pin state updated",
  "pinned": true
}
```

## Troubleshooting

### Pins not showing?
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Refresh the page (F5)
- Check that you're logged in with the correct account

### Someone else's pins showing?
- Should NOT happen with the new system
- Each user only sees their own pins
- If this occurs, clear cache and refresh

### Pin button not working?
- Check browser console for errors (F12)
- Verify user_pins table exists: `DESCRIBE user_pins;`
- Check your internet connection

## Files Modified
- `src/backend/announcements.php` - Backend logic updated
- `add_user_pins_table.sql` - New database table
- `PIN_FEATURE_DOCUMENTATION.md` - Full documentation

## Files NOT Modified
- `src/frontend/admin-dashboard.jsx` - No changes needed
- `src/frontend/user-dashboard.jsx` - No changes needed
