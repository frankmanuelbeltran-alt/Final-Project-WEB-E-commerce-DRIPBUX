import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price_robux: number;
  image_url: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, size: string, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: number, size: string, quantity: number) => {
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, size, quantity }),
    });
    await refreshCart();
  };

  const removeItem = async (id: number) => {
    await fetch(`/api/cart/item/${id}`, { method: 'DELETE' });
    await refreshCart();
  };

  const total = items.reduce((acc, item) => acc + item.price_robux * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, refreshCart, addToCart, removeItem, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
