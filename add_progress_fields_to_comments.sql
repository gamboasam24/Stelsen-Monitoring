-- Add progress tracking fields to project_comments table
ALTER TABLE project_comments 
ADD COLUMN progress_percentage INT DEFAULT NULL,
ADD COLUMN progress_status VARCHAR(50) DEFAULT NULL,
ADD COLUMN evidence_photo LONGTEXT DEFAULT NULL,
ADD COLUMN location_latitude DECIMAL(10,8) DEFAULT NULL,
ADD COLUMN location_longitude DECIMAL(11,8) DEFAULT NULL,
ADD COLUMN location_accuracy FLOAT DEFAULT NULL,
ADD COLUMN comment_type VARCHAR(50) DEFAULT 'text';

-- Create index for filtering progress comments
ALTER TABLE project_comments ADD INDEX idx_comment_type (comment_type);
