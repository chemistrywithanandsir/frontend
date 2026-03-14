import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { fetchMyBundles, type MyBundle } from "../api/razorpayApi";

export function useMyBundles() {
  const [bundles, setBundles] = useState<MyBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBundles([]);
        setLoading(false);
        return;
      }
      const data = await fetchMyBundles(token);
      setBundles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your bundles");
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bundles, loading, error, refetch };
}
