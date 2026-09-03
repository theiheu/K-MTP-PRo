import React, { useState, useMemo, useRef, useEffect } from "react";

import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from './SortableHeader';
import { Product, Category, Variant, AdminTab, Zone, User } from "../types";
import ProductFormModal from "./ProductFormModal";
import ConfirmationModal from "./ConfirmationModal";
import ImageGalleryModal from "./ImageGalleryModal";
import CategoryFormModal from "./CategoryFormModal";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import SearchBar from "./SearchBar";
import { calculateVariantStock } from "../utils/stockCalculator";
import ReceiptList from "./ReceiptList";
import ZoneListSection from "./ZoneListSection";
import UserManagement from "./UserManagement";
import { useAuthStore } from "../store/authStore";
import Dashboard from "./Dashboard";
import InventoryAuditSection from "./InventoryAuditSection";
import Pagination from "./Pagination";

interface AdminPageProps {
  products: Product[];
  categories: Category[];
  zones: Zone[];
  users: User[];
  initialTab?: AdminTab;
  onNavigate: (view: "shop" | "requisitions" | "admin", tab?: AdminTab) => void;
  onAddProduct: (productData: Omit<Product, "id">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryName: string) => Promise<boolean> | boolean;
  onUpdateCategory: (originalName: string, updatedCategory: Category) => void;
  onReorderCategories: (reorderedCategories: Category[]) => void;
  onAddZone: (zone: Omit<Zone, "id" | "createdAt">) => Promise<void>;
  onUpdateZone: (id: string, zone: Omit<Zone, "id" | "createdAt">) => Promise<void>;
  onDeleteZone: (id: string) => Promise<boolean>;
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onUpdateUser: (id: string, user: Omit<User, 'id'>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
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
  users,
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
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const { user } = useAuthStore();
  const isReadOnly = user?.role !== "manager";

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
  const [showFilters, setShowFilters] = useState(false);
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

  const handleConfirmCategoryDelete = async () => {
    if (categoryToDelete) {
      const success = await onDeleteCategory(categoryToDelete.name);
      if (success) {
        handleCloseCategoryDeleteModal();
      } else {
        setCategoryDeleteError(
          `Không thể xóa "${categoryToDelete.name}".`
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

  useEffect(() => {
    setCurrentPage(1);
  }, [stockFilter, categoryFilter, searchTerm]);

  const { items: sortedProducts, requestSort, sortConfig } = useSortableData(filteredProducts, { key: '', direction: null });

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
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
              onClick={() => setActiveTab("inventory_audits")}
              aria-current={activeTab === "inventory_audits" ? "page" : undefined}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inventory_audits"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Kiểm kê hàng hoá
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              aria-current={activeTab === "dashboard" ? "page" : undefined}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Báo cáo phân tích
            </button>
            {!isReadOnly && (
              <>
                <button
                  onClick={() => setActiveTab("categories")}
                  aria-current={activeTab === "categories" ? "page" : undefined}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "categories"
                      ? "border-amber-500 text-amber-600"
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
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Quản lý Khu vực
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  aria-current={activeTab === "users" ? "page" : undefined}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Nhân sự
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "products" && (
          <div role="tabpanel" id="products-panel">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Danh sách Vật tư
              </h2>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 w-full sm:w-auto"
              >
                <PlusIcon className="w-5 h-5" />
                Thêm Vật tư Mới
              </button>
            </div>

            <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-end">
                <div className="flex gap-2 w-full lg:flex-1">
                  <div className="flex-1 min-w-0">
                    <SearchBar
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      placeholder="Tìm kiếm theo tên, mô tả vật tư..."
                    />
                  </div>
                  <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`lg:hidden flex-shrink-0 px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                          showFilters || stockFilter !== 'all' || categoryFilter !== 'all'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Lọc {(stockFilter !== 'all' || categoryFilter !== 'all') && <span className="flex h-2 w-2 rounded-full bg-red-500 ml-0.5"></span>}
                  </button>
                </div>

                {/* Desktop Inline Filters */}
                <div className="hidden lg:flex lg:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                      Lọc tồn kho:
                    </span>
                    <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                    <label
                      htmlFor="admin-category-filter-desktop"
                      className="text-sm font-medium text-gray-800 whitespace-nowrap"
                    >
                      Danh mục:
                    </label>
                    <select
                      id="admin-category-filter-desktop"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
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

            {/* Mobile Filter Bottom Sheet */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl relative z-10 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Lọc vật tư</h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Tồn kho</label>
                                <div className="flex flex-wrap gap-2">
                                  {filterOptions.map((option) => (
                                    <button
                                      key={option.key}
                                      onClick={() => setStockFilter(option.key)}
                                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                        stockFilter === option.key
                                          ? "bg-yellow-600 text-white shadow-sm"
                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    {categories.map((cat) => (
                                      <option key={cat.name} value={cat.name}>
                                        {cat.name}
                                      </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => { 
                                        setStockFilter('all'); 
                                        setCategoryFilter('all');
                                    }}
                                    className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                >
                                    Xoá lọc
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-colors"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader label="Vật tư" sortKey="name" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Danh mục" sortKey="category" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Tổng Tồn kho" sortKey="totalStock" currentSort={sortConfig} onRequestSort={requestSort} />
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                      <React.Fragment key={product.id}>
                        <tr
                          onClick={() => handleToggleExpand(product.id)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 transform transition-transform ${expandedProductId === product.id ? 'rotate-90' : ''} text-gray-500`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {product.category}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
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
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-4">
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
                              colSpan={4}
                              className="px-0 py-0"
                            >
                              <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Chi tiết Biến thể
                                </h4>
                                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                                  <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500">
                                      <tr>
                                        <th className="px-4 py-2 font-medium">Biến thể</th>
                                        <th className="px-4 py-2 font-medium">Tồn kho</th>
                                        <th className="px-4 py-2 font-medium">Thành phần</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {product.variants.map(
                                          (variant: Variant) => (
                                            <tr key={variant.id}>
                                              <td className="px-4 py-3 text-sm text-gray-800 align-top min-w-[200px]">
                                                <div className="flex items-start gap-3">
                                                  {variant.images && variant.images.length > 0 ? (
                                                    <div
                                                      className="h-10 w-10 flex-shrink-0 rounded-md cursor-pointer overflow-hidden border border-gray-200"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenGallery(variant.images!, 0);
                                                      }}
                                                    >
                                                      <ImageWithPlaceholder
                                                        src={variant.images[0]}
                                                        alt="variant"
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : product.images && product.images.length > 0 ? (
                                                    <div
                                                      className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 opacity-60"
                                                      title="Sử dụng ảnh chung"
                                                    >
                                                      <ImageWithPlaceholder
                                                        src={product.images[0]}
                                                        alt="variant"
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                      </svg>
                                                    </div>
                                                  )}
                                                  <div className="flex flex-col whitespace-normal">
                                                    <p className="font-medium">
                                                      {Object.values(variant.attributes).join(" / ") || "Mặc định"}
                                                    </p>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                      Đơn vị: {variant.unit || "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      Giá: {variant.price != null ? `${variant.price.toLocaleString("vi-VN")} đ` : "N/A"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 align-top">
                                                {calculateVariantStock(variant, products)}
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 align-top">
                                                {variant.components && variant.components.length > 0 ? (
                                                  <ul className="list-disc list-inside text-xs space-y-1">
                                                    {variant.components.map((comp) => {
                                                      const compVariant = product.variants.find((v) => v.id === comp.variantId);
                                                      return (
                                                        <li key={comp.variantId}>
                                                          {comp.quantity} x{" "}
                                                          {compVariant
                                                            ? Object.values(compVariant.attributes).join(" / ") || "Mặc định"
                                                            : `ID: ${comp.variantId}`}
                                                        </li>
                                                      );
                                                    })}
                                                  </ul>
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
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Không có vật tư nào phù hợp với bộ lọc đã chọn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div role="tabpanel" id="categories-panel">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Danh sách Danh mục
              </h2>
              <button
                onClick={handleOpenAddCategoryModal}
                className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 w-full sm:w-auto"
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

        {activeTab === "users" && (
          <div role="tabpanel" id="users-panel">
            <UserManagement
              users={users}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
            />
          </div>
        )}

        {activeTab === "inventory_audits" && (
          <div role="tabpanel" id="inventory-audits-panel">
            <InventoryAuditSection />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div role="tabpanel" id="dashboard-panel">
            <Dashboard />
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
