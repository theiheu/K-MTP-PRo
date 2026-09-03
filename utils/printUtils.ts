import { Product, RequisitionForm, GoodsReceiptNote } from '../types';
import { numberToVietnameseWords } from './excelExport';

const getPrintHTMLWrapper = (title: string, bodyHTML: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      @page { margin: 15mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      line-height: 1.5;
      color: #000;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .header-left {
      text-align: left;
    }
    .company-name {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }
    .company-info {
      margin: 0;
    }
    .title-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .doc-title {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .meta-info-left {
      text-align: left;
      font-weight: bold;
    }
    .meta-info-right {
      text-align: right;
      font-style: italic;
    }
    .general-info {
      margin-bottom: 15px;
    }
    .general-info p {
      margin: 5px 0;
      font-weight: bold;
    }
    .info-row {
      display: flex;
    }
    .info-col {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: center;
    }
    th {
      font-weight: bold;
    }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      text-align: center;
    }
    .sig-col {
      flex: 1;
    }
    .sig-title {
      font-weight: bold;
    }
    .sig-sub {
      font-style: italic;
      margin-bottom: 80px;
    }
  </style>
</head>
<body>
  ${bodyHTML}
  <script>
    window.onload = () => {
      window.print();
      // setTimeout(() => window.close(), 500);
    };
  </script>
</body>
</html>
`;

export const printPhieuXuatKho = (requisition: RequisitionForm) => {
  const now = new Date(requisition.fulfilledAt || requisition.createdAt);
  const ngay = now.getDate();
  const thang = now.getMonth() + 1;
  const nam = now.getFullYear();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const maPhieu = requisition.id.substring(0, 8).toUpperCase();

  let tongTien = 0;
  const minRows = 12;
  const itemCount = Math.max(requisition.items.length, minRows);

  let rowsHTML = '';
  for (let i = 0; i < itemCount; i++) {
    if (i < requisition.items.length) {
      const item = requisition.items[i];
      const price = item.variant.price || 0;
      const thanhTien = item.quantity * price;
      tongTien += thanhTien;
      const variantName = Object.values(item.variant.attributes).join(' / ');
      const fullName = variantName ? `${item.product.name} (${variantName})` : item.product.name;
      
      rowsHTML += `
        <tr>
          <td>${i + 1}</td>
          <td class="text-left">${fullName}</td>
          <td>${item.variant.unit || 'Cái'}</td>
          <td>${item.quantity}</td>
          <td class="text-right">${price > 0 ? price.toLocaleString('vi-VN') : ''}</td>
          <td class="text-right">${thanhTien > 0 ? thanhTien.toLocaleString('vi-VN') : ''}</td>
          <td></td>
        </tr>
      `;
    } else {
      rowsHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }
  }

  const bodyHTML = `
    <div class="header">
      <div class="header-left">
        <p class="company-name">TRANG TRẠI MINH TÂN PHÁT</p>
        <p class="company-info">Ấp Tân Tiến, xã Minh Tân, huyện Dầu Tiếng, tỉnh Bình Dương</p>
        <p class="company-info">SĐT: 0988365238 - 0963077879</p>
      </div>
    </div>
    
    <div class="title-section">
      <h1 class="doc-title">PHIẾU XUẤT KHO</h1>
    </div>

    <div class="meta-info">
      <div class="meta-info-left">STT: ${maPhieu}</div>
      <div class="meta-info-right">Ngày ${ngay} tháng ${thang} năm ${nam} - ${time}</div>
    </div>

    <div class="general-info">
      <p>Bên nhận hàng: ${requisition.requesterName}</p>
      <p>Địa chỉ: ${requisition.zone}</p>
      <div class="info-row">
        <div class="info-col"><p>Số điện thoại: ...............................</p></div>
        <div class="info-col"><p>Mục đích: ${requisition.purpose}</p></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th width="5%">STT</th>
          <th width="40%">TÊN SẢN PHẨM, HÀNG HÓA</th>
          <th width="8%">ĐVT</th>
          <th width="7%">SL</th>
          <th width="15%">ĐƠN GIÁ</th>
          <th width="15%">THÀNH TIỀN</th>
          <th width="10%">GHI CHÚ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
        <tr>
          <td colspan="2" class="font-bold">TỔNG CỘNG</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="text-right font-bold">${tongTien > 0 ? tongTien.toLocaleString('vi-VN') : ''}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p class="font-bold">Thành tiền bằng chữ: ${tongTien > 0 ? numberToVietnameseWords(tongTien) : '....................................................................'}</p>

    <div class="signatures">
      <div class="sig-col">
        <div class="sig-title">Người nhận hàng</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Vận chuyển</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Người lập phiếu</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Chủ trại</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
    </div>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(getPrintHTMLWrapper('In Phiếu Xuất Kho', bodyHTML));
    printWindow.document.close();
  }
};

