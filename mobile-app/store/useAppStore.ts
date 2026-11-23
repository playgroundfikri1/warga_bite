import { create } from "zustand";
import type { AppRole } from "@/types/database";

export interface CartItem {
  productId: string;
  sellerId: string;
  sellerComplexId: string;
  shopName: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface AppState {
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => {
    ok: boolean;
    reason?: "DIFFERENT_SELLER";
  };
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeRole: "customer",
  setActiveRole: (role) => set({ activeRole: role }),
  cart: [],
  addToCart: (item, quantity = 1) => {
    const currentCart = get().cart;
    if (currentCart.length > 0 && currentCart[0].sellerId !== item.sellerId) {
      return { ok: false, reason: "DIFFERENT_SELLER" };
    }

    const existing = currentCart.find((c) => c.productId === item.productId);
    if (existing) {
      set({
        cart: currentCart.map((c) =>
          c.productId === item.productId
            ? { ...c, quantity: c.quantity + quantity }
            : c
        ),
      });
    } else {
      set({ cart: [...currentCart, { ...item, quantity }] });
    }
    return { ok: true };
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((c) => c.productId !== productId) });
      return;
    }
    set({
      cart: get().cart.map((c) =>
        c.productId === productId ? { ...c, quantity } : c
      ),
    });
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.productId !== productId) });
  },
  clearCart: () => set({ cart: [] }),
  getCartTotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
