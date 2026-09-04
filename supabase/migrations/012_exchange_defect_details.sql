-- Store structured defect details for exchange requisition items.
ALTER TABLE requisition_items
ADD COLUMN IF NOT EXISTS defect_description TEXT,
ADD COLUMN IF NOT EXISTS repair_needs TEXT,
ADD COLUMN IF NOT EXISTS defect_exchanged_at TIMESTAMP WITH TIME ZONE;