export const printPhieuNhapKho = (receipt: GoodsReceiptNote, allProducts: Product[]) => {
  const now = new Date(receipt.createdAt);
  const ngay = now.getDate();
  const thang = now.getMonth() + 1;
  const nam = now.getFullYear();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const maPhieu = receipt.id.substring(0, 8).toUpperCase();

  let tongTien = 0;
  const minRows = 12;
  const itemCount = Math.max(receipt.items.length, minRows);

  let rowsHTML = '';
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

      rowsHTML += `
        <tr>
          <td>${i + 1}</td>
          <td class="text-left">${fullName}</td>
          <td>${item.unit || variant?.unit || 'Cái'}</td>
          <td>${item.quantity}</td>
          <td class="text-right">${price > 0 ? price.toLocaleString('vi-VN') : ''}</td>
          <td class="text-right">${thanhTien > 0 ? thanhTien.toLocaleString('vi-VN') : ''}</td>
          <td>${ghiChu}</td>
        </tr>
      `;
    } else {
      rowsHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }
  }

  const bodyHTML = `
    <div class="header">
      <div class="header-left">
        <p class="company-name">TRANG TRẠI MINH TÂN PHÁT</p>
        <p class="company-info">Ấp Tân Tiến, xã Minh Tân, huyện Dầu Tiếng, tỉnh Bình Dương</p>
        <p class="company-info">SĐT: 0988365238 - 0963077879</p>
      </div>
    </div>
    
    <div class="title-section">
      <h1 class="doc-title">PHIẾU NHẬP KHO</h1>
    </div>

    <div class="meta-info">
      <div class="meta-info-left">STT: ${maPhieu}</div>
      <div class="meta-info-right">Ngày ${ngay} tháng ${thang} năm ${nam} - ${time}</div>
    </div>

    <div class="general-info">
      <p>Nhà cung cấp: ${receipt.supplier}</p>
      <p>Người nhập: ${receipt.createdBy}</p>
      <p>Ghi chú: ${receipt.notes || ''}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th width="5%">STT</th>
          <th width="40%">TÊN SẢN PHẨM, HÀNG HÓA</th>
          <th width="8%">ĐVT</th>
          <th width="7%">SL</th>
          <th width="15%">ĐƠN GIÁ</th>
          <th width="15%">THÀNH TIỀN</th>
          <th width="10%">GHI CHÚ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
        <tr>
          <td colspan="2" class="font-bold">TỔNG CỘNG</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="text-right font-bold">${tongTien > 0 ? tongTien.toLocaleString('vi-VN') : ''}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p class="font-bold">Thành tiền bằng chữ: ${tongTien > 0 ? numberToVietnameseWords(tongTien) : '....................................................................'}</p>

    <div class="signatures">
      <div class="sig-col">
        <div class="sig-title">Người giao hàng</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Vận chuyển</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Người nhập kho</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Chủ trại</div>
        <div class="sig-sub">(Ký, họ tên)</div>
      </div>
    </div>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(getPrintHTMLWrapper('In Phiếu Nhập Kho', bodyHTML));
    printWindow.document.close();
  }
};
