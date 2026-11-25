import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomerInquiry,
  FragranceNotes,
  Order,
  OrderLineItem,
  OrderStatus,
  OrderTimelineEvent,
  PaymentMethodType,
  PaymentStatus,
  Product,
  ProductCategory,
  PromoCode,
  ShippingAddress,
  ShippingMethodType,
  StoreSettings,
} from "./ecommerce-store";

const envBag = import.meta.env as Record<string, string | undefined>;

const rawSupabaseUrl = (envBag["VITE_SUPABASE_URL"] ?? "").trim();
const rawSupabaseAnonKey = (
  envBag["VITE_SUPABASE_ANON_KEY"] ??
  envBag["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  ""
).trim();

export const isSupabaseConfigured =
  rawSupabaseUrl.startsWith("http") && rawSupabaseAnonKey.length > 10;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ---------------------------------------------------------------------------
// Database Row <-> Domain Model Mappers
// ---------------------------------------------------------------------------

export interface DbProductRow {
  id: number;
  slug: string;
  sku: string;
  name: string;
  fragrance: string;
  mood: string;
  description: string;
  category: string;
  size: string;
  burn_time: string;
  wax_type: string;
  wick_type: string;
  notes: FragranceNotes | null;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
  featured: boolean;
  image: string;
  position: string;
  stripe_payment_link: string;
  stripe_price_id: string;
}

export function mapProductFromRow(row: DbProductRow): Product {
  return {
    id: Number(row.id),
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    fragrance: row.fragrance ?? "",
    mood: row.mood ?? "",
    description: row.description ?? "",
    category: (row.category as ProductCategory) || "Signature",
    size: row.size || "8 oz",
    burnTime: row.burn_time || "45–50 hours",
    waxType: row.wax_type || "Natural Soy & Coconut Wax Blend",
    wickType: row.wick_type || "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: row.notes?.top ?? "",
      heart: row.notes?.heart ?? "",
      base: row.notes?.base ?? "",
    },
    price: Number(row.price) || 15,
    compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
    stock: Number(row.stock) || 0,
    lowStockThreshold: Number(row.low_stock_threshold) || 5,
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    image: row.image || "/products/ambrevelle.jpg",
    position: row.position || "object-center",
    stripePaymentLink: row.stripe_payment_link ?? "",
    stripePriceId: row.stripe_price_id ?? "",
  };
}

export function mapProductToRow(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    fragrance: product.fragrance,
    mood: product.mood,
    description: product.description,
    category: product.category,
    size: product.size,
    burn_time: product.burnTime,
    wax_type: product.waxType,
    wick_type: product.wickType,
    notes: product.notes,
    price: product.price,
    compare_at_price: product.compareAtPrice,
    stock: product.stock,
    low_stock_threshold: product.lowStockThreshold,
    active: product.active,
    featured: product.featured,
    image: product.image,
    position: product.position,
    stripe_payment_link: product.stripePaymentLink,
    stripe_price_id: product.stripePriceId,
    updated_at: new Date().toISOString(),
  };
}

export interface DbOrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: ShippingAddress | null;
  items: OrderLineItem[] | null;
  shipping_method: string;
  subtotal: number | string;
  discount_code: string;
  discount_amount: number | string;
  shipping_cost: number | string;
  tax_amount: number | string;
  total: number | string;
  gift_note: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  stripe_session_id: string;
  stripe_payment_link_url: string;
  tracking_carrier: string;
  tracking_number: string;
  internal_notes: string;
  timeline: OrderTimelineEvent[] | null;
  created_at: string;
  updated_at: string;
}

