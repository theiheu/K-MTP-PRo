import React, { useMemo, useState, useEffect } from "react";
import { CartItem as CartItemType, Product, Variant } from "../types";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { calculateVariantStock } from "../utils/stockCalculator";

interface CartItemProps {
  item: CartItemType;
  allProducts: Product[];
  onRemove: (variantId: number) => void;
  onUpdateItem: (
    variantId: number,
    quantity: number,
    oldVariantId?: number
  ) => void;
  onImageClick?: (images: string[], startIndex: number) => void;
  onReplace?: (variantId: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  allProducts,
  onRemove,
  onUpdateItem,
  onImageClick,
  onReplace,
}) => {
  const [inputValue, setInputValue] = useState<number | "">(item.quantity);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string; }>(item.variant.attributes);

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

  return (
    <>
      <li className="flex py-6">
        <div
          className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
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

        <div className="ml-4 flex flex-1 flex-col">
          <div>
            <div className="flex justify-between text-base font-medium text-gray-900">
              <h3>{item.product.name}</h3>
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
                                ? "bg-yellow-500 text-white border-transparent"
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
            <div className="mt-1 text-sm flex items-center gap-2">
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
              <div className="mt-2 text-xs text-gray-600 border-l-2 border-yellow-300 pl-2">
                <p className="font-medium">Bao gồm:</p>
                <ul className="list-disc list-inside">
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
          <div className="flex flex-1 items-end justify-between text-sm">
            <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-4">
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
                className="font-medium text-yellow-600 hover:text-yellow-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </li>
    </>
  );
};

export default CartItem;
