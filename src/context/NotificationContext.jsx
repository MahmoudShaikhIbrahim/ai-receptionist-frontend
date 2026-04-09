// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getBookings, getOrders } from "../api/business";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext({});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const lastBookingIds = useRef(new Set());
  const lastOrderIds = useRef(new Set());
  const initialized = useRef(false);

  function clearBookings() { setBookingCount(0); }
  function clearOrders() { setOrderCount(0); }

  useEffect(() => {
    if (!token) return;

    async function poll() {
      try {
        const [bookingData, orderData] = await Promise.all([
          getBookings({ limit: 50 }),
          getOrders({ limit: 50 }),
        ]);

        const bookings = bookingData.bookings || bookingData.data || [];
        const orders = orderData.orders || orderData.data || [];

        // Exclude manual/walk-in bookings from notifications
        const aiBookings = bookings.filter(b => b.source !== "manual");

        // Exclude table orders (manual orders placed by staff) from notifications
        const aiOrders = orders.filter(o => !o.tableId);

        const newBookingIds = new Set(aiBookings.map(b => b._id));
        const newOrderIds = new Set(aiOrders.map(o => o._id));

        if (!initialized.current) {
          lastBookingIds.current = newBookingIds;
          lastOrderIds.current = newOrderIds;
          initialized.current = true;
          return;
        }

        // Count new AI bookings only
        let newBookings = 0;
        for (const id of newBookingIds) {
          if (!lastBookingIds.current.has(id)) newBookings++;
        }
        if (newBookings > 0) setBookingCount(prev => prev + newBookings);
        lastBookingIds.current = newBookingIds;

        // Count new AI orders only
        let newOrders = 0;
        for (const id of newOrderIds) {
          if (!lastOrderIds.current.has(id)) newOrders++;
        }
        if (newOrders > 0) setOrderCount(prev => prev + newOrders);
        lastOrderIds.current = newOrderIds;

      } catch {
        // silent fail
      }
    }

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <NotificationContext.Provider value={{ bookingCount, orderCount, clearBookings, clearOrders }}>
      {children}
    </NotificationContext.Provider>
  );
}