import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

export interface POSCartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
}

interface POSCartStore {
  items: POSCartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getItemCount: () => number;
  hasItem: (productId: string) => boolean;
  getItem: (productId: string) => POSCartItem | undefined;
}

export const usePOSCartStore = create<POSCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.productId === product.id);
        const price = Number(product.price);
        const stock = Number(product.quantity);

        if (existingItem) {
          // Check stock availability
          if (existingItem.quantity >= stock) {
            return; // Cannot add more than available stock
          }

          set({
            items: items.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * item.price,
                  }
                : item
            ),
          });
        } else {
          // Add new item
          if (stock <= 0) {
            return; // Cannot add out-of-stock item
          }

          const newItem: POSCartItem = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price,
            quantity: 1,
            subtotal: price,
            stock,
          };

          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items } = get();
        const item = items.find((i) => i.productId === productId);

        if (!item) return;

        // Validate quantity
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        if (quantity > item.stock) {
          return; // Cannot exceed stock
        }

        set({
          items: items.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  quantity,
                  subtotal: quantity * i.price,
                }
              : i
          ),
        });
      },

      incrementQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item && item.quantity < item.stock) {
          get().updateQuantity(productId, item.quantity + 1);
        }
      },

      decrementQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) {
          get().updateQuantity(productId, item.quantity - 1);
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCartSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getCartTotal: () => {
        // For now, total = subtotal (can add tax calculation here)
        return get().getCartSubtotal();
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      hasItem: (productId: string) => {
        return get().items.some((item) => item.productId === productId);
      },

      getItem: (productId: string) => {
        return get().items.find((item) => item.productId === productId);
      },
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
