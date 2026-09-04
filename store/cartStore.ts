import { create } from 'zustand';
import { Product, Variant, CartItem } from '../types';

interface CartState {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product, variant: Variant, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  updateCartItem: (variantId: string, quantity: number, oldVariantId?: string) => void;
  updateCartItemDetails: (variantId: string, details: Partial<CartItem>) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  isCartOpen: false,
  setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

  addToCart: (product, variant, quantity) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.variant.id === variant.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.variant.id === variant.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, variant, quantity }] };
    });
  },

  removeFromCart: (variantId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.variant.id !== variantId),
    }));
  },

  updateCartItem: (variantId, quantity, oldVariantId) => {
    set((state) => {
      const prevCart = state.cart;
      const existingItemIndex = prevCart.findIndex((item) => item.variant.id === variantId);

      if (oldVariantId) {
        const oldItemIndex = prevCart.findIndex((item) => item.variant.id === oldVariantId);
        if (oldItemIndex === -1) return { cart: prevCart };

        const oldItem = prevCart[oldItemIndex];
        const newVariant = oldItem.product.variants.find((v) => v.id === variantId);

        if (!newVariant) return { cart: prevCart };

        if (existingItemIndex !== -1) {
          return {
            cart: prevCart
              .filter((_, index) => index !== oldItemIndex)
              .map((item, index) => {
                if (index === existingItemIndex) {
                  return { ...item, quantity: item.quantity + quantity };
                }
                return item;
              }),
          };
        }

        return {
          cart: prevCart.map((item, index) => {
            if (index === oldItemIndex) {
              return { ...item, variant: newVariant, quantity };
            }
            return item;
          }),
        };
      }

      return {
        cart: prevCart.map((item) => {
          if (item.variant.id === variantId) {
            return { ...item, quantity: Math.max(1, quantity) };
          }
          return item;
        }),
      };
    });
  },

  updateCartItemDetails: (variantId, details) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.variant.id === variantId ? { ...item, ...details } : item
      )
    }));
  },

  clearCart: () => set({ cart: [] }),
}));
