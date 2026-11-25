// Supabase Edge Function: stripe-webhook
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets needed: STRIPE_WEBHOOK_SECRET=whsec_...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
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
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const expectedHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((sig) => sig === expectedHex);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  if (webhookSecret) {
    const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!valid) {
      return new Response("Invalid Stripe signature", { status: 400 });
    }
  }

  const event = JSON.parse(rawBody);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ received: true, warning: "Supabase env missing" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const orderId = session?.metadata?.order_id || session?.client_reference_id;

    if (orderId) {
      const { data: existing } = await admin
        .from("orders")
        .select("timeline")
        .eq("id", orderId)
        .maybeSingle();

      const timeline = Array.isArray(existing?.timeline) ? existing.timeline : [];
      timeline.push({
        id: `evt-stripe-${Date.now()}`,
        status: "pending",
        label: "Stripe Payment Confirmed (Webhook)",
        note: `Session ${session.id} confirmed paid.`,
        timestamp: new Date().toISOString(),
      });

      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          stripe_session_id: session.id ?? "",
          timeline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }
  } else if (event.type === "charge.refunded") {
    const paymentIntent = event.data?.object?.payment_intent;
    if (paymentIntent) {
      await admin
        .from("orders")
        .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
        .eq("stripe_session_id", paymentIntent);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
