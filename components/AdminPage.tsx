import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product, Category, Variant, AdminTab, Zone } from "../types";
import ProductFormModal from "./ProductFormModal";
import ConfirmationModal from "./ConfirmationModal";
import ImageGalleryModal from "./ImageGalleryModal";
import CategoryFormModal from "./CategoryFormModal";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import SearchBar from "./SearchBar";
import { calculateVariantStock } from "../utils/stockCalculator";
import ReceiptList from "./ReceiptList";
import ZoneListSection from "./ZoneListSection";

interface AdminPageProps {
  products: Product[];
  categories: Category[];
  zones: Zone[];
  initialTab?: AdminTab;
  onNavigate: (view: "shop" | "requisitions" | "admin", tab?: AdminTab) => void;
  onAddProduct: (productData: Omit<Product, "id">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryName: string) => boolean;
  onUpdateCategory: (originalName: string, updatedCategory: Category) => void;
  onReorderCategories: (reorderedCategories: Category[]) => void;
  onAddZone: (zone: Omit<Zone, "id" | "createdAt">) => void;
  onUpdateZone: (id: string, zone: Omit<Zone, "id" | "createdAt">) => void;
  onDeleteZone: (id: string) => boolean;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);

const LOW_STOCK_THRESHOLD = 10;
type StockFilter = "all" | "out-of-stock" | "low-stock";

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const AdminPage: React.FC<AdminPageProps> = ({
  products,
  categories,
  zones,
  initialTab = "products",
  onNavigate,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onReorderCategories,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categoryDeleteError, setCategoryDeleteError] = useState<string>("");

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // State for image gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [expandedProductId, setExpandedProductId] = useState<number | null>(
    null
  );

  const handleToggleExpand = (productId: number) => {
    setExpandedProductId((prevId) => (prevId === productId ? null : productId));
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

  const handleFormSubmit = (productData: Omit<Product, "id"> | Product) => {
    if ("id" in productData) {
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

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCategoryFormSubmit = async ({
    originalName,
    data,
  }: {
    originalName?: string;
    data: { name: string; iconFile: File | null; icon: string };
  }) => {
    try {
      let iconBase64 = data.icon;
      if (data.iconFile) {
        iconBase64 = await toBase64(data.iconFile);
      }

      if (editingCategory && originalName) {
        // Editing
        onUpdateCategory(originalName, { name: data.name, icon: iconBase64 });
      } else {
        // Adding
        onAddCategory({ name: data.name, icon: iconBase64 });
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Lỗi xử lý icon danh mục:", error);
      alert("Lỗi xử lý icon.");
    }
  };

  const handleCloseCategoryDeleteModal = () => {
    setCategoryToDelete(null);
    setCategoryDeleteError("");
  };

  const handleConfirmCategoryDelete = () => {
    if (categoryToDelete) {
      const success = onDeleteCategory(categoryToDelete.name);
      if (success) {
        handleCloseCategoryDeleteModal();
      } else {
        setCategoryDeleteError(
          `Không thể xóa "${categoryToDelete.name}" vì nó đang được sử dụng bởi một hoặc nhiều vật tư.`
        );
      }
    }
  };

  const handleDragStart = (
    _: React.DragEvent<HTMLDivElement>,
    position: number
  ) => {
    dragItem.current = position;
  };

  const handleDragEnter = (
    _: React.DragEvent<HTMLDivElement>,
    position: number
  ) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    ) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const newCategories = [...categories];
    const dragItemContent = newCategories[dragItem.current];
    newCategories.splice(dragItem.current, 1);
    newCategories.splice(dragOverItem.current, 0, dragItemContent);

    dragItem.current = null;
    dragOverItem.current = null;
    onReorderCategories(newCategories);
  };

  const handleOpenGallery = (images: string[], startIndex: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const filteredProducts = useMemo(() => {
    const productsWithTotalStock = products.map((p) => {
      const isComposite = p.variants.some(
        (v) => v.components && v.components.length > 0
      );
      let displayStock: number;

      if (isComposite) {
        const compositeVariants = p.variants.filter(
          (v) => v.components && v.components.length > 0
        );
        displayStock = compositeVariants.reduce(
          (sum, v) => sum + calculateVariantStock(v, products),
          0
        );
      } else {
        displayStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      }

      return { ...p, totalStock: displayStock, isComposite };
    });

    let tempProducts = productsWithTotalStock;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(lowercasedTerm) ||
          p.description.toLowerCase().includes(lowercasedTerm)
      );
    }

    switch (stockFilter) {
      case "out-of-stock":
        tempProducts = tempProducts.filter((p) => p.totalStock === 0);
        break;
      case "low-stock":
        tempProducts = tempProducts.filter(
          (p) => p.totalStock > 0 && p.totalStock < LOW_STOCK_THRESHOLD
        );
        break;
    }

    if (categoryFilter !== "all") {
      tempProducts = tempProducts.filter((p) => p.category === categoryFilter);
    }

    return tempProducts;
  }, [products, stockFilter, categoryFilter, searchTerm]);

  const filterOptions: { key: StockFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "low-stock", label: `Tồn kho thấp (< ${LOW_STOCK_THRESHOLD})` },
    { key: "out-of-stock", label: "Hết hàng" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Trang Quản lý
      </h1>

      <div className="mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("products")}
              aria-current={activeTab === "products" ? "page" : undefined}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Quản lý Vật tư
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              aria-current={activeTab === "categories" ? "page" : undefined}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Quản lý Danh mục
            </button>
            <button
              onClick={() => setActiveTab("zones")}
              aria-current={activeTab === "zones" ? "page" : undefined}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "zones"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Quản lý Khu vực
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "products" && (
          <div role="tabpanel" id="products-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Danh sách Vật tư
              </h2>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
              >
                <PlusIcon className="w-5 h-5" />
                Thêm Vật tư Mới
              </button>
            </div>

            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div>
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Tìm kiếm theo tên, mô tả vật tư..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                      Lọc tồn kho:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mb-2">
                      {filterOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setStockFilter(option.key)}
                          className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                            stockFilter === option.key
                              ? "bg-yellow-600 text-white shadow"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="admin-category-filter"
                      className="text-sm font-medium text-gray-800 whitespace-nowrap"
                    >
                      Lọc danh mục:
                    </label>
                    <select
                      id="admin-category-filter"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                    >
                      <option value="all">Tất cả</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="relative px-2 py-3">
                        <span className="sr-only">Mở rộng</span>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Vật tư
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Danh mục
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tổng Tồn kho
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Hành động</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <React.Fragment key={product.id}>
                          <tr
                            onClick={() => handleToggleExpand(product.id)}
                            className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-2 py-4">
                              <ChevronDownIcon
                                className={`w-5 h-5 mx-auto text-gray-400 transform transition-transform duration-200 ${
                                  expandedProductId === product.id
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className="flex-shrink-0 h-10 w-10 rounded-md cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenGallery(product.images, 0);
                                  }}
                                >
                                  <ImageWithPlaceholder
                                    className="h-full w-full rounded-md object-cover transition-transform duration-200 hover:scale-105"
                                    src={product.images[0]}
                                    alt={product.name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  {product.options.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {product.variants.length} biến thể
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    product.totalStock > 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {product.totalStock}
                                </span>
                                {product.isComposite && (
                                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    Bộ
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(product);
                                }}
                                className="text-yellow-600 hover:text-yellow-800"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductToDelete(product);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>

                          {expandedProductId === product.id && (
                            <tr>
                              <td
                                colSpan={5}
                                className="p-0 border-t-2 border-yellow-200"
                              >
                                <div className="p-4 bg-yellow-50">
                                  <h4 className="text-md font-semibold text-gray-700 mb-3 ml-2">
                                    Chi tiết Biến thể
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-inner">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                            Biến thể
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                            Tồn kho
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                            Thành phần
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                            Ảnh
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {product.variants.map(
                                          (variant: Variant) => (
                                            <tr key={variant.id}>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 align-top">
                                                <p className="font-medium">
                                                  {Object.values(
                                                    variant.attributes
                                                  ).join(" / ") || "Mặc định"}
                                                </p>
                                                <div className="text-xs text-gray-500 mt-1">
                                                  Đơn vị:{" "}
                                                  {variant.unit || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  Giá:{" "}
                                                  {variant.price != null
                                                    ? `${variant.price.toLocaleString(
                                                        "vi-VN"
                                                      )} đ`
                                                    : "N/A"}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 align-top">
                                                {calculateVariantStock(
                                                  variant,
                                                  products
                                                )}
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 align-top">
                                                {variant.components &&
                                                variant.components.length >
                                                  0 ? (
                                                  <ul className="list-disc list-inside text-xs space-y-1">
                                                    {variant.components.map(
                                                      (comp) => {
                                                        const compVariant =
                                                          product.variants.find(
                                                            (v) =>
                                                              v.id ===
                                                              comp.variantId
                                                          );
                                                        return (
                                                          <li
                                                            key={comp.variantId}
                                                          >
                                                            {comp.quantity} x{" "}
                                                            {compVariant
                                                              ? Object.values(
                                                                  compVariant.attributes
                                                                ).join(" / ") ||
                                                                "Mặc định"
                                                              : `ID: ${comp.variantId}`}
                                                          </li>
                                                        );
                                                      }
                                                    )}
                                                  </ul>
                                                ) : (
                                                  "—"
                                                )}
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap align-top">
                                                {variant.images &&
                                                variant.images.length > 0 ? (
                                                  <div
                                                    className="h-10 w-10 rounded-md cursor-pointer"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenGallery(
                                                        variant.images!,
                                                        0
                                                      );
                                                    }}
                                                  >
                                                    <ImageWithPlaceholder
                                                      src={variant.images[0]}
                                                      alt="variant"
                                                      className="h-full w-full object-cover rounded-md"
                                                    />
                                                  </div>
                                                ) : product.images.length >
                                                  0 ? (
                                                  <div
                                                    className="h-10 w-10 rounded-md opacity-50"
                                                    title="Sử dụng ảnh chung"
                                                  >
                                                    <ImageWithPlaceholder
                                                      src={product.images[0]}
                                                      alt="variant"
                                                      className="h-full w-full object-cover rounded-md"
                                                    />
                                                  </div>
                                                ) : (
                                                  "—"
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Không có vật tư nào phù hợp với bộ lọc đã chọn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div role="tabpanel" id="categories-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Danh sách Danh mục
              </h2>
              <button
                onClick={handleOpenAddCategoryModal}
                className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
              >
                <PlusIcon className="w-5 h-5" />
                Thêm Danh mục
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                💡 Mẹo: Bạn có thể kéo và thả các danh mục bên dưới để sắp xếp
                lại thứ tự của chúng.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat, index) => (
                <div
                  key={cat.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="p-4 border rounded-lg flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={cat.icon}
                    alt={cat.name}
                    className="w-12 h-12 mb-3 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-800 break-all h-10 flex items-center">
                    {cat.name}
                  </span>
                  <div className="mt-3 pt-3 border-t w-full flex justify-center space-x-3">
                    <button
                      onClick={() => handleOpenEditCategoryModal(cat)}
                      title="Sửa"
                      className="text-gray-500 hover:text-yellow-600 p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      title="Xóa"
                      className="text-gray-500 hover:text-red-600 p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "zones" && (
          <div role="tabpanel" id="zones-panel">
            <ZoneListSection
              zones={zones}
              onAddZone={onAddZone}
              onUpdateZone={onUpdateZone}
              onDeleteZone={onDeleteZone}
            />
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        allProducts={products}
        categories={categories}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategoryFormSubmit}
        category={editingCategory}
        allCategories={categories}
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

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages}
        startIndex={galleryStartIndex}
      />
    </div>
  );
};

export default AdminPage;
