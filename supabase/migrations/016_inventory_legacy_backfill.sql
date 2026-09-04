-- Backfill legacy warehouse data into the new document/ledger model.
-- This migration keeps legacy tables intact and creates traceable core records.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Keep document codes unique across document types that share a printed prefix
-- such as return_to_warehouse/defective_return (PTH) and repair_issue/repair_return (PSC).
CREATE OR REPLACE FUNCTION next_inventory_document_code(p_document_type TEXT, p_document_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM p_document_date)::INTEGER;
  v_prefix TEXT := get_inventory_document_prefix(p_document_type);
  v_next_number INTEGER;
  v_document_code TEXT;
BEGIN
  LOOP
    INSERT INTO document_sequences (document_type, year, last_number)
    VALUES (v_prefix, v_year, 1)
    ON CONFLICT (document_type, year)
    DO UPDATE SET
      last_number = document_sequences.last_number + 1,
      updated_at = NOW()
    RETURNING last_number INTO v_next_number;

    v_document_code := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 6, '0');

    IF NOT EXISTS (
      SELECT 1 FROM inventory_documents WHERE document_code = v_document_code
    ) THEN
      RETURN v_document_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ensure the main warehouse exists before importing historical stock.
INSERT INTO warehouses (name, type, notes)
SELECT 'Kho chính', 'main', 'Kho vật tư trung tâm'
WHERE NOT EXISTS (
  SELECT 1 FROM warehouses WHERE type = 'main'
);

-- =====================================================
-- LEGACY GOODS RECEIPTS -> STOCK RECEIPT DOCUMENTS + IN MOVEMENTS
-- =====================================================

INSERT INTO suppliers (name)
SELECT DISTINCT TRIM(grn.supplier)
FROM goods_receipt_notes grn
WHERE NULLIF(TRIM(grn.supplier), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM suppliers s
    WHERE LOWER(s.name) = LOWER(TRIM(grn.supplier))
  );

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  destination_location_id,
  supplier_id,
  requester_name,
  document_date,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code('stock_receipt', grn.created_at::DATE),
  'stock_receipt',
  'posted',
  main_wh.id,
  s.id,
  grn.created_by,
  grn.created_at::DATE,
  grn.notes,
  jsonb_build_object(
    'linkedRequisitionIds', COALESCE(to_jsonb(grn.linked_requisition_ids), '[]'::jsonb),
    'legacyCreatedBy', grn.created_by
  ),
  'goods_receipt_notes',
  grn.id,
  grn.created_at,
  grn.updated_at
FROM goods_receipt_notes grn
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
LEFT JOIN suppliers s ON LOWER(s.name) = LOWER(TRIM(grn.supplier))
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_documents doc
  WHERE doc.legacy_table = 'goods_receipt_notes'
    AND doc.legacy_id = grn.id
);

INSERT INTO inventory_document_items (
  document_id,
  product_id,
  variant_id,
  quantity_received,
  unit,
  batch_code,
  expiry_date,
  condition,
  display_order,
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  doc.id,
  ri.product_id,
  ri.variant_id,
  ri.quantity,
  v.unit,
  NULL,
  NULL,
  'good',
  ROW_NUMBER() OVER (PARTITION BY ri.receipt_id ORDER BY ri.created_at, ri.id) - 1,
  jsonb_build_object('legacyReceiptId', ri.receipt_id),
  'receipt_items',
  ri.id,
  ri.created_at
FROM receipt_items ri
JOIN inventory_documents doc
  ON doc.legacy_table = 'goods_receipt_notes'
 AND doc.legacy_id = ri.receipt_id
JOIN variants v ON v.id = ri.variant_id
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_document_items item
  WHERE item.legacy_table = 'receipt_items'
    AND item.legacy_id = ri.id
);

