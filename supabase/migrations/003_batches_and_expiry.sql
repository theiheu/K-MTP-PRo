-- Create variant_batches table
CREATE TABLE IF NOT EXISTS variant_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    batch_code VARCHAR(100),
    expiry_date DATE,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to recalculate total stock for a variant
CREATE OR REPLACE FUNCTION recalculate_variant_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE variants
        SET stock = (
            SELECT COALESCE(SUM(stock), 0)
            FROM variant_batches
            WHERE variant_id = OLD.variant_id
        )
        WHERE id = OLD.variant_id;
        RETURN OLD;
    ELSE
        UPDATE variants
        SET stock = (
            SELECT COALESCE(SUM(stock), 0)
            FROM variant_batches
            WHERE variant_id = NEW.variant_id
        )
        WHERE id = NEW.variant_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the recalculation whenever a batch is inserted, updated, or deleted
CREATE TRIGGER trigger_recalculate_variant_stock
AFTER INSERT OR UPDATE OF stock OR DELETE
ON variant_batches
FOR EACH ROW
EXECUTE FUNCTION recalculate_variant_stock();

-- Migrate existing variant stocks into a 'DEFAULT' batch so we don't lose them
-- We only insert a default batch if stock > 0
INSERT INTO variant_batches (variant_id, batch_code, stock)
SELECT id, 'DEFAULT', stock FROM variants WHERE stock > 0;
