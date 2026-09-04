-- Atomic stock issue RPC for the warehouse rebuild.
-- Creates the stock issue document, its items, ledger movements, and balance updates in one transaction.

CREATE OR REPLACE FUNCTION create_stock_issue(
  p_source_location_id UUID DEFAULT NULL,
  p_zone_id UUID DEFAULT NULL,
  p_requester_name TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_name TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_legacy_table TEXT DEFAULT NULL,
  p_legacy_id UUID DEFAULT NULL,
  p_allow_negative BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_document_code TEXT;
  v_source_location_id UUID := p_source_location_id;
  v_item JSONB;
  v_document_item_id UUID;
  v_quantity NUMERIC(12, 2);
  v_display_order INTEGER := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Stock issue requires at least one item';
  END IF;

  IF v_source_location_id IS NULL THEN
    SELECT id
    INTO v_source_location_id
    FROM warehouses
    WHERE type = 'main' AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_source_location_id IS NULL THEN
    RAISE EXCEPTION 'Stock issue requires a source warehouse';
  END IF;

  v_document_code := next_inventory_document_code('stock_issue', p_document_date);

  INSERT INTO inventory_documents (
    document_code,
    document_type,
    status,
    source_location_id,
    zone_id,
    requester_name,
    created_by,
    document_date,
    fulfilled_at,
    notes,
    metadata,
    legacy_table,
    legacy_id
  )
  VALUES (
    v_document_code,
    'stock_issue',
    'posted',
    v_source_location_id,
    p_zone_id,
    p_requester_name,
    p_created_by,
    COALESCE(p_document_date, CURRENT_DATE),
    NOW(),
    p_notes,
    COALESCE(p_metadata, '{}'::jsonb),
    p_legacy_table,
    p_legacy_id
  )
  RETURNING id INTO v_document_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE(
      NULLIF(v_item->>'quantityIssued', '')::NUMERIC,
      NULLIF(v_item->>'quantityApproved', '')::NUMERIC,
      NULLIF(v_item->>'quantityRequested', '')::NUMERIC,
      NULLIF(v_item->>'quantity', '')::NUMERIC
    );

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Stock issue item quantity must be greater than 0';
    END IF;

    INSERT INTO inventory_document_items (
      document_id,
      product_id,
      variant_id,
      quantity_requested,
      quantity_approved,
      quantity_issued,
      unit,
      condition,
      purpose_type,
      reason,
      notes,
      display_order,
      metadata
    )
    VALUES (
      v_document_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      COALESCE(NULLIF(v_item->>'quantityRequested', '')::NUMERIC, v_quantity),
      COALESCE(NULLIF(v_item->>'quantityApproved', '')::NUMERIC, v_quantity),
      v_quantity,
      v_item->>'unit',
      COALESCE(v_item->>'condition', 'good'),
      v_item->>'purposeType',
      v_item->>'reason',
      v_item->>'notes',
      COALESCE(NULLIF(v_item->>'displayOrder', '')::INTEGER, v_display_order),
      COALESCE(v_item->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO v_document_item_id;

    PERFORM post_stock_movement(
      v_document_id,
      v_document_item_id,
      'OUT',
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      v_quantity,
      v_source_location_id,
      NULL,
      'available',
      NULL,
      v_item->>'batchCode',
      NULLIF(v_item->>'expiryDate', '')::DATE,
      NULLIF(v_item->>'unitPrice', '')::NUMERIC,
      p_created_by,
      p_notes,
      COALESCE(v_item->'metadata', '{}'::jsonb),
      p_allow_negative
    );

    v_display_order := v_display_order + 1;
  END LOOP;

  INSERT INTO document_events (
    document_id,
    event_type,
    actor_id,
    actor_name,
    to_status,
    notes
  )
  VALUES (
    v_document_id,
    'posted_stock_issue',
    p_created_by,
    p_created_by_name,
    'posted',
    p_notes
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
