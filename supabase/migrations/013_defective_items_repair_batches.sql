-- Normalize defective material lifecycle management.
CREATE TABLE IF NOT EXISTS defective_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_requisition_id UUID REFERENCES requisition_forms(id) ON DELETE SET NULL,
    source_requisition_item_id UUID REFERENCES requisition_items(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID NOT NULL REFERENCES variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    exchanged_at TIMESTAMP WITH TIME ZONE,
    defect_status TEXT NOT NULL,
    defect_description TEXT,
    repair_needs TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    current_state TEXT NOT NULL DEFAULT 'waiting_repair'
        CHECK (current_state IN ('waiting_repair', 'sent_to_repair', 'repaired', 'disposed')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    repair_vendor TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_return_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'sent'
        CHECK (status IN ('draft', 'sent', 'partially_returned', 'completed', 'cancelled')),
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_batch_id UUID NOT NULL REFERENCES repair_batches(id) ON DELETE CASCADE,
    defective_item_id UUID NOT NULL REFERENCES defective_items(id),
    variant_id UUID NOT NULL REFERENCES variants(id),
    quantity_sent INTEGER NOT NULL CHECK (quantity_sent > 0),
    quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
    quantity_disposed INTEGER NOT NULL DEFAULT 0 CHECK (quantity_disposed >= 0),
    return_notes TEXT,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (quantity_returned + quantity_disposed <= quantity_sent)
);

CREATE INDEX IF NOT EXISTS idx_defective_items_variant ON defective_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_defective_items_state ON defective_items (current_state);
CREATE INDEX IF NOT EXISTS idx_defective_items_source_requisition ON defective_items (source_requisition_id);
CREATE INDEX IF NOT EXISTS idx_repair_batches_status ON repair_batches (status);
CREATE INDEX IF NOT EXISTS idx_repair_batches_sent_at ON repair_batches (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_batch_items_batch ON repair_batch_items (repair_batch_id);
CREATE INDEX IF NOT EXISTS idx_repair_batch_items_defective ON repair_batch_items (defective_item_id);

ALTER TABLE defective_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on defective_items" ON defective_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on defective_items" ON defective_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on defective_items" ON defective_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users on defective_items" ON defective_items FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users on repair_batches" ON repair_batches FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on repair_batches" ON repair_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on repair_batches" ON repair_batches FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users on repair_batches" ON repair_batches FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users on repair_batch_items" ON repair_batch_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users on repair_batch_items" ON repair_batch_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users on repair_batch_items" ON repair_batch_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users on repair_batch_items" ON repair_batch_items FOR DELETE USING (true);

ALTER TABLE inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_type_check;

ALTER TABLE inventory_transactions
ADD CONSTRAINT inventory_transactions_type_check
CHECK (type IN ('RETURN', 'RETURN_DEFECTIVE', 'REPAIR_EXPORT', 'REPAIR_IMPORT', 'DISPOSAL'));
