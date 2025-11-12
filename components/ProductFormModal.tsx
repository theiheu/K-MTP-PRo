import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product, Category, Variant, ChildComponent } from '../types';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { calculateVariantStock } from '../utils/stockCalculator';
import { processImage, validateImageFile } from '../utils/imageUtils';

// --- Icon Components ---
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
const DocumentDuplicateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

// --- Child Components ---

const ComponentEditor: React.FC<{
    components: ChildComponent[];
    currentVariantId: number;
    productVariants: Variant[];
    allProducts: Product[];
    onChange: (components: ChildComponent[]) => void;
    onClose: () => void;
}> = ({ components, currentVariantId, productVariants, allProducts, onChange, onClose }) => {
    const [localComponents, setLocalComponents] = useState<ChildComponent[]>(() => JSON.parse(JSON.stringify(components || [])));
    const [showPreview, setShowPreview] = useState(false);

    const availableVariants = productVariants.filter(v => v.id !== currentVariantId && (!v.components || v.components.length === 0));

    const handleAddComponent = () => {
        setLocalComponents(prev => [...prev, { variantId: 0, quantity: 1 }]);
    };

    const handleRemoveComponent = (index: number) => {
        setLocalComponents(prev => prev.filter((_, i) => i !== index));
    };

    const handleComponentChange = (index: number, field: keyof ChildComponent, value: string | number) => {
        const newComps = [...localComponents];
        const component = { ...newComps[index] };

        if (field === 'variantId') {
            component.variantId = Number(value);
        } else if (field === 'quantity') {
            component.quantity = Math.max(1, Number(value) || 1);
        }

        newComps[index] = component;
        setLocalComponents(newComps);
    };

    const handleSave = () => {
        const validComponents = localComponents.filter(c => c.variantId && c.quantity > 0);

        // Kiểm tra duplicate
        const variantIds = validComponents.map(c => c.variantId);
        const hasDuplicates = variantIds.length !== new Set(variantIds).size;

        if (hasDuplicates) {
            alert('Không thể thêm cùng một biến thể nhiều lần!');
            return;
        }

        onChange(validComponents);
        onClose();
    };

    // Tính toán preview tồn kho
    const previewStock = useMemo(() => {
        if (localComponents.length === 0) return null;

        const validComps = localComponents.filter(c => c.variantId > 0);
        if (validComps.length === 0) return null;

        const minStock = Math.min(...validComps.map(comp => {
            const variant = productVariants.find(v => v.id === comp.variantId);
            if (!variant) return 0;
            const variantStock = calculateVariantStock(variant, allProducts);
            return Math.floor(variantStock / comp.quantity);
        }));

        return minStock;
    }, [localComponents, productVariants, allProducts]);

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[51]" aria-labelledby="component-editor-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="component-editor-title">Quản lý Thành phần</h3>
                                    <p className="mt-1 text-sm text-gray-500">Cấu hình các thành phần để tạo bộ sản phẩm</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    {showPreview ? 'Ẩn' : 'Xem'} Preview
                                </button>
                            </div>

                            {showPreview && previewStock !== null && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Tồn kho dự kiến</p>
                                            <p className="text-lg font-bold text-blue-700">{previewStock} bộ</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                                {localComponents.map((comp, index) => {
                                    const selectedVariant = productVariants.find(v => v.id === comp.variantId);
                                    const variantStock = selectedVariant ? calculateVariantStock(selectedVariant, allProducts) : 0;
                                    const maxSets = selectedVariant ? Math.floor(variantStock / comp.quantity) : 0;

                                    return (
                                        <div key={index} className="p-3 rounded-md bg-gray-50 border border-gray-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs text-gray-600 mb-1">Biến thể</label>
                                                    <select
                                                        value={comp.variantId}
                                                        onChange={(e) => handleComponentChange(index, 'variantId', e.target.value)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 sm:text-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                    >
                                                        <option value={0}>-- Chọn biến thể --</option>
                                                        {availableVariants.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {Object.values(v.attributes).join(', ') || 'Mặc định'} (Tồn: {calculateVariantStock(v, allProducts)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-600 mb-1">Số lượng</label>
                                                        <input
                                                            type="number"
                                                            placeholder="SL"
                                                            value={comp.quantity}
                                                            min="1"
                                                            onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                                                            className="block w-full text-center rounded-md border-gray-300 shadow-sm px-3 py-2 sm:text-sm focus:border-yellow-500 focus:ring-yellow-500"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveComponent(index)}
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                                                        title="Xóa thành phần"
                                                    >
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                            {selectedVariant && (
                                                <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                                                    <span>Tồn kho: <span className="font-semibold">{variantStock}</span></span>
                                                    <span>Có thể tạo: <span className="font-semibold text-green-600">{maxSets} bộ</span></span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {localComponents.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500">Chưa có thành phần nào.</p>
                                        <p className="text-xs text-gray-400 mt-1">Nhấn nút bên dưới để thêm thành phần</p>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddComponent}
                                className="mt-4 w-full text-sm font-medium text-yellow-600 rounded-md ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50 py-2 transition-colors"
                            >
                                + Thêm Thành phần
                            </button>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 sm:w-auto transition-colors"
                            >
                                Lưu thay đổi
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VariantRowContent: React.FC<{
    variant: Variant;
    index: number;
    allProducts: Product[];
    currentProductVariants: Variant[];
    handleVariantChange: (index: number, field: keyof Variant, value: any) => void;
    setEditingVariantIndex: (index: number | null) => void;
    openCamera: (type: 'variant', index: number) => void;
    triggerFileUpload: (type: 'variant', index: number) => void;
    handleImageDelete: (type: 'variant', imageIndex: number, variantIndex: number) => void;
    onDuplicateVariant?: (index: number) => void;
    currentProductId?: number;
}> = ({
    variant,
    index,
    allProducts,
    currentProductVariants,
    handleVariantChange,
    setEditingVariantIndex,
    openCamera,
    triggerFileUpload,
    handleImageDelete,
    onDuplicateVariant,
    currentProductId,
}) => {
    const isComposite = (variant.components && variant.components.length > 0) || false;

    const calculatedStock = useMemo(() => {
        // Create a temporary product shell with the current state of variants for accurate calculation
        const tempProductForCalc: Product = {
            id: currentProductId || Date.now(),
            name: 'temp',
            description: '',
            images: [],
            category: '',
            options: [],
            variants: currentProductVariants,
        };
        const otherProducts = allProducts.filter(p => p.id !== tempProductForCalc.id);
        return calculateVariantStock(variant, [...otherProducts, tempProductForCalc]);
    }, [variant, allProducts, currentProductVariants, currentProductId]);

    return (
        <>
            <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-800">
                <div className="flex items-center gap-2">
                    <span>{Object.values(variant.attributes).join(' / ') || 'Mặc định'}</span>
                    {isComposite && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Bộ
                        </span>
                    )}
                </div>
            </td>
            <td className="px-2 py-2">
                {isComposite ? (
                    <div className="relative">
                        <input
                            type="number"
                            value={calculatedStock}
                            readOnly
                            className="w-20 rounded-md border-gray-300 shadow-sm px-2 py-1.5 text-center sm:text-sm bg-gray-100 cursor-not-allowed"
                            title="Tồn kho tự động tính từ thành phần"
                        />
                    </div>
                ) : (
                    <input
                        type="number"
                        value={variant.stock}
                        onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                        className="w-20 rounded-md border-gray-300 shadow-sm px-2 py-1.5 text-center sm:text-sm focus:border-yellow-500 focus:ring-yellow-500"
                        min="0"
                    />
                )}
            </td>
            <td className="px-2 py-2">
                <input
                    type="number"
                    value={variant.price || ''}
                    onChange={e => handleVariantChange(index, 'price', e.target.value)}
                    className="w-24 rounded-md border-gray-300 shadow-sm px-2 py-1.5 text-center sm:text-sm focus:border-yellow-500 focus:ring-yellow-500"
                    min="0"
                    placeholder="0"
                />
            </td>
            <td className="px-2 py-2">
                <input
                    type="text"
                    placeholder="Cái, Bộ,..."
                    value={variant.unit || ''}
                    onChange={e => handleVariantChange(index, 'unit', e.target.value)}
                    className="w-24 rounded-md border-gray-300 shadow-sm px-2 py-1.5 text-center sm:text-sm focus:border-yellow-500 focus:ring-yellow-500"
                />
            </td>
            <td className="px-2 py-2">
                <button
                    type="button"
                    onClick={() => setEditingVariantIndex(index)}
                    className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-800 text-sm font-medium hover:bg-yellow-50 px-2 py-1 rounded transition-colors"
                    title="Quản lý thành phần"
                >
                    <span>Sửa</span>
                    {variant.components && variant.components.length > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-600 rounded-full">
                            {variant.components.length}
                        </span>
                    )}
                </button>
            </td>
            <td className="px-2 py-2">
                <div className="flex items-center gap-1 mb-1">
                    <button
                        type="button"
                        onClick={() => openCamera('variant', index)}
                        title="Chụp ảnh"
                        className="text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <CameraIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerFileUpload('variant', index)}
                        title="Tải ảnh lên"
                        className="text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                    </button>
                    {onDuplicateVariant && (
                        <button
                            type="button"
                            onClick={() => onDuplicateVariant(index)}
                            title="Sao chép biến thể"
                            className="text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <DocumentDuplicateIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-1 flex-wrap max-w-[120px]">
                    {variant.images?.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group w-10 h-10 rounded border border-gray-200">
                            <ImageWithPlaceholder
                                src={img}
                                alt={`Variant ${index} img ${imgIdx}`}
                                className="w-full h-full rounded object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleImageDelete('variant', imgIdx, index)}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Xóa ảnh"
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </td>
        </>
    );
};


// --- Helper Functions ---
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

// --- Main Modal Component ---
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'> | Product) => void;
  product: Product | null;
  allProducts: Product[];
  categories: Category[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, product, allProducts, categories }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [generalImages, setGeneralImages] = useState<string[]>([]);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [optionValueStrings, setOptionValueStrings] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageTarget, setImageTarget] = useState<{ type: 'general' | 'variant'; index?: number }>({ type: 'general' });
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  // Track previous state to prevent unnecessary resets
  const prevIsOpenRef = useRef(isOpen);
  const prevProductIdRef = useRef(product?.id);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Only reset when modal is newly opened or product changes
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isProductChanged = product?.id !== prevProductIdRef.current;

    // Debug logging
    if (isOpen && isInitializedRef.current && !isNewlyOpened && !isProductChanged) {
        console.log('⚠️ ProductFormModal: Skipping reset - already initialized');
        return;
    }

    if (isOpen && (isNewlyOpened || isProductChanged)) {
        console.log('✅ ProductFormModal: Initializing form', {
            isNewlyOpened,
            isProductChanged,
            productId: product?.id,
            productName: product?.name
        });

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
            setOptionValueStrings(productOptions.map(opt => opt.values.join(', ')));
            setVariants(JSON.parse(JSON.stringify(product.variants))); // Deep copy
        } else {
            // Reset state for new product
            setName('');
            setDescription('');
            setCategory(categories[0]?.name || '');
            setGeneralImages([]);
            setOptions([]);
            setOptionValueStrings([]);
            setVariants([{ id: Date.now(), attributes: {}, stock: 0, price: 0, images: [], unit: 'Cái', components: [] }]);
        }
        setErrors({});
        isInitializedRef.current = true;
    }

    if (!isOpen) {
        setShowCamera(false);
        isInitializedRef.current = false;
    }

    // Update refs
    prevIsOpenRef.current = isOpen;
    prevProductIdRef.current = product?.id;
  }, [isOpen, product, categories]);

  useEffect(() => {
    if (!isOpen || !isInitializedRef.current) return;

    const validOptions = options.filter(opt => opt.name.trim() !== '' && opt.values.length > 0 && opt.values.some(v => v.trim() !== ''));

    if (validOptions.length === 0) {
        if (variants.length === 0 || Object.keys(variants[0].attributes).length > 0 || variants.length > 1) {
            const defaultVariant = variants.find(v => Object.keys(v.attributes).length === 0) || { id: Date.now(), attributes: {}, stock: 0, price: 0, images: [], unit: 'Cái', components: [] };
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
            images: existingVariant?.images || [],
            unit: existingVariant?.unit || 'Cái',
            components: existingVariant?.components || []
        };
    });
    setVariants(newVariants);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionValueStrings, isOpen]);

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node; // Keep the mutable ref updated for other functions to use

    // Cleanup any existing stream when the ref is un-set or re-set
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // If a new node is attached (i.e., the video element is mounted)
    if (node) {
        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                streamRef.current = stream; // Store the stream for cleanup
                node.srcObject = stream;
                await node.play();
            } catch (err) {
                console.error("Lỗi khi truy cập camera: ", err);
                setShowCamera(false); // Hide camera view on error
            }
        };
        startStream();
    }
  }, [setShowCamera]);


  const handleOptionNameChange = (index: number, newName: string) => {
    const oldName = options[index].name;
    const updatedOptions = [...options];
    updatedOptions[index].name = newName;
    setOptions(updatedOptions);

    // If name changed, update all variants to use the new attribute key to preserve data
    if (oldName && newName && oldName !== newName) {
        setVariants(prev => prev.map(v => {
            if (oldName in v.attributes) {
                const newAttributes = { ...v.attributes };
                newAttributes[newName] = newAttributes[oldName];
                delete newAttributes[oldName];
                return { ...v, attributes: newAttributes };
            }
            return v;
        }));
    }
  };

  const handleOptionValuesChange = (index: number, valuesStr: string) => {
    const newOptionValueStrings = [...optionValueStrings];
    newOptionValueStrings[index] = valuesStr;
    setOptionValueStrings(newOptionValueStrings);

    const updatedOptions = [...options];
    updatedOptions[index].values = valuesStr.split(',').map(v => v.trim()).filter(Boolean);
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([...options, { name: '', values: [] }]);
    setOptionValueStrings([...optionValueStrings, '']);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    setOptionValueStrings(optionValueStrings.filter((_, i) => i !== index));
  };

  const handleVariantChange = useCallback((index: number, field: keyof Variant, value: string | number | ChildComponent[]) => {
    setVariants(prevVariants => {
        const newVariants = [...prevVariants];
        const variant = { ...newVariants[index] };

        if (field === 'stock' || field === 'price') {
            (variant as any)[field] = Number(value);
        } else {
            (variant as any)[field] = value;
        }

        newVariants[index] = variant;
        return newVariants;
    });
  }, []);

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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        if (imageTarget.type === 'general') {
            setGeneralImages(prev => [...prev, dataUrl]);
        } else if (imageTarget.type === 'variant' && typeof imageTarget.index === 'number') {
            const newVariants = [...variants];
            const images = newVariants[imageTarget.index].images || [];
            images.push(dataUrl);
            newVariants[imageTarget.index].images = images;
            setVariants(newVariants);
        }
        setShowCamera(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
        // Validate all files first
        const fileArray = [...files];
        const invalidFiles: string[] = [];

        fileArray.forEach(file => {
            const validation = validateImageFile(file);
            if (!validation.valid) {
                invalidFiles.push(`${file.name}: ${validation.error}`);
            }
        });

        if (invalidFiles.length > 0) {
            alert('Một số file không hợp lệ:\n\n' + invalidFiles.join('\n'));
            event.target.value = ''; // Reset input
            return;
        }

        // Show loading indicator
        const loadingToast = document.createElement('div');
        loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        loadingToast.textContent = `Đang xử lý ${fileArray.length} ảnh...`;
        document.body.appendChild(loadingToast);

        // Process images (including HEIC conversion)
        const base64Promises = fileArray.map(file => processImage(file));
        const base64Images = await Promise.all(base64Promises);

        // Remove loading indicator
        document.body.removeChild(loadingToast);

        if (imageTarget.type === 'general') {
            setGeneralImages(prev => [...prev, ...base64Images]);
        } else if (imageTarget.type === 'variant' && typeof imageTarget.index === 'number') {
           const newVariants = [...variants];
           const images = newVariants[imageTarget.index].images || [];
           newVariants[imageTarget.index].images = [...images, ...base64Images];
           setVariants(newVariants);
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
        const newVariants = [...variants];
        newVariants[variantIndex].images = (newVariants[variantIndex].images || []).filter((_, imgIdx) => imgIdx !== imageIndex);
        setVariants(newVariants);
    }
  };

  const handleDuplicateVariant = (index: number) => {
    const variantToDuplicate = variants[index];
    const newVariant: Variant = {
        ...JSON.parse(JSON.stringify(variantToDuplicate)),
        id: Date.now(),
        stock: 0, // Reset stock for duplicated variant
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
        newErrors.name = 'Tên vật tư không được để trống';
    }

    if (generalImages.length === 0) {
        newErrors.images = 'Vui lòng thêm ít nhất một hình ảnh';
    }

    if (variants.length === 0) {
        newErrors.variants = 'Phải có ít nhất một biến thể';
    }

    // Validate variants
    const hasInvalidVariant = variants.some(v => {
        const isComposite = v.components && v.components.length > 0;
        return !isComposite && (v.stock < 0 || v.price === undefined || v.price < 0);
    });

    if (hasInvalidVariant) {
        newErrors.variants = 'Các biến thể phải có tồn kho và giá hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const finalData = {
        name: name.trim(),
        description: description.trim(),
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
    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,.heic,.heif" multiple style={{ display: 'none' }} />
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
                {/* Error Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <InformationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-red-800">Vui lòng kiểm tra lại:</h4>
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                                    {Object.values(errors).map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Tên vật tư <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) {
                                    setErrors(prev => {
                                        const newErrors = {...prev};
                                        delete newErrors.name;
                                        return newErrors;
                                    });
                                }
                            }}
                            required
                            className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 sm:text-sm ${
                                errors.name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
                            }`}
                            placeholder="Nhập tên vật tư..."
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                     <div className="sm:col-span-2">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                        <select
                            id="category"
                            name="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-3 py-2 sm:text-sm"
                        >
                            {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                        <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-3 py-2 sm:text-sm"></textarea>
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Hình ảnh chung <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className={`flex gap-2 flex-wrap p-2 border border-dashed rounded-md min-h-[6rem] flex-grow ${
                                errors.images ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}>
                                {generalImages.length === 0 && (
                                    <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                                        Chưa có ảnh nào
                                    </div>
                                )}
                                {generalImages.map((img, index) => (
                                    <div key={index} className="relative group w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                                        <ImageWithPlaceholder src={img} alt={`General image ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleImageDelete('general', index);
                                                if (errors.images && generalImages.length > 1) {
                                                    setErrors(prev => {
                                                        const newErrors = {...prev};
                                                        delete newErrors.images;
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            className="absolute top-0 right-0 m-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => openCamera('general')}
                                    className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    <CameraIcon className="w-5 h-5 text-gray-500" /> Chụp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => triggerFileUpload('general')}
                                    className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    <ArrowUpTrayIcon className="w-5 h-5 text-gray-500" /> Tải lên
                                </button>
                            </div>
                        </div>
                        {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                    </div>

                    <div className="sm:col-span-6">
                        <h4 className="text-sm font-medium text-gray-700">Thuộc tính & Biến thể</h4>
                        <div className="mt-2 space-y-4">
                            {options.map((opt, index) => (
                                <div key={index} className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label htmlFor={`option-name-${index}`} className="text-xs text-gray-600">Tên thuộc tính (Vd: Màu sắc)</label>
                                        <input type="text" id={`option-name-${index}`} value={opt.name} onChange={(e) => handleOptionNameChange(index, e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-2 py-1.5 sm:text-sm" />
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor={`option-values-${index}`} className="text-xs text-gray-600">Giá trị (phân cách bằng dấu phẩy)</label>
                                        <input type="text" id={`option-values-${index}`} value={optionValueStrings[index]} onChange={(e) => handleOptionValuesChange(index, e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-2 py-1.5 sm:text-sm" />
                                    </div>
                                    <button type="button" onClick={() => removeOption(index)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                            <button type="button" onClick={addOption} className="w-full text-sm font-medium text-yellow-600 rounded-md ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50 py-2">+ Thêm Thuộc tính</button>
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Quản lý Biến thể</h4>
                            <span className="text-xs text-gray-500">{variants.length} biến thể</span>
                        </div>
                         <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Biến thể</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Tồn kho</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Giá</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Đơn vị</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Thành phần</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase">Ảnh & Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {variants.map((variant, index) => (
                                        <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                                            <VariantRowContent
                                                variant={variant}
                                                index={index}
                                                allProducts={allProducts}
                                                currentProductVariants={variants}
                                                handleVariantChange={handleVariantChange}
                                                setEditingVariantIndex={setEditingVariantIndex}
                                                openCamera={openCamera}
                                                triggerFileUpload={triggerFileUpload}
                                                handleImageDelete={handleImageDelete}
                                                onDuplicateVariant={handleDuplicateVariant}
                                                currentProductId={product?.id}
                                            />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {errors.variants && <p className="mt-2 text-sm text-red-600">{errors.variants}</p>}
                    </div>

                </div>
              </div>
              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button type="submit" className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 sm:ml-3 sm:w-auto">
                      Lưu Vật tư
                  </button>
                  <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                      Hủy
                  </button>
              </div>
            </form>
          </div>
        </div>
    </div>
    {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[51] flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg p-4 max-w-xl w-full">
                <video ref={videoCallbackRef} className="w-full h-auto rounded-md" playsInline muted autoPlay></video>
                <div className="mt-4 flex justify-between">
                    <button type="button" onClick={() => setShowCamera(false)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800">Hủy</button>
                    <button type="button" onClick={handleCapture} className="px-4 py-2 rounded-md bg-yellow-500 text-white">Chụp</button>
                </div>
            </div>
        </div>
    )}
    {editingVariantIndex !== null && (
        <ComponentEditor
            components={variants[editingVariantIndex]?.components || []}
            currentVariantId={variants[editingVariantIndex].id}
            productVariants={variants}
            allProducts={allProducts}
            onChange={(newComponents) => handleVariantChange(editingVariantIndex, 'components', newComponents)}
            onClose={() => setEditingVariantIndex(null)}
        />
    )}
    </>
  );
};

export default ProductFormModal;