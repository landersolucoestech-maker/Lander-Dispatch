import { useCallback, useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const read = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValueState] = useState<T>(read);

  useEffect(() => {
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string }>).detail;
      if (detail?.key === key) setValueState(read());
    };
    window.addEventListener("lander:persistent-state", onSync);
    return () => window.removeEventListener("lander:persistent-state", onSync);
  }, [key, read]);

  const setValue = useCallback((next: T | ((current: T) => T)) => {
    setValueState((current) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      window.dispatchEvent(new CustomEvent("lander:persistent-state", { detail: { key } }));
      return resolved;
    });
  }, [key]);

  return [value, setValue] as const;
}
