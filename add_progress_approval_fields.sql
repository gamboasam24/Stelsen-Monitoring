-- Add progress_id and approval_status to project_comments
-- Note: These will also be automatically added by db.php on page load

ALTER TABLE project_comments ADD COLUMN progress_id INT DEFAULT NULL;
ALTER TABLE project_comments ADD COLUMN approval_status VARCHAR(50) DEFAULT NULL;

-- Add indexes  
CREATE INDEX idx_progress_id ON project_comments(progress_id);
CREATE INDEX idx_approval_status ON project_comments(approval_status);
