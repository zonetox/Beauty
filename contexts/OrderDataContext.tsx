import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Order, OrderStatus } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { useAdminPlatform } from './AdminPlatformContext.tsx';
import { useAdminAuth } from './AuthContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';

interface OrderDataContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}

const OrderDataContext = createContext<OrderDataContextType | undefined>(undefined);

// Helper to convert camelCase to snake_case for Supabase inserts
const toSnakeCase = <T,>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase) as unknown as T;
  return Object.keys(obj as object).reduce((acc: Record<string, unknown>, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    return acc;
  }, {}) as unknown as T;
};

export const OrderDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { logAdminAction } = useAdminPlatform();
  const { currentUser: currentAdmin } = useAdminAuth();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('submitted_at', { ascending: false });
    if (error) {
      console.error("Error fetching orders:", error);
    } else if (data) {
      setOrders(snakeToCamel(data) as Order[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);


  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => {
    const { data, error } = await supabase.from('orders').insert(toSnakeCase(newOrderData)).select().single();

    if (error || !data) {
      console.error("Error adding order:", error);
      throw new Error("Failed to create order.");
    }

    const newOrder = snakeToCamel(data) as Order;
    setOrders(prev => [newOrder, ...prev]);
    if (currentAdmin) {
      logAdminAction(currentAdmin.username, 'Create Order', `New order created for ${newOrder.businessName} for package ${newOrder.packageName}.`);
    }
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updates: Partial<Order> = {
      status: newStatus,
      confirmedAt: newStatus === OrderStatus.COMPLETED ? new Date().toISOString() : orderToUpdate.confirmedAt,
      notes: notes || orderToUpdate.notes,
    };

    const { data, error } = await supabase.from('orders').update(toSnakeCase(updates)).eq('id', orderId).select().single();

    if (!error && data) {
      const updatedOrder = snakeToCamel(data) as Order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      if (currentAdmin) {
        if (newStatus === OrderStatus.COMPLETED) {
          logAdminAction(currentAdmin.username, 'Confirm Payment', `Confirmed payment for Order #${orderId} (${orderToUpdate.businessName}).`);
        } else if (newStatus === OrderStatus.REJECTED) {
          logAdminAction(currentAdmin.username, 'Reject Payment', `Rejected payment for Order #${orderId} (${orderToUpdate.businessName}).`);
        }
      }
    } else {
      console.error("Error updating order status:", error);
    }
  };


  return (
    <OrderDataContext.Provider value={{ orders, loading, addOrder, updateOrderStatus }}>
      {children}
    </OrderDataContext.Provider>
  );
};

export const useOrderData = () => {
  const context = useContext(OrderDataContext);
  if (!context) {
    throw new Error('useOrderData must be used within an OrderDataProvider');
  }
  return context;
};