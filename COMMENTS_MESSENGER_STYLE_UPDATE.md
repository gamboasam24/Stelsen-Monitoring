# Messenger-Style Comments UI Update

## Overview
Updated the comments section in the user dashboard to use a Messenger-style interface with proper date grouping, date separators, and a "View Previous Comments" feature that shows/hides older conversation history.

This document has been replaced with a redirect stub.
See the archived copy at [docs/archived_docs/COMMENTS_MESSENGER_STYLE_UPDATE.md](docs/archived_docs/COMMENTS_MESSENGER_STYLE_UPDATE.md).

### 2. Created Helper Function: `groupCommentsByDate()`
**File:** `src/frontend/user-dashboard.jsx` (Lines 360-398)

This function groups comments by date labels:
- **Today** - Comments from today
- **Yesterday** - Comments from yesterday
- **X days ago** - Comments from 2-6 days ago
- **X weeks ago** - Comments from 1-4 weeks ago
- **X months ago** - Comments from 1-11 months ago
- **X years ago** - Comments older than 1 year

The function returns an object with date labels as keys and arrays of comments as values.

### 3. Completely Redesigned Comments Rendering Section
**File:** `src/frontend/user-dashboard.jsx` (Lines 1730-1960)

#### Key Features:

**A. Messenger-Style Date Separators**
- Comments are now grouped by date
- Each date group has a centered date label separator (e.g., "2 days ago")
- Date separators use a pill-shaped design with gray background

**B. Smart "View Previous Comments" Button**
- **Only appears** when there are more than 3 different dates of comments
- **Shows** only the 3 most recent dates by default
- **Button displays:** "View X previous days of comments"
- **On click:** Expands to show all older comments
- Uses an upward arrow icon to indicate loading older messages
- Styled like a Messenger-style button with hover effects

**C. Collapsible/Expandable Comments**
- Uses the `expandedProjectComments` state to track which projects are expanded
- Per-project expansion state (different projects can be expanded/collapsed independently)
- Smooth transition between collapsed and expanded states

**D. Preserved All Existing Features**
- User avatars for each message
- User labels to distinguish speakers when they change
- Progress approval cards for progress updates
- Message attachments (images and files)
- Messenger-style message bubbles with tails
- Read receipts (checkmarks for sent messages)
- Timestamps for each message

## How It Works

### Display Logic:
1. Comments are grouped by date using the `groupCommentsByDate()` function
2. If there are 3 or fewer date groups, **all comments are shown** (View Previous button not needed)
3. If there are more than 3 date groups:
   - **Default state:** Only shows the 3 most recent date groups
   - **View Previous button:** Appears above the comments area
   - **Expanded state:** Shows all date groups and their comments

### State Management:
- `expandedProjectComments[projectId]` = `true` → Show all comments
- `expandedProjectComments[projectId]` = `false/undefined` → Show only recent 3 date groups

### Example Timeline:
```
If comments span 7 different dates:
- Today (shown by default)
- Yesterday (shown by default)
- 2 days ago (shown by default)
- 3 days ago (hidden, will appear when "View Previous" is clicked)
- 1 week ago (hidden)
- 2 weeks ago (hidden)
- 1 month ago (hidden)

Button shows: "View 4 previous days of comments"
```

## Visual Changes

### Before:
- Single date separator at the top
- "View previous comments" button that didn't function
- All comments shown at once
- Unclear organization when there are many comments

### After:
- **Date separators between comment groups** for clear temporal organization
- **Functional "View Previous Comments" button** with:
  - Shows how many days of comments are hidden
  - Clean pill-shaped button with icon
  - Smooth expand/collapse animation
- **Smart display** showing only recent comments by default
- **Better UX** for conversations with long history

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard React hooks (useState)
- CSS Tailwind classes for styling
- No external dependencies added

## Testing Recommendations
1. **Test with few comments (1-3 dates)** → View Previous button should NOT appear
2. **Test with many comments (4+ dates)** → View Previous button SHOULD appear
3. **Click View Previous button** → Should expand to show all dates
4. **Test with multiple projects** → Each project maintains its own expanded/collapsed state
5. **Test on mobile** → Comments should remain readable with proper spacing

## Future Enhancements (Optional)
- Add animation when expanding/collapsing
- Add scroll-to-bottom on new comments
- Add "Load More" pagination for very large comment threads
- Add search/filter for comments
- Persist expanded/collapsed state to localStorage

## Files Modified
- `src/frontend/user-dashboard.jsx`

## Lines Changed
- **State addition:** Line 145
- **Helper function:** Lines 360-398
- **Comments rendering:** Lines 1730-1960
