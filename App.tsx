import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
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
const CreateRequisitionPage = lazy(() => import('./components/CreateRequisitionPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const CreateReceiptPage = lazy(() => import('./components/CreateReceiptPage'));
const ReceiptList = lazy(() => import('./components/ReceiptList'));
const DeliveryNoteList = lazy(() => import('./components/DeliveryNoteList'));
const CreateDeliveryNote = lazy(() => import('./components/CreateDeliveryNote'));

const PRODUCTS_PER_PAGE = 12;

type ViewKey = 'shop' | 'requisitions' | 'receipts' | 'create-requisition' | 'admin' | 'create-receipt' | 'deliveries' | 'create-delivery';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Store
  const { user, login, logout, checkSession } = useAuthStore();
  
  // Cart Store
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateCartItem } = useCartStore();
  
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
    if (path === '/requisitions') return 'requisitions';
    if (path === '/requisitions/create') return 'create-requisition';
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
      case 'create-requisition': navigate('/requisitions/create'); break;
      case 'create-receipt': navigate('/receipts/create'); break;
      case 'create-delivery': navigate('/deliveries/create'); break;
      default: navigate(`/${view}`); break;
    }
  }, [navigate]);

  const handleAddToCart = useCallback((product: any, variant: any, quantity: number) => {
    addToCart(product, variant, quantity);
    toast.success(`Đã thêm ${product.name} (${quantity})`);
  }, [addToCart]);

  const handleUpdateCartItem = useCallback((variantId: string, quantity: number, oldVariantId?: string) => {
    updateCartItem(variantId, quantity, oldVariantId);
  }, [updateCartItem]);

  const handleCreateRequisition = useCallback(async (details: any) => {
    try {
      await createRequisition(details, cart);
      useCartStore.getState().clearCart();
      toast.success('Đã tạo phiếu yêu cầu thành công!');
      navigate('/requisitions');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [cart, createRequisition, navigate]);

  const handleNavigateToCreateRequisition = useCallback(() => {
    if (cartItemCount === 0) {
      alert('Vui lòng thêm vật tư vào phiếu trước khi tạo.');
      return;
    }
    navigate('/requisitions/create');
  }, [cartItemCount, navigate]);

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
    await updateReceipt(receipt.id, {}); // Shows alert for now
  }, [updateReceipt]);

  const handleCreateDeliveryNoteWrapper = useCallback(async (items: any, receiptId: string, shipperId: string) => {
    try {
      await createDelivery(items, receiptId, shipperId, user?.name || '');
      navigate('/deliveries');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [createDelivery, navigate, user]);

  const showDesktopNav = ['shop', 'requisitions', 'receipts', 'admin', 'deliveries', 'create-delivery'].includes(currentView);

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
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
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
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Danh sách vật tư</h2>
                <ProductList
                  products={paginatedProducts}
                  onAddToCart={handleAddToCart}
                  totalProducts={filteredAndSortedProducts.length}
                  allProducts={products}
                  onImageClick={handleOpenGallery}
                />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination currentPage={productCurrentPage} totalPages={totalPages} onPageChange={setProductCurrentPage} />
                  </div>
                )}
              </div>
            </>
          } />
          
          <Route path="/requisitions" element={
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          
          <Route path="/receipts" element={
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          
          <Route path="/requisitions/create" element={
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <CreateRequisitionPage zones={zones}
                user={user}
                allProducts={products}
                cartItems={cart}
                onSubmit={handleCreateRequisition}
                onCancel={() => navigate('/')}
                onUpdateItem={handleUpdateCartItem}
                onRemoveItem={removeFromCart}
              />
            </main>
          } />
          
          <Route path="/admin" element={
            !["manager", "auditor"].includes(user?.role || "") ? <Navigate to="/" replace /> :
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {isCartOpen && (
        <div className="relative z-50">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md bg-white shadow-xl flex flex-col">
                  <div className="flex items-start justify-between px-4 py-6 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Phiếu Yêu Cầu Tạm Thời</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                    <Cart
                      cartItems={cart}
                      allProducts={products}
                      onRemove={removeFromCart}
                      onUpdateItem={handleUpdateCartItem}
                      onCreateRequisition={() => { setIsCartOpen(false); handleNavigateToCreateRequisition(); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
