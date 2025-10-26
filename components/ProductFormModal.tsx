import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Variant } from '../types';

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
const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
const ArrowUpTrayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);


const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// Helper function to generate combinations
const generateCombinations = (options: { name: string; values: string[] }[]): { [key: string]: string }[] => {
    if (options.length === 0) return [{}];
    const combinations: { [key: string]: string }[] = [];
    const firstOption = options[0];
    const remainingOptions = options.slice(1);
    const remainingCombinations = generateCombinations(remainingOptions);

    for (const value of firstOption.values) {
        for (const combo of remainingCombinations) {
            combinations.push({ [firstOption.name]: value, ...combo });
        }
    }
    return combinations;
};


const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, product, categories }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [generalImages, setGeneralImages] = useState<string[]>([]);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageTarget, setImageTarget] = useState<{ type: 'general' | 'variant'; index?: number }>({ type: 'general' });


  useEffect(() => {
    if (isOpen) {
        if (product) {
            setName(product.name);
            setDescription(product.description);
            setCategory(product.category);
            setGeneralImages(product.images);
            
            const productOptions = product.options.map(optName => {
                const values = [...new Set(product.variants.map(v => v.attributes[optName]).filter(Boolean))];
                return { name: optName, values };
            });
            setOptions(productOptions);
            setVariants(product.variants.map(v => ({...v})));
        } else {
            // Reset state for new product
            setName('');
            setDescription('');
            setCategory(categories[0]?.name || '');
            setGeneralImages([]);
            setOptions([]);
            setVariants([{ id: Date.now(), attributes: {}, stock: 0, price: 0, images: [] }]);
        }
    } else {
        setShowCamera(false);
    }
  }, [isOpen, product, categories]);

  useEffect(() => {
    if (!isOpen) return;

    const validOptions = options.filter(opt => opt.name.trim() !== '' && opt.values.length > 0 && opt.values.some(v => v.trim() !== ''));
    
    if (validOptions.length === 0) {
        if (variants.length === 0 || Object.keys(variants[0].attributes).length > 0 || variants.length > 1) {
            const defaultVariant = variants.find(v => Object.keys(v.attributes).length === 0) || { id: Date.now(), attributes: {}, stock: 0, price: 0, images: [] };
            setVariants([defaultVariant]);
        }
        return;
    }
    
    const optionsForCombinations = validOptions.map(opt => ({
      ...opt,
      values: opt.values.filter(Boolean)
    }));

    const combinations = generateCombinations(optionsForCombinations);
    const newVariants = combinations.map((combo, index) => {
        const existingVariant = variants.find(v => {
          const keys = Object.keys(combo);
          if (Object.keys(v.attributes).length !== keys.length) return false;
          return keys.every(key => v.attributes[key] === combo[key]);
        });
        return {
            id: existingVariant?.id || Date.now() + index,
            attributes: combo,
            stock: existingVariant?.stock || 0,
            price: existingVariant?.price || 0,
            images: existingVariant?.images || []
        };
    });
    setVariants(newVariants);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, isOpen]);
  
  // Camera handling...
  useEffect(() => {
    const startCamera = async () => {
        if (showCamera && videoRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            } catch (err) {
                console.error("Lỗi khi truy cập camera: ", err);
                setShowCamera(false);
            }
        }
    };
    startCamera();
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };
  }, [showCamera]);


  const handleOptionNameChange = (index: number, newName: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].name = newName;
    setOptions(updatedOptions);
  };
  
  const handleOptionValuesChange = (index: number, valuesStr: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].values = valuesStr.split(',').map(v => v.trim());
    setOptions(updatedOptions);
  };

  const addOption = () => setOptions([...options, { name: '', values: [] }]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleVariantChange = (index: number, field: 'stock' | 'price', value: string) => {
    setVariants(prevVariants =>
      prevVariants.map((variant, i) =>
        i === index
          ? { ...variant, [field]: Number(value) || 0 }
          : variant
      )
    );
  };
  
  const openCamera = (type: 'general' | 'variant', index?: number) => {
      setImageTarget({ type, index });
      setShowCamera(true);
  }

  const handleCapture = () => {
    const video = videoRef.current;
    if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        if (imageTarget.type === 'general') {
            setGeneralImages(prev => [...prev, dataUrl]);
        } else if (imageTarget.type === 'variant' && typeof imageTarget.index === 'number') {
            setVariants(prevVariants =>
                prevVariants.map((variant, i) =>
                    i === imageTarget.index
                        ? { ...variant, images: [...(variant.images || []), dataUrl] }
                        : variant
                )
            );
        }
        setShowCamera(false);
    }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
        const base64Promises = [...files].map(file => toBase64(file));
        const base64Images = await Promise.all(base64Promises);

        if (imageTarget.type === 'general') {
            setGeneralImages(prev => [...prev, ...base64Images]);
        } else if (imageTarget.type === 'variant' && typeof imageTarget.index === 'number') {
           setVariants(prevVariants =>
                prevVariants.map((variant, i) =>
                    i === imageTarget.index
                        ? { ...variant, images: [...(variant.images || []), ...base64Images] }
                        : variant
                )
            );
        }
    } catch (error) {
        console.error("Lỗi chuyển đổi ảnh sang base64", error);
        alert("Có lỗi xảy ra khi tải ảnh lên.")
    }

    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = (type: 'general' | 'variant', index?: number) => {
      setImageTarget({ type, index });
      fileInputRef.current?.click();
  };

  const handleImageDelete = (type: 'general' | 'variant', imageIndex: number, variantIndex?: number) => {
    if (type === 'general') {
        setGeneralImages(prev => prev.filter((_, i) => i !== imageIndex));
    } else if (type === 'variant' && typeof variantIndex === 'number') {
        setVariants(prevVariants =>
            prevVariants.map((variant, i) =>
                i === variantIndex
                    ? { ...variant, images: (variant.images || []).filter((_, imgIdx) => imgIdx !== imageIndex) }
                    : variant
            )
        );
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (generalImages.length === 0) {
        alert("Vui lòng thêm ít nhất một hình ảnh chung.");
        return;
    }
    const finalData = {
        name,
        description,
        category,
        images: generalImages,
        options: options.map(opt => opt.name).filter(Boolean),
        variants,
    };
    const submissionData = product ? { ...finalData, id: product.id } : finalData;
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <>
    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple style={{ display: 'none' }} />
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <form onSubmit={handleSubmit} className="relative flex flex-col transform overflow-hidden rounded-t-lg sm:rounded-lg bg-white text-left shadow-xl transition-all w-full h-screen sm:h-auto sm:max-h-[90vh] sm:my-8 sm:w-full sm:max-w-4xl">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-grow overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                        {product ? 'Sửa Vật tư' : 'Thêm Vật tư Mới'}
                    </h3>
                    <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                {/* Form Content */}
                <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên vật tư</label>
                        <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                    </div>
                     <div className="sm:col-span-2">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                        <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
                            {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                        <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
                    </div>
                    
                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh chung</label>
                        <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-md">
                            <div className="flex flex-wrap gap-4">
                                {generalImages.map((image, index) => (
                                    <div key={index} className="relative group flex-shrink-0">
                                        <img src={image} alt={`General image ${index + 1}`} className="h-24 w-24 rounded-md object-cover" />
                                        <button type="button" onClick={() => handleImageDelete('general', index)} className="absolute top-0 right-0 -m-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button type="button" onClick={() => openCamera('general')} className="h-24 w-24 flex flex-col items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 text-gray-500">
                                        <CameraIcon className="w-8 h-8" />
                                        <span className="text-xs mt-1">Chụp ảnh</span>
                                    </button>
                                    <button type="button" onClick={() => triggerFileUpload('general')} className="h-24 w-24 flex flex-col items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 text-gray-500">
                                        <ArrowUpTrayIcon className="w-8 h-8"/>
                                        <span className="text-xs mt-1">Tải ảnh lên</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-6 space-y-4 rounded-md border border-gray-300 p-4">
                        <h4 className="text-base font-medium text-gray-800">Tùy chọn & Biến thể</h4>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                <input
                                    type="text"
                                    placeholder="Tên tùy chọn (vd: Màu sắc)"
                                    value={option.name}
                                    onChange={(e) => handleOptionNameChange(index, e.target.value)}
                                    className="block w-1/3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Giá trị, cách nhau bằng dấu phẩy (vd: Đen, Trắng)"
                                    value={option.values.join(', ')}
                                    onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                                    className="block w-2/3 rounded-md border-gray-300 shadow-sm sm:text-sm"
                                />
                                <button type="button" onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className="w-full text-sm font-medium text-yellow-600 rounded-md ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50 py-2">+ Thêm Tùy chọn</button>
                    </div>

                    <div className="sm:col-span-6">
                      <h4 className="text-base font-medium text-gray-800">Chi tiết Biến thể</h4>
                       <div className="mt-2 overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200 text-sm">
                               <thead className="bg-gray-50">
                                   <tr>
                                       <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Biến thể</th>
                                       <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                                       <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                                       <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ảnh riêng</th>
                                   </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-gray-200">
                                   {variants.map((variant, index) => (
                                       <tr key={variant.id}>
                                           <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-800">
                                               {Object.values(variant.attributes).join(' / ') || 'Mặc định'}
                                           </td>
                                           <td className="px-2 py-2">
                                               <input type="number" value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="w-20 rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                           </td>
                                           <td className="px-2 py-2">
                                                <input type="number" value={variant.price || ''} onChange={e => handleVariantChange(index, 'price', e.target.value)} className="w-24 rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                           </td>
                                           <td className="px-2 py-2">
                                               <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => openCamera('variant', index)} title="Chụp ảnh" className="text-gray-500 p-1 hover:bg-gray-100 rounded-full"><CameraIcon className="w-5 h-5"/></button>
                                                    <button type="button" onClick={() => triggerFileUpload('variant', index)} title="Tải ảnh lên" className="text-gray-500 p-1 hover:bg-gray-100 rounded-full"><ArrowUpTrayIcon className="w-5 h-5"/></button>
                                                </div>
                                                <div className="flex gap-1 mt-1 flex-wrap w-24">
                                                    {variant.images?.map((img, imgIdx) => (
                                                        <div key={imgIdx} className="relative group">
                                                            <img src={img} alt={`Variant ${index} img ${imgIdx}`} className="w-8 h-8 rounded object-cover"/>
                                                            <button type="button" onClick={() => handleImageDelete('variant', imgIdx, index)} className="absolute top-0 right-0 -m-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <XMarkIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                    </div>
                </div>
              </div>
              {/* Footer */}
               <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 flex-shrink-0 border-t">
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
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col items-center justify-center p-4">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-lg rounded-lg mb-4 h-auto max-h-[70vh]"></video>
            <div className="flex gap-4">
                <button type="button" onClick={handleCapture} className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-lg">Chụp</button>
                <button type="button" onClick={() => setShowCamera(false)} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-lg">Hủy</button>
            </div>
        </div>
      )}
      </>
  );
};

export default ProductFormModal;