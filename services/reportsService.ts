import { supabase } from '../lib/supabase';
import type {
  InventoryMovementReportRow,
  StockBalanceState,
  StockCardEntry,
  StockMovement,
  StockMovementType,
  StockOnHandRow,
} from '../types/inventory';
import { inventoryDocumentsCoreService, stockCoreService } from './inventoryCoreService';

type DbRow = Record<string, any>;

const asNumber = (value: unknown): number => (value == null ? 0 : Number(value));
const round2 = (value: number): number => Math.round(value * 100) / 100;
const dateOnly = (value: string): string => (value ? value.slice(0, 10) : value);

const mapStockOnHand = (row: DbRow): StockOnHandRow => ({
  warehouseId: row.warehouse_id,
  warehouseName: row.warehouse_name,
  warehouseType: row.warehouse_type,
  productId: row.product_id,
  productName: row.product_name,
  variantId: row.variant_id,
  variantAttributes: row.variant_attributes ?? {},
  sku: row.sku ?? undefined,
  unit: row.unit ?? undefined,
  itemType: row.item_type,
  minStock: asNumber(row.min_stock),
  maxStock: row.max_stock == null ? undefined : asNumber(row.max_stock),
  balanceState: row.balance_state,
  batchCode: row.batch_code ?? undefined,
  expiryDate: row.expiry_date ?? undefined,
  quantity: asNumber(row.quantity),
  updatedAt: row.updated_at,
});

