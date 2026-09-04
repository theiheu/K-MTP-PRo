import React, { useState } from "react";
import { User, CartItem as CartItemType, Product, RequisitionGroup } from "../types";
import CartItem from "./CartItem";
import ConfirmationModal from "./ConfirmationModal";

interface CreateRequisitionModalProps {
  isOpen: boolean;
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
    groups?: RequisitionGroup[];
  }, cartOverride?: CartItemType[]) => void;
  onCancel: () => void;
  onUpdateItem: (variantId: string, quantity: number) => void;
  onUpdateDetails: (variantId: string, details: Partial<CartItemType>) => void;
  onRemoveItem: (variantId: string) => void;
}

const CreateRequisitionModal: React.FC<CreateRequisitionModalProps> = ({
  isOpen,
  zones,
  user,
  users,
  cartItems,
  allProducts,
  onSubmit,
  onCancel,
  onUpdateItem,
  onUpdateDetails,
  onRemoveItem,
}) => {
  const defaultGroups: RequisitionGroup[] = [
    { id: 'general-purpose', name: 'Mục đích chung', purposeType: 'regular_use', displayOrder: 0 },
  ];

  const [requesterName, setRequesterName] = useState(user.name);
  const [zone, setZone] = useState(user.zone || (zones && zones.length > 0 ? zones[0].name : ""));
  const [purpose, setPurpose] = useState("");
  const [itemToRemove, setItemToRemove] = useState<CartItemType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<RequisitionGroup[]>(defaultGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNeededBy, setNewGroupNeededBy] = useState("");

  const getGroupForItem = (item: CartItemType) => {
    return groups.find(group => group.id === item.groupId) || groups[0];
  };

  const cartWithGroups = cartItems.map(item => {
    const group = getGroupForItem(item);
    return {
      ...item,
      groupId: group.id,
      groupName: group.name,
      purposeType: group.purposeType,
      groupNotes: group.notes,
      neededBy: group.neededBy,
    };
  });

  const addCustomGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;
    const id = `custom-${Date.now()}`;
    setGroups(current => [
      ...current,
      {
        id,
        name: trimmedName,
        purposeType: 'other',
        neededBy: newGroupNeededBy.trim() || undefined,
        displayOrder: current.length,
      },
    ]);
    setNewGroupName("");
    setNewGroupNeededBy("");
  };

  const updateGroupNotes = (groupId: string, notes: string) => {
    setGroups(current => current.map(group => group.id === groupId ? { ...group, notes } : group));
  };

  const updateGroupName = (groupId: string, name: string) => {
    setGroups(current => current.map(group => group.id === groupId ? { ...group, name } : group));
  };

  const updateGroupNeededBy = (groupId: string, neededBy: string) => {
    setGroups(current => current.map(group => group.id === groupId ? { ...group, neededBy } : group));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requesterName.trim()) {
      setError("Vui lòng điền tên người yêu cầu");
      return;
    }
    if (cartItems.length === 0) {
      setError("Không thể tạo phiếu yêu cầu trống");
      return;
    }
    if (groups.some(group => !group.name.trim())) {
      setError("Vui lòng nhập hạng mục/mục đích sử dụng cho từng nhóm");
      return;
    }
    const missingNotes = cartWithGroups.find(item => item.isExchange && !item.defectNotes?.trim());
    if (missingNotes) {
      setError(`Vui lòng nhập lý do/tình trạng hỏng hóc cho vật tư: ${missingNotes.product.name}`);
      return;
    }
    const purposeSummary = purpose.trim() || groups.map(group => group.name.trim()).filter(Boolean).join("; ");
    onSubmit({ requesterName, zone, purpose: purposeSummary, isCompleted, groups }, cartWithGroups);
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
  const exchangeCount = cartWithGroups.filter(item => item.isExchange).length;

  if (!isOpen) return null;

  return (
    <div className="relative z-[60]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
          <div className="relative flex h-[100dvh] w-full transform flex-col overflow-hidden bg-gray-100 text-left shadow-xl transition-all sm:h-auto sm:max-h-[90vh] sm:max-w-6xl sm:rounded-lg">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-2xl" id="modal-title">
                Tạo Phiếu Yêu Cầu Mới
              </h1>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onCancel}
              >
                <span className="sr-only">Đóng</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 items-start xl:grid-cols-5 xl:gap-6">
                {/* Left side: Item List */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 xl:col-span-3">
                  <div className="border-b pb-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Vật tư Yêu cầu ({totalItems})
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Gom vật tư theo hạng mục/mục đích sử dụng và thời gian cần như phiếu giấy.</p>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className={`rounded-md border p-3 ${
                      exchangeCount > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Vật tư đổi hỏng</p>
                          <p className="mt-0.5 text-xs text-gray-500">Chỉ dùng khi dòng vật tư cần thu hồi đồ cũ.</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          {exchangeCount} vật tư
                        </span>
                      </div>
                    </div>

                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      {groups.map(group => {
                        const count = cartWithGroups.filter(item => item.groupId === group.id).length;
                        return (
                          <div key={group.id} className="min-w-[128px] rounded-md bg-gray-50 px-3 py-2 shadow-sm ring-1 ring-gray-200">
                            <p className="truncate text-xs font-semibold text-gray-800">{group.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{count} vật tư{group.neededBy ? ` - ${group.neededBy}` : ''}</p>
                          </div>
                        );
                      })}
                    </div>

                    <details className="rounded-md border border-gray-200 bg-gray-50">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-gray-800">
                        Quản lý nhóm mục đích
                      </summary>
                      <div className="space-y-3 border-t border-gray-200 p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                          <input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Hạng mục/mục đích: VD cho xe cộ các khu..."
                            className="rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600"
                          />
                          <input
                            value={newGroupNeededBy}
                            onChange={(e) => setNewGroupNeededBy(e.target.value)}
                            placeholder="Thời gian cần"
                            className="rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600"
                          />
                          <button
                            type="button"
                            onClick={addCustomGroup}
                            className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                          >
                            Thêm
                          </button>
                        </div>
                        {groups.map(group => (
                          <div key={group.id} className="rounded-md border border-gray-200 bg-white p-3">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Hạng mục/Mục đích sử dụng</label>
                                <input
                                  value={group.name}
                                  onChange={(e) => updateGroupName(group.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Thời gian cần</label>
                                <input
                                  value={group.neededBy || ''}
                                  onChange={(e) => updateGroupNeededBy(group.id, e.target.value)}
                                  placeholder="VD: càng sớm"
                                  className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600"
                                />
                              </div>
                            </div>
                            <label className="mt-2 block text-xs font-medium text-gray-600">Ghi chú nhóm</label>
                            <input
                              value={group.notes || ''}
                              onChange={(e) => updateGroupNotes(group.id, e.target.value)}
                              placeholder="VD: sửa máng nước khu B"
                              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600"
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {cartItems.length > 0 ? (
                    <ul role="list" className="divide-y divide-gray-100 mt-2">
                      {cartItems.map((item) => (
                        <CartItem
                          key={item.variant.id}
                          item={item}
                          allProducts={allProducts}
                          onRemove={handleRequestRemove}
                          onUpdateItem={onUpdateItem}
                          onUpdateDetails={onUpdateDetails}
                          groups={groups}
                          useGroupWorkflow
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-gray-500 text-sm">
                      Không có vật tư nào. Vui lòng quay lại kho để thêm vật tư.
                    </p>
                  )}
                </div>

                {/* Right side: Form */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 xl:sticky xl:top-4 xl:col-span-2">
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                      Thông tin Phiếu
                    </h2>

                    {error && (
                      <div className="rounded-md bg-red-50 p-3">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="requesterName" className="block text-sm font-medium leading-6 text-gray-900">
                        Tên người yêu cầu
                      </label>
                      <div className="mt-1 space-y-2">
                        {!isManager ? (
                          <input
                            type="text"
                            value={user.name}
                            readOnly
                            className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm bg-gray-50 cursor-not-allowed"
                          />
                        ) : (
                          <>
                            <select
                              value={users.some(u => u.name === requesterName) ? requesterName : 'OTHER'}
                              onChange={(e) => {
                                if (e.target.value !== 'OTHER') {
                                  setRequesterName(e.target.value);
                                  const selectedUser = users.find(u => u.name === e.target.value);
                                  if (selectedUser?.zone) setZone(selectedUser.zone);
                                } else {
                                  setRequesterName('');
                                }
                              }}
                              className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600 sm:text-sm"
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
                                className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600 sm:text-sm"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="zone" className="block text-sm font-medium leading-6 text-gray-900">
                        Khu vực
                      </label>
                      <div className="mt-1">
                        <select
                          id="zone"
                          name="zone"
                          value={zone}
                          onChange={(e) => setZone(e.target.value)}
                          className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-amber-600 sm:text-sm"
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
                      <label htmlFor="purpose" className="block text-sm font-medium leading-6 text-gray-900">
                        Ghi chú chung
                      </label>
                      <div className="mt-1">
                        <textarea
                          rows={3}
                          name="purpose"
                          id="purpose"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-600 sm:text-sm"
                          placeholder="Ghi chú chung nếu cần"
                        ></textarea>
                      </div>
                    </div>

                    {isManager && (
                      <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
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

                    <div className="pt-4 space-y-3">
                      <button
                        type="submit"
                        disabled={cartItems.length === 0}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                      >
                        Gửi Phiếu Yêu cầu
                      </button>
                      <button
                        type="button"
                        onClick={onCancel}
                        className="w-full flex justify-center py-2.5 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

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

export default CreateRequisitionModal;
