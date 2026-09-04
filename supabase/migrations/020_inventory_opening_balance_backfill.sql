-- Opening-balance reconciliation: sync core stock_balances.available to legacy variants.stock.
-- Migration 016 rebuilt the core ledger only from historical receipts/issues/audits, which
-- misses the opening stock that was seeded directly into variants.stock (and manual stock edits).
-- This migration generates one stock_adjustment document + ADJUST movements for every variant
-- where the two numbers differ, so the core ledger matches the legacy stock the app already shows.
-- Idempotent: when balances already match, the DO block exits without creating a document.

DO $$
DECLARE
  v_document_id UUID;
  v_warehouse_id UUID;
  v_has_diff BOOLEAN;
  v_item_id UUID;
  v_delta NUMERIC;
  r RECORD;
BEGIN
  SELECT id INTO v_warehouse_id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Main warehouse not found';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM variants v
    LEFT JOIN (
      SELECT variant_id, SUM(quantity) AS available
      FROM stock_balances
      WHERE balance_state = 'available'
      GROUP BY variant_id
    ) sb ON sb.variant_id = v.id
    WHERE v.stock <> COALESCE(sb.available, 0)
  ) INTO v_has_diff;

  IF NOT v_has_diff THEN
    RETURN;
  END IF;

  INSERT INTO inventory_documents (
    document_code, document_type, status,
    source_location_id, destination_location_id,
    document_date, notes, metadata
  )
  VALUES (
    next_inventory_document_code('stock_adjustment', CURRENT_DATE),
    'stock_adjustment',
    'posted',
    v_warehouse_id,
    v_warehouse_id,
    CURRENT_DATE,
    'Đồng bộ tồn đầu kỳ từ legacy variants.stock',
    jsonb_build_object('source', 'opening_balance_backfill', 'runAt', NOW())
  )
  RETURNING id INTO v_document_id;

  FOR r IN
    SELECT
      v.id AS variant_id,
      v.product_id,
      v.unit,
      v.stock AS legacy_stock,
      COALESCE(sb.available, 0) AS core_available,
      v.stock - COALESCE(sb.available, 0) AS delta
    FROM variants v
    LEFT JOIN (
      SELECT variant_id, SUM(quantity) AS available
      FROM stock_balances
      WHERE balance_state = 'available'
      GROUP BY variant_id
    ) sb ON sb.variant_id = v.id
    WHERE v.stock <> COALESCE(sb.available, 0)
    ORDER BY v.id
  LOOP
    v_delta := r.delta;

    INSERT INTO inventory_document_items (
      document_id, product_id, variant_id,
      quantity_approved,
      unit, condition, reason, display_order, metadata
    )
    VALUES (
      v_document_id, r.product_id, r.variant_id,
      ABS(v_delta),
      r.unit, 'good', 'Đồng bộ tồn đầu kỳ', 0,
      jsonb_build_object(
        'adjustmentDelta', v_delta,
        'legacyStock', r.legacy_stock,
        'coreAvailableBefore', r.core_available
      )
    )
    RETURNING id INTO v_item_id;

    PERFORM post_stock_movement(
      v_document_id, v_item_id, 'ADJUST',
      r.product_id, r.variant_id,
      ABS(v_delta),
      CASE WHEN v_delta < 0 THEN v_warehouse_id ELSE NULL END,
      CASE WHEN v_delta > 0 THEN v_warehouse_id ELSE NULL END,
      CASE WHEN v_delta < 0 THEN 'available' ELSE NULL END,
      CASE WHEN v_delta > 0 THEN 'available' ELSE NULL END,
      NULL, NULL, NULL, NULL,
      'Đồng bộ tồn đầu kỳ từ legacy',
      jsonb_build_object('source', 'opening_balance_backfill'),
      TRUE
    );
  END LOOP;

  INSERT INTO document_events (
    document_id, event_type, to_status, notes, metadata
  )
  VALUES (
    v_document_id, 'opening_balance_backfill', 'posted',
    'Đồng bộ tồn đầu kỳ từ legacy variants.stock',
    jsonb_build_object('source', 'opening_balance_backfill')
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
