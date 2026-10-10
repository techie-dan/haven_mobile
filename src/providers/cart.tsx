import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuth } from "@/providers/auth";
import { useCatalog } from "@/providers/catalog";
import {
  clearServerCart,
  deleteCartItem,
  fetchCartRows,
  mergeGuestLines,
  upsertCartItem,
} from "@/lib/cart";
import { cartCount, cartSubtotalCents } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "haven.cart.v1";

type CartAction =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; product: Product; quantity: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

function reducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const existing = state.find((l) => l.product.id === action.product.id);
      if (existing) {
        return state.map((l) =>
          l.product.id === action.product.id
            ? { ...l, quantity: Math.min(10, l.quantity + action.quantity) }
            : l,
        );
      }
      return [...state, { product: action.product, quantity: Math.min(10, action.quantity) }];
    }
    case "setQuantity":
      if (action.quantity <= 0) return state.filter((l) => l.product.id !== action.productId);
      return state.map((l) =>
        l.product.id === action.productId
          ? { ...l, quantity: Math.min(10, action.quantity) }
          : l,
      );
    case "remove":
      return state.filter((l) => l.product.id !== action.productId);
    case "clear":
      return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  hydrated: boolean;
  synced: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { products, loading: catalogLoading } = useCatalog();
  const userId = user?.id ?? null;

  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);

  const linesRef = useRef(lines);
  const productsRef = useRef(products);
  const mutatedBeforeHydration = useRef(false);
  const mergedForUser = useRef<string | null>(null);
  const hadUser = useRef(false);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const persistLocal = useCallback((next: CartLine[]) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const mapRows = useCallback(
    (rows: { product_id: string; quantity: number }[]): CartLine[] =>
      rows
        .map((row) => {
          const product = productsRef.current.find((p) => p.id === row.product_id);
          if (!product) return null;
          return { product, quantity: Math.min(10, Math.max(1, row.quantity)) } satisfies CartLine;
        })
        .filter((line): line is CartLine => line !== null),
    [],
  );

  const applyServerRows = useCallback(
    (rows: { product_id: string; quantity: number }[]) => {
      const next = mapRows(rows);
      mutatedBeforeHydration.current = true;
      dispatch({ type: "hydrate", lines: next });
      persistLocal(next);
    },
    [mapRows, persistLocal],
  );

  // Resolve the cart once per identity. Signed-in customers share the account
  // cart with the website and receive Realtime updates from it.
  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const readLocal = async (): Promise<CartLine[]> => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CartLine[];
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((line) => {
            const product = productsRef.current.find((p) => p.id === line.product.id);
            if (!product) return null;
            return { product, quantity: Math.min(10, Math.max(1, line.quantity)) } satisfies CartLine;
          })
          .filter((line): line is CartLine => line !== null);
      } catch {
        return [];
      }
    };

    const restoreLocal = async () => {
      const local = await readLocal();
      if (cancelled) return;
      dispatch({
        type: "hydrate",
        lines: mutatedBeforeHydration.current ? linesRef.current : local,
      });
      setSynced(false);
      setHydrated(true);
    };

    async function boot() {
      // Wait for the catalogue: server rows are only ids until products resolve.
      if (catalogLoading) return;

      if (!supabase || !userId) {
        if (hadUser.current) {
          // Signed out: the basket belongs to the account and stays server-side,
          // so it does not leak to the next guest on a shared device.
          hadUser.current = false;
          await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          dispatch({ type: "hydrate", lines: [] });
          setSynced(false);
          setHydrated(true);
          return;
        }
        await restoreLocal();
        return;
      }
      hadUser.current = true;

      try {
        const local = await readLocal();
        // Fold the device cart in once per identity, never on a catalogue refresh.
        if (local.length > 0 && mergedForUser.current !== userId) {
          await mergeGuestLines(userId, local);
          mergedForUser.current = userId;
        }

        const client = supabase;
        const rows = await fetchCartRows(userId);
        if (cancelled) return;

        applyServerRows(rows);
        setSynced(true);
        setHydrated(true);

        channel = client
          .channel(`cart:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              void fetchCartRows(userId)
                .then((next) => {
                  if (!cancelled) applyServerRows(next);
                })
                .catch((error) => console.error("[cart] realtime refetch failed:", error));
            },
          )
          .subscribe((status) => {
            // Fires on the first subscribe and again after every reconnect
            // (iOS suspends the socket when the app is backgrounded, and
            // events broadcast in that window are lost). Re-reading the rows
            // here means a basket edited on the website is never missed —
            // it appears the moment the app comes back.
            if (status !== "SUBSCRIBED") return;
            void fetchCartRows(userId)
              .then((next) => {
                if (!cancelled) applyServerRows(next);
              })
              .catch((error) => console.error("[cart] post-subscribe refetch failed:", error));
          });
      } catch (error) {
        console.error("[cart] could not sync with Supabase; using local cart:", error);
        await restoreLocal();
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [userId, applyServerRows, catalogLoading, products]);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      const next = reducer(linesRef.current, { type: "add", product, quantity });
      if (!hydrated) mutatedBeforeHydration.current = true;
      dispatch({ type: "add", product, quantity });
      persistLocal(next);

      if (userId) {
        const merged = next.find((l) => l.product.id === product.id);
        void upsertCartItem(userId, product.id, merged?.quantity ?? quantity).catch((error) =>
          console.error("[cart] failed to save item:", error),
        );
      }
    },
    [hydrated, persistLocal, userId],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const next = reducer(linesRef.current, { type: "setQuantity", productId, quantity });
      if (!hydrated) mutatedBeforeHydration.current = true;
      dispatch({ type: "setQuantity", productId, quantity });
      persistLocal(next);

      if (userId) {
        const write =
          quantity <= 0
            ? deleteCartItem(userId, productId)
            : upsertCartItem(userId, productId, quantity);
        void write.catch((error) => console.error("[cart] failed to update item:", error));
      }
    },
    [hydrated, persistLocal, userId],
  );

  const removeItem = useCallback(
    (productId: string) => {
      const next = reducer(linesRef.current, { type: "remove", productId });
      if (!hydrated) mutatedBeforeHydration.current = true;
      dispatch({ type: "remove", productId });
      persistLocal(next);

      if (userId) {
        void deleteCartItem(userId, productId).catch((error) =>
          console.error("[cart] failed to remove item:", error),
        );
      }
    },
    [hydrated, persistLocal, userId],
  );

  const clear = useCallback(() => {
    const next = reducer(linesRef.current, { type: "clear" });
    if (!hydrated) mutatedBeforeHydration.current = true;
    dispatch({ type: "clear" });
    persistLocal(next);

    if (userId) {
      void clearServerCart(userId).catch((error) =>
        console.error("[cart] failed to clear cart:", error),
      );
    }
  }, [hydrated, persistLocal, userId]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotalCents: cartSubtotalCents(lines),
      hydrated,
      synced,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [lines, hydrated, synced, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
