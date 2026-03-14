import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  openRazorpayCheckout,
} from "../api/razorpayApi";

export function useRazorpayPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const pay = useCallback(
    async (bundleId: string, bundleTitle: string) => {
      setError(null);
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError("Please sign in to purchase.");
          setLoading(false);
          return;
        }

        await loadRazorpayScript();
        const orderData = await createRazorpayOrder(bundleId, token);

        openRazorpayCheckout({
          keyId: orderData.keyId,
          orderId: orderData.order.id,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Chemistry by Anand",
          description: orderData.bundle.title,
          prefill: {
            email: session?.user?.email ?? undefined,
            name: session?.user?.user_metadata?.full_name ?? undefined,
          },
          onSuccess: async (response) => {
            try {
              await verifyRazorpayPayment(
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bundle_id: bundleId,
                },
                token
              );
              setLoading(false);
              navigate("/dashboard/my-notes", {
                state: { paymentSuccess: true, message: `"${bundleTitle}" is now in My Notes.` },
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Verification failed.");
              setLoading(false);
            }
          },
          onDismiss: () => {
            setLoading(false);
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start payment.");
        setLoading(false);
      }
    },
    [navigate]
  );

  return { pay, loading, error };
}
