import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import Header from './components/Header';
import ProductList from './components/ProductList';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';
import LoginPage from './components/LoginPage';
import Pagination from './components/Pagination';
import SearchBar from './components/SearchBar';
import CategoryNav from './components/CategoryNav';
import PopularProductsSlider from './components/PopularProductsSlider';
import ImageGalleryModal from './components/ImageGalleryModal';

import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useDataStore } from './store/dataStore';
import { AdminTab } from './types';

const RequisitionListPage = lazy(() => import('./components/RequisitionListPage'));
const CreateRequisitionModal = lazy(() => import('./components/CreateRequisitionModal'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const CoreRequisitionPage = lazy(() => import('./components/CoreRequisitionPage'));
const CoreRequisitionListPage = lazy(() => import('./components/CoreRequisitionListPage'));
const CreateReceiptPage = lazy(() => import('./components/CreateReceiptPage'));
const ReceiptList = lazy(() => import('./components/ReceiptList'));
const DeliveryNoteList = lazy(() => import('./components/DeliveryNoteList'));
const CreateDeliveryNote = lazy(() => import('./components/CreateDeliveryNote'));
const EditReceiptModal = lazy(() => import('./components/EditReceiptModal'));
const PRODUCTS_PER_PAGE = 12;

type ViewKey = 'shop' | 'requisitions' | 'warehouse-requisitions' | 'receipts' | 'create-requisition' | 'warehouse-request' | 'admin' | 'create-receipt' | 'deliveries' | 'create-delivery';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Store
  const { user, login, logout, checkSession } = useAuthStore();

  // Cart Store
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateCartItem, updateCartItemDetails } = useCartStore();

  // Data Store
  const {
    products, categories, zones, requisitions, receipts, deliveries, users,
    isFetchingInitialData, isActionLoading, fetchInitialData,
    addUser, updateUser, deleteUser,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory, reorderCategories,
    addZone, updateZone, deleteZone,
    createRequisition, updateRequisition, deleteRequisition,
    fulfillRequisition,
    confirmRequisitionReceipt,
    createReceipt, deleteReceipt, updateReceipt,
    createDelivery, verifyDelivery, rejectDelivery
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('products');

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user, fetchInitialData]);

  const currentView = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'shop';
    if (path === '/warehouse/requisitions') return 'warehouse-requisitions';
    if (path === '/requisitions') return 'requisitions';
    if (path === '/requisitions/create') return 'create-requisition';
    if (path === '/warehouse/request') return 'warehouse-request';
    if (path === '/receipts') return 'receipts';
    if (path === '/receipts/create') return 'create-receipt';
    if (path === '/deliveries') return 'deliveries';
    if (path === '/deliveries/create') return 'create-delivery';
    if (path === '/admin') return 'admin';
    return 'shop';
  }, [location.pathname]);

  // Sync search to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && !searchTerm) setSearchTerm(q);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set('q', searchTerm);
    else params.delete('q');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchTerm]);

  useEffect(() => {
    setProductCurrentPage(1);
  }, [searchTerm, category]);

  useEffect(() => {
    if (!isFetchingInitialData) {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [user, currentView, productCurrentPage, isFetchingInitialData]);

  // Data processing
  const filteredAndSortedProducts = useMemo(() => {
    let temp = products;
    if (searchTerm) {
      temp = temp.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (category !== 'Tất cả') temp = temp.filter(p => p.category === category);
    return temp;
  }, [searchTerm, category, products]);

  const paginatedProducts = useMemo(() =>
    filteredAndSortedProducts.slice((productCurrentPage - 1) * PRODUCTS_PER_PAGE, productCurrentPage * PRODUCTS_PER_PAGE),
  [filteredAndSortedProducts, productCurrentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);

  const allCategoriesForNav = useMemo(() => [{ name: 'Tất cả', icon: '' }, ...categories], [categories]);

  const popularProducts = useMemo(() => {
    if (!requisitions || requisitions.length === 0) return [];
    const freq: Record<string, number> = {};
    requisitions.forEach(req => {
      req.items.forEach(item => {
        freq[item.product.id] = (freq[item.product.id] || 0) + 1;
      });
    });

    const sorted = [...products].sort((a, b) => (freq[b.id] || 0) - (freq[a.id] || 0));
    return sorted.filter(p => freq[p.id] > 0).slice(0, 8);
  }, [products, requisitions]);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Handlers
  const handleOpenGallery = useCallback((images: string[], startIndex: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  }, []);

  const handleNavigate = useCallback((view: ViewKey, tab?: AdminTab) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'admin' && tab) setAdminInitialTab(tab);
    switch (view) {
      case 'shop': navigate('/'); break;
      case 'warehouse-requisitions': navigate('/warehouse/requisitions'); break;
      case 'create-requisition': navigate('/requisitions/create'); break;
      case 'warehouse-request': navigate('/warehouse/request'); break;
      case 'create-receipt': navigate('/receipts/create'); break;
      case 'create-delivery': navigate('/deliveries/create'); break;
      default: navigate(`/${view}`); break;
    }
  }, [navigate]);

  const handleNavigateToCreateRequisition = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsCartOpen(true);
  }, [setIsCartOpen]);

  const handleAddToCart = useCallback((product: any, variant: any, quantity: number) => {
    addToCart(product, variant, quantity);
    const variantLabel = Object.values(variant.attributes || {}).filter(Boolean).join(' / ');
    const totalCartItems = useCartStore.getState().cart.reduce((total, item) => total + item.quantity, 0);

    toast.custom((toastItem) => (
      <div
        className={`pointer-events-auto w-[calc(100vw-1rem)] max-w-[20rem] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/10 transition-all sm:max-w-sm ${
          toastItem.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 sm:h-9 sm:w-9">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.22a1 1 0 111.414-1.414l4.034 4.034 6.543-6.543a1 1 0 011.417-.006z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 sm:text-sm sm:normal-case sm:tracking-normal sm:text-gray-900">Đã thêm</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{product.name}</p>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                {variantLabel && <span className="max-w-full truncate">{variantLabel}</span>}
                <span className="flex-shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">
                  {quantity} {variant.unit || ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Phiếu hiện có {totalCartItems} vật tư.</p>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(toastItem.id)}
              className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Đóng thông báo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex gap-2 pl-9 sm:mt-3 sm:pl-12">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastItem.id);
                setIsCartOpen(true);
              }}
              className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 sm:px-3"
            >
              Mở phiếu
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(toastItem.id)}
              className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 sm:px-3"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    ), {
      duration: 3500,
      position: 'top-right',
    });
  }, [addToCart, setIsCartOpen]);

  const handleUpdateCartItem = useCallback((variantId: string, quantity: number, oldVariantId?: string) => {
    updateCartItem(variantId, quantity, oldVariantId);
  }, [updateCartItem]);

  const handleCreateRequisition = useCallback(async (details: any, cartOverride?: any[]) => {
    try {
      const finalCart = cartOverride || cart;
      await createRequisition(details, finalCart);
      useCartStore.getState().clearCart();
      setIsCartOpen(false);
      toast.success(details.isCompleted ? 'Đã tạo và hoàn thành phiếu yêu cầu!' : 'Đã tạo phiếu yêu cầu thành công!');
      navigate('/requisitions');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [cart, createRequisition, navigate, setIsCartOpen]);

  const handleFulfillRequisition = useCallback(async (formId: string, details: any) => {
    try {
      const result = await fulfillRequisition(formId, details);
      if (!result.success) {
        alert(result.message);
      } else {
        toast.success('Đã hoàn thành phiếu yêu cầu!');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [fulfillRequisition]);

  const handleConfirmReceipt = useCallback(async (formId: string) => {
    const notes = window.prompt("Nhập ghi chú nhận hàng (tuỳ chọn):");
    if (notes === null) return; // User cancelled

    try {
      await confirmRequisitionReceipt(formId, user?.name || 'Người dùng', notes);
      toast.success('Đã xác nhận nhận hàng thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xác nhận nhận hàng');
    }
  }, [confirmRequisitionReceipt, user]);

  const handleCreateReceipt = useCallback(async (receiptData: any) => {
    try {
      const { fulfilledReqIds } = await createReceipt({ ...receiptData, createdBy: user?.name || '' });
      let msg = 'Đã tạo Phiếu nhập kho thành công!';
      if (fulfilledReqIds && fulfilledReqIds.length > 0) msg += `\nHệ thống đã tự động cấp phát: ${fulfilledReqIds.join(', ')}`;
      alert(msg);
      navigate('/receipts');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [createReceipt, navigate, user]);

  const handleDeleteReceipt = useCallback(async (receiptId: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá phiếu nhập kho này không? ID: ${receiptId}. Hành động này sẽ hoàn trả lại số lượng tồn kho.`)) {
      await deleteReceipt(receiptId);
    }
  }, [deleteReceipt]);

  const handleEditReceipt = useCallback(async (receipt: any) => {
    setEditingReceipt(receipt);
  }, []);

  const handleCreateDeliveryNoteWrapper = useCallback(async (items: any, receiptId: string, shipperId: string) => {
    try {
      await createDelivery(items, receiptId, shipperId, user?.name || '');
      navigate('/deliveries');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [createDelivery, navigate, user]);

  const showDesktopNav = ['shop', 'warehouse-requisitions', 'requisitions', 'warehouse-request', 'receipts', 'admin', 'deliveries', 'create-delivery'].includes(currentView);

  if (!user) return <LoginPage />;

  if (isFetchingInitialData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu từ máy chủ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0 flex flex-col">
      <Toaster containerStyle={{ top: 80, right: 20 }} />

      {isActionLoading && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-30 flex flex-col items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent"></div>
            <span className="text-gray-800 font-medium">Đang xử lý...</span>
          </div>
        </div>
      )}

      <div className="contents print:hidden">
        <Header
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          onNavigate={handleNavigate}
          currentView={currentView}
          user={user}
          onLogout={logout}
        />

        {showDesktopNav && <DesktopNav onNavigate={handleNavigate} currentView={currentView} user={user} />}
      </div>

      <Suspense fallback={<div className="py-10 text-center text-gray-500">Đang tải nội dung...</div>}>
        <Routes>
          <Route path="/" element={
            <>
              {popularProducts.length > 0 && (
                <div className="bg-white pt-6 pb-2 sm:pb-4">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <PopularProductsSlider
                      products={popularProducts}
                      allProducts={products}
                      onAddToCart={handleAddToCart}
                      onImageClick={handleOpenGallery}
                    />
                  </div>
                </div>
              )}

              <div className="bg-white sm:bg-gray-50 pt-2 pb-4">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                </div>
              </div>

              <CategoryNav categories={allCategoriesForNav} activeCategory={category} onSelectCategory={setCategory} />
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-[calc(100vh-24rem)]">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Danh sách vật tư</h2>
                <ProductList
                  products={paginatedProducts}
                  onAddToCart={handleAddToCart}
                  totalProducts={filteredAndSortedProducts.length}
                  allProducts={products}
                  onImageClick={handleOpenGallery}
                />
                {totalPages > 1 && (
                  <div className="mt-auto pt-8 pb-4">
                    <Pagination currentPage={productCurrentPage} totalPages={totalPages} onPageChange={setProductCurrentPage} />
                  </div>
                )}
              </div>
            </>
          } />

          <Route path="/requisitions" element={
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <RequisitionListPage
                forms={requisitions}
                zones={zones}
                onFulfill={handleFulfillRequisition}
                onConfirmReceipt={handleConfirmReceipt}
                currentUser={user}
                cartItems={cart}
                allProducts={products}
                onCartRemove={removeFromCart}
                onCartUpdateItem={handleUpdateCartItem}
                onCreateRequisition={handleNavigateToCreateRequisition}
                onUpdateRequisition={updateRequisition}
                onDeleteRequisition={deleteRequisition}
              />
            </main>
          } />

          <Route path="/warehouse/requisitions" element={<CoreRequisitionListPage />} />

          <Route path="/warehouse/request" element={<CoreRequisitionPage />} />

          <Route path="/receipts" element={
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <ReceiptList
                receipts={receipts}
                products={products}
                onNavigate={handleNavigate}
                isReadOnly={user?.role === 'auditor'}
                onEditReceipt={handleEditReceipt}
                onDeleteReceipt={handleDeleteReceipt}
              />
            </main>
          } />


          <Route path="/admin" element={
            !["manager", "auditor"].includes(user?.role || "") ? <Navigate to="/" replace /> :
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <AdminPage
                products={products}
                categories={categories}
                zones={zones}
                users={users}
                initialTab={adminInitialTab}
                onNavigate={handleNavigate}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                onAddCategory={addCategory}
                onDeleteCategory={deleteCategory}
                onUpdateCategory={updateCategory}
                onReorderCategories={reorderCategories}
                onAddZone={addZone}
                onUpdateZone={updateZone}
                onDeleteZone={deleteZone}
                onAddUser={addUser}
                onUpdateUser={updateUser}
                onDeleteUser={deleteUser}
              />
            </main>
          } />

          <Route path="/receipts/create" element={
            user?.role !== "manager" ? <Navigate to="/" replace /> :
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <CreateReceiptPage
                user={user}
                products={products}
                categories={categories}
                onSubmit={handleCreateReceipt}
                onCancel={() => handleNavigate('receipts')}
                onAddProduct={addProduct}
              />
            </main>
          } />

          <Route path="/deliveries" element={
            !["manager", "auditor"].includes(user?.role || "") ? <Navigate to="/" replace /> :
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <DeliveryNoteList
                deliveryNotes={deliveries}
                products={products}
                currentUser={user}
                onNavigate={handleNavigate}
                createDeliveryNote={handleCreateDeliveryNoteWrapper as any}
                verifyDeliveryNote={verifyDelivery}
                rejectDeliveryNote={rejectDelivery}
                isReadOnly={user?.role !== 'manager'}
              />
            </main>
          } />

          <Route path="/deliveries/create" element={
            user?.role !== "manager" ? <Navigate to="/" replace /> :
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1">
              <CreateDeliveryNote
                user={user}
                products={products}
                receipts={receipts}
                onSubmit={handleCreateDeliveryNoteWrapper as any}
                onCancel={() => handleNavigate('deliveries')}
              />
            </main>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <div className="contents print:hidden">
        <BottomNav onNavigate={handleNavigate} currentView={currentView} user={user} />
      </div>
      <ImageGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} images={galleryImages} startIndex={galleryStartIndex} />
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          products={products}
          isOpen={true}
          onClose={() => setEditingReceipt(null)}
          onSave={updateReceipt}
        />
      )}

      <Suspense fallback={null}>
        <CreateRequisitionModal
          isOpen={isCartOpen}
          zones={zones}
          user={user}
          users={users}
          allProducts={products}
          cartItems={cart}
          onSubmit={handleCreateRequisition}
          onCancel={() => setIsCartOpen(false)}
          onUpdateItem={handleUpdateCartItem}
          onUpdateDetails={updateCartItemDetails}
          onRemoveItem={removeFromCart}
        />
      </Suspense>
    </div>
  );
};

export default App;
