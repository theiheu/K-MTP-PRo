-- Add exchange fields to requisition_forms
ALTER TABLE requisition_forms
ADD COLUMN is_exchange BOOLEAN DEFAULT false,
ADD COLUMN defect_notes TEXT,
ADD COLUMN defect_images JSONB;
