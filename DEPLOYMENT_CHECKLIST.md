# PIN FEATURE DEPLOYMENT CHECKLIST

## Pre-Deployment

### Code Review
- [x] Backend: `/src/backend/announcements.php` modified
  - [x] `user_pins` table creation logic added
  - [x] GET query updated with LEFT JOIN
  - [x] PIN toggle logic updated
- [x] Frontend: No changes needed
  - [x] Verified both dashboards work as-is
  - [x] No breaking changes

### Testing Environment
- [ ] Test database has been backed up
- [ ] Test server is set up with new code
- [ ] Multiple test user accounts created

## Pre-Production Checklist

### Database Preparation
- [ ] Production database backed up
- [ ] Backup stored in secure location with timestamp
- [ ] Rollback plan documented
- [ ] Query: `SHOW TABLES LIKE 'user_pins';` prepared to verify

### Code Deployment
- [ ] New `/src/backend/announcements.php` uploaded to production
- [ ] File permissions set correctly (644 for PHP files)
- [ ] No syntax errors: `php -l /path/to/announcements.php`
- [ ] Frontend code verified unchanged

### Browser/Client Preparation
- [ ] Browser cache clearing instructions prepared for users
- [ ] Instructions: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- [ ] Alternative: Open DevTools and clear cache from network tab

## Deployment Day

### Pre-Launch (30 minutes before)
- [ ] Production database accessible and responsive
- [ ] Backup of announcements table created: `SELECT * INTO OUTFILE`
- [ ] All team members notified of deployment
- [ ] Monitoring tools prepared

### Launch (5 minutes)
- [ ] Announce maintenance window (if needed)
- [ ] Upload new announcements.php
- [ ] Verify file was uploaded correctly
- [ ] Test with one user account (not production-critical)

### Post-Launch (10 minutes)
- [ ] Test pin functionality with admin account
  - [ ] Pin an announcement
  - [ ] Verify it appears at top
  - [ ] Unpin it
  - [ ] Verify it moves to normal position
- [ ] Test with regular user account
- [ ] Test pin isolation: admin pins, user doesn't see it pinned
- [ ] Check browser console for errors (F12)
- [ ] Monitor server logs for errors

## Testing Protocol

### Test 1: Basic Functionality
```
1. Log in as User A
2. Find an announcement (e.g., "Test Announcement")
3. Click pin icon
4. Verify announcement moves to top
5. Click pin again
6. Verify announcement returns to normal order
Result: PASS ✓ / FAIL ✗
```

### Test 2: User Independence
```
1. Log in as User A, pin announcement "X"
2. Log out, log in as User B
3. Check if announcement "X" is pinned
   Expected: NO (User B didn't pin it)
4. User B pins announcement "Y"
5. Log out, log in as User A
6. Check if announcement "Y" is pinned
   Expected: NO (User A didn't pin it)
Result: PASS ✓ / FAIL ✗
```

### Test 3: Same Announcement, Different Pins
```
1. Log in as Admin, find announcement "Z"
2. Admin pins announcement "Z"
3. Log out, log in as User A
4. Check if announcement "Z" is pinned for User A
   Expected: NO (User A didn't pin it)
5. User A pins announcement "Z"
6. Log out, log in as Admin
7. Check if announcement "Z" is still pinned for Admin
   Expected: YES (Admin pinned it)
Result: PASS ✓ / FAIL ✗
```

### Test 4: Multiple Pins
```
1. Log in as User A
2. Pin announcements: A, B, C
3. Check if all 3 appear at top in order
4. Log out, log in as User B
5. User B pins announcements: D, E
6. Check that User B only sees D, E at top
7. Check that User A's pins (A, B, C) are not at top
Result: PASS ✓ / FAIL ✗
```

### Test 5: Pin Persistence
```
1. Log in as User A, pin announcement "X"
2. Refresh the page
3. Verify announcement "X" is still pinned
4. Close browser and re-login
5. Verify announcement "X" is still pinned
6. Wait 24 hours, check again
7. Verify announcement "X" is still pinned
Result: PASS ✓ / FAIL ✗
```

## Rollback Procedure

### If Critical Issues Found

```
1. Stop accepting new requests (if possible)
2. Restore backup: MySQL backup restore command
3. Revert announcements.php to previous version
4. Clear all browser caches
5. Test basic functionality
6. Announce issue and rollback to users
7. Schedule post-mortem meeting
```

### Rollback Commands

```bash
# Restore database from backup
mysql -u user -p database < backup_file.sql

# Or restore just the announcements table
mysql -u user -p database -e "SOURCE backup_announcements.sql"

# Verify restoration
mysql -u user -p database -e "DESCRIBE user_pins;"
```

## Post-Deployment (24 Hours)

- [ ] Monitor error logs for any issues
- [ ] Check user feedback for complaints
- [ ] Verify no unusual database activity
- [ ] Confirm all pin operations working
- [ ] Run query to verify user_pins table populated:
  ```sql
  SELECT COUNT(*) as total_pins FROM user_pins;
  ```
- [ ] Document any issues encountered
- [ ] Schedule follow-up review meeting

## Performance Monitoring

### Queries to Run

```sql
-- Check table exists and has data
SELECT COUNT(*) FROM user_pins;

-- Check query performance
EXPLAIN SELECT ... FROM announcements a 
LEFT JOIN user_pins up ...;

-- Monitor table growth
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_name = 'user_pins';
```

### Expected Performance
- Page load time: < 200ms
- Pin/unpin action: < 100ms
- Database query: < 50ms

## Communication Template

### To Users
```
📌 PIN FEATURE UPDATE

We've improved the announcement pinning feature!

What changed:
✓ Each user now has their own pinned announcements
✓ Your pins no longer affect other users
✓ Other users' pins don't appear in your view

What you need to do:
1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear cache if needed (Ctrl+Shift+Delete)
3. Log out and back in
4. Enjoy independent pin control!

Have questions? Contact IT Support.
```

### To Managers
```
DEPLOYMENT COMPLETE: User-Specific Announcement Pins

Status: ✓ SUCCESSFUL
- Code deployed to production
- All tests passing
- Users notified
- Monitoring active

Changes:
- Each user can pin/unpin announcements independently
- Pins stored in dedicated user_pins table
- No breaking changes to frontend
- Automatic database setup on first use

Next steps:
- Monitor for 24 hours
- Collect user feedback
- Schedule review meeting
```

## Sign-Off

### Deployer Information
- Deployed by: _________________ 
- Date & Time: _________________
- Server: _________________
- Database: _________________
- Backup location: _________________

### Testing Verification
- [x] All tests passed: YES / NO
- [x] No errors in console: YES / NO
- [x] Database working: YES / NO
- [x] Multiple users tested: YES / NO

### Approval
- QA Lead: _________________ Date: _______
- DevOps Lead: _________________ Date: _______
- PM: _________________ Date: _______

## Final Verification

- [ ] Ask 3 different users to test
- [ ] Collect feedback in first 24 hours
- [ ] Run performance benchmark
- [ ] Document any issues
- [ ] Archive this checklist

---

**Deployment Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE | ☐ ROLLED BACK**

**Go/No-Go Decision: ☐ GO | ☐ NO-GO (Reason: ___________)**
