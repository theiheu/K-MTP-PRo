import React, { useState } from "react";
import { CartItem as CartItemType, Product } from "../types";
import CartItem from "./CartItem";
import ConfirmationModal from "./ConfirmationModal";
import ImageGalleryModal from "./ImageGalleryModal";

interface CartProps {
  cartItems: CartItemType[];
  allProducts: Product[];
  onRemove: (variantId: number) => void;
  onUpdateItem: (
    variantId: number,
    quantity: number,
    oldVariantId?: number
  ) => void;
  onCreateRequisition: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  allProducts,
  onRemove,
  onUpdateItem,
  onCreateRequisition,
}) => {
  const [itemToRemove, setItemToRemove] = useState<CartItemType | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleRequestRemove = (variantId: number) => {
    const item = cartItems.find((i) => i.variant.id === variantId);
    if (item) {
      setItemToRemove(item);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      onRemove(itemToRemove.variant.id);
    }
    setItemToRemove(null);
  };

  const handleImageClick = (images: string[], startIndex: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Phiếu Yêu Cầu Tạm Thời
            </h2>
          </div>

          <div className="flow-root">
            {cartItems.length > 0 ? (
              <ul role="list" className="-my-6 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.variant.id}
                    item={item}
                    onRemove={handleRequestRemove}
                    onUpdateItem={onUpdateItem}
                    allProducts={allProducts}
                    onImageClick={handleImageClick}
                  />
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có vật tư nào trong phiếu.</p>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="mt-8">
              <button
                onClick={onCreateRequisition}
                className="w-full flex items-center justify-center rounded-md border border-transparent bg-yellow-500 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-yellow-600"
              >
                Tạo Phiếu Yêu cầu
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa Vật tư khỏi Phiếu"
        message={`Bạn có chắc chắn muốn xóa "${itemToRemove?.product.name}" khỏi phiếu yêu cầu tạm thời không?`}
        confirmButtonText="Xóa"
        confirmButtonClass="bg-red-600 hover:bg-red-500"
      />

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages}
        startIndex={galleryStartIndex}
      />
    </>
  );
};

export default Cart;
