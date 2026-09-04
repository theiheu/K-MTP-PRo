-- Group requisition items by purpose so one requisition can cover multiple workflows.
CREATE TABLE IF NOT EXISTS requisition_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id UUID NOT NULL REFERENCES requisition_forms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose_type TEXT NOT NULL DEFAULT 'regular_use'
    CHECK (purpose_type IN ('regular_use', 'exchange', 'farm_repair', 'supplement', 'other')),
  notes TEXT,
  needed_by TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE requisition_items
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES requisition_groups(id) ON DELETE SET NULL;

ALTER TABLE requisition_groups
ADD COLUMN IF NOT EXISTS needed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_requisition_groups_requisition ON requisition_groups (requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_group ON requisition_items (group_id);

ALTER TABLE requisition_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on requisition_groups" ON requisition_groups;
DROP POLICY IF EXISTS "Enable insert access for all users on requisition_groups" ON requisition_groups;
DROP POLICY IF EXISTS "Enable update access for all users on requisition_groups" ON requisition_groups;
DROP POLICY IF EXISTS "Enable delete access for all users on requisition_groups" ON requisition_groups;

CREATE POLICY "Enable read access for all users on requisition_groups" ON requisition_groups FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on requisition_groups" ON requisition_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on requisition_groups" ON requisition_groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users on requisition_groups" ON requisition_groups FOR DELETE USING (true);
