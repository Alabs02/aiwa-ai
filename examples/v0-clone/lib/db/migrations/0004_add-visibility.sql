-- Migration to add visibility, preview_url, and demo_url to chat_ownerships table
-- Run this migration to update your existing database

-- Add visibility column with default 'private'
ALTER TABLE chat_ownerships 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';

-- Add preview_url column for screenshot/image previews
ALTER TABLE chat_ownerships 
ADD COLUMN IF NOT EXISTS preview_url VARCHAR(512);

-- Add demo_url column for live demo/iframe fallback
ALTER TABLE chat_ownerships 
ADD COLUMN IF NOT EXISTS demo_url VARCHAR(512);

-- Add index on visibility for faster filtering
CREATE INDEX IF NOT EXISTS idx_chat_ownerships_visibility 
ON chat_ownerships(visibility);

-- Add compound index for common query patterns
CREATE INDEX IF NOT EXISTS idx_chat_ownerships_visibility_created 
ON chat_ownerships(visibility, created_at DESC);

-- Add comment to document the visibility values
COMMENT ON COLUMN chat_ownerships.visibility IS 'Visibility setting: public, private, or team';