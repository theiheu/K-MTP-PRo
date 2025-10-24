import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import CategoryNav from './components/CategoryNav';
import RequisitionListPage from './components/RequisitionListPage';
import RequisitionModal from './components/RequisitionModal';
import BottomNav from './components/BottomNav';
import { Product, CartItem, RequisitionForm } from './types';
import { PRODUCTS, CATEGORIES } from './constants';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  
  const [currentView, setCurrentView] = useState<'shop' | 'requisitions'>('shop');
  const [requisitionForms, setRequisitionForms] = useState<RequisitionForm[]>([]);


  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...PRODUCTS];

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
  }, [searchTerm, category]);

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

  const handleCreateRequisition = (details: { requesterName: string; zone: string; purpose: string }) => {
    const newForm: RequisitionForm = {
      id: `REQ-${Date.now()}`,
      ...details,
      items: cart,
      status: 'Đang chờ xử lý',
      createdAt: new Date().toISOString(),
    };
    setRequisitionForms(prev => [...prev, newForm]);
    setCart([]);
    setIsRequisitionModalOpen(false);
    setIsCartOpen(false);
    alert('Đã tạo phiếu yêu cầu thành công!');
    setCurrentView('requisitions');
  };
  
  const handleFulfillRequisition = (formId: string, fulfilledBy: string) => {
    setRequisitionForms(prev =>
      prev.map(form =>
        form.id === formId
          ? { ...form, status: 'Đã hoàn thành', fulfilledBy, fulfilledAt: new Date().toISOString() }
          : form
      )
    );
  };


  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16 sm:pb-0">
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        onSearch={setSearchTerm}
        onNavigate={setCurrentView}
        currentView={currentView}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'shop' && (
          <>
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
            />
        )}
      </main>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCreateRequisition={() => setIsRequisitionModalOpen(true)}
      />
      
      <RequisitionModal
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        onSubmit={handleCreateRequisition}
      />
      
      <BottomNav 
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <Chatbot allProducts={PRODUCTS} />
    </div>
  );
};

export default App;