import React, { useState, useEffect } from "react";
import { GoodsReceiptNote, Product, ReceiptItem } from "../types";

interface EditReceiptModalProps {
  receipt: GoodsReceiptNote;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<GoodsReceiptNote>) => Promise<void>;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({ receipt, products, isOpen, onClose, onSave }) => {
  const [supplier, setSupplier] = useState(receipt.supplier);
  const [notes, setNotes] = useState(receipt.notes || "");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSupplier(receipt.supplier);
      setNotes(receipt.notes || "");
      // Deep clone items so we can edit quantities safely
      setItems(JSON.parse(JSON.stringify(receipt.items)));
    }
  }, [isOpen, receipt]);

  if (!isOpen) return null;

  const handleQuantityChange = (index: number, newQty: number) => {
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(receipt.id, {
        supplier,
        notes,
        items,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-3 mb-4" id="modal-title">
                Sửa Phiếu Nhập Kho: {receipt.id}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nhà cung cấp <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Danh sách vật tư</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có vật tư nào. Vui lòng thêm từ danh sách.</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          const variant = product?.variants.find(v => v.id === item.variantId);
                          const attributesStr = variant?.attributes ? Object.values(variant.attributes).join(" - ") : "";
                          
                          return (
                            <div key={`${item.productId}-${item.variantId}-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{product?.name || item.productName || item.productId}</h4>
                                <p className="text-xs text-gray-500">{attributesStr || "Mặc định"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500">SL:</label>
                                <input
                                  type="number"
                                  min={1}
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Xóa"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReceiptModal;
