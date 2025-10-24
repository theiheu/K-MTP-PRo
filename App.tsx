import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import CategoryNav from './components/CategoryNav';
import RequisitionListPage from './components/RequisitionListPage';
import CreateRequisitionPage from './components/CreateRequisitionPage';
import BottomNav from './components/BottomNav';
import SetupPage from './components/SetupPage'; // Đổi tên từ LoginPage
import { Product, CartItem, RequisitionForm, User } from './types';
import { PRODUCTS, CATEGORIES } from './constants';

const USER_STORAGE_KEY = 'chicken_farm_user';
const REQUISITIONS_STORAGE_KEY = 'chicken_farm_requisitions';
const PRODUCTS_STORAGE_KEY = 'chicken_farm_products';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [masterProductList, setMasterProductList] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return savedProducts ? JSON.parse(savedProducts) : PRODUCTS;
    } catch (error) {
      console.error("Không thể tải sản phẩm từ localStorage", error);
      return PRODUCTS;
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  
  const [currentView, setCurrentView] = useState<'shop' | 'requisitions' | 'create-requisition'>('shop');

  const [requisitionForms, setRequisitionForms] = useState<RequisitionForm[]>(() => {
    try {
        const savedRequisitions = localStorage.getItem(REQUISITIONS_STORAGE_KEY);
        return savedRequisitions ? JSON.parse(savedRequisitions) : [];
    } catch (error) {
        console.error("Không thể tải phiếu yêu cầu từ localStorage", error);
        return [];
    }
  });

  // Effect to load user
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Không thể đọc thông tin người dùng từ localStorage", error);
    }
    setIsInitializing(false);
  }, []);

  // Effect to save requisitions
  useEffect(() => {
    try {
        localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(requisitionForms));
    } catch (error) {
        console.error("Không thể lưu phiếu yêu cầu vào localStorage", error);
    }
  }, [requisitionForms]);

  // Effect to save products
  useEffect(() => {
    try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(masterProductList));
    } catch (error) {
        console.error("Không thể lưu sản phẩm vào localStorage", error);
    }
  }, [masterProductList]);


  const filterAndSortProducts = useCallback(() => {
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
    
    setProducts(tempProducts);
  }, [searchTerm, category, masterProductList]);

  useEffect(() => {
    setCategory(CATEGORIES[0]);
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      if (product.stock <= 0) {
        alert("Vật tư này đã hết hàng và không thể yêu cầu.");
        return prevCart;
      }

      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert(`Không thể yêu cầu nhiều hơn số lượng tồn kho (${product.stock}).`);
            return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const productInCart = cart.find(item => item.product.id === productId)?.product;
    if (!productInCart) return;

    let newQuantity = quantity;
    if (newQuantity > productInCart.stock) {
        alert(`Không thể yêu cầu nhiều hơn số lượng tồn kho (${productInCart.stock}).`);
        newQuantity = productInCart.stock;
    }
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
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
      id: `REQ-${Date.now()}`,
      ...details,
      items: cart,
      status: 'Đang chờ xử lý',
      createdAt: new Date().toISOString(),
    };
    setRequisitionForms(prev => [...prev, newForm]);
    setCart([]);
    alert('Đã tạo phiếu yêu cầu thành công!');
    setCurrentView('requisitions');
  };
  
  const handleFulfillRequisition = (formId: string, notes: string) => {
     if (!currentUser || currentUser.role !== 'manager') return;
     
     const formToFulfill = requisitionForms.find(form => form.id === formId);
     if (!formToFulfill || formToFulfill.status === 'Đã hoàn thành') {
        return;
     }

     // Cập nhật tồn kho sản phẩm
     setMasterProductList(currentProducts => {
        let newProducts = [...currentProducts];
        formToFulfill.items.forEach(reqItem => {
            newProducts = newProducts.map(p => 
                p.id === reqItem.product.id 
                    ? { ...p, stock: Math.max(0, p.stock - reqItem.quantity) } 
                    : p
            );
        });
        return newProducts;
     });

     // Cập nhật trạng thái phiếu yêu cầu
    setRequisitionForms(prev =>
      prev.map(form =>
        form.id === formId
          ? { 
              ...form, 
              status: 'Đã hoàn thành', 
              fulfilledBy: currentUser.name, 
              fulfilledAt: new Date().toISOString(),
              fulfillmentNotes: notes
            }
          : form
      )
    );
    alert(`Đã xác nhận cung cấp thành công cho phiếu ${formId}. Tồn kho đã được cập nhật.`);
  };

  const handleUserSetup = (user: User) => {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        setCurrentUser(user);
    } catch (error) {
        console.error("Không thể lưu thông tin người dùng vào localStorage", error);
        alert("Đã xảy ra lỗi khi lưu thông tin của bạn. Vui lòng thử lại.");
    }
  };

  const handleResetUser = () => {
    try {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(REQUISITIONS_STORAGE_KEY);
        localStorage.removeItem(PRODUCTS_STORAGE_KEY);
        setCurrentUser(null);
        setCurrentView('shop');
        setCart([]);
        setRequisitionForms([]);
        setMasterProductList(PRODUCTS);
    } catch (error) {
        console.error("Không thể xóa dữ liệu người dùng khỏi localStorage", error);
    }
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  }

  if (!currentUser) {
    return <SetupPage onSetup={handleUserSetup} />;
  }

  const isFocusedView = currentView === 'create-requisition';

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16 sm:pb-0">
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        onNavigate={setCurrentView}
        currentView={currentView}
        user={currentUser}
        onResetUser={handleResetUser}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'shop' && (
          <>
            <div className="mb-6">
              <label htmlFor="search" className="sr-only">Tìm kiếm vật tư</label>
              <div className="relative text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border-0 bg-white py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Tìm kiếm vật tư..."
                  type="search"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <CategoryNav 
              categories={CATEGORIES}
              activeCategory={category}
              onSelectCategory={setCategory}
            />
            <div className="mt-8">
              <ProductList products={products} onAddToCart={addToCart} />
            </div>
          </>
        )}
        {currentView === 'requisitions' && (
            <RequisitionListPage 
                forms={requisitionForms}
                onFulfill={handleFulfillRequisition}
                currentUser={currentUser}
            />
        )}
        {currentView === 'create-requisition' && (
           <CreateRequisitionPage
              user={currentUser}
              cartItems={cart}
              onSubmit={handleCreateRequisition}
              onCancel={() => setCurrentView('shop')}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
           />
        )}
      </main>

      {(currentUser.role === 'requester' || currentUser.role === 'manager') && !isFocusedView && (
        <Cart 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            cartItems={cart}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onCreateRequisition={handleNavigateToCreateRequisition}
        />
      )}
      
      {!isFocusedView && (
        <BottomNav 
          onNavigate={setCurrentView}
          currentView={currentView}
        />
      )}
      
      {!isFocusedView && <Chatbot allProducts={masterProductList} />}
    </div>
  );
};

export default App;