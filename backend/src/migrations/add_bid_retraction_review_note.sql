-- Allow sellers/admins to leave a short note when approving/denying a retraction.
ALTER TABLE bid_retractions
  ADD COLUMN IF NOT EXISTS review_note TEXT;
