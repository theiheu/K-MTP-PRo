import React, { useState } from "react";
import { Product, DeliveryItem } from "../types";

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

interface CreateDeliveryNoteFormProps {
  products: Product[];
  onSubmit: (data: {
    deliveredBy: string;
    items: DeliveryItem[];
    notes?: string;
  }) => void;
  onCancel: () => void;
}

const CreateDeliveryNoteForm: React.FC<CreateDeliveryNoteFormProps> = ({
  products,
  onSubmit,
  onCancel,
}) => {
  const [deliveredBy, setDeliveredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | "">("");
  const [selectedVariant, setSelectedVariant] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);

  const handleAddItem = () => {
    if (!selectedProduct || !selectedVariant) return;

    const product = products.find((p) => p.id === selectedProduct);
    const variant = product?.variants.find((v) => v.id === selectedVariant);

    if (!product || !variant) return;

    const newItem: DeliveryItem = {
      productId: selectedProduct,
      variantId: selectedVariant,
      quantity,
      productName: product.name,
      variantAttributes: variant.attributes,
      unit: variant.unit,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveredBy.trim()) {
      alert("Vui lòng nhập tên người giao hàng");
      return;
    }
    if (items.length === 0) {
      alert("Vui lòng thêm ít nhất một vật tư");
      return;
    }
    onSubmit({
      deliveredBy: deliveredBy.trim(),
      items,
      notes: notes.trim() || undefined,
    });
  };

  const selectedProductData = selectedProduct
    ? products.find((p) => p.id === selectedProduct)
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        <div>
          <label
            htmlFor="deliveredBy"
            className="block text-sm font-medium text-gray-700"
          >
            Người giao hàng
          </label>
          <input
            type="text"
            id="deliveredBy"
            value={deliveredBy}
            onChange={(e) => setDeliveredBy(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            required
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Danh sách vật tư
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label
                htmlFor="product"
                className="block text-sm font-medium text-gray-700"
              >
                Vật tư
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(Number(e.target.value) || "");
                  setSelectedVariant("");
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
              >
                <option value="">Chọn vật tư...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="variant"
                className="block text-sm font-medium text-gray-700"
              >
                Biến thể
              </label>
              <select
                id="variant"
                value={selectedVariant}
                onChange={(e) =>
                  setSelectedVariant(Number(e.target.value) || "")
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                disabled={!selectedProduct}
              >
                <option value="">Chọn biến thể...</option>
                {selectedProductData?.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {Object.entries(variant.attributes)
                      .map(([key, value]) => `${value}`)
                      .join(" / ") || "Mặc định"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Số lượng
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct || !selectedVariant}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Vật tư
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Biến thể
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Số lượng
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Object.values(item.variantAttributes || {}).join(
                          " / "
                        ) || "Mặc định"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Chưa có vật tư nào được thêm
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Ghi chú
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
            placeholder="Nhập ghi chú nếu có..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Tạo phiếu giao nhận
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeliveryNoteForm;
