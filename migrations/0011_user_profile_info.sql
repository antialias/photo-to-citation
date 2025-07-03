ALTER TABLE user ADD COLUMN bio TEXT;
ALTER TABLE user ADD COLUMN social_links TEXT;
ALTER TABLE user ADD COLUMN profile_status TEXT NOT NULL DEFAULT 'under_review';
ALTER TABLE user ADD COLUMN profile_review_notes TEXT;