INSERT INTO stock_movements (
  document_id,
  document_item_id,
  movement_type,
  product_id,
  variant_id,
  destination_location_id,
  destination_state,
  quantity,
  batch_code,
  expiry_date,
  occurred_at,
  notes,
  metadata
)
SELECT
  doc.id,
  item.id,
  'IN',
  item.product_id,
  item.variant_id,
  doc.destination_location_id,
  'available',
  item.quantity_received,
  item.batch_code,
  item.expiry_date,
  COALESCE(doc.created_at, item.created_at, NOW()),
  doc.notes,
  jsonb_build_object('legacyTable', 'receipt_items', 'legacyId', item.legacy_id)
FROM inventory_document_items item
JOIN inventory_documents doc ON doc.id = item.document_id
WHERE item.legacy_table = 'receipt_items'
  AND item.quantity_received > 0
  AND NOT EXISTS (
    SELECT 1
    FROM stock_movements movement
    WHERE movement.document_item_id = item.id
      AND movement.movement_type = 'IN'
  );

-- =====================================================
-- LEGACY REQUISITIONS -> REQUISITION DOCUMENTS + STOCK ISSUE MOVEMENTS
-- =====================================================

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  source_location_id,
  zone_id,
  requester_name,
  document_date,
  needed_by,
  fulfilled_at,
  received_at,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code('requisition', rf.created_at::DATE),
  'requisition',
  CASE rf.status
    WHEN 'Đang chờ xử lý' THEN 'submitted'
    WHEN 'Đã duyệt yêu cầu' THEN 'issued'
    WHEN 'Đã hoàn thành' THEN 'received'
    WHEN 'Đã huỷ' THEN 'cancelled'
    ELSE 'submitted'
  END,
  main_wh.id,
  z.id,
  rf.requester_name,
  rf.created_at::DATE,
  NULL,
  rf.fulfilled_at,
  rf.received_at,
  rf.purpose,
  jsonb_build_object(
    'legacyStatus', rf.status,
    'legacyZone', rf.zone,
    'fulfilledBy', rf.fulfilled_by,
    'fulfillmentNotes', rf.fulfillment_notes,
    'receivedBy', rf.received_by,
    'receiveNotes', rf.receive_notes
  ),
  'requisition_forms',
  rf.id,
  rf.created_at,
  rf.updated_at
FROM requisition_forms rf
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
LEFT JOIN zones z ON z.name = rf.zone
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_documents doc
  WHERE doc.legacy_table = 'requisition_forms'
    AND doc.legacy_id = rf.id
);

INSERT INTO inventory_document_items (
  document_id,
  product_id,
  variant_id,
  quantity_requested,
  quantity_approved,
  quantity_issued,
  quantity_received,
  unit,
  condition,
  purpose_type,
  reason,
  notes,
  display_order,
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  doc.id,
  ri.product_id,
  ri.variant_id,
  ri.quantity,
  CASE WHEN rf.status <> 'Đang chờ xử lý' THEN ri.quantity ELSE NULL END,
  CASE WHEN rf.fulfilled_at IS NOT NULL OR rf.status IN ('Đã duyệt yêu cầu', 'Đã hoàn thành') THEN ri.quantity ELSE NULL END,
  CASE WHEN rf.received_at IS NOT NULL OR rf.status = 'Đã hoàn thành' THEN ri.quantity ELSE NULL END,
  v.unit,
  CASE WHEN COALESCE(ri.is_exchange, FALSE) THEN 'defective' ELSE 'good' END,
  rg.purpose_type,
  ri.defect_notes,
  rg.notes,
  ROW_NUMBER() OVER (PARTITION BY ri.requisition_id ORDER BY ri.created_at, ri.id) - 1,
  jsonb_build_object(
    'legacyRequisitionId', ri.requisition_id,
    'legacyGroupId', ri.group_id,
    'groupName', rg.name,
    'isExchange', COALESCE(ri.is_exchange, FALSE),
    'defectDescription', ri.defect_description,
    'repairNeeds', ri.repair_needs,
    'defectExchangedAt', ri.defect_exchanged_at,
    'defectImages', COALESCE(to_jsonb(ri.defect_images), '[]'::jsonb)
  ),
  'requisition_items',
  ri.id,
  ri.created_at
FROM requisition_items ri
JOIN requisition_forms rf ON rf.id = ri.requisition_id
JOIN inventory_documents doc
  ON doc.legacy_table = 'requisition_forms'
 AND doc.legacy_id = ri.requisition_id
JOIN variants v ON v.id = ri.variant_id
LEFT JOIN requisition_groups rg ON rg.id = ri.group_id
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_document_items item
  WHERE item.legacy_table = 'requisition_items'
    AND item.legacy_id = ri.id
);

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  source_location_id,
  zone_id,
  requester_name,
  document_date,
  fulfilled_at,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code('stock_issue', COALESCE(rf.fulfilled_at::DATE, rf.created_at::DATE)),
  'stock_issue',
  'posted',
  main_wh.id,
  z.id,
  rf.requester_name,
  COALESCE(rf.fulfilled_at::DATE, rf.created_at::DATE),
  rf.fulfilled_at,
  rf.fulfillment_notes,
  jsonb_build_object(
    'sourceRequisitionId', rf.id,
    'legacyStatus', rf.status,
    'fulfilledBy', rf.fulfilled_by
  ),
  'requisition_forms:issue',
  rf.id,
  COALESCE(rf.fulfilled_at, rf.created_at),
  rf.updated_at
