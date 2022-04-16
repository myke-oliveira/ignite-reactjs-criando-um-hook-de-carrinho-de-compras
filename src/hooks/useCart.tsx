import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      if (cart.some(product => product.id === productId)) {
        setCart(cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            };
          }
          return product;
        }));
        return;
      }
      const response = await api.get(`/products/${productId}`)
      const product = response.data as Product;
      if (!product) {
        throw new Error("Product not found.")
      }
      setCart([...cart, {...product, amount: 1}])
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast("Erro na adição do produtoS");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(product => product.id !== productId));
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast("Erro ao remover produto.");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw new Error("Invalid value");
      }
      setCart(cart.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product;
      }));
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast("Erro ao atualizar produto.");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
