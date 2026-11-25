// Server-side Stripe & Supabase REST integration (Cloudflare Workers + Node/Vite compatible)

type EnvBag = Record<string, unknown>;

function readEnv(key: string, workerEnv: unknown): string {
  if (workerEnv && typeof workerEnv === "object") {
    const val = (workerEnv as EnvBag)[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return "";
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function updateSupabaseOrderAdmin(
  orderId: string,
  patch: Record<string, unknown>,
  workerEnv: unknown,
) {
  const supabaseUrl =
    readEnv("SUPABASE_URL", workerEnv) || readEnv("VITE_SUPABASE_URL", workerEnv);
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY", workerEnv);
  if (!supabaseUrl || !serviceKey || !orderId) return;

  try {
    await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
      },
    );
  } catch {
    // Non-fatal if Supabase table isn't migrated yet
  }
}

async function verifyStripeHmacSignature(
  rawBody: string,
  sigHeader: string,
  webhookSecret: string,
): Promise<boolean> {
  const parts = sigHeader.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t" && v) timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(`${timestamp}.${rawBody}`),
  );
  const expectedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((s) => s === expectedHex);
}

export interface CreateCheckoutPayload {
  orderId: string;
  customerEmail: string;
  items: Array<{
    name: string;
    fragrance?: string;
    size?: string;
    price: number;
    quantity: number;
    stripePriceId?: string;
  }>;
  shippingCost?: number;
  shippingMethod?: string;
  discountCode?: string;
  discountAmount?: number;
  taxAmount?: number;
  origin?: string;
}

