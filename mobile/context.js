import { createContext, useContext } from 'react';

export const AuthCtx = createContext(null);
export const CartCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
export const useCart = () => useContext(CartCtx);
