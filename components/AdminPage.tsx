import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import ProductFormModal from './ProductFormModal';
import ConfirmationModal from './ConfirmationModal';

interface AdminPageProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (productData: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryName: string) => boolean;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const PhotoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


const LOW_STOCK_THRESHOLD = 10;
type StockFilter = 'all' | 'out-of-stock' | 'low-stock';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const AdminPage: React.FC<AdminPageProps> = ({ products, categories, onAddProduct, onUpdateProduct, onDeleteProduct, onAddCategory, onDeleteCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [categoryDeleteError, setCategoryDeleteError] = useState<string>('');
  
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIconFile(file);
          setIconPreview(URL.createObjectURL(file));
      }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    handleCloseModal();
  };
  
  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
    }
    setProductToDelete(null);
  };

  const handleCloseCategoryDeleteModal = () => {
    setCategoryToDelete(null);
    setCategoryDeleteError('');
  };

  const handleConfirmCategoryDelete = () => {
    if (categoryToDelete) {
        const success = onDeleteCategory(categoryToDelete.name);
        if (success) {
            handleCloseCategoryDeleteModal();
        } else {
            setCategoryDeleteError(`Không thể xóa "${categoryToDelete.name}" vì nó đang được sử dụng bởi một hoặc nhiều vật tư.`);
        }
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !iconFile) {
        alert("Vui lòng nhập tên danh mục và chọn một icon.");
        return;
    }
    try {
        const iconBase64 = await toBase64(iconFile);
        onAddCategory({ name: newCategoryName, icon: iconBase64 });
        setNewCategoryName('');
        setIconFile(null);
        setIconPreview('');
        // Reset the file input visually
        const fileInput = document.getElementById('icon-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    } catch (error) {
        console.error("Lỗi chuyển đổi icon sang Base64:", error);
        alert("Đã xảy ra lỗi khi tải lên icon. Vui lòng thử lại.");
    }
  };

  const filteredProducts = useMemo(() => {
    let tempProducts = [...products];

    // Lọc theo trạng thái tồn kho
    switch (stockFilter) {
      case 'out-of-stock':
        tempProducts = tempProducts.filter(p => p.stock === 0);
        break;
      case 'low-stock':
        tempProducts = tempProducts.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD);
        break;
    }

    // Lọc theo danh mục
    if (categoryFilter !== 'all') {
      tempProducts = tempProducts.filter(p => p.category === categoryFilter);
    }

    return tempProducts;
  }, [products, stockFilter, categoryFilter]);

  const filterOptions: { key: StockFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'low-stock', label: `Tồn kho thấp (< ${LOW_STOCK_THRESHOLD})` },
    { key: 'out-of-stock', label: 'Hết hàng' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý Vật tư</h1>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="w-5 h-5"/>
          Thêm Vật tư Mới
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Quản lý Danh mục</h2>
          <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row gap-2 mb-3 items-center">
              <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Tên danh mục mới"
                  className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
              />
               <label htmlFor="icon-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  <PhotoIcon className="w-5 h-5 mr-2 text-gray-500" />
                  {iconFile ? 'Đổi Icon' : 'Chọn Icon'}
              </label>
              <input id="icon-upload" name="icon-upload" type="file" className="sr-only" accept="image/*" onChange={handleIconChange}/>
              
              {iconPreview && <img src={iconPreview} alt="Xem trước icon" className="w-10 h-10 rounded-md object-cover border"/>}

              <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              >
                  Thêm Danh mục
              </button>
          </form>
          <div className="border-t pt-3">
              <span className="text-sm font-medium text-gray-600">Danh mục hiện có:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map(cat => (
                      <div key={cat.name} className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full bg-gray-100 text-gray-800">
                          <img src={cat.icon} alt={cat.name} className="w-4 h-4" />
                          <span className="text-xs font-medium">{cat.name}</span>
                          <button 
                            onClick={() => setCategoryToDelete(cat)}
                            className="flex items-center justify-center w-4 h-4 text-gray-500 rounded-full hover:bg-red-200 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Xóa danh mục ${cat.name}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2.22 2.22a.75.75 0 0 1 1.06 0L8 6.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L9.06 8l4.72 4.72a.75.75 0 1 1-1.06 1.06L8 9.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L6.94 8 2.22 3.28a.75.75 0 0 1 0-1.06Z" /></svg>
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 whitespace-nowrap">Lọc tồn kho:</span>
                <div className="flex flex-wrap items-center gap-2">
                    {filterOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => setStockFilter(option.key)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                stockFilter === option.key
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="admin-category-filter" className="text-sm font-medium text-gray-800 whitespace-nowrap">Lọc danh mục:</label>
                <select
                    id="admin-category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="all">Tất cả</option>
                    {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>


      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vật tư</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-md object-cover" src={product.images[0]} alt={product.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenEditModal(product)} className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                      <button onClick={() => setProductToDelete(product)} className="text-red-600 hover:text-red-900">Xóa</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        Không có vật tư nào phù hợp với bộ lọc đã chọn.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        categories={categories}
      />
      
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận Xóa Vật tư"
        message={`Bạn có chắc chắn muốn xóa vật tư "${productToDelete?.name}" không? Hành động này không thể hoàn tác.`}
      />

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={handleCloseCategoryDeleteModal}
        onConfirm={handleConfirmCategoryDelete}
        title="Xác nhận Xóa Danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        confirmButtonText="Xác nhận Xóa"
        error={categoryDeleteError}
      />
    </div>
  );
};

export default AdminPage;