FROM requisition_forms rf
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
LEFT JOIN zones z ON z.name = rf.zone
WHERE (rf.fulfilled_at IS NOT NULL OR rf.status IN ('Đã duyệt yêu cầu', 'Đã hoàn thành'))
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_documents doc
    WHERE doc.legacy_table = 'requisition_forms:issue'
      AND doc.legacy_id = rf.id
  );

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
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  issue_doc.id,
  ri.product_id,
  ri.variant_id,
  ri.quantity,
  ri.quantity,
  ri.quantity,
  v.unit,
  CASE WHEN COALESCE(ri.is_exchange, FALSE) THEN 'defective' ELSE 'good' END,
  rg.purpose_type,
  ri.defect_notes,
  COALESCE(rf.fulfillment_notes, rg.notes),
  ROW_NUMBER() OVER (PARTITION BY ri.requisition_id ORDER BY ri.created_at, ri.id) - 1,
  jsonb_build_object(
    'sourceRequisitionId', ri.requisition_id,
    'sourceRequisitionItemId', ri.id,
    'isExchange', COALESCE(ri.is_exchange, FALSE)
  ),
  'requisition_items:issue',
  ri.id,
  COALESCE(rf.fulfilled_at, ri.created_at)
FROM requisition_items ri
JOIN requisition_forms rf ON rf.id = ri.requisition_id
JOIN inventory_documents issue_doc
  ON issue_doc.legacy_table = 'requisition_forms:issue'
 AND issue_doc.legacy_id = ri.requisition_id
JOIN variants v ON v.id = ri.variant_id
LEFT JOIN requisition_groups rg ON rg.id = ri.group_id
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_document_items item
  WHERE item.legacy_table = 'requisition_items:issue'
    AND item.legacy_id = ri.id
);

INSERT INTO stock_movements (
  document_id,
  document_item_id,
  movement_type,
  product_id,
  variant_id,
  source_location_id,
  source_state,
  quantity,
  occurred_at,
  notes,
  metadata
)
SELECT
  doc.id,
  item.id,
  'OUT',
  item.product_id,
  item.variant_id,
  doc.source_location_id,
  'available',
  item.quantity_issued,
  COALESCE(doc.fulfilled_at, doc.created_at, item.created_at, NOW()),
  doc.notes,
  jsonb_build_object(
    'legacyTable', 'requisition_items',
    'legacyId', item.legacy_id,
    'sourceRequisitionId', doc.legacy_id
  )
