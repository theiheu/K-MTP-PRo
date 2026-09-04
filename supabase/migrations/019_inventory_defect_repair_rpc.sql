-- Core defective/repair/disposal RPCs for the warehouse rebuild (Phase 8).
-- Each function creates a document, its items, ledger movements, and balance
-- updates in one transaction, reusing post_stock_movement + stock_balances.

-- =====================================================
-- 1. DEFECTIVE RETURN: available -> defective
-- =====================================================
CREATE OR REPLACE FUNCTION create_defective_return(
  p_warehouse_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_warehouse_id UUID := p_warehouse_id;
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Defective return requires at least one item';
  END IF;

  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id FROM warehouses
    WHERE type = 'main' AND is_active = TRUE ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Defective return requires a warehouse';
  END IF;

  v_document_code := next_inventory_document_code('defective_return', p_document_date);

  INSERT INTO inventory_documents (
    document_code, document_type, status,
    source_location_id, destination_location_id,
    created_by, document_date, notes, metadata, legacy_table, legacy_id
  )
  VALUES (
    v_document_code, 'defective_return', 'posted',
    v_warehouse_id, v_warehouse_id,
    p_created_by, COALESCE(p_document_date, CURRENT_DATE), p_notes,
    COALESCE(p_metadata, '{}'::jsonb), p_legacy_table, p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityReceived', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC,
      NULLIF(v_item->>'quantityRequested', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Defective return item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id, product_id, variant_id, quantity_received,
      unit, condition, reason, notes, display_order, metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_item->>'unit',
      COALESCE(v_item->>'condition', 'defective'),
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id, v_document_item_id, 'RETURN_DEFECTIVE',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_warehouse_id, v_warehouse_id,
      'available', 'defective',
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      COALESCE(v_item->>'reason', p_notes),
      COALESCE(v_item->'metadata', '{}'::jsonb),
      FALSE
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (document_id, event_type, actor_id, actor_name, to_status, notes)
  VALUES (v_document_id, 'posted_defective_return', p_created_by, p_created_by_name, 'posted', p_notes);

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. REPAIR ISSUE: defective -> repairing
-- =====================================================
CREATE OR REPLACE FUNCTION create_repair_issue(
  p_warehouse_id UUID DEFAULT NULL,
  p_destination_location_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_warehouse_id UUID := p_warehouse_id;
  v_destination_location_id UUID := COALESCE(p_destination_location_id, p_warehouse_id);
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Repair issue requires at least one item';
  END IF;

  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id FROM warehouses
    WHERE type = 'main' AND is_active = TRUE ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Repair issue requires a source warehouse';
  END IF;

  IF v_destination_location_id IS NULL THEN
    v_destination_location_id := v_warehouse_id;
  END IF;

  v_document_code := next_inventory_document_code('repair_issue', p_document_date);

  INSERT INTO inventory_documents (
    document_code, document_type, status,
    source_location_id, destination_location_id,
    created_by, document_date, notes, metadata, legacy_table, legacy_id
  )
  VALUES (
    v_document_code, 'repair_issue', 'posted',
    v_warehouse_id, v_destination_location_id,
    p_created_by, COALESCE(p_document_date, CURRENT_DATE), p_notes,
    COALESCE(p_metadata, '{}'::jsonb), p_legacy_table, p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityIssued', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC,
      NULLIF(v_item->>'quantityRequested', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Repair issue item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id, product_id, variant_id, quantity_issued,
      unit, condition, reason, notes, display_order, metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_item->>'unit',
      COALESCE(v_item->>'condition', 'defective'),
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id, v_document_item_id, 'REPAIR_OUT',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_warehouse_id, v_destination_location_id,
      'defective', 'repairing',
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      COALESCE(v_item->>'reason', p_notes),
      COALESCE(v_item->'metadata', '{}'::jsonb),
      FALSE
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (document_id, event_type, actor_id, actor_name, to_status, notes)
  VALUES (v_document_id, 'posted_repair_issue', p_created_by, p_created_by_name, 'posted', p_notes);

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. REPAIR RETURN: repairing -> available
-- =====================================================
CREATE OR REPLACE FUNCTION create_repair_return(
  p_warehouse_id UUID DEFAULT NULL,
  p_source_location_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_warehouse_id UUID := p_warehouse_id;
  v_source_location_id UUID := COALESCE(p_source_location_id, p_warehouse_id);
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Repair return requires at least one item';
  END IF;

  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id FROM warehouses
    WHERE type = 'main' AND is_active = TRUE ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Repair return requires a warehouse';
  END IF;

  IF v_source_location_id IS NULL THEN
    v_source_location_id := v_warehouse_id;
  END IF;

  v_document_code := next_inventory_document_code('repair_return', p_document_date);

  INSERT INTO inventory_documents (
    document_code, document_type, status,
    source_location_id, destination_location_id,
    created_by, document_date, notes, metadata, legacy_table, legacy_id
  )
  VALUES (
    v_document_code, 'repair_return', 'posted',
    v_source_location_id, v_warehouse_id,
    p_created_by, COALESCE(p_document_date, CURRENT_DATE), p_notes,
    COALESCE(p_metadata, '{}'::jsonb), p_legacy_table, p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityReceived', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Repair return item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id, product_id, variant_id, quantity_received,
      unit, condition, reason, notes, display_order, metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_item->>'unit',
      COALESCE(v_item->>'condition', 'repaired'),
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id, v_document_item_id, 'REPAIR_IN',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_source_location_id, v_warehouse_id,
      'repairing', 'available',
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      COALESCE(v_item->>'reason', p_notes),
      COALESCE(v_item->'metadata', '{}'::jsonb),
      FALSE
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (document_id, event_type, actor_id, actor_name, to_status, notes)
  VALUES (v_document_id, 'posted_repair_return', p_created_by, p_created_by_name, 'posted', p_notes);

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. DISPOSAL: available/defective -> disposed
-- =====================================================
CREATE OR REPLACE FUNCTION create_disposal(
  p_warehouse_id UUID DEFAULT NULL,
  p_source_state TEXT DEFAULT 'defective',
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_warehouse_id UUID := p_warehouse_id;
  v_source_state TEXT := COALESCE(p_source_state, 'defective');
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Disposal requires at least one item';
  END IF;

  IF v_source_state NOT IN ('available', 'defective') THEN
    RAISE EXCEPTION 'Disposal source state must be available or defective';
  END IF;

  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id FROM warehouses
    WHERE type = 'main' AND is_active = TRUE ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Disposal requires a warehouse';
  END IF;

  v_document_code := next_inventory_document_code('disposal', p_document_date);

  INSERT INTO inventory_documents (
    document_code, document_type, status,
    source_location_id, destination_location_id,
    created_by, document_date, notes, metadata, legacy_table, legacy_id
  )
  VALUES (
    v_document_code, 'disposal', 'posted',
    v_warehouse_id, v_warehouse_id,
    p_created_by, COALESCE(p_document_date, CURRENT_DATE), p_notes,
    COALESCE(p_metadata, '{}'::jsonb), p_legacy_table, p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityIssued', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC,
      NULLIF(v_item->>'quantityRequested', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Disposal item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id, product_id, variant_id, quantity_issued,
      unit, condition, reason, notes, display_order, metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_item->>'unit',
      COALESCE(v_item->>'condition', 'disposed'),
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id, v_document_item_id, 'DISPOSAL',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_warehouse_id, v_warehouse_id,
      v_source_state, 'disposed',
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      COALESCE(v_item->>'reason', p_notes),
      COALESCE(v_item->'metadata', '{}'::jsonb),
      FALSE
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (document_id, event_type, actor_id, actor_name, to_status, notes)
  VALUES (v_document_id, 'posted_disposal', p_created_by, p_created_by_name, 'posted', p_notes);

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
