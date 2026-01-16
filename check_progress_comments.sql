-- Check if progress_id and approval_status columns exist
DESCRIBE project_comments;

-- Check if there are any progress comments
SELECT comment_id, comment_type, progress_id, approval_status, created_at 
FROM project_comments 
WHERE comment_type = 'progress' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check all comments for a specific project (replace 1 with your project_id)
SELECT comment_id, comment_type, progress_percentage, approval_status
FROM project_comments 
WHERE project_id = 1
ORDER BY created_at DESC;
