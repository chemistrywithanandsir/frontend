import { supabase } from "../../lib/supabaseClient";
import {
  readClientCache,
  removeClientCacheByPrefix,
  writeClientCache,
} from "../utils/clientCache";

const PURCHASES_CACHE_PREFIX = "purchases_v1:";
const PURCHASES_CACHE_TTL_MS = 1000 * 60 * 10;

export type UserPurchase = {
  id: string;
  productType: string;
  productId: string;
  amountRupees: number;
  currency: string;
  createdAt: string;
};

export async function savePurchase(params: {
  userId: string;
  productType: "bundle" | "notes" | "subscription";
  productId: string;
  amountRupees: number;
  currency?: string;
  paymentProvider: "razorpay" | "stripe" | "manual";
  providerPaymentId?: string;
}): Promise<void> {
  removeClientCacheByPrefix(`${PURCHASES_CACHE_PREFIX}${params.userId}:`);

  const { error } = await supabase.from("user_purchases").insert({
    user_id: params.userId,
    product_type: params.productType,
    product_id: params.productId,
    amount_rupees: params.amountRupees,
    currency: params.currency ?? "INR",
    payment_provider: params.paymentProvider,
    provider_payment_id: params.providerPaymentId ?? null,
  });

  if (error) {
    console.error("savePurchase error", error);
    throw new Error(error.message);
  }
}

export async function listUserPurchases(userId: string): Promise<UserPurchase[]> {
  const cacheKey = `${PURCHASES_CACHE_PREFIX}${userId}:list`;
  const cached = readClientCache<UserPurchase[]>(cacheKey, PURCHASES_CACHE_TTL_MS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("user_purchases")
    .select("id, product_type, product_id, amount_rupees, currency, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listUserPurchases error", error);
    return [];
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id as string,
    productType: (row.product_type as string) ?? "",
    productId: (row.product_id as string) ?? "",
    amountRupees: Number(row.amount_rupees ?? 0),
    currency: (row.currency as string) ?? "INR",
    createdAt: row.created_at as string,
  }));
  writeClientCache(cacheKey, mapped);
  return mapped;
}

