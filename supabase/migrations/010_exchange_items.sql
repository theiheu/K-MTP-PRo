-- Move exchange fields from requisition_forms to requisition_items

-- Remove from forms
ALTER TABLE requisition_forms
DROP COLUMN IF EXISTS is_exchange,
DROP COLUMN IF EXISTS defect_notes,
DROP COLUMN IF EXISTS defect_images;

-- Add to items
ALTER TABLE requisition_items
ADD COLUMN is_exchange BOOLEAN DEFAULT false,
ADD COLUMN defect_notes TEXT,
ADD COLUMN defect_images JSONB;
