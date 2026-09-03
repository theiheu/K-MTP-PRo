import * as XLSX from 'xlsx-js-style';
import { Product, RequisitionForm, GoodsReceiptNote } from '../types';
import { calculateVariantStock } from './stockCalculator';
import {
  ConsumedItem,
  ReportPeriod,
  getMostRequestedMaterials,
  getMaterialsByCategory,
  getRequisitionsByZone,
  getRequisitionsByPeriod,
  getConsumedMaterials,
  getReceivedMaterials
} from './reportUtils';
import { createStyledReportSheet } from './styleHelpers';

// --- 1. Xuất danh sách sản phẩm (giữ nguyên) ---

export const exportProductsToExcel = (products: Product[], allProducts: Product[]) => {
  const workbook = XLSX.utils.book_new();

  const productHeaders = ['STT', 'Mã Hàng', 'Tên Vật Tư', 'Danh Mục', 'Phân Loại', 'Tồn Kho', 'Đơn Vị', 'Giá', 'Mô Tả'];
  const productData: any[][] = [];
  let stt = 1;

  products.forEach((product) => {
    const shortId = `SP-${product.id.substring(0, 5).toUpperCase()}`;

    if (product.variants.length === 0) {
      productData.push([
        stt++, shortId, product.name, product.category, 'Mặc định', 0, '', '', product.description
      ]);
      return;
    }

    product.variants.forEach((variant, index) => {
      const variantName = Object.values(variant.attributes).join(' / ') || 'Mặc định';
      const isComposite = variant.components && variant.components.length > 0;
      const stock = calculateVariantStock(variant, allProducts);

      productData.push([
        index === 0 ? stt++ : '',
        index === 0 ? shortId : '',
        index === 0 ? product.name : '',
        index === 0 ? product.category : '',
        variantName + (isComposite ? ' (Bộ)' : ''),
        stock,
        variant.unit || '',
        variant.price ? variant.price.toLocaleString('vi-VN') + ' đ' : '',
        index === 0 ? product.description : ''
      ]);
    });
  });

  const wscols = [
    { wch: 5 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 40 },
  ];
  const worksheet = createStyledReportSheet('DANH SÁCH VẬT TƯ', 'Toàn thời gian', productHeaders, productData, wscols);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách Vật tư');

  const formattedDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `K-MTP_VatTu_${formattedDate}.xlsx`);
};

// --- 2. Xuất lịch sử nhập kho ---

