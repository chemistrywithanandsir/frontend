const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/** Ask backend to compute and store page counts for notes in this bundle (for notes with no count yet). */
export async function ensureBundlePageCounts(bundleId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/bundles/${encodeURIComponent(bundleId)}/ensure-page-counts`, {
    method: "POST",
  });
  if (!res.ok) return;
  await res.json();
}

export type CreateOrderResponse = {
  keyId: string;
  order: { id: string; amount: number; currency: string };
  bundle: { id: string; title: string; description: string; examCode: string };
};

export async function createRazorpayOrder(
  bundleId: string,
  token: string
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bundle_id: bundleId }),
  });
  const json = await res.json();
  if (!res.ok) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : Array.isArray(json.detail)
          ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
          : "Failed to create order";
    throw new Error(detail);
  }
  return json as CreateOrderResponse;
}

export type VerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bundle_id: string;
};

export async function verifyRazorpayPayment(
  payload: VerifyPayload,
  token: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/payments/razorpay/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : Array.isArray(json.detail)
          ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
          : "Payment verification failed";
    throw new Error(detail);
  }
  return json as { ok: boolean; message?: string };
}

export type MyBundleChapter = {
  id: string;
  title: string;
  pageCount: number;
  chemistryType: "Organic" | "Inorganic" | "Physical";
  /** For CBSE: Chemistry | Physics | Maths */
  subject?: string | null;
  pdfUrl?: string | null;
  thumbnailUrl?: string | null;
};

export type MyBundle = {
  id: string;
  title: string;
  examCode: string;
  displayExamLabel?: string;
  description: string;
  priceInRupees: number;
  thumbnailUrl?: string | null;
  chapters: MyBundleChapter[];
};

export async function fetchMyBundles(token: string): Promise<MyBundle[]> {
  const res = await fetch(`${API_BASE}/notes/my-bundles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : "Failed to load your bundles";
    throw new Error(detail);
  }
  return (json.bundles ?? []) as MyBundle[];
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, string>) => void) => void;
    };
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout(
  options: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill?: { name?: string; email?: string; contact?: string };
    onSuccess: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    onDismiss?: () => void;
  }
): void {
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay script not loaded. Call loadRazorpayScript() first.");
  }
  const rzp = new Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: "Chemistry by Anand",
    description: options.description,
    order_id: options.orderId,
    prefill: options.prefill ?? {},
    theme: { color: "#22d3ee" },
    handler: (response: Record<string, string>) => {
      options.onSuccess({
        razorpay_order_id: response.razorpay_order_id ?? "",
        razorpay_payment_id: response.razorpay_payment_id ?? "",
        razorpay_signature: response.razorpay_signature ?? "",
      });
    },
    modal: {
      ondismiss: options.onDismiss ?? (() => {}),
    },
  });
  rzp.open();
}
