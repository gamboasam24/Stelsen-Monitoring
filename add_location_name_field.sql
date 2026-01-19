-- Add location_name field to project_comments table
ALTER TABLE project_comments 
ADD COLUMN location_name VARCHAR(255) DEFAULT NULL;

-- Create index for location name
CREATE INDEX idx_location_name ON project_comments(location_name);