FROM inventory_document_items item
JOIN inventory_documents doc ON doc.id = item.document_id
WHERE item.legacy_table = 'requisition_items:issue'
  AND item.quantity_issued > 0
  AND NOT EXISTS (
    SELECT 1
    FROM stock_movements movement
    WHERE movement.document_item_id = item.id
      AND movement.movement_type = 'OUT'
  );

-- =====================================================
-- LEGACY INVENTORY AUDITS -> AUDIT DOCUMENTS + ADJUSTMENT MOVEMENTS
-- =====================================================

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  source_location_id,
  destination_location_id,
  requester_name,
  document_date,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code('stock_audit', ia.created_at::DATE),
  'stock_audit',
  CASE ia.status WHEN 'Hoàn thành' THEN 'completed' ELSE 'counting' END,
  main_wh.id,
  main_wh.id,
  ia.created_by,
  ia.created_at::DATE,
  ia.notes,
  jsonb_build_object('title', ia.title, 'completedAt', ia.completed_at),
  'inventory_audits',
  ia.id,
  ia.created_at,
  COALESCE(ia.completed_at, ia.created_at)
FROM inventory_audits ia
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_documents doc
  WHERE doc.legacy_table = 'inventory_audits'
    AND doc.legacy_id = ia.id
);

INSERT INTO inventory_document_items (
  document_id,
  product_id,
  variant_id,
  quantity_requested,
  quantity_received,
  unit,
  reason,
  notes,
  display_order,
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  doc.id,
  iai.product_id,
  iai.variant_id,
  iai.system_quantity,
  iai.actual_quantity,
  v.unit,
  iai.reason,
  'Dòng kiểm kê legacy',
  ROW_NUMBER() OVER (PARTITION BY iai.audit_id ORDER BY iai.id) - 1,
  jsonb_build_object(
    'systemQuantity', iai.system_quantity,
    'actualQuantity', iai.actual_quantity,
    'adjustmentDelta', COALESCE(iai.actual_quantity, iai.system_quantity) - iai.system_quantity
  ),
  'inventory_audit_items',
  iai.id,
  doc.created_at
FROM inventory_audit_items iai
JOIN inventory_documents doc
  ON doc.legacy_table = 'inventory_audits'
 AND doc.legacy_id = iai.audit_id
JOIN variants v ON v.id = iai.variant_id
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_document_items item
  WHERE item.legacy_table = 'inventory_audit_items'
    AND item.legacy_id = iai.id
);

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  source_location_id,
  destination_location_id,
  requester_name,
  document_date,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code('stock_adjustment', COALESCE(ia.completed_at::DATE, ia.created_at::DATE)),
  'stock_adjustment',
  'posted',
  main_wh.id,
  main_wh.id,
  ia.created_by,
  COALESCE(ia.completed_at::DATE, ia.created_at::DATE),
  ia.notes,
  jsonb_build_object('auditId', ia.id, 'title', ia.title, 'completedAt', ia.completed_at),
  'inventory_audits:adjustment',
  ia.id,
  COALESCE(ia.completed_at, ia.created_at),
  COALESCE(ia.completed_at, ia.created_at)
FROM inventory_audits ia
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
WHERE ia.status = 'Hoàn thành'
  AND EXISTS (
    SELECT 1
    FROM inventory_audit_items iai
    WHERE iai.audit_id = ia.id
      AND iai.actual_quantity IS NOT NULL
      AND iai.actual_quantity <> iai.system_quantity
  )
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_documents doc
    WHERE doc.legacy_table = 'inventory_audits:adjustment'
      AND doc.legacy_id = ia.id
  );

