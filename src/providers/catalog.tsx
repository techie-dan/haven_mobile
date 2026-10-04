import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getProducts } from "@/lib/catalog";
import type { Product } from "@/lib/types";

interface CatalogContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bySlug: (slug: string) => Product | undefined;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

const describeError = (err: unknown) =>
  err instanceof Error ? err.message : "Could not reach the catalogue.";

/** Loads the shared catalogue once for the whole app. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getProducts();
      setProducts(next);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // State is only touched from promise callbacks, never synchronously in the
  // effect body, so mounting does not trigger a cascading render.
  useEffect(() => {
    let active = true;

    getProducts()
      .then((next) => {
        if (!active) return;
        setProducts(next);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(describeError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      error,
      refresh,
      bySlug: (slug: string) => products.find((p) => p.slug === slug),
    }),
    [products, loading, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside <CatalogProvider>.");
  return context;
}