export function mapOrderFromRow(row: DbOrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: {
      fullName: row.customer_name,
      email: row.customer_email,
    },
    shippingAddress: row.shipping_address ?? {
      street: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
    items: Array.isArray(row.items) ? row.items : [],
    shippingMethod: (row.shipping_method as ShippingMethodType) || "standard",
    subtotal: Number(row.subtotal) || 0,
    discountCode: row.discount_code ?? "",
    discountAmount: Number(row.discount_amount) || 0,
    shippingCost: Number(row.shipping_cost) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    total: Number(row.total) || 0,
    giftNote: row.gift_note ?? "",
    orderStatus: (row.order_status as OrderStatus) || "pending",
    paymentStatus: (row.payment_status as PaymentStatus) || "awaiting_stripe",
    paymentMethod: (row.payment_method as PaymentMethodType) || "stripe_checkout",
    stripeSessionId: row.stripe_session_id ?? "",
    stripePaymentLinkUrl: row.stripe_payment_link_url ?? "",
    trackingCarrier: row.tracking_carrier ?? "",
    trackingNumber: row.tracking_number ?? "",
    internalNotes: row.internal_notes ?? "",
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
  };
}

export function mapOrderToRow(order: Order) {
  return {
    id: order.id,
    customer_name: order.customer.fullName,
    customer_email: order.customer.email,
    shipping_address: order.shippingAddress,
    items: order.items,
    shipping_method: order.shippingMethod,
    subtotal: order.subtotal,
    discount_code: order.discountCode,
    discount_amount: order.discountAmount,
    shipping_cost: order.shippingCost,
    tax_amount: order.taxAmount,
    total: order.total,
    gift_note: order.giftNote,
    order_status: order.orderStatus,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    stripe_session_id: order.stripeSessionId,
    stripe_payment_link_url: order.stripePaymentLinkUrl,
    tracking_carrier: order.trackingCarrier,
    tracking_number: order.trackingNumber,
    internal_notes: order.internalNotes,
    timeline: order.timeline,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export interface DbPromoRow {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number | string;
  min_subtotal: number | string;
  active: boolean;
  usage_count: number;
  description: string;
}

export function mapPromoFromRow(row: DbPromoRow): PromoCode {
  return {
    code: row.code,
    type: row.type,
    value: Number(row.value) || 0,
    minSubtotal: Number(row.min_subtotal) || 0,
    active: Boolean(row.active),
    usageCount: Number(row.usage_count) || 0,
    description: row.description ?? "",
  };
}

export interface DbInquiryRow {
  id: string;
  name: string;
  email: string;
  inquiry_type: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

export function mapInquiryFromRow(row: DbInquiryRow): CustomerInquiry {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    inquiryType: row.inquiry_type,
    message: row.message,
    status: row.status,
  };
}

export interface DbSettingsRow {
  store_name: string;
  support_email: string;
  currency: string;
  free_shipping_threshold: number | string;
  standard_shipping_rate: number | string;
  express_shipping_rate: number | string;
  tax_rate_percent: number | string;
  announcement_text: string;
  announcement_enabled: boolean;
  stripe_checkout_mode: "stripe_checkout_preview" | "stripe_payment_link";
  global_stripe_payment_link: string;
  stripe_publishable_key: string;
}

export function mapSettingsFromRow(row: DbSettingsRow): StoreSettings {
  return {
    storeName: row.store_name || "Madeleine Lucia Candle Co.",
    supportEmail: row.support_email || "info@madeleineluciacandle.com",
    currency: row.currency || "USD",
    freeShippingThreshold: Number(row.free_shipping_threshold ?? 50),
    standardShippingRate: Number(row.standard_shipping_rate ?? 5),
    expressShippingRate: Number(row.express_shipping_rate ?? 12),
    taxRatePercent: Number(row.tax_rate_percent ?? 0),
    announcementText: row.announcement_text ?? "",
    announcementEnabled: Boolean(row.announcement_enabled),
    stripeCheckoutMode: row.stripe_checkout_mode || "stripe_checkout_preview",
    globalStripePaymentLink: row.global_stripe_payment_link ?? "",
    stripePublishableKey:
      row.stripe_publishable_key || (envBag["VITE_STRIPE_PUBLISHABLE_KEY"] ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Live Stripe Checkout Session & Verification Client Helpers
// ---------------------------------------------------------------------------

export interface CheckoutSessionRequest {
  orderId: string;
  customerEmail: string;
  items: Array<{
    name: string;
    fragrance: string;
    size: string;
    price: number;
    quantity: number;
    stripePriceId: string;
  }>;
  shippingCost: number;
  shippingMethod: string;
  discountCode: string;
  discountAmount: number;
  taxAmount: number;
}

export type StripeSessionResult =
  | { status: "redirect"; url: string; sessionId: string }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

export async function initiateLiveStripeCheckout(
  payload: CheckoutSessionRequest,
): Promise<StripeSessionResult> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // 1. Try built-in server API route (/api/stripe/create-checkout-session)
  try {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, origin }),
    });
    const data = (await res.json()) as {
      configured?: boolean;
      url?: string;
      sessionId?: string;
      error?: string;
    };

    if (data.configured && data.url && data.sessionId) {
      return { status: "redirect", url: data.url, sessionId: data.sessionId };
    }
    if (data.configured && data.error) {
      return { status: "error", message: data.error };
    }
  } catch {
    // Fall through to Supabase Edge Function if available
  }

  // 2. Fallback: Try Supabase Edge Function (create-stripe-checkout) if Supabase is configured
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
        body: { ...payload, origin },
      });
      if (!error && data && typeof data === "object") {
        const typed = data as {
          configured?: boolean;
          url?: string;
          sessionId?: string;
          error?: string;
        };
        if (typed.configured && typed.url && typed.sessionId) {
          return { status: "redirect", url: typed.url, sessionId: typed.sessionId };
        }
        if (typed.configured && typed.error) {
          return { status: "error", message: typed.error };
        }
      }
    } catch {
      // Edge function not deployed yet; fall back cleanly
    }
  }

  return { status: "unconfigured" };
}

