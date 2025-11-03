-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('requester', 'manager')),
  zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- Base64 data URL
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ZONES TABLE
-- =====================================================
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  images TEXT[], -- Array of image URLs
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  options TEXT[], -- e.g., ["Màu sắc", "Kích cỡ"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VARIANTS TABLE
-- =====================================================
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attributes JSONB, -- e.g., {"Màu sắc": "Đen", "Kích cỡ": "L"}
  stock INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2),
  images TEXT[], -- Specific images for this variant
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VARIANT COMPONENTS TABLE (for composite products)
-- =====================================================
CREATE TABLE variant_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  child_variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_variant_id, child_variant_id)
);

-- =====================================================
-- REQUISITION FORMS TABLE
-- =====================================================
CREATE TABLE requisition_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Đang chờ xử lý', 'Đã hoàn thành')),
  fulfilled_by TEXT,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfillment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REQUISITION ITEMS TABLE
-- =====================================================
CREATE TABLE requisition_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id UUID NOT NULL REFERENCES requisition_forms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GOODS RECEIPT NOTES TABLE
-- =====================================================
CREATE TABLE goods_receipt_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  linked_requisition_ids TEXT[], -- Array of requisition IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RECEIPT ITEMS TABLE
-- =====================================================
CREATE TABLE receipt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERY NOTES TABLE
-- =====================================================
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES goods_receipt_notes(id),
  shipper_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  created_by TEXT NOT NULL,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  rejection_reason TEXT,
  has_issues BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_id TEXT,
  processing_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERY ITEMS TABLE
-- =====================================================
CREATE TABLE delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  quantity INTEGER NOT NULL,
  actual_quantity INTEGER,
  quality_issue BOOLEAN DEFAULT FALSE,
  issue_notes TEXT,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  received_date TIMESTAMP WITH TIME ZONE,
  condition TEXT CHECK (condition IN ('good', 'damaged', 'partial')),
  damage_description TEXT,
  replacement_needed BOOLEAN DEFAULT FALSE,
  quality_checks JSONB, -- {"visualInspection": true, "notes": "..."}
  tracking_info JSONB, -- {"location": "...", "status": "..."}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERY HISTORY TABLE
-- =====================================================
CREATE TABLE delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_name TEXT NOT NULL,
  notes TEXT,
  metadata JSONB
);

-- =====================================================
-- DELIVERY VERIFICATION TABLE
-- =====================================================
CREATE TABLE delivery_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  verified_by TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  item_checks JSONB NOT NULL, -- {"itemId": {"actualQuantity": 10, "hasIssue": false, ...}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERY QUALITY TABLE
-- =====================================================
CREATE TABLE delivery_quality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON variants(product_id);
CREATE INDEX idx_variant_components_parent ON variant_components(parent_variant_id);
CREATE INDEX idx_variant_components_child ON variant_components(child_variant_id);
CREATE INDEX idx_requisition_items_requisition ON requisition_items(requisition_id);
CREATE INDEX idx_requisition_items_variant ON requisition_items(variant_id);
CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_variant ON receipt_items(variant_id);
CREATE INDEX idx_delivery_items_delivery ON delivery_items(delivery_note_id);
CREATE INDEX idx_delivery_items_variant ON delivery_items(variant_id);
CREATE INDEX idx_delivery_history_delivery ON delivery_history(delivery_note_id);
CREATE INDEX idx_delivery_verification_delivery ON delivery_verification(delivery_note_id);
CREATE INDEX idx_delivery_quality_delivery ON delivery_quality(delivery_note_id);
CREATE INDEX idx_delivery_notes_status ON delivery_notes(status);
CREATE INDEX idx_delivery_notes_batch ON delivery_notes(batch_id);
CREATE INDEX idx_requisition_forms_status ON requisition_forms(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requisition_forms_updated_at BEFORE UPDATE ON requisition_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goods_receipt_notes_updated_at BEFORE UPDATE ON goods_receipt_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_notes_updated_at BEFORE UPDATE ON delivery_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- =====================================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE requisition_forms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;