export const exportReceiptsToExcel = (receipts: any[], allProducts: Product[]) => {
  const receiptHeaders = ['STT', 'Mã Phiếu', 'Nhà Cung Cấp', 'Ghi Chú', 'Ngày Nhập', 'Người Nhập', 'Tên Vật Tư', 'Phân Loại', 'Số Lượng', 'Đơn Vị', 'Mã Lô', 'Hạn Sử Dụng'];
  const receiptData: any[][] = [];
  let stt = 1;

  receipts.forEach((receipt) => {
    receipt.items.forEach((item: any, index: number) => {
      const product = allProducts.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      const variantName = variant ? (Object.values(variant.attributes).join(' / ') || 'Mặc định') : '';
      const productName = product ? product.name : 'Vật tư không xác định';

      receiptData.push([
        index === 0 ? stt++ : '',
        index === 0 ? receipt.id.substring(0, 8).toUpperCase() : '',
        index === 0 ? receipt.supplier : '',
        index === 0 ? receipt.notes : '',
        index === 0 ? new Date(receipt.createdAt).toLocaleDateString('vi-VN') : '',
        index === 0 ? receipt.createdBy : '',
        productName,
        variantName,
        item.quantity,
        item.unit || variant?.unit || '',
        item.batchCode || '',
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : ''
      ]);
    });
  });

  const workbook = XLSX.utils.book_new();
  const wscols = [
    { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
    { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
  ];
  const worksheet = createStyledReportSheet('LỊCH SỬ NHẬP KHO', 'Toàn thời gian', receiptHeaders, receiptData, wscols);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử Nhập kho');

  const formattedDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `LichSu_NhapKho_${formattedDate}.xlsx`);
};

// --- 3. Xuất báo cáo Xuất/Nhập đơn giản (giữ nguyên cho tương thích) ---

export const exportReportToExcel = (
  consumedData: ConsumedItem[],
  receivedData: ConsumedItem[],
  periodName: string
) => {
  const workbook = XLSX.utils.book_new();
  const headers = ['STT', 'Mã Sản Phẩm', 'Tên Vật Tư', 'Phân Loại', 'Tổng Số Lượng', 'Đơn Vị'];
  const colWidths = [{ wch: 8 }, { wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];

  const consumedDataRows = consumedData.map((item, i) => [
    i + 1, item.productId.substring(0, 8).toUpperCase(), item.productName, item.variantName, item.totalQuantity, item.unit
  ]);
  const wsConsumed = createStyledReportSheet('BÁO CÁO VẬT TƯ ĐÃ XUẤT', periodName, headers, consumedDataRows, colWidths);
  XLSX.utils.book_append_sheet(workbook, wsConsumed, 'Vật Tư Đã Xuất');

  const receivedDataRows = receivedData.map((item, i) => [
    i + 1, item.productId.substring(0, 8).toUpperCase(), item.productName, item.variantName, item.totalQuantity, item.unit
  ]);
  const wsReceived = createStyledReportSheet('BÁO CÁO VẬT TƯ ĐÃ NHẬP', periodName, headers, receivedDataRows, colWidths);
  XLSX.utils.book_append_sheet(workbook, wsReceived, 'Vật Tư Đã Nhập');

  const dateStr = new Date().toISOString().slice(0, 10);
  const safePeriodName = periodName.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, `BaoCao_XuatNhap_${safePeriodName}_${dateStr}.xlsx`);
};

// --- 4. MỚI: Xuất báo cáo đầy đủ chi tiết (multi-sheet) ---

export const exportFullReportToExcel = (
  requisitions: RequisitionForm[],
  products: Product[],
  receipts: GoodsReceiptNote[],
  period: ReportPeriod,
  periodLabel: string,
  startDate?: string,
  endDate?: string
) => {
  const workbook = XLSX.utils.book_new();
  const colWidths5 = [{ wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];

  // --- Sheet 1: Tổng hợp Phiếu Yêu Cầu ---
  const filteredReqs = getRequisitionsByPeriod(requisitions, period, startDate, endDate);
  const reqHeaders = ['STT', 'Mã Phiếu', 'Người Yêu Cầu', 'Khu Vực', 'Mục Đích', 'Trạng Thái', 'Ngày Tạo', 'Người Duyệt', 'Ngày Duyệt', 'Ghi Chú Duyệt', 'Số Loại VT', 'Tổng SL'];
  const reqData = filteredReqs.map((req, idx) => [
    idx + 1, req.id.substring(0, 8).toUpperCase(), req.requesterName, req.zone, req.purpose, req.status,
    new Date(req.createdAt).toLocaleDateString('vi-VN'), req.fulfilledBy || '',
    req.fulfilledAt ? new Date(req.fulfilledAt).toLocaleDateString('vi-VN') : '',
    req.fulfillmentNotes || '', req.items.length, req.items.reduce((s, i) => s + i.quantity, 0)
  ]);
  const reqCols = [
    { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 30 },
    { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }
  ];
  const wsReqs = createStyledReportSheet('BÁO CÁO TỔNG HỢP PHIẾU YÊU CẦU', periodLabel, reqHeaders, reqData, reqCols);
  XLSX.utils.book_append_sheet(workbook, wsReqs, 'Phiếu Yêu Cầu');

  // --- Sheet 2: Vật tư YC nhiều nhất ---
  const topMaterials = getMostRequestedMaterials(requisitions, products, period, startDate, endDate);
  const totalReqQty = topMaterials.reduce((s, i) => s + i.totalQuantity, 0);
  const matHeaders = ['Hạng', 'Tên Vật Tư', 'Phân Loại', 'Danh Mục', 'Tổng SL Yêu Cầu', 'Đơn Vị', 'Tỷ Trọng (%)'];
  const matData = topMaterials.map((item, idx) => [
    idx + 1, item.productName, item.variantName, item.category || '', item.totalQuantity, item.unit,
    totalReqQty > 0 ? ((item.totalQuantity / totalReqQty) * 100).toFixed(1) : '0.0'
  ]);
  const matCols = [{ wch: 6 }, { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 }];
  const wsMaterials = createStyledReportSheet('VẬT TƯ YÊU CẦU NHIỀU NHẤT', periodLabel, matHeaders, matData, matCols);
  XLSX.utils.book_append_sheet(workbook, wsMaterials, 'VT Yêu Cầu Nhiều Nhất');

  // --- Sheet 3: Phân loại theo Danh mục ---
  const categoryStats = getMaterialsByCategory(requisitions, products, period, startDate, endDate);
  const catHeaders = ['Danh Mục', 'Số Loại VT', 'Tổng SL YC', 'Tỷ Trọng (%)', 'Chi Tiết VT', 'SL'];
  const catData: any[][] = [];
  categoryStats.forEach(cat => {
    catData.push([
      cat.categoryName, cat.materialCount, cat.totalQuantity,
      totalReqQty > 0 ? ((cat.totalQuantity / totalReqQty) * 100).toFixed(1) : '0.0',
      '', ''
    ]);
    cat.items.forEach(item => {
      catData.push(['', '', '', '', `  → ${item.productName} (${item.variantName})`, `${item.totalQuantity} ${item.unit}`]);
    });
  });
  const catCols = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 15 }];
  const wsCats = createStyledReportSheet('PHÂN LOẠI VẬT TƯ THEO DANH MỤC', periodLabel, catHeaders, catData, catCols);
  XLSX.utils.book_append_sheet(workbook, wsCats, 'Phân Loại Danh Mục');

  // --- Sheet 4: Thống kê theo Zone ---
  const zoneStats = getRequisitionsByZone(requisitions, period, startDate, endDate);
  const zoneHeaders = ['Khu Vực', 'Số Phiếu YC', 'Tổng SL VT', 'Top VT'];
  const zoneData: any[][] = [];
  zoneStats.forEach(zone => {
    zoneData.push([
      zone.zoneName, zone.requisitionCount, zone.totalItemQuantity,
      zone.topMaterials.map(m => `${m.name}: ${m.quantity}`).join(', ')
    ]);
  });
  const zoneCols = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 60 }];
  const wsZones = createStyledReportSheet('THỐNG KÊ YÊU CẦU THEO KHU VỰC', periodLabel, zoneHeaders, zoneData, zoneCols);
  XLSX.utils.book_append_sheet(workbook, wsZones, 'Thống Kê Theo Zone');

  // --- Sheet 5: Vật tư đã Xuất kho ---
  const consumedData = getConsumedMaterials(requisitions, period, startDate, endDate);
  const consumedHeaders = ['STT', 'Tên Vật Tư', 'Phân Loại', 'Tổng Đã Xuất', 'Đơn Vị'];
  const consumedDataRows = consumedData.map((item, idx) => [
    idx + 1, item.productName, item.variantName, item.totalQuantity, item.unit
  ]);
  const wsConsumed = createStyledReportSheet('THỐNG KÊ VẬT TƯ ĐÃ XUẤT KHO', periodLabel, consumedHeaders, consumedDataRows, [{ wch: 5 }, ...colWidths5]);
  XLSX.utils.book_append_sheet(workbook, wsConsumed, 'Xuất Kho');

  // --- Sheet 6: Vật tư đã Nhập kho ---
  const receivedData = getReceivedMaterials(receipts, products, period, startDate, endDate);
  const receivedHeaders = ['STT', 'Tên Vật Tư', 'Phân Loại', 'Tổng Đã Nhập', 'Đơn Vị'];
  const receivedDataRows = receivedData.map((item, idx) => [
    idx + 1, item.productName, item.variantName, item.totalQuantity, item.unit
  ]);
  const wsReceived = createStyledReportSheet('THỐNG KÊ VẬT TƯ ĐÃ NHẬP KHO', periodLabel, receivedHeaders, receivedDataRows, [{ wch: 5 }, ...colWidths5]);
  XLSX.utils.book_append_sheet(workbook, wsReceived, 'Nhập Kho');

  // --- Ghi file ---
  const dateStr = new Date().toISOString().slice(0, 10);
  const safePeriodName = periodLabel.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, `BaoCao_DayDu_${safePeriodName}_${dateStr}.xlsx`);
};