INSERT INTO inventory_document_items (
  document_id,
  product_id,
  variant_id,
  quantity_approved,
  quantity_issued,
  quantity_received,
  unit,
  reason,
  notes,
  display_order,
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  adj_doc.id,
  iai.product_id,
  iai.variant_id,
  ABS(iai.actual_quantity - iai.system_quantity),
  CASE WHEN iai.actual_quantity < iai.system_quantity THEN ABS(iai.actual_quantity - iai.system_quantity) ELSE NULL END,
  CASE WHEN iai.actual_quantity > iai.system_quantity THEN ABS(iai.actual_quantity - iai.system_quantity) ELSE NULL END,
  v.unit,
  iai.reason,
  'Điều chỉnh từ kiểm kê legacy',
  ROW_NUMBER() OVER (PARTITION BY iai.audit_id ORDER BY iai.id) - 1,
  jsonb_build_object(
    'auditItemId', iai.id,
    'systemQuantity', iai.system_quantity,
    'actualQuantity', iai.actual_quantity,
    'adjustmentDelta', iai.actual_quantity - iai.system_quantity
  ),
  'inventory_audit_items:adjustment',
  iai.id,
  adj_doc.created_at
FROM inventory_audit_items iai
JOIN variants v ON v.id = iai.variant_id
JOIN inventory_documents adj_doc
  ON adj_doc.legacy_table = 'inventory_audits:adjustment'
 AND adj_doc.legacy_id = iai.audit_id
WHERE iai.actual_quantity IS NOT NULL
  AND iai.actual_quantity <> iai.system_quantity
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_document_items item
    WHERE item.legacy_table = 'inventory_audit_items:adjustment'
      AND item.legacy_id = iai.id
);

INSERT INTO stock_movements (
  document_id,
  document_item_id,
  movement_type,
  product_id,
  variant_id,
  source_location_id,
  destination_location_id,
  source_state,
  destination_state,
  quantity,
  occurred_at,
  notes,
  metadata
)
SELECT
  doc.id,
  item.id,
  'ADJUST',
  item.product_id,
  item.variant_id,
  CASE WHEN (item.metadata->>'adjustmentDelta')::NUMERIC < 0 THEN doc.source_location_id ELSE NULL END,
  CASE WHEN (item.metadata->>'adjustmentDelta')::NUMERIC > 0 THEN doc.destination_location_id ELSE NULL END,
  CASE WHEN (item.metadata->>'adjustmentDelta')::NUMERIC < 0 THEN 'available' ELSE NULL END,
  CASE WHEN (item.metadata->>'adjustmentDelta')::NUMERIC > 0 THEN 'available' ELSE NULL END,
  ABS((item.metadata->>'adjustmentDelta')::NUMERIC),
  COALESCE(doc.created_at, item.created_at, NOW()),
  item.reason,
  jsonb_build_object('legacyTable', 'inventory_audit_items', 'legacyId', item.legacy_id)
FROM inventory_document_items item
JOIN inventory_documents doc ON doc.id = item.document_id
WHERE item.legacy_table = 'inventory_audit_items:adjustment'
  AND ABS((item.metadata->>'adjustmentDelta')::NUMERIC) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM stock_movements movement
    WHERE movement.document_item_id = item.id
      AND movement.movement_type = 'ADJUST'
  );

-- =====================================================
-- LEGACY INVENTORY TRANSACTIONS -> DEFECT/REPAIR/DISPOSAL MOVEMENTS
-- =====================================================

