import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { Product, Variant } from '../types';
import Pagination from './Pagination';

interface StockLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  variant: Variant;
}

interface Transaction {
  date: string;
  type: 'IN' | 'OUT';
  documentId: string;
  documentType: string;
  quantity: number;
  actor: string;
  notes?: string;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const StockLedgerModal: React.FC<StockLedgerModalProps> = ({ isOpen, onClose, product, variant }) => {
  const { receipts, requisitions } = useDataStore();

  const transactions = useMemo(() => {
    const list: Transaction[] = [];

    // Lấy lịch sử nhập kho (Receipts)
    receipts.forEach(receipt => {
      const item = receipt.items.find(i => i.variantId === variant.id);
      if (item) {
        list.push({
          date: receipt.createdAt,
          type: 'IN',
          documentId: receipt.id,
          documentType: 'Phiếu Nhập',
          quantity: item.quantity,
          actor: receipt.createdBy,
          notes: receipt.notes
        });
      }
    });

    // Lấy lịch sử xuất kho (Requisitions)
    // Chỉ tính các phiếu đã hoàn thành hoặc đã nhận hàng
    requisitions.filter(r => r.status === 'Đã hoàn thành' || r.status === 'Đã nhận hàng').forEach(req => {
      // Đối với sản phẩm đơn (hoặc variant trực tiếp)
      const directItem = req.items.find(i => i.variant.id === variant.id);
      if (directItem) {
        list.push({
          date: req.fulfilledAt || req.createdAt,
          type: 'OUT',
          documentId: req.id,
          documentType: 'Phiếu Yêu Cầu',
          quantity: directItem.quantity,
          actor: req.fulfilledBy || req.requesterName,
          notes: req.purpose
        });
      }

      // Hỗ trợ truy xuất linh kiện (composite variant)
      req.items.forEach(reqItem => {
        if (reqItem.variant.components && reqItem.variant.components.length > 0) {
          const comp = reqItem.variant.components.find(c => c.variantId === variant.id);
          if (comp) {
             list.push({
              date: req.fulfilledAt || req.createdAt,
              type: 'OUT',
              documentId: req.id,
              documentType: `Lắp ráp (${reqItem.product.name})`,
              quantity: reqItem.quantity * comp.quantity,
              actor: req.fulfilledBy || req.requesterName,
              notes: req.purpose
            });
          }
        }
      });
    });

    // Sắp xếp theo ngày giảm dần (mới nhất lên trên)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receipts, requisitions, variant.id]);

  // Tính toán Tồn kho chạy ngược (Running Balance)
  const ledgerEntries = useMemo(() => {
    let currentBal = variant.stock;
    return transactions.map(t => {
      const entry = { ...t, balance: currentBal };
      if (t.type === 'IN') {
        currentBal -= t.quantity;
      } else {
        currentBal += t.quantity;
      }
      return entry;
    });
  }, [transactions, variant.stock]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const totalPages = Math.ceil(ledgerEntries.length / ITEMS_PER_PAGE) || 1;
  const paginatedEntries = ledgerEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!isOpen) return null;

  const variantName = Object.values(variant.attributes).join(' / ') || 'Mặc định';

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl flex flex-col max-h-[90vh]">
            <div className="bg-white px-4 py-3 sm:px-6 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">Thẻ kho (Lịch sử giao dịch)</h3>
                <p className="text-sm text-gray-500">{product.name} - {variantName}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Đóng</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1 bg-gray-50 p-4">
              <div className="bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 relative">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Ngày tháng</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Loại phiếu</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Mã chứng từ</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Nhập</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Xuất</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Tồn</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Thực hiện bởi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedEntries.length > 0 ? (
                      paginatedEntries.map((entry, idx) => (
                        <tr key={`${entry.documentId}-${idx}`} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{new Date(entry.date).toLocaleString('vi-VN')}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {entry.documentType}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono" title={entry.notes}>{entry.documentId.substring(0, 8).toUpperCase()}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-green-600 font-medium">{entry.type === 'IN' ? `+${entry.quantity}` : '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600 font-medium">{entry.type === 'OUT' ? `-${entry.quantity}` : '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-gray-900">{entry.balance}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.actor}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                          Chưa có giao dịch xuất nhập nào cho vật tư này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-between items-center sticky bottom-0">
               <div className="text-sm text-gray-700">
                 Tồn kho hiện tại: <span className="font-bold text-lg">{variant.stock} {variant.unit}</span>
               </div>
               <button onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Đóng
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLedgerModal;