// --- 5. MỚI: Xuất riêng danh sách phiếu yêu cầu ---

export const exportRequisitionsToExcel = (
  requisitions: RequisitionForm[],
  period: ReportPeriod,
  periodLabel: string,
  startDate?: string,
  endDate?: string
) => {
  const workbook = XLSX.utils.book_new();
  const filtered = getRequisitionsByPeriod(requisitions, period, startDate, endDate);

  // Sheet 1: Danh sách phiếu
  const reqHeaders = ['STT', 'Mã Phiếu', 'Người Yêu Cầu', 'Khu Vực', 'Mục Đích', 'Trạng Thái', 'Ngày Tạo', 'Người Duyệt', 'Ngày Duyệt', 'Ghi Chú'];
  const reqDataRows = filtered.map((req, idx) => [
    idx + 1, req.id.substring(0, 8).toUpperCase(), req.requesterName, req.zone, req.purpose, req.status,
    new Date(req.createdAt).toLocaleDateString('vi-VN'), req.fulfilledBy || '',
    req.fulfilledAt ? new Date(req.fulfilledAt).toLocaleDateString('vi-VN') : '', req.fulfillmentNotes || ''
  ]);
  const reqCols = [
    { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 30 },
    { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 30 }
  ];
  const ws1 = createStyledReportSheet('DANH SÁCH PHIẾU YÊU CẦU', periodLabel, reqHeaders, reqDataRows, reqCols);
  XLSX.utils.book_append_sheet(workbook, ws1, 'Danh Sách Phiếu YC');

  // Sheet 2: Chi tiết vật tư từng phiếu
  const detailHeaders = ['Mã Phiếu', 'Người YC', 'Ngày Tạo', 'Tên Vật Tư', 'Phân Loại', 'Số Lượng', 'Đơn Vị'];
  const detailDataRows: any[][] = [];
  filtered.forEach(req => {
    req.items.forEach((item, idx) => {
      detailDataRows.push([
        idx === 0 ? req.id.substring(0, 8).toUpperCase() : '',
        idx === 0 ? req.requesterName : '',
        idx === 0 ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '',
        item.product.name,
        Object.values(item.variant.attributes).join(' / ') || 'Mặc định',
        item.quantity,
        item.variant.unit || 'Cái'
      ]);
    });
  });
  const detailCols = [{ wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 35 }, { wch: 25 }, { wch: 10 }, { wch: 10 }];
  const ws2 = createStyledReportSheet('CHI TIẾT VẬT TƯ TRONG PHIẾU YÊU CẦU', periodLabel, detailHeaders, detailDataRows, detailCols);
  XLSX.utils.book_append_sheet(workbook, ws2, 'Chi Tiết Vật Tư');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `PhieuYeuCau_${periodLabel.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
};

// ====================================================================
// 6. MỚI: Xuất Phiếu Xuất Kho theo mẫu chuẩn (từ phiếu yêu cầu)
// ====================================================================

export const numberToVietnameseWords = (n: number): string => {
  if (n === 0) return 'Không đồng';
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ'];

  const groupToWords = (num: number): string => {
    if (num === 0) return '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    let result = '';
    if (h > 0) result += ones[h] + ' trăm ';
    if (t > 1) { result += ones[t] + ' mươi '; if (o === 1) result += 'mốt'; else if (o === 5) result += 'lăm'; else if (o > 0) result += ones[o]; }
    else if (t === 1) { result += 'mười '; if (o === 5) result += 'lăm'; else if (o > 0) result += ones[o]; }
    else if (t === 0 && h > 0 && o > 0) { result += 'lẻ ' + ones[o]; }
    else if (o > 0) result += ones[o];
    return result.trim();
  };

  const groups: number[] = [];
  let temp = Math.floor(n);
  while (temp > 0) { groups.push(temp % 1000); temp = Math.floor(temp / 1000); }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      result += groupToWords(groups[i]) + ' ' + units[i] + ' ';
    }
  }
  result = result.trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
};

export const exportPhieuXuatKho = (requisition: RequisitionForm) => {
  const now = new Date(requisition.fulfilledAt || requisition.createdAt);
  const ngay = now.getDate();
  const thang = now.getMonth() + 1;
  const nam = now.getFullYear();
  const maPhieu = requisition.id.substring(0, 8).toUpperCase();

  // Build rows as array-of-arrays
  const rows: any[][] = [];

  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Row 0 (Excel row 1): Company header
  rows.push(['', 'TRẠI GÀ ĐẺ TRỨNG LÊ VĂN DƯƠNG', '', '', '', '', '', '']);
  // Row 1: Address
  rows.push(['', 'Ấp Tân Tiến, xã Minh Tân, huyện Dầu Tiếng, tỉnh Bình Dương', '', '', '', '', '', '']);
  // Row 2: Phone
  rows.push(['', 'SĐT: 0988365238 - 0963077879', '', '', '', '', '', '']);
  // Row 3: Empty
  rows.push(['', '', '', '', '', '', '', '']);
  // Row 4: Title - MUST BE IN COL 0 since we merge C0:C7
  rows.push(['PHIẾU XUẤT KHO', '', '', '', '', '', '', '']);
  // Row 5: STT & Date - STT in COL 1, Date in COL 4
  rows.push(['', `STT: ${maPhieu}`, '', '', `Ngày ${ngay} tháng ${thang} năm ${nam} - ${time}`, '', '', '']);
  // Row 6: Bên nhận hàng
  rows.push(['', `Bên nhận hàng: ${requisition.requesterName}`, '', '', '', '', '', '']);
  // Row 7: Địa chỉ
  rows.push(['', `Địa chỉ: ${requisition.zone}`, '', '', '', '', '', '']);
  // Row 8: SĐT & Vận chuyển - MUST BE IN COL 4 since we merge C4:C7
  rows.push(['', 'Số điện thoại:', '', '', `Mục đích: ${requisition.purpose}`, '', '', '']);
  // Row 9: Table header
  rows.push(['STT', 'TÊN SẢN PHẨM, HÀNG HÓA', '', 'ĐVT', 'SL', 'ĐƠN GIÁ', 'THÀNH TIỀN', 'GHI CHÚ']);

  // Data rows
  let tongTien = 0;
  const minRows = 12;
  const itemCount = Math.max(requisition.items.length, minRows);

  for (let i = 0; i < itemCount; i++) {
    if (i < requisition.items.length) {
      const item = requisition.items[i];
      const price = item.variant.price || 0;
      const thanhTien = item.quantity * price;
      tongTien += thanhTien;
      const variantName = Object.values(item.variant.attributes).join(' / ');
      const fullName = variantName ? `${item.product.name} (${variantName})` : item.product.name;
      rows.push([
        i + 1,
        fullName,
        '',
        item.variant.unit || 'Cái',
        item.quantity,
        price > 0 ? price : '',
        thanhTien > 0 ? thanhTien : '',
        ''
      ]);
    } else {
      rows.push([i + 1, '', '', '', '', '', '', '']);
    }
  }

  // TỔNG CỘNG row
  const tongCongRowIdx = rows.length;
  rows.push(['', 'TỔNG CỘNG', '', '', '', '', tongTien > 0 ? tongTien : '', '']);

  // Thành tiền bằng chữ
  rows.push(['', `Thành tiền bằng chữ: ${tongTien > 0 ? numberToVietnameseWords(tongTien) : '...............'}`, '', '', '', '', '', '']);

  // Empty row
  rows.push([]);

  // Signature row
  rows.push(['Người nhận hàng', '', 'Vận chuyển', '', 'Người lập phiếu', '', 'Chủ trại', '']);
  rows.push(['(Ký, họ tên)', '', '(Ký, họ tên)', '', '(Ký, họ tên)', '', '(Ký, họ tên)', '']);

  // Add some space for signatures
  rows.push([]);
  rows.push([]);
  rows.push([]);

  // Signature names - leave them empty so the template looks clean and doesn't dump names into unrelated cells
  rows.push(['', '', '', '', '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // --- STYLING ---
  const borderThin = { style: 'thin', color: { rgb: '000000' } };
  const borderBox = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

  // Helper to safely get/create cell
  const getCell = (r: number, c: number) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    return ws[cellRef];
  };

  // Trại Gà Đẻ Trứng
  getCell(0, 1).s = { font: { bold: true, sz: 14, name: 'Times New Roman' }, alignment: { vertical: 'center' } };
  getCell(1, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
  getCell(2, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };

  // Title
  getCell(4, 0).s = { font: { bold: true, sz: 20, name: 'Times New Roman' }, alignment: { horizontal: 'center', vertical: 'center' } };
  
  // STT (col 1) & Date (col 4)
  getCell(5, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'left' } };
  getCell(5, 4).s = { font: { bold: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'right' } };

  // Info rows
  for (let r = 6; r <= 8; r++) {
    for (let c = 1; c <= 7; c++) {
      getCell(r, c).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
    }
  }

  // Table header & data borders
  const tableEndRow = tongCongRowIdx + 1;
  for (let r = 9; r <= tableEndRow; r++) {
    for (let c = 0; c <= 7; c++) {
      const cell = getCell(r, c);
      cell.s = { ...cell.s, font: { sz: 11, name: 'Times New Roman' }, border: borderBox, alignment: { vertical: 'center' } };
      
      // Header row styling
      if (r === 9) {
        cell.s.font.bold = true;
        cell.s.alignment.horizontal = 'center';
      }
      // STT column alignment
      if (c === 0 && r > 9) {
        cell.s.alignment.horizontal = 'center';
        cell.s.font.bold = true;
      }
      // TỔNG CỘNG row
      if (r === tongCongRowIdx) {
        cell.s.font.bold = true;
        if (c === 1) cell.s.alignment.horizontal = 'center';
      }
      // Thành tiền bằng chữ
      if (r === tableEndRow) {
        cell.s.font.bold = true;
      }
    }
  }

  // Signatures
  const sigRow = tongCongRowIdx + 3;
  for (let r = sigRow; r <= sigRow + 5; r++) {
    for (let c = 0; c <= 7; c++) {
      const cell = getCell(r, c);
      cell.s = { font: { sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'center', vertical: 'center' } };
      if (r === sigRow || r === sigRow + 5) cell.s.font.bold = true;
      if (r === sigRow + 1) cell.s.font.italic = true;
    }
  }

  // Column widths
  ws['!cols'] = [
    { wch: 6 },   // A: STT
    { wch: 22 },  // B: Tên SP (part 1)
    { wch: 18 },  // C: Tên SP (part 2)
    { wch: 8 },   // D: ĐVT
    { wch: 8 },   // E: SL
    { wch: 12 },  // F: Đơn giá
    { wch: 14 },  // G: Thành tiền
    { wch: 12 },  // H: Ghi chú
  ];

  // Merge cells
  const merges: XLSX.Range[] = [];
  // Company header merges (rows 0-2, B:H)
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 7 } }); // Company name
  merges.push({ s: { r: 1, c: 1 }, e: { r: 1, c: 7 } }); // Address
  merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: 7 } }); // Phone
  // Title merge
  merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }); // PHIẾU XUẤT KHO
  // STT merge
  merges.push({ s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }); // STT
  // Date merge
  merges.push({ s: { r: 5, c: 4 }, e: { r: 5, c: 7 } }); // Ngày...tháng...năm
  // Bên nhận hàng
  merges.push({ s: { r: 6, c: 1 }, e: { r: 6, c: 7 } });
  // Địa chỉ
  merges.push({ s: { r: 7, c: 1 }, e: { r: 7, c: 7 } });
  // SĐT & Mục đích
  merges.push({ s: { r: 8, c: 1 }, e: { r: 8, c: 3 } });
  merges.push({ s: { r: 8, c: 4 }, e: { r: 8, c: 7 } });
  // Table header: TÊN SẢN PHẨM merge B:C
  merges.push({ s: { r: 9, c: 1 }, e: { r: 9, c: 2 } });
  // Data rows: merge B:C for product name
  for (let i = 0; i < itemCount; i++) {
    merges.push({ s: { r: 10 + i, c: 1 }, e: { r: 10 + i, c: 2 } });
  }
  // TỔNG CỘNG row: merge B:C
  merges.push({ s: { r: tongCongRowIdx, c: 1 }, e: { r: tongCongRowIdx, c: 2 } });
  // Thành tiền bằng chữ: merge B:H
  merges.push({ s: { r: tongCongRowIdx + 1, c: 1 }, e: { r: tongCongRowIdx + 1, c: 7 } });
  // Signature merges
  // sigRow is already declared above
  merges.push({ s: { r: sigRow, c: 0 }, e: { r: sigRow, c: 1 } });
  merges.push({ s: { r: sigRow, c: 2 }, e: { r: sigRow, c: 3 } });
  merges.push({ s: { r: sigRow, c: 4 }, e: { r: sigRow, c: 5 } });
  merges.push({ s: { r: sigRow, c: 6 }, e: { r: sigRow, c: 7 } });
  // Sub-signature line
  merges.push({ s: { r: sigRow + 1, c: 0 }, e: { r: sigRow + 1, c: 1 } });
  merges.push({ s: { r: sigRow + 1, c: 2 }, e: { r: sigRow + 1, c: 3 } });
  merges.push({ s: { r: sigRow + 1, c: 4 }, e: { r: sigRow + 1, c: 5 } });
  merges.push({ s: { r: sigRow + 1, c: 6 }, e: { r: sigRow + 1, c: 7 } });

  ws['!merges'] = merges;

  // Row heights
  ws['!rows'] = [];
  for (let i = 0; i < rows.length; i++) {
    if (i === 4) ws['!rows'][i] = { hpt: 30 }; // Title row
    else ws['!rows'][i] = { hpt: 20 };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, 'Phiếu Xuất Kho');

  XLSX.writeFile(workbook, `PhieuXuatKho_${maPhieu}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ====================================================================
// 7. MỚI: Xuất Phiếu Nhập Kho theo mẫu chuẩn (từ phiếu nhập kho)
// ====================================================================

export const exportPhieuNhapKho = (receipt: GoodsReceiptNote, allProducts: Product[]) => {
  const now = new Date(receipt.createdAt);
  const ngay = now.getDate();
  const thang = now.getMonth() + 1;
  const nam = now.getFullYear();
  const maPhieu = receipt.id.substring(0, 8).toUpperCase();

  const rows: any[][] = [];

  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Header rows
  rows.push(['', 'TRẠI GÀ ĐẺ TRỨNG LÊ VĂN DƯƠNG', '', '', '', '', '', '']);
  rows.push(['', 'Ấp Tân Tiến, xã Minh Tân, huyện Dầu Tiếng, tỉnh Bình Dương', '', '', '', '', '', '']);
  rows.push(['', 'SĐT: 0988365238 - 0963077879', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '', '']);
  // Title - MUST BE IN COL 0
  rows.push(['PHIẾU NHẬP KHO', '', '', '', '', '', '', '']);
  // STT & Date - STT in COL 1, Date in COL 4
  rows.push(['', `STT: ${maPhieu}`, '', '', `Ngày ${ngay} tháng ${thang} năm ${nam} - ${time}`, '', '', '']);
  // Nhà cung cấp
  rows.push(['', `Nhà cung cấp: ${receipt.supplier}`, '', '', '', '', '', '']);
  // Người nhập
  rows.push(['', `Người nhập: ${receipt.createdBy}`, '', '', '', '', '', '']);
  // Ghi chú - MUST BE IN COL 1
  rows.push(['', `Ghi chú: ${receipt.notes || ''}`, '', '', '', '', '', '']);
  // Table header
  rows.push(['STT', 'TÊN SẢN PHẨM, HÀNG HÓA', '', 'ĐVT', 'SL', 'ĐƠN GIÁ', 'THÀNH TIỀN', 'GHI CHÚ']);

  // Data rows
  let tongTien = 0;
  const minRows = 12;
  const itemCount = Math.max(receipt.items.length, minRows);

  for (let i = 0; i < itemCount; i++) {
    if (i < receipt.items.length) {
      const item = receipt.items[i];
      const product = allProducts.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      const variantName = variant ? Object.values(variant.attributes).join(' / ') : '';
      const productName = product?.name || item.productName || 'Vật tư';
      const fullName = variantName ? `${productName} (${variantName})` : productName;
      const price = variant?.price || 0;
      const thanhTien = item.quantity * price;
      tongTien += thanhTien;
      const batchInfo = item.batchCode ? `Lô: ${item.batchCode}` : '';
      const expiryInfo = item.expiryDate ? `HSD: ${new Date(item.expiryDate).toLocaleDateString('vi-VN')}` : '';
      const ghiChu = [batchInfo, expiryInfo].filter(Boolean).join(', ');

      rows.push([
        i + 1,
        fullName,
        '',
        item.unit || variant?.unit || 'Cái',
        item.quantity,
        price > 0 ? price : '',
        thanhTien > 0 ? thanhTien : '',
        ghiChu
      ]);
    } else {
      rows.push([i + 1, '', '', '', '', '', '', '']);
    }
  }

  // TỔNG CỘNG
  const tongCongRowIdx = rows.length;
  rows.push(['', 'TỔNG CỘNG', '', '', '', '', tongTien > 0 ? tongTien : '', '']);

  // Thành tiền bằng chữ
  rows.push(['', `Thành tiền bằng chữ: ${tongTien > 0 ? numberToVietnameseWords(tongTien) : '...............'}`, '', '', '', '', '', '']);

  // Empty row
  rows.push([]);

  // Signature row
  rows.push(['Người giao hàng', '', 'Vận chuyển', '', 'Người nhập kho', '', 'Chủ trại', '']);
  rows.push(['(Ký, họ tên)', '', '(Ký, họ tên)', '', '(Ký, họ tên)', '', '(Ký, họ tên)', '']);

  rows.push([]);
  rows.push([]);
  rows.push([]);

  // Signature names - leave them empty so the template looks clean and doesn't dump names into unrelated cells
  rows.push(['', '', '', '', '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // --- STYLING ---
  const borderThin = { style: 'thin', color: { rgb: '000000' } };
  const borderBox = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

  const getCell = (r: number, c: number) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    return ws[cellRef];
  };

  // Trại Gà Đẻ Trứng
  getCell(0, 1).s = { font: { bold: true, sz: 14, name: 'Times New Roman' }, alignment: { vertical: 'center' } };
  getCell(1, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
  getCell(2, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };

  // Title
  getCell(4, 0).s = { font: { bold: true, sz: 20, name: 'Times New Roman' }, alignment: { horizontal: 'center', vertical: 'center' } };
  
  // STT & Date
  getCell(5, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'left' } };
  getCell(5, 4).s = { font: { bold: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'right' } };

  // Info rows
  for (let r = 6; r <= 8; r++) {
    for (let c = 1; c <= 7; c++) {
      getCell(r, c).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
    }
  }

  // Table header & data borders
  const tableEndRow = tongCongRowIdx + 1;
  for (let r = 9; r <= tableEndRow; r++) {
    for (let c = 0; c <= 7; c++) {
      const cell = getCell(r, c);
      cell.s = { ...cell.s, font: { sz: 11, name: 'Times New Roman' }, border: borderBox, alignment: { vertical: 'center' } };
      
      // Header row styling
      if (r === 9) {
        cell.s.font.bold = true;
        cell.s.alignment.horizontal = 'center';
      }
      // STT column alignment
      if (c === 0 && r > 9) {
        cell.s.alignment.horizontal = 'center';
        cell.s.font.bold = true;
      }
      // TỔNG CỘNG row
      if (r === tongCongRowIdx) {
        cell.s.font.bold = true;
        if (c === 1) cell.s.alignment.horizontal = 'center';
      }
      // Thành tiền bằng chữ
      if (r === tableEndRow) {
        cell.s.font.bold = true;
      }
    }
  }

  // Signatures
  const sigRow = tongCongRowIdx + 3;
  for (let r = sigRow; r <= sigRow + 5; r++) {
    for (let c = 0; c <= 7; c++) {
      const cell = getCell(r, c);
      cell.s = { font: { sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'center', vertical: 'center' } };
      if (r === sigRow || r === sigRow + 5) cell.s.font.bold = true;
      if (r === sigRow + 1) cell.s.font.italic = true;
    }
  }

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 18 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
  ];

  // Merges (same pattern as Phiếu Xuất Kho)
  const merges: XLSX.Range[] = [];
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 7 } });
  merges.push({ s: { r: 1, c: 1 }, e: { r: 1, c: 7 } });
  merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: 7 } });
  merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }); // Title
  merges.push({ s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }); // STT
  merges.push({ s: { r: 5, c: 4 }, e: { r: 5, c: 7 } }); // Date
  merges.push({ s: { r: 6, c: 1 }, e: { r: 6, c: 7 } });
  merges.push({ s: { r: 7, c: 1 }, e: { r: 7, c: 7 } });
  merges.push({ s: { r: 8, c: 1 }, e: { r: 8, c: 7 } });
  // Table header B:C merge
  merges.push({ s: { r: 9, c: 1 }, e: { r: 9, c: 2 } });
  // Data rows B:C merge
  for (let i = 0; i < itemCount; i++) {
    merges.push({ s: { r: 10 + i, c: 1 }, e: { r: 10 + i, c: 2 } });
  }
  // TỔNG CỘNG
  merges.push({ s: { r: tongCongRowIdx, c: 1 }, e: { r: tongCongRowIdx, c: 2 } });
  merges.push({ s: { r: tongCongRowIdx + 1, c: 1 }, e: { r: tongCongRowIdx + 1, c: 7 } });
  // Signatures
  // sigRow is already declared above
  for (let row = sigRow; row <= sigRow + 1; row++) {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 1 } });
    merges.push({ s: { r: row, c: 2 }, e: { r: row, c: 3 } });
    merges.push({ s: { r: row, c: 4 }, e: { r: row, c: 5 } });
    merges.push({ s: { r: row, c: 6 }, e: { r: row, c: 7 } });
  }

  ws['!merges'] = merges;

  ws['!rows'] = [];
  for (let i = 0; i < rows.length; i++) {
    if (i === 4) ws['!rows'][i] = { hpt: 30 };
    else ws['!rows'][i] = { hpt: 20 };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, 'Phiếu Nhập Kho');

  XLSX.writeFile(workbook, `PhieuNhapKho_${maPhieu}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
