import React, { useState, useMemo } from 'react';
import { Product, Variant, CartItem } from '../types';
import SearchBar from './SearchBar';
import ImageWithPlaceholder from './ImageWithPlaceholder';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  onAddItem: (item: CartItem) => void;
  existingVariantIds: number[];
  variantToReplaceId?: number | null;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  allProducts,
  onAddItem,
  existingVariantIds,
  variantToReplaceId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allProducts]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    // Reset variant and quantity when a new product is selected
    setSelectedVariant(product.variants.length === 1 ? product.variants[0] : null);
    setQuantity(1);
  };

  const handleAddItem = () => {
    if (selectedProduct && selectedVariant && quantity > 0) {
      if (!variantToReplaceId && existingVariantIds.includes(selectedVariant.id)) {
        alert('Vật tư này đã có trong phiếu. Vui lòng cập nhật số lượng trực tiếp.');
        return;
      }
      onAddItem({
        product: selectedProduct,
        variant: selectedVariant,
        quantity,
      });
      resetStateAndClose();
    }
  };

  const resetStateAndClose = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{variantToReplaceId ? 'Thay thế Vật tư' : 'Thêm Vật tư vào Phiếu'}</h2>
          <button onClick={resetStateAndClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Left: Product List */}
          <div className="w-1/3 border-r overflow-y-auto p-2">
            <div className="p-2">
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
            <ul>
              {filteredProducts.map(product => (
                <li key={product.id} onClick={() => handleSelectProduct(product)} className={`p-3 cursor-pointer rounded-md hover:bg-gray-100 ${selectedProduct?.id === product.id ? 'bg-yellow-100' : ''}`}>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Variant Selection */}
          <div className="w-2/3 overflow-y-auto p-6">
            {!selectedProduct ? (
              <div className="text-center text-gray-500 pt-10">Vui lòng chọn một vật tư từ danh sách bên trái.</div>
            ) : (
              <div>
                <div className="flex items-start gap-4">
                    <ImageWithPlaceholder src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-24 h-24 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-bold">{selectedProduct.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                    </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold">Chọn loại (biến thể):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {selectedProduct.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={existingVariantIds.includes(variant.id) && variant.id !== variantToReplaceId}
                        className={`p-3 border rounded-md text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedVariant?.id === variant.id
                            ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500'
                            : 'border-gray-300 hover:border-yellow-400'
                        }`}>
                        <p className="font-medium">{Object.values(variant.attributes).join(' / ')}</p>
                        <p className="text-xs text-gray-500 mt-1">Tồn kho: {variant.stock} {variant.unit}</p>
                        {existingVariantIds.includes(variant.id) && <p className='text-xs text-red-500 mt-1'>Đã có trong phiếu</p>}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedVariant && (
                    <div className="mt-6 pt-6 border-t">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Số lượng:</label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                min="1"
                            />
                            <span className="text-sm text-gray-600">{selectedVariant.unit}</span>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button onClick={resetStateAndClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
          <button
            onClick={handleAddItem}
            disabled={!selectedVariant || quantity <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
          >
            Thêm vào Phiếu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;

