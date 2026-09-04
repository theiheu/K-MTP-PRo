import { Product, RequisitionForm, GoodsReceiptNote } from '../types';

// --- Interfaces ---

export interface ConsumedItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unit: string;
  totalQuantity: number;
  category?: string;
}

export interface RequisitionStatusStats {
  pending: number;
  completed: number;
  received: number;
  total: number;
}

export interface CategoryMaterialStats {
  categoryName: string;
  materialCount: number;
  totalQuantity: number;
  items: { productName: string; variantName: string; unit: string; totalQuantity: number }[];
}

export interface ZoneStats {
  zoneName: string;
  requisitionCount: number;
  totalItemQuantity: number;
  topMaterials: { name: string; quantity: number }[];
}

// --- Report Period Type ---
export type ReportPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

// --- Date Helpers ---

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isSameWeek = (d1: Date, d2: Date) => {
  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  return getWeekStart(d1).getTime() === getWeekStart(d2).getTime();
};

const isSameMonth = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
};

const isWithinRange = (date: Date, startStr?: string, endStr?: string) => {
  if (!startStr && !endStr) return true;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (startStr) {
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    if (d < start) return false;
  }
  if (endStr) {
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
};

export const matchesPeriod = (
  dateStr: string,
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): boolean => {
  const now = new Date();
  const actionDate = new Date(dateStr);
  if (period === 'today') return isSameDay(actionDate, now);
  if (period === 'thisWeek') return isSameWeek(actionDate, now);
  if (period === 'thisMonth') return isSameMonth(actionDate, now);
  if (period === 'custom') return isWithinRange(actionDate, startDate, endDate);
  return false;
};

// --- 1. Lọc phiếu yêu cầu theo kỳ ---

export const getRequisitionsByPeriod = (
  requisitions: RequisitionForm[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): RequisitionForm[] => {
  return requisitions.filter(req =>
    matchesPeriod(req.createdAt, period, startDate, endDate)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// --- 2. Top vật tư được yêu cầu nhiều nhất ---

export const getMostRequestedMaterials = (
  requisitions: RequisitionForm[],
  products: Product[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): ConsumedItem[] => {
  const materialMap = new Map<string, ConsumedItem>();

  requisitions.forEach(req => {
    if (!matchesPeriod(req.createdAt, period, startDate, endDate)) return;

    req.items.forEach(item => {
      const key = `${item.product.id}-${item.variant.id}`;
      const existing = materialMap.get(key);
      const product = products.find(p => p.id === item.product.id);
      const category = product?.category || item.product.category || 'Chưa phân loại';

      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        const variantAttributes = Object.values(item.variant.attributes).join(' / ') || 'Mặc định';
        materialMap.set(key, {
          productId: item.product.id,
          variantId: item.variant.id,
          productName: item.product.name,
          variantName: variantAttributes,
          unit: item.variant.unit || 'Cái',
          totalQuantity: item.quantity,
          category
        });
      }
    });
  });

  return Array.from(materialMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
};

// --- 3. Thống kê phiếu theo trạng thái ---

export const getRequisitionStatsByStatus = (
  requisitions: RequisitionForm[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): RequisitionStatusStats => {
  const filtered = getRequisitionsByPeriod(requisitions, period, startDate, endDate);
  return {
    pending: filtered.filter(r => r.status === 'Đang chờ xử lý').length,
    completed: filtered.filter(r => r.status === 'Đã duyệt yêu cầu').length,
    received: filtered.filter(r => r.status === 'Đã hoàn thành').length,
    total: filtered.length
  };
};

// --- 4. Phân loại vật tư yêu cầu theo danh mục ---

export const getMaterialsByCategory = (
  requisitions: RequisitionForm[],
  products: Product[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): CategoryMaterialStats[] => {
  const categoryMap = new Map<string, CategoryMaterialStats>();

  requisitions.forEach(req => {
    if (!matchesPeriod(req.createdAt, period, startDate, endDate)) return;

    req.items.forEach(item => {
      const product = products.find(p => p.id === item.product.id);
      const catName = product?.category || item.product.category || 'Chưa phân loại';
      const variantName = Object.values(item.variant.attributes).join(' / ') || 'Mặc định';
      const materialKey = `${item.product.name}-${variantName}`;

      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { categoryName: catName, materialCount: 0, totalQuantity: 0, items: [] });
      }
      const cat = categoryMap.get(catName)!;
      cat.totalQuantity += item.quantity;

      const existingItem = cat.items.find(i => i.productName === item.product.name && i.variantName === variantName);
      if (existingItem) {
        existingItem.totalQuantity += item.quantity;
      } else {
        cat.items.push({
          productName: item.product.name,
          variantName,
          unit: item.variant.unit || 'Cái',
          totalQuantity: item.quantity
        });
        cat.materialCount += 1;
      }
    });
  });

  // Sort items within each category
  categoryMap.forEach(cat => {
    cat.items.sort((a, b) => b.totalQuantity - a.totalQuantity);
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
};

// --- 5. Thống kê theo khu vực / zone ---

export const getRequisitionsByZone = (
  requisitions: RequisitionForm[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): ZoneStats[] => {
  const zoneMap = new Map<string, ZoneStats>();

  requisitions.forEach(req => {
    if (!matchesPeriod(req.createdAt, period, startDate, endDate)) return;

    const zoneName = req.zone || 'Không xác định';
    if (!zoneMap.has(zoneName)) {
      zoneMap.set(zoneName, { zoneName, requisitionCount: 0, totalItemQuantity: 0, topMaterials: [] });
    }
    const zone = zoneMap.get(zoneName)!;
    zone.requisitionCount += 1;

    const materialAgg = new Map<string, number>();
    req.items.forEach(item => {
      zone.totalItemQuantity += item.quantity;
      const name = item.product.name;
      materialAgg.set(name, (materialAgg.get(name) || 0) + item.quantity);
    });

    // Merge materials
    materialAgg.forEach((qty, name) => {
      const existing = zone.topMaterials.find(m => m.name === name);
      if (existing) existing.quantity += qty;
      else zone.topMaterials.push({ name, quantity: qty });
    });
  });

  // Sort top materials within each zone
  zoneMap.forEach(zone => {
    zone.topMaterials.sort((a, b) => b.quantity - a.quantity);
    zone.topMaterials = zone.topMaterials.slice(0, 5);
  });

  return Array.from(zoneMap.values()).sort((a, b) => b.requisitionCount - a.requisitionCount);
};

// --- 6. Giữ nguyên: Vật tư xuất từ phiếu Đã duyệt yêu cầu ---

export const getConsumedMaterials = (
  requisitions: RequisitionForm[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): ConsumedItem[] => {
  const consumedMap = new Map<string, ConsumedItem>();

  requisitions.forEach(req => {
    if (req.status !== 'Đã duyệt yêu cầu') return;
    const actionDate = req.fulfilledAt || req.createdAt;
    if (!matchesPeriod(actionDate, period, startDate, endDate)) return;

    req.items.forEach(item => {
      const key = `${item.product.id}-${item.variant.id}`;
      const existing = consumedMap.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        const variantAttributes = Object.values(item.variant.attributes).join(' / ') || 'Mặc định';
        consumedMap.set(key, {
          productId: item.product.id,
          variantId: item.variant.id,
          productName: item.product.name,
          variantName: variantAttributes,
          unit: item.variant.unit || 'Cái',
          totalQuantity: item.quantity
        });
      }
    });
  });

  return Array.from(consumedMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
};

// --- 7. Giữ nguyên: Vật tư nhập từ phiếu nhập ---

export const getReceivedMaterials = (
  receipts: GoodsReceiptNote[],
  allProducts: Product[],
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): ConsumedItem[] => {
  const receivedMap = new Map<string, ConsumedItem>();

  receipts.forEach(receipt => {
    if (!matchesPeriod(receipt.createdAt, period, startDate, endDate)) return;

    receipt.items.forEach(item => {
      const key = `${item.productId}-${item.variantId}`;
      const existing = receivedMap.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        const product = allProducts.find(p => p.id === item.productId);
        const variant = product?.variants.find(v => v.id === item.variantId);
        const variantAttributes = variant ? Object.values(variant.attributes).join(' / ') : 'Không rõ';

        receivedMap.set(key, {
          productId: item.productId,
          variantId: item.variantId,
          productName: product?.name || `Sản phẩm ID: ${item.productId}`,
          variantName: variantAttributes || 'Mặc định',
          unit: variant?.unit || 'Cái',
          totalQuantity: item.quantity
        });
      }
    });
  });

  return Array.from(receivedMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
};


