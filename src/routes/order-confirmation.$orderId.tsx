import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Gift,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  formatMoney,
  ORDER_STATUS_LABELS,
  OrderStatus,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import { Eyebrow, StoreFooter, StoreHeader } from "@/components/shop/StorefrontChrome";

export const Route = createFileRoute("/order-confirmation/$orderId")({
  head: () => ({
    meta: [{ title: "Order Confirmed — Madeleine Lucia Candle Co." }],
  }),
  component: OrderConfirmationPage,
});

const PIPELINE_STEPS: OrderStatus[] = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "delivered",
];

function OrderConfirmationPage() {
  const { orderId } = Route.useParams();
  const state = useEcommerceStore();

  const order = state.orders.find(
    (o) => o.id.toUpperCase() === orderId.toUpperCase(),
  );

  if (!order) {
    return (
      <main className="min-h-screen bg-ivory">
        <StoreHeader />
        <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col items-center justify-center px-5 pt-40 text-center">
          <Eyebrow>Order Lookup</Eyebrow>
          <h1 className="mt-3 font-display text-5xl text-midnight">Order Not Found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We couldn't locate order <strong>{orderId}</strong> in this browser session. You can
            search any order on our tracking page.
          </p>
          <Link
            to="/track-order"
            className="mt-7 bg-midnight px-7 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground"
          >
            Go to Order Tracking
          </Link>
        </div>
        <StoreFooter />
      </main>
    );
  }

  const stepIndex = Math.max(0, PIPELINE_STEPS.indexOf(order.orderStatus));

  return (
    <main className="min-h-screen bg-ivory">
      <StoreHeader />

      <section className="mx-auto max-w-4xl px-5 pb-24 pt-44 md:px-10 lg:pt-48">
        <div className="border border-border bg-card p-8 text-center md:p-12">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-sage/35 text-midnight">
            <CheckCircle2 size={28} />
          </div>
          <Eyebrow>Thank you, {order.customer.fullName}</Eyebrow>
          <h1 className="mt-3 font-display text-5xl text-midnight md:text-6xl">
            Your Moment Is <em>Reserved.</em>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Order <strong className="text-midnight">#{order.id}</strong> has been recorded. Updates
            will be sent to <strong className="text-midnight">{order.customer.email}</strong>.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 border border-border bg-ivory px-5 py-2.5 text-xs">
            <span className="font-semibold uppercase tracking-[.14em] text-midnight">
              Order #{order.id}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1 text-earth font-medium">
              <ShieldCheck size={14} />
              {order.paymentStatus === "paid"
                ? "Paid via Stripe"
                : "Awaiting Stripe Link Confirmation"}
            </span>
            <span className="text-border">•</span>
            <span className="text-muted-foreground">
              Status: {ORDER_STATUS_LABELS[order.orderStatus]}
            </span>
          </div>

          {order.stripePaymentLinkUrl && order.paymentStatus === "awaiting_stripe" && (
            <div className="mx-auto mt-6 max-w-md border border-midnight/30 bg-powder/40 p-4 text-xs">
              <p className="font-medium text-midnight">
                Didn't finish your payment in the Stripe tab?
              </p>
              <a
                href={order.stripePaymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-semibold uppercase tracking-[.14em] text-earth underline"
              >
                Re-open Stripe Payment Link →
              </a>
            </div>
          )}

          {/* Live Fulfillment Progress */}
          {order.orderStatus !== "cancelled" && (
            <div className="mt-10 border-t border-border pt-8 text-left">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[.2em] text-earth">
                Live Studio Fulfillment Progress
              </p>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {PIPELINE_STEPS.map((st, idx) => {
                  const done = idx <= stepIndex;
                  return (
                    <div key={st} className="text-center">
                      <div
                        className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-semibold ${
                          done
                            ? "bg-midnight text-primary-foreground"
                            : "border border-border bg-ivory text-muted-foreground"
                        }`}
                      >
                        {done ? <Check size={14} /> : idx + 1}
                      </div>
                      <p
                        className={`mt-2 text-[10px] uppercase tracking-[.12em] ${
                          done ? "font-semibold text-midnight" : "text-muted-foreground"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[st]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl text-midnight">Shipping Details</h2>
            <div className="mt-4 space-y-1 text-sm text-charcoal">
              <p className="font-medium">{order.customer.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>

            <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-midnight">
                <Truck size={14} className="text-earth" />
                {order.shippingMethod === "express"
                  ? "Express Priority Air (1–2 business days)"
                  : "Standard Studio Ground (3–5 business days)"}
              </p>
              {order.trackingNumber && (
                <p className="mt-2 font-medium text-earth">
                  {order.trackingCarrier || "Carrier"} Tracking: #{order.trackingNumber}
                </p>
              )}
            </div>

            {order.giftNote && (
              <div className="mt-5 border border-border bg-cream/70 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.15em] text-earth">
                  <Gift size={13} /> Enclosed Gift Card
                </p>
                <p className="mt-1.5 font-display text-lg italic text-midnight">
                  “{order.giftNote}”
                </p>
              </div>
            )}
          </div>

          <div className="border border-border bg-cream p-6 md:p-8">
            <h2 className="font-display text-2xl text-midnight">Items Ordered</h2>
            <div className="mt-4 divide-y divide-border/70">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-3 first:pt-0">
                  <img src={item.image} alt={item.name} className="h-16 w-14 object-cover" />
                  <div className="flex-1">
                    <p className="font-display text-lg text-midnight">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-[.12em] text-earth">
                      Qty {item.quantity} • {item.size}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-earth">
                  <span>Discount ({order.discountCode})</span>
                  <span>-{formatMoney(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? "FREE" : formatMoney(order.shippingCost)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatMoney(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 font-display text-2xl text-midnight">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/track-order"
            className="inline-flex items-center gap-2 border border-midnight px-6 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
          >
            <Package size={14} /> Track Order Timeline
          </Link>
          <Link
            to="/"
            hash="collection"
            className="inline-flex items-center gap-2 bg-midnight px-7 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <StoreFooter />
    </main>
  );
}
