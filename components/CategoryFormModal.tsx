import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { processImage, validateImageFile } from '../utils/imageUtils';

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const PhotoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { originalName?: string; data: { name: string; iconFile: File | null; icon: string } }) => void;
  category: Category | null;
  allCategories: Category[];
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, onSubmit, category, allCategories }) => {
    const [name, setName] = useState('');
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string>('');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setName(category.name);
                setIconPreview(category.icon);
                setIconFile(null);
            } else {
                setName('');
                setIconPreview('');
                setIconFile(null);
            }
            setNameError('');
        }
    }, [isOpen, category]);

    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file
            const validation = validateImageFile(file);
            if (!validation.valid) {
                alert(validation.error);
                e.target.value = '';
                return;
            }

            try {
                // Show loading
                const loadingToast = document.createElement('div');
                loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                loadingToast.textContent = 'Đang xử lý ảnh...';
                document.body.appendChild(loadingToast);

                // Process image (including HEIC conversion)
                const base64Image = await processImage(file, 256, 256, 0.9);

                // Remove loading
                document.body.removeChild(loadingToast);

                setIconFile(file);
                setIconPreview(base64Image);
            } catch (error) {
                console.error('Error processing icon:', error);
                alert('Không thể xử lý ảnh. Vui lòng thử file khác.');
                e.target.value = '';
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');

        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError('Tên danh mục không được để trống.');
            return;
        }

        const isEditing = !!category;
        const isNameChanged = isEditing && category.name !== trimmedName;
        const nameExists = allCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());

        if ((!isEditing && nameExists) || (isNameChanged && nameExists)) {
            setNameError('Tên danh mục này đã tồn tại.');
            return;
        }

        if (!isEditing && !iconFile) {
            alert('Vui lòng chọn một icon cho danh mục mới.');
            return;
        }

        onSubmit({
            originalName: category?.name,
            data: {
                name: trimmedName,
                iconFile,
                icon: category?.icon || ''
            }
        });
    };

    if (!isOpen) return null;

    const isEditing = !!category;

    return (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <form onSubmit={handleSubmit} className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                        {isEditing ? 'Sửa Danh mục' : 'Thêm Danh mục Mới'}
                      </h3>
                      <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6"/>
                        <span className="sr-only">Đóng modal</span>
                      </button>
                      <div className="mt-4 space-y-4">
                         <div>
                            <label htmlFor="categoryName" className="block text-sm font-medium leading-6 text-gray-900">Tên danh mục</label>
                            <div className="mt-2">
                              <input
                                type="text"
                                name="categoryName"
                                id="categoryName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6"
                              />
                            </div>
                            {nameError && <p className="mt-2 text-sm text-red-600">{nameError}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Icon</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-md border border-gray-200 flex items-center justify-center bg-gray-50">
                                    {iconPreview ? (
                                        <img src={iconPreview} alt="Xem trước" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <label htmlFor="icon-upload" className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    <span>{isEditing ? 'Thay đổi Icon' : 'Tải lên Icon'}</span>
                                    <input id="icon-upload" name="icon-upload" type="file" className="sr-only" accept="image/svg+xml,image/png,image/jpeg,image/webp,.heic,.heif" onChange={handleIconChange}/>
                                </label>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 sm:ml-3 sm:w-auto"
                  >
                    Lưu
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

export default CategoryFormModal;