INSERT INTO inventory_documents (
  document_code,
  document_type,
  status,
  source_location_id,
  destination_location_id,
  requester_name,
  document_date,
  notes,
  metadata,
  legacy_table,
  legacy_id,
  created_at,
  updated_at
)
SELECT
  next_inventory_document_code(
    CASE it.type
      WHEN 'REPAIR_EXPORT' THEN 'repair_issue'
      WHEN 'REPAIR_IMPORT' THEN 'repair_return'
      WHEN 'DISPOSAL' THEN 'disposal'
      WHEN 'RETURN_DEFECTIVE' THEN 'defective_return'
      ELSE 'return_to_warehouse'
    END,
    it.created_at::DATE
  ),
  CASE it.type
    WHEN 'REPAIR_EXPORT' THEN 'repair_issue'
    WHEN 'REPAIR_IMPORT' THEN 'repair_return'
    WHEN 'DISPOSAL' THEN 'disposal'
    WHEN 'RETURN_DEFECTIVE' THEN 'defective_return'
    ELSE 'return_to_warehouse'
  END,
  LOWER(COALESCE(it.status, 'COMPLETED')),
  main_wh.id,
  main_wh.id,
  it.created_by,
  it.created_at::DATE,
  it.notes,
  jsonb_build_object('referenceId', it.reference_id, 'legacyType', it.type),
  'inventory_transactions',
  it.id,
  it.created_at,
  it.created_at
FROM inventory_transactions it
CROSS JOIN LATERAL (
  SELECT id FROM warehouses WHERE type = 'main' ORDER BY created_at ASC LIMIT 1
) main_wh
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_documents doc
  WHERE doc.legacy_table = 'inventory_transactions'
    AND doc.legacy_id = it.id
);

INSERT INTO inventory_document_items (
  document_id,
  product_id,
  variant_id,
  quantity_approved,
  quantity_issued,
  quantity_received,
  unit,
  condition,
  reason,
  notes,
  display_order,
  metadata,
  legacy_table,
  legacy_id,
  created_at
)
SELECT
  doc.id,
  COALESCE(NULLIF(tx_item.value->>'productId', '')::UUID, v.product_id),
  (tx_item.value->>'variantId')::UUID,
  (tx_item.value->>'quantity')::NUMERIC,
  CASE WHEN it.type IN ('REPAIR_EXPORT', 'DISPOSAL') THEN (tx_item.value->>'quantity')::NUMERIC ELSE NULL END,
  CASE WHEN it.type IN ('RETURN', 'RETURN_DEFECTIVE', 'REPAIR_IMPORT') THEN (tx_item.value->>'quantity')::NUMERIC ELSE NULL END,
  v.unit,
  CASE
    WHEN it.type = 'RETURN_DEFECTIVE' THEN 'defective'
    WHEN it.type = 'REPAIR_IMPORT' THEN 'repaired'
    WHEN it.type = 'DISPOSAL' THEN 'disposed'
    ELSE 'good'
  END,
  tx_item.value->>'reason',
  it.notes,
  tx_item.ordinality - 1,
  jsonb_build_object(
    'legacyTransactionId', it.id,
    'legacyType', it.type,
    'rawItem', tx_item.value
  ),
  'inventory_transactions:item',
  uuid_generate_v5(it.id, tx_item.ordinality::TEXT),
  it.created_at
FROM inventory_transactions it
JOIN inventory_documents doc
  ON doc.legacy_table = 'inventory_transactions'
 AND doc.legacy_id = it.id
CROSS JOIN LATERAL jsonb_array_elements(it.items) WITH ORDINALITY AS tx_item(value, ordinality)
JOIN variants v ON v.id = (tx_item.value->>'variantId')::UUID
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_document_items item
  WHERE item.legacy_table = 'inventory_transactions:item'
    AND item.legacy_id = uuid_generate_v5(it.id, tx_item.ordinality::TEXT)
);

