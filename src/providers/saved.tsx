import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadSavedIds, persistSavedIds } from "@/lib/saved";

interface SavedContextValue {
  ids: string[];
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

/** Device-local wishlist backing the Saved tab. */
export function SavedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    void loadSavedIds().then(setIds);
  }, []);

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [productId, ...prev];
      void persistSavedIds(next);
      return next;
    });
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({ ids, isSaved: (id: string) => ids.includes(id), toggle }),
    [ids, toggle],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used inside <SavedProvider>.");
  return context;
}
