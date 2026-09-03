import * as XLSX from 'xlsx-js-style';

export const createStyledReportSheet = (
  title: string,
  periodLabel: string,
  headers: string[],
  dataRows: any[][],
  colWidths: {wch: number}[]
) => {
  const rows: any[][] = [];
  
  rows.push(['', 'TRẠI GÀ ĐẺ TRỨNG LÊ VĂN DƯƠNG']);
  rows.push(['', 'Ấp Tân Tiến, xã Minh Tân, huyện Dầu Tiếng, tỉnh Bình Dương']);
  rows.push(['', 'SĐT: 0988365238 - 0963077879']);
  rows.push([]);
  
  rows.push([title]);
  rows.push(['', `Kỳ báo cáo: ${periodLabel}`]);
  rows.push([]);
  
  rows.push(headers);
  dataRows.forEach(r => rows.push(r));
  
  rows.push([]);
  const colCount = Math.max(headers.length, 4);
  const sigRowIdx = rows.length;
  const sigRow = new Array(colCount).fill('');
  sigRow[0] = 'Người lập biểu';
  sigRow[colCount - 2] = 'Chủ trại';
  rows.push(sigRow);

  const sigSubRow = new Array(colCount).fill('');
  sigSubRow[0] = '(Ký, họ tên)';
  sigSubRow[colCount - 2] = '(Ký, họ tên)';
  rows.push(sigSubRow);
  
  rows.push([]);
  rows.push([]);
  rows.push([]);
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  const borderThin = { style: 'thin', color: { rgb: '000000' } };
  const borderBox = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

  const getCell = (r: number, c: number) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    return ws[cellRef];
  };

  getCell(0, 1).s = { font: { bold: true, sz: 14, name: 'Times New Roman' }, alignment: { vertical: 'center' } };
  getCell(1, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
  getCell(2, 1).s = { font: { bold: true, sz: 11, name: 'Times New Roman' } };
  getCell(4, 0).s = { font: { bold: true, sz: 18, name: 'Times New Roman' }, alignment: { horizontal: 'center', vertical: 'center' } };
  getCell(5, 1).s = { font: { bold: true, italic: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'left' } };
  
  const merges: XLSX.Range[] = [];
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: colCount - 1 } });
  merges.push({ s: { r: 1, c: 1 }, e: { r: 1, c: colCount - 1 } });
  merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: colCount - 1 } });
  merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: colCount - 1 } }); 
  merges.push({ s: { r: 5, c: 1 }, e: { r: 5, c: colCount - 1 } });
  
  for(let r = 7; r < 7 + 1 + dataRows.length; r++) {
    for(let c = 0; c < headers.length; c++) {
      const cell = getCell(r, c);
      cell.s = { ...cell.s, font: { sz: 11, name: 'Times New Roman' }, border: borderBox, alignment: { vertical: 'center' } };
      if (r === 7) {
        cell.s.font.bold = true;
        cell.s.alignment.horizontal = 'center';
      }
      if (c === 0) cell.s.alignment.horizontal = 'center';
    }
  }

  for (let c = 0; c < colCount; c++) {
    const s1 = getCell(sigRowIdx, c);
    s1.s = { font: { bold: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'center' } };
    const s2 = getCell(sigRowIdx + 1, c);
    s2.s = { font: { italic: true, sz: 11, name: 'Times New Roman' }, alignment: { horizontal: 'center' } };
  }
  
  merges.push({ s: { r: sigRowIdx, c: 0 }, e: { r: sigRowIdx, c: 1 } });
  merges.push({ s: { r: sigRowIdx + 1, c: 0 }, e: { r: sigRowIdx + 1, c: 1 } });
  merges.push({ s: { r: sigRowIdx, c: colCount - 2 }, e: { r: sigRowIdx, c: colCount - 1 } });
  merges.push({ s: { r: sigRowIdx + 1, c: colCount - 2 }, e: { r: sigRowIdx + 1, c: colCount - 1 } });

  ws['!merges'] = merges;
  ws['!cols'] = colWidths;
  ws['!rows'] = [];
  ws['!rows'][4] = { hpt: 30 }; 

  return ws;
};
