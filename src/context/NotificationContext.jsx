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
  const lastOrderRoundCounts = useRef(new Map()); // ✅ track round counts per order
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

        // Only AI bookings for booking notifications
        const aiBookings = bookings.filter(b => b.source !== "manual");

        // ✅ Include ALL active orders for kitchen notifications
        // (table dine-in + manual pickup/delivery, exclude completed/cancelled)
        const kitchenOrders = orders.filter(o =>
          ["confirmed", "preparing", "ready"].includes(o.status)
        );

        const newBookingIds = new Set(aiBookings.map(b => b._id));
        const newOrderIds = new Set(kitchenOrders.map(o => o._id));

        if (!initialized.current) {
          lastBookingIds.current = newBookingIds;
          lastOrderIds.current = newOrderIds;
          // ✅ Initialize round counts
          for (const order of kitchenOrders) {
            lastOrderRoundCounts.current.set(
              String(order._id),
              order.rounds?.length || 0
            );
          }
          initialized.current = true;
          return;
        }

        // Count new bookings
        let newBookings = 0;
        for (const id of newBookingIds) {
          if (!lastBookingIds.current.has(id)) newBookings++;
        }
        if (newBookings > 0) setBookingCount(prev => prev + newBookings);
        lastBookingIds.current = newBookingIds;

        // Count new orders AND new rounds on existing orders
        let newOrders = 0;
        for (const order of kitchenOrders) {
          const id = String(order._id);
          const currentRounds = order.rounds?.length || 0;

          if (!lastOrderIds.current.has(id)) {
            // Brand new order
            newOrders++;
          } else {
            // Existing order — check if a new round was added
            const prevRounds = lastOrderRoundCounts.current.get(id) || 0;
            if (currentRounds > prevRounds) {
              newOrders++; // ✅ New round = new notification
            }
          }

          // Update round count
          lastOrderRoundCounts.current.set(id, currentRounds);
        }

        // Clean up round counts for orders no longer active
        for (const id of lastOrderRoundCounts.current.keys()) {
          if (!newOrderIds.has(id)) {
            lastOrderRoundCounts.current.delete(id);
          }
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