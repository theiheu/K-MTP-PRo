import React, { useMemo, useState, useEffect } from "react";
import { CartItem as CartItemType, Product, RequisitionGroup, Variant } from "../types";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { calculateVariantStock } from "../utils/stockCalculator";

interface CartItemProps {
  item: CartItemType;
  allProducts: Product[];
  onRemove: (variantId: string) => void;
  onUpdateItem: (
    variantId: string,
    quantity: number,
    oldVariantId?: string
  ) => void;
  onUpdateDetails?: (variantId: string, details: Partial<CartItemType>) => void;
  onImageClick?: (images: string[], startIndex: number) => void;
  onReplace?: (variantId: string) => void;
  groups?: RequisitionGroup[];
  useGroupWorkflow?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  allProducts,
  onRemove,
  onUpdateItem,
  onUpdateDetails,
  onImageClick,
  onReplace,
  groups = [],
  useGroupWorkflow = false,
}) => {
  const [inputValue, setInputValue] = useState<number | "">(item.quantity);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string; }>(item.variant.attributes);
  const hasExchangeDetails = Boolean(item.exchangedAt || item.defectDescription || item.repairNeeds || item.defectImages?.length);
  const [showExchangeDetails, setShowExchangeDetails] = useState(hasExchangeDetails);

  useEffect(() => {
    // Sync local state if the parent's state changes
    if (item.quantity !== inputValue) {
      setInputValue(item.quantity);
    }
    // Also sync selected options if the variant changes from parent
    setSelectedOptions(item.variant.attributes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.quantity, item.variant]);

  const calculatedStock = useMemo(() => {
    return calculateVariantStock(item.variant, allProducts);
  }, [item.variant, allProducts]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInputValue("");
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return;
    }

    let newQuantity = num < 0 ? 0 : num;
    setInputValue(newQuantity);
  };

  const handleBlur = () => {
    let finalQuantity = typeof inputValue === "number" ? inputValue : 0;

    if (finalQuantity < 1) {
      finalQuantity = 1;
    }

    // Only call update if the value is actually different or invalid
    if (
      finalQuantity !== item.quantity ||
      inputValue === "" ||
      inputValue === 0
    ) {
      onUpdateItem(item.variant.id, finalQuantity);
    }
    // Sync local state with the final valid value
    setInputValue(finalQuantity);
  };

  const increment = () => {
    onUpdateItem(item.variant.id, item.quantity + 1);
  };

  const decrement = () => {
    if (item.quantity > 1) {
      onUpdateItem(item.variant.id, item.quantity - 1);
    }
  };

  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };

    const newVariant = item.product.variants.find(variant =>
      item.product.options.every(optName =>
        variant.attributes[optName] === newOptions[optName]
      )
    );

    if (newVariant && newVariant.id !== item.variant.id) {
      setSelectedOptions(newOptions);
      onUpdateItem(newVariant.id, item.quantity, item.variant.id);
    }
  };

  const variantAttributes = Object.entries(item.variant.attributes)
    .map(([, value]) => value)
    .join(", ");

  const isComposite =
    item.variant.components && item.variant.components.length > 0;
  const isExchangeItem = Boolean(item.isExchange);

  return (
    <>
      <li className="py-5 sm:py-6">
        <div className="flex gap-3 sm:gap-4">
        <div
          className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
          onClick={() => {
            if (onImageClick) {
              // Collect all available images
              const variantImages = item.variant.images || [];
              const productImages = item.product.images || [];
              // Get current image to determine start index
              const currentImage =
                item.variant.images?.[0] || item.product.images[0];
              // Combine all unique images
              const allImages = Array.from(
                new Set([...variantImages, ...productImages])
              );
              // Find the index of current image
              const startIndex = Math.max(0, allImages.indexOf(currentImage));
              onImageClick(allImages, startIndex);
            }
          }}
        >
          <ImageWithPlaceholder
            src={item.variant.images?.[0] || item.product.images[0]}
            alt={item.product.name}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <div>
            <div className="flex justify-between text-base font-medium text-gray-900">
              <h3 className="min-w-0 break-words pr-2">{item.product.name}</h3>
            </div>
            {item.product.options.length > 0 && (
              <div className="mt-3 space-y-2">
                {item.product.options.map((optionName) => {
                  const availableValues = [
                    ...new Set(
                      item.product.variants
                        .map((v) => v.attributes[optionName])
                        .filter(Boolean)
                    ),
                  ] as string[];
                  return (
                    <div key={optionName}>
                      <h4 className="text-xs font-medium text-gray-600">
                        {optionName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {availableValues.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleOptionSelect(optionName, value)}
                            className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                              selectedOptions[optionName] === value
                                ? "bg-amber-500 text-white border-transparent"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-1 text-sm flex flex-wrap items-center gap-2">
              <p
                className={
                  calculatedStock === 0
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }
              >
                Tồn kho: {calculatedStock} {item.variant.unit}
              </p>
              {item.quantity > calculatedStock && (
                <span className="text-red-500 font-medium">
                  (Vượt {item.quantity - calculatedStock} {item.variant.unit})
                </span>
              )}
            </div>

            {isComposite && (
              <div className="mt-2 text-xs text-gray-600 border-l-2 border-amber-300 pl-2">
                <p className="font-medium">Bao gồm:</p>
                <ul className="list-disc list-inside break-words">
                  {item.variant.components!.map((comp) => {
                    const componentVariant = item.product.variants.find(
                      (v) => v.id === comp.variantId
                    );
                    const variantName = componentVariant
                      ? Object.values(componentVariant.attributes).join(" / ")
                      : `ID ${comp.variantId}`;
                    return componentVariant ? (
                      <li key={comp.variantId}>
                        {comp.quantity} x {variantName}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between text-sm mt-4 gap-y-3 gap-x-4 w-full">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  type="button"
                  onClick={decrement}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={inputValue}
                  onChange={handleQuantityChange}
                  onBlur={handleBlur}
                  className={`w-12 text-center border-l border-r border-gray-300 focus:outline-none py-1 ${
                    item.quantity > calculatedStock
                      ? "text-red-500 font-medium"
                      : ""
                  }`}
                  min="1"
                  aria-label={`Số lượng cho ${item.product.name}`}
                />
                <button
                  type="button"
                  onClick={increment}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto">
              {onReplace && (
                <button
                  type="button"
                  onClick={() => onReplace(item.variant.id)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Thay thế
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(item.variant.id)}
                className="font-medium text-amber-600 hover:text-amber-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
        </div>

        {onUpdateDetails && (
          <div className={`mt-4 sm:ml-28 rounded-lg border p-3 sm:p-4 ${isExchangeItem ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="space-y-2">
              {useGroupWorkflow ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hạng mục/Mục đích sử dụng</label>
                    <select
                      value={item.groupId || groups[0]?.id || ''}
                      onChange={(e) => {
                        const group = groups.find(entry => entry.id === e.target.value);
                        onUpdateDetails(item.variant.id, {
                          groupId: group?.id,
                          groupName: group?.name,
                          purposeType: group?.purposeType,
                          groupNotes: group?.notes,
                        });
                      }}
                      className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600"
                    >
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  {isExchangeItem ? (
                    <button
                      type="button"
                      onClick={() => onUpdateDetails(item.variant.id, {
                        isExchange: false,
                        defectNotes: undefined,
                        defectDescription: undefined,
                        repairNeeds: undefined,
                        exchangedAt: undefined,
                        defectImages: undefined,
                      })}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      Đang là vật tư đổi hỏng - bấm để bỏ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateDetails(item.variant.id, { isExchange: true })}
                      className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-amber-700"
                    >
                      Dòng này là vật tư đổi hỏng?
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <input
                    id={`exchange-${item.variant.id}`}
                    type="checkbox"
                    checked={item.isExchange || false}
                    onChange={(e) => {
                      onUpdateDetails(item.variant.id, { isExchange: e.target.checked });
                      if (e.target.checked) setShowExchangeDetails(hasExchangeDetails);
                    }}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-amber-600 focus:ring-amber-600 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`exchange-${item.variant.id}`} className="block text-sm font-medium leading-5 text-gray-800 cursor-pointer">
                      Cấp đổi vật tư này
                    </label>
                    <p className="mt-0.5 text-xs text-gray-500">Thu hồi đồ cũ hỏng để gom vào kho sửa chữa.</p>
                  </div>
                </div>
              )}
            </div>

            {isExchangeItem && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>Tình trạng hỏng</span>
                    <span className="font-normal text-red-600">Bắt buộc</span>
                  </label>
                  <input
                    type="text"
                    value={item.defectNotes || ""}
                    onChange={(e) => onUpdateDetails(item.variant.id, { defectNotes: e.target.value })}
                    placeholder="VD: cháy cuộn dây, vỡ vỏ bọc..."
                    className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-600"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowExchangeDetails(value => !value)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                >
                  {showExchangeDetails ? 'Ẩn chi tiết tùy chọn' : 'Thêm ngày, ảnh và nội dung sửa'}
                </button>

                {showExchangeDetails && (
                  <div className="rounded-md border border-amber-100 bg-white p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ngày đổi vật tư hỏng
                      </label>
                      <input
                        type="date"
                        value={item.exchangedAt ? item.exchangedAt.slice(0, 10) : ""}
                        onChange={(e) => onUpdateDetails(item.variant.id, { exchangedAt: e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : undefined })}
                        className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hỏng như thế nào
                      </label>
                      <textarea
                        rows={2}
                        value={item.defectDescription || ""}
                        onChange={(e) => onUpdateDetails(item.variant.id, { defectDescription: e.target.value })}
                        placeholder="Vị trí hỏng, triệu chứng, mức độ ảnh hưởng..."
                        className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cần sửa những gì
                      </label>
                      <textarea
                        rows={2}
                        value={item.repairNeeds || ""}
                        onChange={(e) => onUpdateDetails(item.variant.id, { repairNeeds: e.target.value })}
                        placeholder="VD: thay dây nguồn, hàn lại mối nối..."
                        className="block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hình ảnh đồ hỏng
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label
                          htmlFor={`defect-images-${item.variant.id}`}
                          className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
                        >
                          Chọn ảnh
                        </label>
                        <span className="text-xs text-gray-500">
                          {item.defectImages?.length ? `${item.defectImages.length} ảnh đã chọn` : "Chưa có ảnh"}
                        </span>
                      </div>
                      <input
                        id={`defect-images-${item.variant.id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            const newImages = [...(item.defectImages || [])];
                            Array.from(files).forEach((file) => {
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = () => {
                                newImages.push(reader.result as string);
                                onUpdateDetails(item.variant.id, { defectImages: newImages });
                              };
                            });
                          }
                        }}
                        className="sr-only"
                      />

                      {item.defectImages && item.defectImages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.defectImages.map((src, idx) => (
                            <div key={idx} className="relative group">
                              <img src={src} alt="Defect" className="h-12 w-12 object-cover rounded border border-gray-200" />
                              <button
                                type="button"
                                onClick={() => onUpdateDetails(item.variant.id, { defectImages: item.defectImages!.filter((_, i) => i !== idx) })}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </li>
    </>
  );
};

export default CartItem;