const makePeriodRange = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T23:59:59.999`);
  return { from: from.toISOString(), to: to.toISOString() };
};

interface MovementBucket {
  productId: string;
  variantId: string;
  productName?: string;
  variantAttributes?: Record<string, string>;
  unit?: string;
  received: number;
  issued: number;
  returned: number;
  defective: number;
  repaired: number;
  adjusted: number;
  net: number;
}

const createBucket = (movement: StockMovement): MovementBucket => ({
  productId: movement.productId,
  variantId: movement.variantId,
  productName: movement.productName,
  variantAttributes: movement.variantAttributes,
  unit: movement.unit,
  received: 0,
  issued: 0,
  returned: 0,
  defective: 0,
  repaired: 0,
  adjusted: 0,
  net: 0,
});

// Whether a movement touches the "available" state. Only those affect the
// available-stock report (xuất nhập tồn khả dụng).
const availableDelta = (movement: StockMovement): number => {
  let delta = 0;
  if (movement.sourceState === 'available') delta -= movement.quantity;
  if (movement.destinationState === 'available') delta += movement.quantity;
  return delta;
};

const accumulateMovement = (bucket: MovementBucket, movement: StockMovement) => {
  const delta = availableDelta(movement);
  bucket.net += delta;

  switch (movement.movementType as StockMovementType) {
    case 'IN':
      bucket.received += movement.quantity;
      break;
    case 'OUT':
      bucket.issued += movement.quantity;
      break;
    case 'RETURN':
      bucket.returned += movement.quantity;
      break;
    case 'RETURN_DEFECTIVE':
    case 'REPAIR_OUT':
    case 'DISPOSAL':
      bucket.defective += movement.quantity;
      break;
    case 'REPAIR_IN':
      bucket.repaired += movement.quantity;
      break;
    case 'ADJUST':
      bucket.adjusted += delta;
      break;
    default:
      break;
  }
};

export const reportsService = {
  async getStockOnHand(): Promise<StockOnHandRow[]> {
    const { data, error } = await supabase
      .from('inventory_stock_on_hand')
      .select('*')
      .order('product_name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapStockOnHand);
  },

  async getInventoryMovementReport(fromDate: string, toDate: string): Promise<InventoryMovementReportRow[]> {
    const { from, to } = makePeriodRange(fromDate, toDate);
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `)
      .gte('occurred_at', from)
      .lte('occurred_at', to)
      .order('occurred_at', { ascending: true });

    if (error) throw error;

    const movements = (data || []).map((row: DbRow) => {
      const movement: StockMovement = {
        id: row.id,
        documentId: row.document_id,
        documentItemId: row.document_item_id ?? undefined,
        movementType: row.movement_type,
        productId: row.product_id,
        variantId: row.variant_id,
        sourceLocationId: row.source_location_id ?? undefined,
        destinationLocationId: row.destination_location_id ?? undefined,
        sourceState: row.source_state ?? undefined,
        destinationState: row.destination_state ?? undefined,
        quantity: asNumber(row.quantity),
        batchCode: row.batch_code ?? undefined,
        expiryDate: row.expiry_date ?? undefined,
        unitCost: row.unit_cost == null ? undefined : asNumber(row.unit_cost),
        occurredAt: row.occurred_at,
        createdBy: row.created_by ?? undefined,
        notes: row.notes ?? undefined,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
        productName: row.product?.name,
        variantAttributes: row.variant?.attributes ?? undefined,
        unit: row.variant?.unit ?? undefined,
      };
      return movement;
    });

    const buckets = new Map<string, MovementBucket>();
    movements.forEach(movement => {
      const key = movement.variantId;
      const bucket = buckets.get(key) || createBucket(movement);
      accumulateMovement(bucket, movement);
      buckets.set(key, bucket);
    });

    const balances = await stockCoreService.getBalances();
    const closingByVariant = balances.reduce<Record<string, number>>((acc, balance) => {
      if (balance.balanceState === 'available') {
        acc[balance.variantId] = (acc[balance.variantId] || 0) + balance.quantity;
      }
      return acc;
    }, {});

    const rows: InventoryMovementReportRow[] = Array.from(buckets.values()).map(bucket => {
      const closing = round2(closingByVariant[bucket.variantId] || 0);
      const opening = round2(closing - bucket.net);
      return {
        productId: bucket.productId,
        variantId: bucket.variantId,
        productName: bucket.productName || bucket.variantId,
        variantAttributes: bucket.variantAttributes || {},
        unit: bucket.unit,
        openingQuantity: opening,
        receivedQuantity: round2(bucket.received),
        issuedQuantity: round2(bucket.issued),
        returnedQuantity: round2(bucket.returned),
        defectiveQuantity: round2(bucket.defective),
        repairedQuantity: round2(bucket.repaired),
        adjustedQuantity: round2(bucket.adjusted),
        closingQuantity: closing,
      };
    });

    return rows.sort((a, b) => a.productName.localeCompare(b.productName));
  },

  async getZoneConsumptionReport(fromDate: string, toDate: string): Promise<Array<{ zoneId?: string; totalQuantity: number; documentCount: number }>> {
    const documents = await inventoryDocumentsCoreService.getByType('stock_issue');
    const buckets = new Map<string, { totalQuantity: number; documentCount: number }>();

    documents.forEach(document => {
      const documentDay = dateOnly(document.documentDate);
      if (documentDay < fromDate || documentDay > toDate) return;

      const key = document.zoneId || '__none__';
      const bucket = buckets.get(key) || { totalQuantity: 0, documentCount: 0 };
      const total = (document.items || []).reduce(
        (sum, item) => sum + (item.quantityIssued || item.quantityApproved || item.quantityRequested || 0),
        0
      );
      bucket.totalQuantity += total;
      bucket.documentCount += 1;
      buckets.set(key, bucket);
    });

    return Array.from(buckets.entries())
      .map(([zoneId, value]) => ({
        zoneId: zoneId === '__none__' ? undefined : zoneId,
        ...value,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  },

  async getStockCard(variantId: string): Promise<StockCardEntry> {
    const [movements, balances] = await Promise.all([
      stockCoreService.getVariantMovements(variantId),
      stockCoreService.getBalances(),
    ]);

    const balance = balances
      .filter(item => item.variantId === variantId)
      .map(item => ({
        balanceState: item.balanceState as StockBalanceState,
        quantity: item.quantity,
        warehouseId: item.warehouseId,
        batchCode: item.batchCode,
        expiryDate: item.expiryDate,
      }));

    return { balance, movements };
  },
};
