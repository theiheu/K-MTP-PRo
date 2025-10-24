import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'> | Product) => void;
  product: Product | null;
  categories: Category[];
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, product, categories }) => {
  const getEmptyProduct = (): Omit<Product, 'id'> => ({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    images: [],
    category: categories[0]?.name || '', // Mặc định là danh mục có sẵn đầu tiên
  });

  const [formData, setFormData] = useState(getEmptyProduct());
  const [imageText, setImageText] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData(product);
        setImageText(product.images.join('\n'));
      } else {
        setFormData(getEmptyProduct());
        setImageText('');
      }
    }
  }, [isOpen, product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    if (type === 'number') {
        processedValue = value === '' ? '' : parseFloat(value);
        if (isNaN(processedValue as number)) processedValue = 0;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setImageText(e.target.value);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const images = imageText.split('\n').map(url => url.trim()).filter(url => url);
    if (images.length === 0) {
        alert("Vui lòng cung cấp ít nhất một URL hình ảnh.");
        return;
    }
    const finalData = { ...formData, images };
    onSubmit(finalData);
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <form onSubmit={handleSubmit} className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="w-full">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                        {product ? 'Sửa Vật tư' : 'Thêm Vật tư Mới'}
                    </h3>
                    <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên vật tư</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá (tùy chọn)</label>
                        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                     </div>
                  </div>
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
                    <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                   <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">URL Hình ảnh</label>
                    <textarea name="images" id="images" value={imageText} onChange={handleImageChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Mỗi URL trên một dòng" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
              >
                Lưu Thay đổi
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

export default ProductFormModal;