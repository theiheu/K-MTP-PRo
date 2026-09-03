import React, { useState } from "react";
import { User, CartItem as CartItemType, Product } from "../types";
import CartItem from "./CartItem";
import ConfirmationModal from "./ConfirmationModal";

interface CreateRequisitionPageProps {
  user: User;
  cartItems: CartItemType[];
  allProducts: Product[];
  zones: { id: string, name: string }[];
  users: User[];
  onSubmit: (details: {
    requesterName: string;
    zone: string;
    purpose: string;
    isCompleted?: boolean;
  }) => void;
  onCancel: () => void;
  onUpdateItem: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
}

const CreateRequisitionPage: React.FC<CreateRequisitionPageProps> = ({ zones,
  user,
  users,
  cartItems,
  allProducts,
  onSubmit,
  onCancel,
  onUpdateItem,
  onRemoveItem,
}) => {
  const [requesterName, setRequesterName] = useState(user.name);
  const [zone, setZone] = useState(user.zone || (zones && zones.length > 0 ? zones[0].name : ""));
  const [purpose, setPurpose] = useState("");
  const [itemToRemove, setItemToRemove] = useState<CartItemType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requesterName.trim()) {
      setError("Vui lòng điền tên người yêu cầu");
      return;
    }
    if (!purpose.trim()) {
      setError("Vui lòng điền Mục đích");
      return;
    }
    if (cartItems.length === 0) {
      setError("Không thể tạo phiếu yêu cầu trống");
      return;
    }
    onSubmit({ requesterName, zone, purpose, isCompleted });
  };

  const handleRequestRemove = (variantId: string) => {
    const item = cartItems.find((i) => i.variant.id === variantId);
    if (item) {
      setItemToRemove(item);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      onRemoveItem(itemToRemove.variant.id);
      if (cartItems.length === 1) {
        // If it was the last item
        onCancel(); // Go back to shop
      }
    }
    setItemToRemove(null);
  };

  const isManager = user.role === "manager";

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6">
        Tạo Phiếu Yêu Cầu Mới
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start"
      >
        {/* Left side: Item List */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
            Vật tư Yêu cầu ({totalItems})
          </h2>
          {cartItems.length > 0 ? (
            <ul
              role="list"
              className="divide-y divide-gray-200 mt-4 max-h-[60vh] overflow-y-auto"
            >
              {cartItems.map((item) => (
                <CartItem
                  key={item.variant.id}
                  item={item}
                  allProducts={allProducts}
                  onRemove={handleRequestRemove}
                  onUpdateItem={onUpdateItem}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-gray-500">
              Không có vật tư nào. Vui lòng quay lại kho để thêm vật tư.
            </p>
          )}
        </div>

        {/* Right side: Form */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md sticky top-24">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
              Thông tin Phiếu
            </h2>
            <div>
              <label
                htmlFor="requesterName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Tên người yêu cầu
              </label>
              <div className="mt-2 space-y-2">
                {!isManager ? (
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <>
                    <select
                      value={users.some(u => u.name === requesterName) ? requesterName : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value !== 'OTHER') {
                          setRequesterName(e.target.value);
                          // Auto update zone based on user if found
                          const selectedUser = users.find(u => u.name === e.target.value);
                          if (selectedUser?.zone) {
                            setZone(selectedUser.zone);
                          }
                        } else {
                          setRequesterName(''); // Clear for manual input
                        }
                      }}
                      className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6"
                    >
                      <option value="" disabled>Chọn người yêu cầu...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} {u.zone ? `(${u.zone})` : ''}
                        </option>
                      ))}
                      <option value="OTHER">-- Nhập tên khác... --</option>
                    </select>

                    {(!users.some(u => u.name === requesterName) || requesterName === '') && (
                      <input
                        type="text"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        placeholder="Nhập tên người yêu cầu"
                        required
                        className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6 mt-2"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="zone"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Khu vực
              </label>
              <div className="mt-2">
                <select
                  id="zone"
                  name="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="purpose"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mục đích
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="purpose"
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6"
                  placeholder="Vd: Sửa chữa máy cho gà ăn"
                  required
                ></textarea>
              </div>
            </div>
            {isManager && (
              <div className="flex items-center">
                <input
                  id="isCompleted"
                  name="isCompleted"
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                />
                <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-900 font-medium">
                  Hoàn thành phiếu ngay (Đã xuất và giao hàng)
                </label>
              </div>
            )}
            <div className="border-t pt-6 space-y-3">
              <button
                type="submit"
                disabled={cartItems.length === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Gửi Phiếu Yêu cầu
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Hủy và Quay lại Kho
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa Vật tư khỏi Phiếu"
        message={`Bạn có chắc chắn muốn xóa "${itemToRemove?.product.name}" khỏi phiếu yêu cầu này không?`}
        confirmButtonText="Xóa"
        confirmButtonClass="bg-red-600 hover:bg-red-500"
      />
    </div>
  );
};

export default CreateRequisitionPage;

