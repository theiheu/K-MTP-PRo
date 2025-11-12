import React, { useState, useEffect } from 'react';
import { User, CartItem as CartItemType, Product, RequisitionForm } from '../types';
import CartItem from './CartItem';
import ConfirmationModal from './ConfirmationModal';
import AddItemModal from './AddItemModal';
import { productsService } from '../services/supabaseService'; // To add new items

interface EditRequisitionPageProps {
  user: User;
  requisition: RequisitionForm;
  allProducts: Product[];
  onSubmit: (updatedRequisition: RequisitionForm) => void;
  onCancel: () => void;
}

const EditRequisitionPage: React.FC<EditRequisitionPageProps> = ({
  user,
  requisition,
  allProducts,
  onSubmit,
  onCancel,
}) => {
  const [requesterName, setRequesterName] = useState(requisition.requesterName);
  const [zone, setZone] = useState(requisition.zone);
  const [purpose, setPurpose] = useState(requisition.purpose);
  // Admin can edit the creation date
  const [createdAt, setCreatedAt] = useState(new Date(requisition.createdAt).toISOString().slice(0, 16));
  const [currentItems, setCurrentItems] = useState<CartItemType[]>(requisition.items);
  const [itemToRemove, setItemToRemove] = useState<CartItemType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [variantToReplaceId, setVariantToReplaceId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentItems(requisition.items);
  }, [requisition.items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requesterName.trim()) {
      setError('Vui lòng điền tên người yêu cầu');
      return;
    }
    if (!purpose.trim()) {
      setError('Vui lòng điền Mục đích');
      return;
    }
    if (currentItems.length === 0) {
      setError('Phiếu yêu cầu không thể trống');
      return;
    }

    const updatedRequisition: RequisitionForm = {
      ...requisition,
      requesterName,
      zone,
      purpose,
      createdAt: new Date(createdAt).toISOString(),
      items: currentItems,
    };

    onSubmit(updatedRequisition);
  };

  const handleRequestRemove = (variantId: number) => {
    const item = currentItems.find((i) => i.variant.id === variantId);
    if (item) {
      setItemToRemove(item);
    }
  };

  const handleUpdateItem = (variantId: number, quantity: number) => {
    setCurrentItems(currentItems.map(item =>
      item.variant.id === variantId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (variantId: number) => {
    setCurrentItems(currentItems.filter(item => item.variant.id !== variantId));
  };

  const handleRequestReplace = (variantId: number) => {
    setVariantToReplaceId(variantId);
    setIsAddItemModalOpen(true);
  };

  const handleAddNewItem = (newItem: CartItemType) => {
    if (variantToReplaceId) {
      // Replace item logic
      setCurrentItems(prevItems =>
        prevItems.map(item =>
          item.variant.id === variantToReplaceId ? newItem : item
        )
      );
      setVariantToReplaceId(null);
    } else {
      // Add new item logic
      setCurrentItems(prevItems => [...prevItems, newItem]);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      handleRemoveItem(itemToRemove.variant.id);
    }
    setItemToRemove(null);
  };

  const isManager = user.role === 'manager';
  const totalItems = currentItems.reduce((acc, item) => acc + item.quantity, 0);

  // TODO: Implement logic to add new products/variants to the list

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6">
        Chỉnh sửa Phiếu Yêu Cầu
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left side: Item List */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
            Vật tư Yêu cầu ({totalItems})
          </h2>
          {currentItems.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200 mt-4 max-h-[60vh] overflow-y-auto">
              {currentItems.map((item) => (
                <CartItem
                  key={item.variant.id}
                  item={item}
                  allProducts={allProducts}
                  onRemove={handleRequestRemove}
                  onUpdateItem={handleUpdateItem}
                  onReplace={handleRequestReplace}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-gray-500">Không có vật tư nào trong phiếu.</p>
          )}
          {isManager && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(true)}
                className="w-full flex justify-center items-center py-2 px-4 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Thêm Vật tư
              </button>
            </div>
          )}
        </div>

        {/* Right side: Form */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md sticky top-24">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">Thông tin Phiếu</h2>

            {isManager && (
                 <div>
                 <label htmlFor="createdAt" className="block text-sm font-medium leading-6 text-gray-900">
                   Ngày tạo phiếu
                 </label>
                 <div className="mt-2">
                   <input
                     type="datetime-local"
                     name="createdAt"
                     id="createdAt"
                     value={createdAt}
                     onChange={(e) => setCreatedAt(e.target.value)}
                     className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6"
                   />
                 </div>
               </div>
            )}

            <div>
              <label htmlFor="requesterName" className="block text-sm font-medium leading-6 text-gray-900">
                Tên người yêu cầu
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="requesterName"
                  id="requesterName"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  readOnly={!isManager}
                  className={`block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 ${
                    !isManager ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="zone" className="block text-sm font-medium leading-6 text-gray-900">
                Khu vực
              </label>
              <div className="mt-2">
                <select
                  id="zone"
                  name="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  disabled={!isManager}
                  className={`block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 ${
                    !isManager ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  {window.zones?.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium leading-6 text-gray-900">
                Mục đích
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="purpose"
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  readOnly={!isManager}
                  className={`block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6 ${
                    !isManager ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                ></textarea>
              </div>
            </div>

            <div className="border-t pt-6 space-y-3">
              <button
                type="submit"
                disabled={currentItems.length === 0 || !isManager}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Lưu Thay Đổi
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Hủy
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

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => { setIsAddItemModalOpen(false); setVariantToReplaceId(null); }}
        allProducts={allProducts}
        onAddItem={handleAddNewItem}
        existingVariantIds={currentItems.map(item => item.variant.id)}
        variantToReplaceId={variantToReplaceId}
      />
    </div>
  );
};

export default EditRequisitionPage;

