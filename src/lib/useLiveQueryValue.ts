import { liveQuery } from "dexie";
import { useEffect, useState, type DependencyList } from "react";

export const useLiveQueryValue = <T,>(
  query: () => PromiseLike<T> | T,
  deps: DependencyList,
  initialValue: T,
) => {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() => Promise.resolve(query())).subscribe({
      next: (nextValue) => {
        setValue(nextValue);
        setError(null);
      },
      error: (nextError) => {
        setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
      },
    });

    return () => subscription.unsubscribe();
    // The caller owns dependency selection because the query function is usually inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { value, error };
};
