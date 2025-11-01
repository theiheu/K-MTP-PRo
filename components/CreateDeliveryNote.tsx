import React, { useState, useCallback } from "react";
import {
  Product,
  GoodsReceiptNote,
  User,
  DeliveryNote,
  DeliveryItem,
} from "../types";

interface CreateDeliveryNoteProps {
  user: User | null;
  products: Product[];
  receipts: GoodsReceiptNote[];
  onSubmit: (
    items: DeliveryNote["items"],
    receiptId: string,
    shipperId: string
  ) => void;
  onCancel: () => void;
}

const CreateDeliveryNote: React.FC<CreateDeliveryNoteProps> = ({
  user,
  products,
  receipts,
  onSubmit,
  onCancel,
}) => {
  const [selectedReceipt, setSelectedReceipt] =
    useState<GoodsReceiptNote | null>(null);
  const [shipperId, setShipperId] = useState("");
  const [items, setItems] = useState<DeliveryItem[]>([]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedReceipt || !shipperId) {
        alert("Vui lòng chọn phiếu nhập kho và nhập ID người giao hàng.");
        return;
      }

      if (items.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để giao.");
        return;
      }

      onSubmit(items, selectedReceipt.id, shipperId);
    },
    [selectedReceipt, shipperId, items, onSubmit]
  );

  const handleQuantityChange = useCallback(
    (index: number, quantity: number) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, quantity } : item))
      );
    },
    []
  );

  const handleToggleItem = useCallback(
    (index: number, checked: boolean) => {
      if (checked) {
        const receiptItem = selectedReceipt!.items[index];
        const product = products.find((p) => p.id === receiptItem.productId);
        const variant = product?.variants.find(
          (v) => v.id === receiptItem.variantId
        );

        setItems((prev) => [
          ...prev,
          {
            productId: receiptItem.productId,
            variantId: receiptItem.variantId,
            quantity: receiptItem.quantity,
            productName: product?.name,
            variantAttributes: variant?.attributes,
            unit: variant?.unit,
          },
        ]);
      } else {
        setItems((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [selectedReceipt, products]
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Tạo Phiếu Giao Hàng
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn phiếu nhập kho
          </label>
          <select
            value={selectedReceipt?.id || ""}
            onChange={(e) => {
              const receipt = receipts.find((r) => r.id === e.target.value);
              setSelectedReceipt(receipt || null);
              setItems([]);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            required
          >
            <option value="">-- Chọn phiếu nhập kho --</option>
            {receipts.map((receipt) => (
              <option key={receipt.id} value={receipt.id}>
                {receipt.id} - {receipt.supplier}
              </option>
            ))}
          </select>
        </div>

        {/* Shipper ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Người giao hàng
          </label>
          <input
            type="text"
            value={shipperId}
            onChange={(e) => setShipperId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Nhập ID người giao hàng"
            required
          />
        </div>

        {/* Items Selection */}
        {selectedReceipt && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Danh sách hàng hóa
            </h3>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chọn
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Biến thể
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedReceipt.items.map((item, index) => {
                    const product = products.find(
                      (p) => p.id === item.productId
                    );
                    const variant = product?.variants.find(
                      (v) => v.id === item.variantId
                    );
                    const variantName = variant
                      ? Object.values(variant.attributes).join(" / ")
                      : "";
                    const isSelected = items.some(
                      (i) =>
                        i.productId === item.productId &&
                        i.variantId === item.variantId
                    );

                    return (
                      <tr key={`${item.productId}-${item.variantId}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleToggleItem(index, e.target.checked)
                            }
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product?.name || "Unknown Product"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variantName || "Mặc định"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {isSelected ? (
                            <input
                              type="number"
                              value={
                                items.find(
                                  (i) =>
                                    i.productId === item.productId &&
                                    i.variantId === item.variantId
                                )?.quantity || 0
                              }
                              onChange={(e) => {
                                const idx = items.findIndex(
                                  (i) =>
                                    i.productId === item.productId &&
                                    i.variantId === item.variantId
                                );
                                if (idx !== -1) {
                                  handleQuantityChange(
                                    idx,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  );
                                }
                              }}
                              max={item.quantity}
                              min="0"
                              className="w-20 rounded-md border-gray-300 text-right"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">
                              {item.quantity} {variant?.unit}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Tạo phiếu giao hàng
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeliveryNote;
