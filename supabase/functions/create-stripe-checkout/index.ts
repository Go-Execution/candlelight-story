// Supabase Edge Function: create-stripe-checkout
// Deploy with: supabase functions deploy create-stripe-checkout
// Secret needed: supabase secrets set STRIPE_SECRET_KEY=sk_...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CheckoutItem {
  name: string;
  fragrance?: string;
  size?: string;
  price: number;
  quantity: number;
  stripePriceId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ configured: false, error: "STRIPE_SECRET_KEY is not configured in Supabase Secrets." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const {
      orderId,
      customerEmail,
      items,
      shippingCost = 0,
      shippingMethod = "standard",
      discountCode = "",
      discountAmount = 0,
      taxAmount = 0,
      origin = "http://localhost:3000",
    } = body as {
      orderId: string;
      customerEmail: string;
      items: CheckoutItem[];
      shippingCost?: number;
      shippingMethod?: string;
      discountCode?: string;
      discountAmount?: number;
      taxAmount?: number;
      origin?: string;
    };

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("client_reference_id", orderId);
    params.set("customer_email", customerEmail);
    params.set(
      "success_url",
      `${origin}/order-confirmation/${encodeURIComponent(orderId)}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}`,
    );
    params.set(
      "cancel_url",
      `${origin}/checkout?stripe_status=cancelled&order_id=${encodeURIComponent(orderId)}`,
    );
    params.set("metadata[order_id]", orderId);

    items.forEach((item, idx) => {
      const hasRealStripePrice =
        item.stripePriceId && /^price_[A-Za-z0-9]{10,}$/.test(item.stripePriceId) && !item.stripePriceId.startsWith("price_mlc_");
      if (hasRealStripePrice && item.stripePriceId) {
        params.set(`line_items[${idx}][price]`, item.stripePriceId);
        params.set(`line_items[${idx}][quantity]`, String(item.quantity));
      } else {
        params.set(`line_items[${idx}][price_data][currency]`, "usd");
        params.set(`line_items[${idx}][price_data][product_data][name]`, item.name);
        params.set(
          `line_items[${idx}][price_data][product_data][description]`,
          [item.fragrance, item.size].filter(Boolean).join(" • ") || "Handcrafted Candle",
        );
        params.set(
          `line_items[${idx}][price_data][unit_amount]`,
          String(Math.round(item.price * 100)),
        );
        params.set(`line_items[${idx}][quantity]`, String(item.quantity));
      }
    });

    let nextIdx = items.length;
    if (taxAmount > 0) {
      params.set(`line_items[${nextIdx}][price_data][currency]`, "usd");
      params.set(`line_items[${nextIdx}][price_data][product_data][name]`, "Estimated Sales Tax");
      params.set(`line_items[${nextIdx}][price_data][unit_amount]`, String(Math.round(taxAmount * 100)));
      params.set(`line_items[${nextIdx}][quantity]`, "1");
      nextIdx += 1;
    }

    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(Math.round(shippingCost * 100)));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set(
      "shipping_options[0][shipping_rate_data][display_name]",
      shippingMethod === "express" ? "Express Priority Air (1–2 days)" : "Standard Studio Ground (3–5 days)",
    );

    if (discountAmount > 0) {
      const couponBody = new URLSearchParams();
      couponBody.set("amount_off", String(Math.round(discountAmount * 100)));
      couponBody.set("currency", "usd");
      couponBody.set("duration", "once");
      couponBody.set("name", discountCode || "Store Discount");

      const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: couponBody.toString(),
      });
      if (couponRes.ok) {
        const couponJson = (await couponRes.json()) as { id: string };
        params.set("discounts[0][coupon]", couponJson.id);
      }
    } else {
      params.set("allow_promotion_codes", "true");
    }

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const sessionData = await sessionRes.json();
    if (!sessionRes.ok) {
      return new Response(
        JSON.stringify({ configured: true, error: sessionData?.error?.message ?? "Stripe API error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (supabaseUrl && supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      await adminClient
        .from("orders")
        .update({ stripe_session_id: sessionData.id, updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({ configured: true, url: sessionData.url, sessionId: sessionData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