export async function verifyReturnedStripeSession(
  sessionId: string,
  orderId: string,
): Promise<{ verified: boolean; paid: boolean }> {
  try {
    const res = await fetch(
      `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&order_id=${encodeURIComponent(orderId)}`,
    );
    if (!res.ok) return { verified: false, paid: false };
    const data = (await res.json()) as { verified?: boolean; paid?: boolean };
    return {
      verified: Boolean(data.verified),
      paid: Boolean(data.paid),
    };
  } catch {
    return { verified: false, paid: false };
  }
}

export interface IntegrationHealthStatus {
  stripe: {
    secretKeyConfigured: boolean;
    publishableKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
    mode: "live" | "test" | "unconfigured";
  };
  supabase: {
    urlConfigured: boolean;
    anonKeyConfigured: boolean;
    serviceRoleConfigured: boolean;
    clientActive: boolean;
  };
}

export async function fetchIntegrationHealth(): Promise<IntegrationHealthStatus> {
  try {
    const res = await fetch("/api/health/integrations");
    if (res.ok) {
      const json = (await res.json()) as {
        stripe: IntegrationHealthStatus["stripe"];
        supabase: Omit<IntegrationHealthStatus["supabase"], "clientActive">;
      };
      return {
        stripe: json.stripe,
        supabase: {
          ...json.supabase,
          clientActive: isSupabaseConfigured,
        },
      };
    }
  } catch {
    // Ignore network error
  }

  return {
    stripe: {
      secretKeyConfigured: false,
      publishableKeyConfigured: Boolean(envBag["VITE_STRIPE_PUBLISHABLE_KEY"]),
      webhookSecretConfigured: false,
      mode: "unconfigured",
    },
    supabase: {
      urlConfigured: isSupabaseConfigured,
      anonKeyConfigured: isSupabaseConfigured,
      serviceRoleConfigured: false,
      clientActive: isSupabaseConfigured,
    },
  };
}
