import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import FilterSortControls from './components/FilterSortControls';
import Chatbot from './components/Chatbot';
import CategoryNav from './components/CategoryNav';
import { Product, CartItem } from './types';
import { PRODUCTS, CATEGORIES } from './constants';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...PRODUCTS];

    // Filter by search term
    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (category !== 'All') {
      tempProducts = tempProducts.filter(p => p.category === category);
    }

    // Sort
    switch (sortOption) {
      case 'price-asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        tempProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        tempProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // No sort or sort by ID for stability
        tempProducts.sort((a,b) => a.id - b.id);
        break;
    }
    
    setProducts(tempProducts);
  }, [searchTerm, category, sortOption]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);


  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
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
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onSearch={setSearchTerm}/>
      <CategoryNav 
        categories={CATEGORIES}
        activeCategory={category}
        onSelectCategory={setCategory}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterSortControls 
          categories={CATEGORIES}
          onFilterChange={setCategory}
          onSortChange={setSortOption}
          selectedCategory={category}
          selectedSort={sortOption}
        />
        <ProductList products={products} onAddToCart={addToCart} />
      </main>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      <Chatbot allProducts={PRODUCTS} />
    </div>
  );
};

export default App;
