import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { fetchMyBundles, type MyBundle } from "../api/razorpayApi";

let lastMyBundlesSnapshot: MyBundle[] | null = null;

export function useMyBundles() {
  const [bundles, setBundles] = useState<MyBundle[]>(lastMyBundlesSnapshot ?? []);
  const [loading, setLoading] = useState(lastMyBundlesSnapshot === null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (lastMyBundlesSnapshot === null) {
      setLoading(true);
    }
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBundles([]);
        lastMyBundlesSnapshot = [];
        setLoading(false);
        return;
      }
      const data = await fetchMyBundles(token);
      setBundles(data);
      lastMyBundlesSnapshot = data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your bundles");
      setBundles([]);
      lastMyBundlesSnapshot = [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bundles, loading, error, refetch };
}
