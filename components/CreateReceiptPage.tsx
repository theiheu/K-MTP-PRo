
import React, { useState, useMemo } from 'react';
import { User, Product, ReceiptItem, Variant, Category, GoodsReceiptNote } from '../types';
import SearchBar from './SearchBar';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import ImageGalleryModal from './ImageGalleryModal';
import ProductFormModal from './ProductFormModal';
import { calculateVariantStock } from '../utils/stockCalculator';

interface CreateReceiptPageProps {
    user: User;
    products: Product[];
    categories: Category[];
    onSubmit: (data: Omit<GoodsReceiptNote, 'id' | 'createdAt' | 'createdBy' | 'linkedRequisitionIds'>) => void;
    onCancel: () => void;
    onAddProduct: (productData: Omit<Product, 'id'>) => void;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


const CreateReceiptPage: React.FC<CreateReceiptPageProps> = ({ user, products, categories, onSubmit, onCancel, onAddProduct }) => {
    const [supplier, setSupplier] = useState('');
    const [notes, setNotes] = useState('');
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    
    const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
    
    // State for image gallery
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);

    const handleToggleExpand = (productId: number) => {
        setExpandedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleOpenGallery = (images: string[], startIndex: number) => {
        if (images && images.length > 0) {
            setGalleryImages(images);
            setGalleryStartIndex(startIndex);
            setIsGalleryOpen(true);
        }
    };

    const allUniqueCategories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.category)))], [products]);

    const filteredProducts = useMemo(() => {
        return products
            .map(p => ({
                ...p,
                totalStock: p.variants.reduce((sum, v) => sum + calculateVariantStock(v, products), 0)
            }))
            .filter(p => {
                const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
                const matchesSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
            })
            .sort((a, b) => {
                if (a.totalStock === 0 && b.totalStock > 0) {
                    return -1;
                }
                if (a.totalStock > 0 && b.totalStock === 0) {
                    return 1;
                }
                return a.name.localeCompare(b.name);
            });
    }, [products, categoryFilter, searchTerm]);
    
    const itemsToReceive = useMemo(() => {
        const items: (ReceiptItem & { productName: string; variantAttributes: {[key: string]: string}; unit?: string })[] = [];
        for (const variantIdStr in quantities) {
            const variantId = parseInt(variantIdStr, 10);
            const quantity = quantities[variantId];
            if (quantity > 0) {
                for (const product of products) {
                    const variant = product.variants.find(v => v.id === variantId);
                    if (variant) {
                        items.push({
                            productId: product.id,
                            variantId: variant.id,
                            quantity: quantity,
                            productName: product.name,
                            variantAttributes: variant.attributes,
                            unit: variant.unit
                        });
                        break;
                    }
                }
            }
        }
        return items;
    }, [quantities, products]);

    const handleQuantityChange = (variantId: number, value: string) => {
        const quantity = parseInt(value, 10);
        setQuantities(prev => ({
            ...prev,
            [variantId]: isNaN(quantity) || quantity < 0 ? 0 : quantity
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (itemsToReceive.length === 0) {
            alert("Vui lòng thêm ít nhất một vật tư vào phiếu nhập.");
            return;
        }
        if (!supplier.trim()) {
            alert("Vui lòng nhập tên nhà cung cấp.");
            return;
        }
        
        const finalItems: ReceiptItem[] = itemsToReceive.map(({ productId, variantId, quantity }) => ({
            productId, variantId, quantity
        }));

        onSubmit({ supplier, notes, items: finalItems });
    };

    const handleProductFormSubmit = (productData: Omit<Product, 'id'> | Product) => {
      if (!('id' in productData)) {
        onAddProduct(productData);
      }
      setIsProductFormModalOpen(false);
    };

    return (
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6">Tạo Phiếu Nhập Kho</h1>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Cột trái: Danh sách vật tư */}
            <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Chọn Vật tư để Nhập</h2>
              
              {/* Bộ lọc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Tìm kiếm vật tư..." />
                  <div>
                      <label htmlFor="receipt-category-filter" className="sr-only">Lọc danh mục</label>
                      <select
                          id="receipt-category-filter"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm h-full"
                      >
                         <option value="all">Tất cả Danh mục</option>
                         {allUniqueCategories.map((cat) => cat !== 'all' && <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                  </div>
              </div>
              
              <div className="text-center border-t pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsProductFormModalOpen(true)}
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-800"
                >
                  Vật tư không có trong danh sách? Thêm mới tại đây.
                </button>
              </div>

              {/* Danh sách vật tư */}
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {filteredProducts.length > 0 ? filteredProducts.map(product => {
                    const isExpanded = expandedProductIds.has(product.id);
                    return (
                        <div key={product.id} className="border rounded-lg">
                            <div 
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => handleToggleExpand(product.id)}
                                role="button"
                                aria-expanded={isExpanded}
                                aria-controls={`variants-${product.id}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-md flex-shrink-0 cursor-pointer overflow-hidden group"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Ngăn việc mở/đóng khi nhấp vào ảnh
                                            handleOpenGallery(product.images, 0);
                                        }}
                                    >
                                        <ImageWithPlaceholder
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-800">{product.name}</h3>
                                        <p className={`text-xs ${product.totalStock > 0 ? 'text-gray-500' : 'text-red-600 font-semibold'}`}>
                                            Tổng tồn kho: {product.totalStock}
                                        </p>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
    
                            {isExpanded && (
                                <div id={`variants-${product.id}`} className="border-t border-gray-200">
                                    <div className="pl-3 pr-3 pb-3 sm:pl-[60px] sm:pr-3 sm:pb-3">
                                        <table className="w-full text-sm text-left mt-2">
                                            <thead className="text-xs text-gray-600 bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-1 font-medium">Biến thể</th>
                                                    <th className="px-2 py-1 font-medium text-right">Số lượng nhập</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            {product.variants.map(variant => (
                                                <tr key={variant.id} className="border-t">
                                                    <td className="px-2 py-2">
                                                        <p className="text-gray-700">{Object.values(variant.attributes).join(' / ') || 'Mặc định'}</p>
                                                        <p className="text-xs text-gray-500">Tồn kho: {variant.stock}</p>
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            value={quantities[variant.id] || ''}
                                                            onClick={(e) => e.stopPropagation()} // Ngăn việc đóng lại khi nhấp vào input
                                                            onChange={e => handleQuantityChange(variant.id, e.target.value)}
                                                            placeholder="0"
                                                            min="0"
                                                            className="w-24 text-center rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm p-1.5"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                    <p className="text-center text-gray-500 py-8">Không có vật tư nào phù hợp với bộ lọc.</p>
                )}
              </div>
            </div>
    
            {/* Cột phải: Chi tiết phiếu & Tóm tắt */}
            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md sticky top-24 space-y-6">
                 <div>
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">Thông tin Phiếu</h2>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="supplier" className="block text-sm font-medium leading-6 text-gray-900">Nhà cung cấp</label>
                            <input type="text" id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 sm:text-sm"/>
                        </div>
                        <div>
                             <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">Ghi chú</label>
                             <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 sm:text-sm"></textarea>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
                        Vật tư sẽ được nhập ({itemsToReceive.length})
                    </h2>
                    {itemsToReceive.length > 0 ? (
                        <div className="flow-root mt-4 max-h-60 overflow-y-auto pr-2">
                            <ul role="list" className="-my-2 divide-y divide-gray-200">
                                {itemsToReceive.map(item => (
                                    <li key={item.variantId} className="flex items-center py-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                            <p className="text-xs text-gray-500 truncate">{Object.values(item.variantAttributes).join(' / ') || 'Mặc định'}</p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 text-sm">
                                            <span className="font-semibold">{item.quantity}</span> {item.unit}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="mt-4 text-gray-500 text-center py-4">Nhập số lượng ở bảng bên trái để thêm vật tư.</p>
                    )}
                </div>

                 <div className="border-t pt-6 space-y-3">
                   <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Xác nhận Nhập kho
                  </button>
                  <button type="button" onClick={onCancel} className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Hủy
                  </button>
                </div>
            </div>
          </form>

          <ImageGalleryModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            images={galleryImages}
            startIndex={galleryStartIndex}
          />
          <ProductFormModal
            isOpen={isProductFormModalOpen}
            onClose={() => setIsProductFormModalOpen(false)}
            onSubmit={handleProductFormSubmit}
            product={null}
            allProducts={products}
            categories={categories}
          />
        </div>
      );
};

export default CreateReceiptPage;
