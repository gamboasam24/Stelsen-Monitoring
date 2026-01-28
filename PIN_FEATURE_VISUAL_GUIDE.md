# User-Specific Pinning - Visual Comparison

## BEFORE: Global Pinning System ❌

This document has been replaced with a redirect stub.
See the archived copy at [docs/archived_docs/PIN_FEATURE_VISUAL_GUIDE.md](docs/archived_docs/PIN_FEATURE_VISUAL_GUIDE.md).

See the archived copy for full details.
## Sorting Order - Per User

**Admin's View:**
```
1. Policy (Admin pinned it)
2. Update (Admin pinned it)
3. Meeting Notes (not pinned by Admin)
4. News (not pinned by Admin)
```

**User A's View:**
```
1. Meeting Notes (User A pinned it)
2. Policy (User A didn't pin)
3. Update (User A didn't pin)
4. News (User A didn't pin)
```

Same announcements, different order based on each person's pins!

## Data Flow Diagram

### Pinning Process (NEW)

```
User clicks pin icon
    ↓
Frontend: togglePin(announcement_id, true)
    ↓
POST /backend/announcements.php
Body: { action: "pin", id: 5, pinned: true }
    ↓
Backend checks user_id from session
    ↓
INSERT INTO user_pins (user_id=1, announcement_id=5)
    ↓
Response: { status: "success" }
    ↓
Frontend updates local state
    ↓
Next GET announcements:
    ├─ User 1: Sees announcement 5 with is_pinned=1
    ├─ User 2: Sees announcement 5 with is_pinned=0
    └─ User 3: Sees announcement 5 with is_pinned=0
```

## Timeline of Announcement for One Day

```
08:00 - Admin creates "Policy Update"
10:00 - Admin pins it
        ├─ Admin's view: [Policy Update] - PINNED
        ├─ User A's view: Policy Update - not pinned
        └─ User B's view: Policy Update - not pinned

14:00 - User A pins same announcement
        ├─ Admin's view: [Policy Update] - PINNED
        ├─ User A's view: [Policy Update] - PINNED
        └─ User B's view: Policy Update - not pinned

16:00 - Admin unpins
        ├─ Admin's view: Policy Update - not pinned
        ├─ User A's view: [Policy Update] - PINNED (still!)
        └─ User B's view: Policy Update - not pinned
```

## Summary Table

| Feature | OLD System | NEW System |
|---------|-----------|-----------|
| Pin scope | Global (all users) | Per-user (independent) |
| Storage | `announcements.is_pinned` | `user_pins` table |
| Affected users | All users | Only the pinning user |
| One user unpins | Everyone sees it unpinned | Other users' pins unchanged |
| Same announcement | Can't have different pin states | Each user has own pin state |
| Database size | 1 bit per announcement | ~20 bytes per pin |
| Complexity | Simple | Slightly more complex |
| **User experience** | **Frustrating** ❌ | **Independent control** ✓ |