export async function handleApiRequest(
  request: Request,
  workerEnv: unknown,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  // 1. Safe Integration Readiness Status (No secrets ever exposed)
  if (url.pathname === "/api/health/integrations" && request.method === "GET") {
    const secretKey = readEnv("STRIPE_SECRET_KEY", workerEnv);
    const publishableKey = readEnv("VITE_STRIPE_PUBLISHABLE_KEY", workerEnv);
    const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET", workerEnv);
    const supabaseUrl =
      readEnv("SUPABASE_URL", workerEnv) || readEnv("VITE_SUPABASE_URL", workerEnv);
    const supabaseAnon = readEnv("VITE_SUPABASE_ANON_KEY", workerEnv);
    const supabaseService = readEnv("SUPABASE_SERVICE_ROLE_KEY", workerEnv);

    const stripeMode = secretKey.startsWith("sk_live_")
      ? "live"
      : secretKey.startsWith("sk_test_")
        ? "test"
        : "unconfigured";

    return jsonResponse({
      stripe: {
        secretKeyConfigured: Boolean(secretKey),
        publishableKeyConfigured: Boolean(publishableKey),
        webhookSecretConfigured: Boolean(webhookSecret),
        mode: stripeMode,
      },
      supabase: {
        urlConfigured: Boolean(supabaseUrl),
        anonKeyConfigured: Boolean(supabaseAnon),
        serviceRoleConfigured: Boolean(supabaseService),
      },
    });
  }

  // 2. Create Live Stripe Hosted Checkout Session
  if (url.pathname === "/api/stripe/create-checkout-session" && request.method === "POST") {
    const stripeSecretKey = readEnv("STRIPE_SECRET_KEY", workerEnv);
    if (!stripeSecretKey) {
      return jsonResponse({
        configured: false,
        error: "STRIPE_SECRET_KEY is not set in server environment (.env.local).",
      });
    }

    try {
      const body = (await request.json()) as CreateCheckoutPayload;
      const origin =
        body.origin ||
        request.headers.get("origin") ||
        readEnv("PUBLIC_SITE_URL", workerEnv) ||
        url.origin;

      const params = new URLSearchParams();
      params.set("mode", "payment");
      params.set("client_reference_id", body.orderId);
      params.set("customer_email", body.customerEmail);
      params.set(
        "success_url",
        `${origin.replace(/\/$/, "")}/order-confirmation/${encodeURIComponent(body.orderId)}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}`,
      );
      params.set(
        "cancel_url",
        `${origin.replace(/\/$/, "")}/checkout?stripe_status=cancelled&order_id=${encodeURIComponent(body.orderId)}`,
      );
      params.set("metadata[order_id]", body.orderId);

      body.items.forEach((item, idx) => {
        const isRealStripePriceId =
          Boolean(item.stripePriceId) &&
          /^price_[A-Za-z0-9]{10,}$/.test(item.stripePriceId ?? "") &&
          !(item.stripePriceId ?? "").startsWith("price_mlc_");

        if (isRealStripePriceId && item.stripePriceId) {
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

      let extraIdx = body.items.length;
      const taxAmount = body.taxAmount ?? 0;
      if (taxAmount > 0) {
        params.set(`line_items[${extraIdx}][price_data][currency]`, "usd");
        params.set(`line_items[${extraIdx}][price_data][product_data][name]`, "Sales Tax");
        params.set(
          `line_items[${extraIdx}][price_data][unit_amount]`,
          String(Math.round(taxAmount * 100)),
        );
        params.set(`line_items[${extraIdx}][quantity]`, "1");
        extraIdx += 1;
      }

      const shippingCost = body.shippingCost ?? 0;
      params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
      params.set(
        "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
        String(Math.round(shippingCost * 100)),
      );
      params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
      params.set(
        "shipping_options[0][shipping_rate_data][display_name]",
        body.shippingMethod === "express"
          ? "Express Priority Air (1–2 business days)"
          : "Standard Studio Ground (3–5 business days)",
      );

      const discountAmount = body.discountAmount ?? 0;
      if (discountAmount > 0) {
        const couponForm = new URLSearchParams();
        couponForm.set("amount_off", String(Math.round(discountAmount * 100)));
        couponForm.set("currency", "usd");
        couponForm.set("duration", "once");
        couponForm.set("name", body.discountCode || "Store Promo");

        const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: couponForm.toString(),
        });
        if (couponRes.ok) {
          const couponData = (await couponRes.json()) as { id?: string };
          if (couponData.id) {
            params.set("discounts[0][coupon]", couponData.id);
          }
        }
      } else {
        params.set("allow_promotion_codes", "true");
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const stripeJson = (await stripeRes.json()) as {
        id?: string;
        url?: string;
        error?: { message?: string };
      };

      if (!stripeRes.ok || !stripeJson.url || !stripeJson.id) {
        return jsonResponse(
          {
            configured: true,
            error: stripeJson.error?.message ?? "Failed to create Stripe Checkout Session.",
          },
          400,
        );
      }

      await updateSupabaseOrderAdmin(
        body.orderId,
        { stripe_session_id: stripeJson.id },
        workerEnv,
      );

      return jsonResponse({
        configured: true,
        sessionId: stripeJson.id,
        url: stripeJson.url,
      });
    } catch (err) {
      return jsonResponse(
        {
          configured: true,
          error: err instanceof Error ? err.message : "Unexpected Stripe server error.",
        },
        500,
      );
    }
  }

  // 3. Verify Returning Checkout Session (Works immediately even on localhost without webhook CLI)
  if (url.pathname === "/api/stripe/verify-session" && request.method === "GET") {
    const stripeSecretKey = readEnv("STRIPE_SECRET_KEY", workerEnv);
    const sessionId = url.searchParams.get("session_id") ?? "";
    const orderId = url.searchParams.get("order_id") ?? "";

    if (!stripeSecretKey || !sessionId) {
      return jsonResponse({ verified: false, paid: false });
    }

    try {
      const res = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        },
      );
      if (!res.ok) {
        return jsonResponse({ verified: false, paid: false });
      }
      const session = (await res.json()) as {
        id?: string;
        payment_status?: string;
        client_reference_id?: string;
        metadata?: { order_id?: string };
      };
      const isPaid = session.payment_status === "paid";
      const resolvedOrderId =
        orderId || session.metadata?.order_id || session.client_reference_id || "";

      if (isPaid && resolvedOrderId) {
        await updateSupabaseOrderAdmin(
          resolvedOrderId,
          { payment_status: "paid", stripe_session_id: session.id ?? sessionId },
          workerEnv,
        );
      }

      return jsonResponse({
        verified: true,
        paid: isPaid,
        orderId: resolvedOrderId,
        sessionId: session.id ?? sessionId,
      });
    } catch {
      return jsonResponse({ verified: false, paid: false });
    }
  }

  // 4. Stripe Webhook Endpoint (/api/stripe/webhook)
  if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
    const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET", workerEnv);
    const sigHeader = request.headers.get("stripe-signature") ?? "";
    const rawBody = await request.text();

    if (webhookSecret) {
      const valid = await verifyStripeHmacSignature(rawBody, sigHeader, webhookSecret);
      if (!valid) {
        return jsonResponse({ error: "Invalid Stripe webhook signature" }, 400);
      }
    }

    try {
      const event = JSON.parse(rawBody) as {
        type?: string;
        data?: {
          object?: {
            id?: string;
            client_reference_id?: string;
            metadata?: { order_id?: string };
          };
        };
      };

      if (event.type === "checkout.session.completed") {
        const sessionObj = event.data?.object;
        const targetOrderId =
          sessionObj?.metadata?.order_id || sessionObj?.client_reference_id || "";
        if (targetOrderId) {
          await updateSupabaseOrderAdmin(
            targetOrderId,
            {
              payment_status: "paid",
              stripe_session_id: sessionObj?.id ?? "",
            },
            workerEnv,
          );
        }
      }

      return jsonResponse({ received: true });
    } catch {
      return jsonResponse({ error: "Malformed webhook payload" }, 400);
    }
  }

  return jsonResponse({ error: "API route not found" }, 404);
}
