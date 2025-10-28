import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import RequisitionListPage from './components/RequisitionListPage';
import CreateRequisitionPage from './components/CreateRequisitionPage';
import AdminPage from './components/AdminPage';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';
import LoginPage from './components/LoginPage';
import Pagination from './components/Pagination';
import SearchBar from './components/SearchBar';
import CategoryNav from './components/CategoryNav';
import { Product, CartItem, RequisitionForm, User, Category, Variant } from './types';
import { PRODUCTS, DEFAULT_CATEGORIES } from './constants';
import { calculateVariantStock } from './utils/stockCalculator';

const USER_STORAGE_key = 'chicken_farm_user';
const REQUISITIONS_STORAGE_key = 'chicken_farm_requisitions';
const PRODUCTS_STORAGE_key = 'chicken_farm_products';
const CATEGORIES_STORAGE_KEY = 'chicken_farm_categories';

const PRODUCTS_PER_PAGE = 10; // Giảm để kích hoạt phân trang

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [masterProductList, setMasterProductList] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_key);
      return savedProducts ? JSON.parse(savedProducts) : PRODUCTS;
    } catch (error) {
      console.error("Không thể tải sản phẩm từ localStorage", error);
      return PRODUCTS;
    }
  });
  
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const parsed = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
      return parsed.filter((c: Category) => c.name !== 'Tất cả');
    } catch (error) {
      console.error("Không thể tải danh mục từ localStorage", error);
      return DEFAULT_CATEGORIES.filter(c => c.name !== 'Tất cả');
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  
  const [currentView, setCurrentView] = useState<'shop' | 'requisitions' | 'create-requisition' | 'admin'>('shop');

  const [requisitionForms, setRequisitionForms] = useState<RequisitionForm[]>(() => {
    try {
        const savedRequisitions = localStorage.getItem(REQUISITIONS_STORAGE_key);
        return savedRequisitions ? JSON.parse(savedRequisitions) : [];
    } catch (error) {
        console.error("Không thể tải phiếu yêu cầu từ localStorage", error);
        return [];
    }
  });
  

  // Effects for localStorage...
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_key);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Không thể đọc thông tin người dùng từ localStorage", error);
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentUser, currentView, productCurrentPage]); 

  useEffect(() => {
    try {
        const requisitionsToSave = requisitionForms.map(form => {
            const sanitizedItems = form.items.map(cartItem => {
                const { product, variant, ...restOfCartItem } = cartItem;
                const sanitizeImages = (images: string[] | undefined) => (images || []).filter(img => !img.startsWith('data:image'));
                const sanitizedProductVariants = product.variants.map(v => ({ ...v, images: sanitizeImages(v.images) }));
                const sanitizedProduct = { ...product, images: sanitizeImages(product.images), variants: sanitizedProductVariants };
                const sanitizedVariant = { ...variant, images: sanitizeImages(variant.images) };
                return { ...restOfCartItem, product: sanitizedProduct, variant: sanitizedVariant };
            });
            return { ...form, items: sanitizedItems };
        });
        localStorage.setItem(REQUISITIONS_STORAGE_key, JSON.stringify(requisitionsToSave));
    } catch (error) {
        console.error("Không thể lưu phiếu yêu cầu vào localStorage", error);
    }
  }, [requisitionForms]);

  useEffect(() => {
    try {
        const productsToSave = masterProductList.map(product => {
            const sanitizeImages = (images: string[] | undefined) => (images || []).filter(img => !img.startsWith('data:image'));
            const sanitizedVariants = product.variants.map(variant => ({ ...variant, images: sanitizeImages(variant.images) }));
            return { ...product, images: sanitizeImages(product.images), variants: sanitizedVariants };
        });
        localStorage.setItem(PRODUCTS_STORAGE_key, JSON.stringify(productsToSave));
    } catch (error) {
        console.error("Không thể lưu sản phẩm vào localStorage", error);
    }
  }, [masterProductList]);

  useEffect(() => {
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
        console.error("Không thể lưu danh mục vào localStorage", error);
    }
  }, [categories]);

  useEffect(() => {
    setProductCurrentPage(1);
  }, [searchTerm, category]);

  const getFilteredAndSortedProducts = useCallback(() => {
    let tempProducts = [...masterProductList];
    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (category !== 'Tất cả') {
      tempProducts = tempProducts.filter(p => p.category === category);
    }
    return tempProducts;
  }, [searchTerm, category, masterProductList]);
  
  const addToCart = (product: Product, variant: Variant, quantity: number) => {
    setCart(prevCart => {
      // Stock check logic will be handled within components based on calculated stock.
      const existingItemIndex = prevCart.findIndex(item => item.variant.id === variant.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      }
      return [...prevCart, { product, variant, quantity }];
    });
  };

  const removeFromCart = (variantId: number) => {
    setCart(prevCart => prevCart.filter(item => item.variant.id !== variantId));
  };
  
  const updateCartItem = (variantId: number, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.variant.id !== variantId) return item;
        // Stock checks are now more complex and better handled at the point of action.
        // We'll trust the input for now, or add more complex validation if needed.
        let newQuantity = Math.max(1, quantity);
        return { ...item, quantity: newQuantity };
      })
    );
  };
  
  const handleNavigateToCreateRequisition = () => {
    if (cart.length === 0) {
      alert("Vui lòng thêm vật tư vào phiếu trước khi tạo.");
      return;
    }
    setIsCartOpen(false);
    setCurrentView('create-requisition');
  };

  const handleCreateRequisition = (details: { requesterName: string, zone: string; purpose: string }) => {
    if (!currentUser) return;
    const newForm: RequisitionForm = {
      id: `REQ-${Date.now()}`, ...details, items: cart,
      status: 'Đang chờ xử lý', createdAt: new Date().toISOString(),
    };
    setRequisitionForms(prev => [newForm, ...prev]);
    setCart([]);
    alert('Đã tạo phiếu yêu cầu thành công!');
    setCurrentView('requisitions');
  };

  const handleFulfillRequisition = (formId: string, details: { notes: string; fulfillerName: string }) => {
      const formToFulfill = requisitionForms.find(f => f.id === formId);
      if (!formToFulfill) {
          alert("Lỗi: Không tìm thấy phiếu yêu cầu.");
          return;
      }
  
      const updatedProductList = JSON.parse(JSON.stringify(masterProductList));
      let stockSufficient = true;
      const stockErrors: string[] = [];
  
      // Check stock sufficiency first
      for (const item of formToFulfill.items) {
          const currentStock = calculateVariantStock(item.variant, updatedProductList);
          if (currentStock < item.quantity) {
              const variantName = Object.values(item.variant.attributes).join(' / ') || '';
              stockErrors.push(`- Không đủ tồn kho cho "${item.product.name}" ${variantName}. Yêu cầu ${item.quantity}, còn lại ${currentStock}.`);
              stockSufficient = false;
          }
      }
  
      if (!stockSufficient) {
          alert("Không thể hoàn thành phiếu:\n" + stockErrors.join("\n"));
          return;
      }
  
      // If stock is sufficient, deduct it
      formToFulfill.items.forEach(item => {
          const isComposite = item.variant.components && item.variant.components.length > 0;
          const parentProductIndex = updatedProductList.findIndex((p: Product) => p.id === item.product.id);
          if (parentProductIndex === -1) return;

          if (isComposite) {
              item.variant.components!.forEach(component => {
                  const componentVariantIndex = updatedProductList[parentProductIndex].variants.findIndex((v: Variant) => v.id === component.variantId);
                  if (componentVariantIndex !== -1) {
                      updatedProductList[parentProductIndex].variants[componentVariantIndex].stock -= item.quantity * component.quantity;
                  }
              });
          } else {
              const variantIndex = updatedProductList[parentProductIndex].variants.findIndex((v: Variant) => v.id === item.variant.id);
              if (variantIndex !== -1) {
                  updatedProductList[parentProductIndex].variants[variantIndex].stock -= item.quantity;
              }
          }
      });
  
      setMasterProductList(updatedProductList);
      setRequisitionForms(prev => prev.map(form =>
          form.id === formId ? { ...form, status: 'Đã hoàn thành', fulfilledBy: details.fulfillerName, fulfillmentNotes: details.notes, fulfilledAt: new Date().toISOString() } : form
      ));
      alert('Đã hoàn thành phiếu yêu cầu thành công!');
  };

  const handleAddProduct = (productData: Omit<Product, 'id'>) => setMasterProductList(prev => [...prev, { ...productData, id: Date.now() }]);
  const handleUpdateProduct = (updatedProduct: Product) => setMasterProductList(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const handleDeleteProduct = (productId: number) => setMasterProductList(prev => prev.filter(p => p.id !== productId));
  const handleAddCategory = (category: Category) => {
    if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) { alert("Một danh mục với tên này đã tồn tại."); return; }
    setCategories(prev => [...prev, category]);
  };
  const handleDeleteCategory = (categoryName: string): boolean => {
    if (masterProductList.some(p => p.category === categoryName)) return false;
    setCategories(prev => prev.filter(c => c.name !== categoryName));
    return true;
  };

  const handleUpdateCategory = (originalName: string, updatedCategory: Category) => {
    if (originalName !== updatedCategory.name && categories.some(c => c.name.toLowerCase() === updatedCategory.name.toLowerCase())) {
      alert("Một danh mục với tên này đã tồn tại.");
      return;
    }
    setCategories(prev => prev.map(c => (c.name === originalName ? updatedCategory : c)));
    if (originalName !== updatedCategory.name) {
      setMasterProductList(prev =>
        prev.map(p => (p.category === originalName ? { ...p, category: updatedCategory.name } : p))
      );
    }
  };

  const handleReorderCategories = (reorderedCategories: Category[]) => {
    setCategories(reorderedCategories);
  };
  
  const handleLogin = (user: User) => {
    try { localStorage.setItem(USER_STORAGE_key, JSON.stringify(user)); setCurrentUser(user); }
    catch (error) { console.error("Không thể lưu thông tin người dùng vào localStorage", error); alert("Đã xảy ra lỗi khi lưu thông tin của bạn."); }
  };
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      try { localStorage.removeItem(USER_STORAGE_key); setCurrentUser(null); }
      catch (error) { console.error("Không thể xóa thông tin người dùng khỏi localStorage", error); }
    }
  };

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
  
  const showDesktopNav = ['shop', 'requisitions', 'admin'].includes(currentView);

  const renderContent = () => {
    switch (currentView) {
      case 'shop': {
        const filteredAndSortedProducts = getFilteredAndSortedProducts();
        const paginatedProducts = filteredAndSortedProducts.slice(
            (productCurrentPage - 1) * PRODUCTS_PER_PAGE,
            productCurrentPage * PRODUCTS_PER_PAGE
        );
        const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);

        const allCategoriesForNav: Category[] = [
            { name: 'Tất cả', icon: '' },
            ...categories
        ];

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
      }
      case 'requisitions':
        return ( <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6"> <RequisitionListPage forms={requisitionForms} onFulfill={handleFulfillRequisition} currentUser={currentUser!} /> </main> );
      case 'create-requisition':
         return ( <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6"> <CreateRequisitionPage user={currentUser} allProducts={masterProductList} cartItems={cart} onSubmit={handleCreateRequisition} onCancel={() => setCurrentView('shop')} onUpdateItem={updateCartItem} onRemoveItem={removeFromCart} /> </main> );
      case 'admin':
         return ( <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6"> <AdminPage products={masterProductList} categories={categories} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onUpdateCategory={handleUpdateCategory} onReorderCategories={handleReorderCategories} /> </main> );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Header 
        cartItemCount={cart.reduce((total, item) => total + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)} 
        onNavigate={setCurrentView}
        currentView={currentView}
        user={currentUser}
        onLogout={handleLogout}
      />
      {showDesktopNav && (
        <DesktopNav
          onNavigate={setCurrentView}
          currentView={currentView}
          user={currentUser}
        />
      )}
      {renderContent()}
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
      <BottomNav onNavigate={setCurrentView} currentView={currentView} user={currentUser} />
    </div>
  );
};

export default App;
