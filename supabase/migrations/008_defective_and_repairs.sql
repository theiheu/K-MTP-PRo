-- Add defective and repairing stock to variants
ALTER TABLE variants
ADD COLUMN defective_stock INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN repairing_stock INTEGER DEFAULT 0 NOT NULL;

-- Create table for inventory transactions (defective/repair/disposal)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('RETURN', 'REPAIR_EXPORT', 'REPAIR_IMPORT', 'DISPOSAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    items JSONB NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    reference_id UUID
);

-- RLS Policies
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for managers on inventory_transactions" ON inventory_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for managers on inventory_transactions" ON inventory_transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for managers on inventory_transactions" ON inventory_transactions FOR DELETE USING (true);
