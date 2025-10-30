import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';
import LoginPage from './components/LoginPage';
import Pagination from './components/Pagination';
import SearchBar from './components/SearchBar';
import CategoryNav from './components/CategoryNav';
import {
  Product,
  CartItem,
  RequisitionForm,
  User,
  Category,
  Variant,
  GoodsReceiptNote,
  AdminTab,
} from './types';
import { PRODUCTS, DEFAULT_CATEGORIES } from './constants';
import { calculateVariantStock } from './utils/stockCalculator';
import { cloneProductList } from './utils/productUtils';

const RequisitionListPage = lazy(() => import('./components/RequisitionListPage'));
const CreateRequisitionPage = lazy(() => import('./components/CreateRequisitionPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const CreateReceiptPage = lazy(() => import('./components/CreateReceiptPage'));
const ReceiptList = lazy(() => import('./components/ReceiptList'));

const USER_STORAGE_KEY = 'chicken_farm_user';
const REQUISITIONS_STORAGE_KEY = 'chicken_farm_requisitions';
const PRODUCTS_STORAGE_KEY = 'chicken_farm_products';
const CATEGORIES_STORAGE_KEY = 'chicken_farm_categories';
const RECEIPTS_STORAGE_KEY = 'chicken_farm_receipts';

const PRODUCTS_PER_PAGE = 10;

type ViewKey =
  | 'shop'
  | 'requisitions'
  | 'receipts'
  | 'create-requisition'
  | 'admin'
  | 'create-receipt';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [masterProductList, setMasterProductList] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return savedProducts ? JSON.parse(savedProducts) : PRODUCTS;
    } catch (error) {
      console.error('Không thể tải sản phẩm từ localStorage', error);
      return PRODUCTS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const parsed = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
      return parsed.filter((c: Category) => c.name !== 'Tất cả');
    } catch (error) {
      console.error('Không thể tải danh mục từ localStorage', error);
      return DEFAULT_CATEGORIES.filter((c) => c.name !== 'Tất cả');
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [productCurrentPage, setProductCurrentPage] = useState(1);

  const [currentView, setCurrentView] = useState<ViewKey>('shop');
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('products');

  const [requisitionForms, setRequisitionForms] = useState<RequisitionForm[]>(() => {
    try {
      const savedRequisitions = localStorage.getItem(REQUISITIONS_STORAGE_KEY);
      return savedRequisitions ? JSON.parse(savedRequisitions) : [];
    } catch (error) {
      console.error('Không thể tải phiếu yêu cầu từ localStorage', error);
      return [];
    }
  });

  const [goodsReceiptNotes, setGoodsReceiptNotes] = useState<GoodsReceiptNote[]>(() => {
    try {
      const savedReceipts = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      return savedReceipts ? JSON.parse(savedReceipts) : [];
    } catch (error) {
      console.error('Không thể tải phiếu nhập kho từ localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Không thể đọc thông tin người dùng từ localStorage', error);
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentUser, currentView, productCurrentPage]);

  useEffect(() => {
    try {
      localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(requisitionForms));
    } catch (error) {
      console.error('Không thể lưu phiếu yêu cầu vào localStorage', error);
    }
  }, [requisitionForms]);

  useEffect(() => {
    try {
      localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(goodsReceiptNotes));
    } catch (error) {
      console.error('Không thể lưu phiếu nhập kho vào localStorage', error);
    }
  }, [goodsReceiptNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(masterProductList));
    } catch (error) {
      console.error('Không thể lưu sản phẩm vào localStorage', error);
    }
  }, [masterProductList]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Không thể lưu danh mục vào localStorage', error);
    }
  }, [categories]);

  useEffect(() => {
    setProductCurrentPage(1);
  }, [searchTerm, category]);

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = masterProductList;

    if (searchTerm) {
      tempProducts = tempProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (category !== 'Tất cả') {
      tempProducts = tempProducts.filter((p) => p.category === category);
    }

    return tempProducts;
  }, [searchTerm, category, masterProductList]);

  const paginatedProducts = useMemo(
    () =>
      filteredAndSortedProducts.slice(
        (productCurrentPage - 1) * PRODUCTS_PER_PAGE,
        productCurrentPage * PRODUCTS_PER_PAGE,
      ),
    [filteredAndSortedProducts, productCurrentPage],
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE),
    [filteredAndSortedProducts],
  );

  const allCategoriesForNav: Category[] = useMemo(
    () => [{ name: 'Tất cả', icon: '' }, ...categories],
    [categories],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const showDesktopNav = useMemo(
    () => ['shop', 'requisitions', 'receipts', 'admin'].includes(currentView),
    [currentView],
  );

  const handleNavigate = useCallback((view: ViewKey, tab?: AdminTab) => {
    setCurrentView(view);
    if (view === 'admin' && tab) {
      setAdminInitialTab(tab);
    }
  }, []);

  const addToCart = useCallback((product: Product, variant: Variant, quantity: number) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.variant.id === variant.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      }
      return [...prevCart, { product, variant, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((variantId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.variant.id !== variantId));
  }, []);

  const updateCartItem = useCallback((variantId: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.variant.id !== variantId) return item;
        const newQuantity = Math.max(1, quantity);
        return { ...item, quantity: newQuantity };
      }),
    );
  }, []);

  const handleNavigateToCreateRequisition = useCallback(() => {
    if (cartItemCount === 0) {
      alert('Vui lòng thêm vật tư vào phiếu trước khi tạo.');
      return;
    }
    setIsCartOpen(false);
    handleNavigate('create-requisition');
  }, [cartItemCount, handleNavigate]);

  const handleCreateRequisition = useCallback(
    (details: { requesterName: string; zone: string; purpose: string }) => {
      if (!currentUser) return;
      const newForm: RequisitionForm = {
        id: `REQ-${Date.now()}`,
        ...details,
        items: cart,
        status: 'Đang chờ xử lý',
        createdAt: new Date().toISOString(),
      };
      setRequisitionForms((prev) => [newForm, ...prev]);
      setCart([]);
      alert('Đã tạo phiếu yêu cầu thành công!');
      handleNavigate('requisitions');
    },
    [cart, currentUser, handleNavigate],
  );

  const handleFulfillRequisition = useCallback(
    (
      formId: string,
      details: { notes: string; fulfillerName: string },
      currentProductList: Product[],
      shouldClone: boolean = true,
    ): { success: boolean; updatedProducts: Product[]; message?: string } => {
      const formToFulfill = requisitionForms.find((f) => f.id === formId);
      if (!formToFulfill) {
        return {
          success: false,
          updatedProducts: currentProductList,
          message: 'Lỗi: Không tìm thấy phiếu yêu cầu.',
        };
      }

      const workingProductList = shouldClone
        ? cloneProductList(currentProductList)
        : currentProductList;

      let stockSufficient = true;
      const stockErrors: string[] = [];

      for (const item of formToFulfill.items) {
        const currentStock = calculateVariantStock(item.variant, workingProductList);
        if (currentStock < item.quantity) {
          const variantName = Object.values(item.variant.attributes).join(' / ') || '';
          stockErrors.push(
            `- Không đủ tồn kho cho "${item.product.name}" ${variantName}. Yêu cầu ${item.quantity}, còn lại ${currentStock}.`,
          );
          stockSufficient = false;
        }
      }

      if (!stockSufficient) {
        return {
          success: false,
          updatedProducts: currentProductList,
          message: 'Không thể hoàn thành phiếu:\n' + stockErrors.join('\n'),
        };
      }

      formToFulfill.items.forEach((item) => {
        const parentProductIndex = workingProductList.findIndex((p) => p.id === item.product.id);
        if (parentProductIndex === -1) return;

        const isComposite = item.variant.components && item.variant.components.length > 0;
        if (isComposite) {
          item.variant.components!.forEach((component) => {
            const componentVariantIndex = workingProductList[parentProductIndex].variants.findIndex(
              (v) => v.id === component.variantId,
            );
            if (componentVariantIndex !== -1) {
              workingProductList[parentProductIndex].variants[componentVariantIndex].stock -=
                item.quantity * component.quantity;
            }
          });
        } else {
          const variantIndex = workingProductList[parentProductIndex].variants.findIndex(
            (v) => v.id === item.variant.id,
          );
          if (variantIndex !== -1) {
            workingProductList[parentProductIndex].variants[variantIndex].stock -= item.quantity;
          }
        }
      });

      setRequisitionForms((prev) =>
        prev.map((form) =>
          form.id === formId
            ? {
                ...form,
                status: 'Đã hoàn thành',
                fulfilledBy: details.fulfillerName,
                fulfillmentNotes: details.notes,
                fulfilledAt: new Date().toISOString(),
              }
            : form,
        ),
      );

      return {
        success: true,
        updatedProducts: workingProductList,
        message: 'Đã hoàn thành phiếu yêu cầu thành công!',
      };
    },
    [requisitionForms],
  );

  const triggerFulfillRequisition = useCallback(
    (formId: string, details: { notes: string; fulfillerName: string }) => {
      const result = handleFulfillRequisition(formId, details, masterProductList);
      if (result.success) {
        setMasterProductList(result.updatedProducts);
      }
      if (result.message) {
        alert(result.message);
      }
    },
    [handleFulfillRequisition, masterProductList],
  );

  const handleAddProduct = useCallback(
    (productData: Omit<Product, 'id'>) =>
      setMasterProductList((prev) => [...prev, { ...productData, id: Date.now() }]),
    [],
  );

  const handleUpdateProduct = useCallback(
    (updatedProduct: Product) =>
      setMasterProductList((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))),
    [],
  );

  const handleDeleteProduct = useCallback(
    (productId: number) => setMasterProductList((prev) => prev.filter((p) => p.id !== productId)),
    [],
  );

  const handleAddCategory = useCallback(
    (categoryData: Category) => {
      if (categories.some((c) => c.name.toLowerCase() === categoryData.name.toLowerCase())) {
        alert('Một danh mục với tên này đã tồn tại.');
        return;
      }
      setCategories((prev) => [...prev, categoryData]);
    },
    [categories],
  );

  const handleDeleteCategory = useCallback(
    (categoryName: string): boolean => {
      if (masterProductList.some((p) => p.category === categoryName)) return false;
      setCategories((prev) => prev.filter((c) => c.name !== categoryName));
      return true;
    },
    [masterProductList],
  );

  const handleUpdateCategory = useCallback(
    (originalName: string, updatedCategory: Category) => {
      if (
        originalName !== updatedCategory.name &&
        categories.some((c) => c.name.toLowerCase() === updatedCategory.name.toLowerCase())
      ) {
        alert('Một danh mục với tên này đã tồn tại.');
        return;
      }
      setCategories((prev) => prev.map((c) => (c.name === originalName ? updatedCategory : c)));
      if (originalName !== updatedCategory.name) {
        setMasterProductList((prev) =>
          prev.map((p) => (p.category === originalName ? { ...p, category: updatedCategory.name } : p)),
        );
      }
    },
    [categories],
  );

  const handleReorderCategories = useCallback((reorderedCategories: Category[]) => {
    setCategories(reorderedCategories);
  }, []);

  const handleLogin = useCallback((user: User) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error('Không thể lưu thông tin người dùng vào localStorage', error);
      alert('Đã xảy ra lỗi khi lưu thông tin của bạn.');
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
        setCurrentUser(null);
      } catch (error) {
        console.error('Không thể xóa thông tin người dùng khỏi localStorage', error);
      }
    }
  }, []);

  const handleConfirmReceipt = useCallback(
    (receiptData: Omit<GoodsReceiptNote, 'id' | 'createdAt'>) => {
      if (!currentUser) return;

      let updatedProducts = cloneProductList(masterProductList);

      receiptData.items.forEach((item) => {
        const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (productIndex !== -1) {
          const variantIndex = updatedProducts[productIndex].variants.findIndex(
            (v) => v.id === item.variantId,
          );
          if (variantIndex !== -1) {
            updatedProducts[productIndex].variants[variantIndex].stock += item.quantity;
          }
        }
      });

      const fulfilledReqIds: string[] = [];
      const pendingRequisitions = requisitionForms
        .filter((f) => f.status === 'Đang chờ xử lý')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (const form of pendingRequisitions) {
        const result = handleFulfillRequisition(
          form.id,
          {
            notes: `Tự động cấp phát từ Phiếu nhập kho GRN-${Date.now()}`,
            fulfillerName: 'Hệ thống (Nhập kho)',
          },
          updatedProducts,
          false,
        );

        if (result.success) {
          updatedProducts = result.updatedProducts;
          fulfilledReqIds.push(form.id);
        }
      }

      const newReceipt: GoodsReceiptNote = {
        ...receiptData,
        id: `GRN-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        linkedRequisitionIds: fulfilledReqIds,
      };

      setGoodsReceiptNotes((prev) => [newReceipt, ...prev]);
      setMasterProductList(updatedProducts);

      let alertMessage = 'Đã tạo Phiếu nhập kho thành công và cập nhật tồn kho.';
      if (fulfilledReqIds.length > 0) {
        alertMessage += `\nHệ thống đã tự động cấp phát cho các phiếu yêu cầu: ${fulfilledReqIds.join(', ')}.`;
      }
      alert(alertMessage);
      handleNavigate('receipts');
    },
    [currentUser, handleFulfillRequisition, handleNavigate, masterProductList, requisitionForms],
  );

  const content = useMemo(() => {
    switch (currentView) {
      case 'shop':
        return (
          <>
            <div className="bg-white sm:bg-gray-50 pt-6 pb-2 sm:pb-4">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              </div>
            </div>
            <CategoryNav
              categories={allCategoriesForNav}
              activeCategory={category}
              onSelectCategory={setCategory}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <ProductList
                products={paginatedProducts}
                onAddToCart={addToCart}
                totalProducts={filteredAndSortedProducts.length}
                allProducts={masterProductList}
              />
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={productCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setProductCurrentPage}
                  />
                </div>
              )}
            </div>
          </>
        );
      case 'requisitions':
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RequisitionListPage
              forms={requisitionForms}
              onFulfill={triggerFulfillRequisition}
              currentUser={currentUser!}
            />
          </main>
        );
      case 'receipts':
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ReceiptList receipts={goodsReceiptNotes} products={masterProductList} onNavigate={handleNavigate} />
          </main>
        );
      case 'create-requisition':
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CreateRequisitionPage
              user={currentUser}
              allProducts={masterProductList}
              cartItems={cart}
              onSubmit={handleCreateRequisition}
              onCancel={() => handleNavigate('shop')}
              onUpdateItem={updateCartItem}
              onRemoveItem={removeFromCart}
            />
          </main>
        );
      case 'admin':
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminPage
              products={masterProductList}
              categories={categories}
              initialTab={adminInitialTab}
              onNavigate={handleNavigate}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateCategory={handleUpdateCategory}
              onReorderCategories={handleReorderCategories}
            />
          </main>
        );
      case 'create-receipt':
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CreateReceiptPage
              user={currentUser}
              products={masterProductList}
              categories={categories}
              onSubmit={handleConfirmReceipt}
              onCancel={() => handleNavigate('receipts')}
              onAddProduct={handleAddProduct}
            />
          </main>
        );
      default:
        return null;
    }
  }, [
    currentView,
    searchTerm,
    allCategoriesForNav,
    category,
    paginatedProducts,
    addToCart,
    filteredAndSortedProducts.length,
    masterProductList,
    totalPages,
    productCurrentPage,
    requisitionForms,
    triggerFulfillRequisition,
    currentUser,
    goodsReceiptNotes,
    handleNavigate,
    cart,
    handleCreateRequisition,
    updateCartItem,
    removeFromCart,
    categories,
    adminInitialTab,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddCategory,
    handleDeleteCategory,
    handleUpdateCategory,
    handleReorderCategories,
    handleConfirmReceipt,
  ]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        user={currentUser}
        onLogout={handleLogout}
      />
      {showDesktopNav && (
        <DesktopNav onNavigate={handleNavigate} currentView={currentView} user={currentUser} />
      )}
      <Suspense fallback={<div className="py-10 text-center text-gray-500">Đang tải nội dung...</div>}>
        {content}
      </Suspense>
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemove={removeFromCart}
        onUpdateItem={updateCartItem}
        onCreateRequisition={handleNavigateToCreateRequisition}
        allProducts={masterProductList}
      />
      <Chatbot allProducts={masterProductList} />
      <BottomNav onNavigate={handleNavigate} currentView={currentView} user={currentUser} />
    </div>
  );
};

export default App;