INSERT INTO stock_movements (
  document_id,
  document_item_id,
  movement_type,
  product_id,
  variant_id,
  source_location_id,
  destination_location_id,
  source_state,
  destination_state,
  quantity,
  occurred_at,
  notes,
  metadata
)
SELECT
  doc.id,
  item.id,
  CASE doc.metadata->>'legacyType'
    WHEN 'RETURN' THEN 'RETURN'
    WHEN 'RETURN_DEFECTIVE' THEN 'RETURN_DEFECTIVE'
    WHEN 'REPAIR_EXPORT' THEN 'REPAIR_OUT'
    WHEN 'REPAIR_IMPORT' THEN 'REPAIR_IN'
    WHEN 'DISPOSAL' THEN 'DISPOSAL'
    ELSE 'ADJUST'
  END,
  item.product_id,
  item.variant_id,
  CASE doc.metadata->>'legacyType'
    WHEN 'REPAIR_EXPORT' THEN doc.source_location_id
    WHEN 'REPAIR_IMPORT' THEN doc.source_location_id
    WHEN 'DISPOSAL' THEN doc.source_location_id
    ELSE NULL
  END,
  CASE doc.metadata->>'legacyType'
    WHEN 'RETURN' THEN doc.destination_location_id
    WHEN 'RETURN_DEFECTIVE' THEN doc.destination_location_id
    WHEN 'REPAIR_EXPORT' THEN doc.destination_location_id
    WHEN 'REPAIR_IMPORT' THEN doc.destination_location_id
    ELSE NULL
  END,
  CASE doc.metadata->>'legacyType'
    WHEN 'REPAIR_EXPORT' THEN 'defective'
    WHEN 'REPAIR_IMPORT' THEN 'repairing'
    WHEN 'DISPOSAL' THEN 'defective'
    ELSE NULL
  END,
  CASE doc.metadata->>'legacyType'
    WHEN 'RETURN' THEN 'available'
    WHEN 'RETURN_DEFECTIVE' THEN 'defective'
    WHEN 'REPAIR_EXPORT' THEN 'repairing'
    WHEN 'REPAIR_IMPORT' THEN 'available'
    ELSE NULL
  END,
  COALESCE(item.quantity_approved, item.quantity_issued, item.quantity_received),
  COALESCE(doc.created_at, item.created_at, NOW()),
  item.reason,
  jsonb_build_object(
    'legacyTable', 'inventory_transactions',
    'legacyId', doc.legacy_id,
    'legacyType', doc.metadata->>'legacyType'
  )
FROM inventory_document_items item
JOIN inventory_documents doc ON doc.id = item.document_id
WHERE item.legacy_table = 'inventory_transactions:item'
  AND COALESCE(item.quantity_approved, item.quantity_issued, item.quantity_received) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM stock_movements movement
    WHERE movement.document_item_id = item.id
  );

-- =====================================================
-- EVENTS AND BALANCE REBUILD
-- =====================================================

INSERT INTO document_events (
  document_id,
  event_type,
  actor_name,
  to_status,
  notes,
  metadata,
  created_at
)
SELECT
  doc.id,
  'legacy_backfilled',
  doc.requester_name,
  doc.status,
  doc.notes,
  jsonb_build_object('legacyTable', doc.legacy_table, 'legacyId', doc.legacy_id),
  doc.created_at
FROM inventory_documents doc
WHERE doc.legacy_table IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM document_events event
    WHERE event.document_id = doc.id
      AND event.event_type = 'legacy_backfilled'
  );

SELECT rebuild_stock_balances();

CREATE OR REPLACE VIEW inventory_legacy_stock_reconciliation AS
SELECT
  v.product_id,
  p.name AS product_name,
  v.id AS variant_id,
  v.attributes AS variant_attributes,
  v.sku,
  v.unit,
  v.stock AS legacy_variant_stock,
  COALESCE(SUM(sb.quantity) FILTER (
    WHERE sb.balance_state = 'available'
      AND w.type = 'main'
  ), 0) AS core_available_stock,
  v.stock - COALESCE(SUM(sb.quantity) FILTER (
    WHERE sb.balance_state = 'available'
      AND w.type = 'main'
  ), 0) AS stock_difference
FROM variants v
JOIN products p ON p.id = v.product_id
LEFT JOIN stock_balances sb ON sb.variant_id = v.id
LEFT JOIN warehouses w ON w.id = sb.warehouse_id
GROUP BY
  v.product_id,
  p.name,
  v.id,
  v.attributes,
  v.sku,
  v.unit,
  v.stock;

NOTIFY pgrst, 'reload schema';
