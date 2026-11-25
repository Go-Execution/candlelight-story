import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Clock,
  MapPin,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import {
  formatMoney,
  ORDER_STATUS_LABELS,
  OrderStatus,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import { Eyebrow, StoreFooter, StoreHeader } from "@/components/shop/StorefrontChrome";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [{ title: "Track Your Order — Madeleine Lucia Candle Co." }],
  }),
  component: TrackOrderPage,
});

const STEPS: OrderStatus[] = ["pending", "processing", "packed", "shipped", "delivered"];

function TrackOrderPage() {
  const state = useEcommerceStore();
  const [queryId, setQueryId] = useState(state.orders[0]?.id ?? "MLC-1045");
  const [queryEmail, setQueryEmail] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(state.orders[0]?.id ?? "MLC-1045");

  const matchedOrder = state.orders.find((o) => {
    const idMatch = o.id.toUpperCase() === activeOrderId.trim().toUpperCase();
    if (!idMatch) return false;
    if (!queryEmail.trim()) return true;
    return o.customer.email.toLowerCase() === queryEmail.trim().toLowerCase();
  });

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    setActiveOrderId(queryId.trim());
  };

  const currentIdx = matchedOrder
    ? Math.max(0, STEPS.indexOf(matchedOrder.orderStatus))
    : 0;

  return (
    <main className="min-h-screen bg-ivory">
      <StoreHeader />

      <section className="mx-auto max-w-4xl px-5 pb-24 pt-44 md:px-10 lg:pt-48">
        <div className="text-center">
          <Eyebrow>Customer care</Eyebrow>
          <h1 className="mt-3 font-display text-5xl text-midnight md:text-6xl">
            Track Your <em>Order.</em>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Enter your Madeleine Lucia order number (for example, <strong>MLC-1045</strong>) to view
            live studio preparation and carrier updates.
          </p>
        </div>

        <form
          onSubmit={handleLookup}
          className="mt-10 grid gap-3 border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] md:p-7"
        >
          <input
            required
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Order ID (e.g. MLC-1045)"
            aria-label="Order ID"
            className="border border-border bg-ivory px-4 py-3 text-sm uppercase outline-none focus:border-midnight"
          />
          <input
            type="email"
            value={queryEmail}
            onChange={(e) => setQueryEmail(e.target.value)}
            placeholder="Billing Email (Optional)"
            aria-label="Billing Email"
            className="border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-midnight px-6 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
          >
            <Search size={14} /> Track
          </button>
        </form>

        {/* Quick Select Recent Orders */}
        {state.orders.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Recent orders:</span>
            {state.orders.slice(0, 5).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setQueryId(o.id);
                  setQueryEmail("");
                  setActiveOrderId(o.id);
                }}
                className={`border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                  matchedOrder?.id === o.id
                    ? "border-midnight bg-midnight text-primary-foreground"
                    : "border-border bg-card text-charcoal hover:border-midnight"
                }`}
              >
                #{o.id}
              </button>
            ))}
          </div>
        )}

        {!matchedOrder ? (
          <div className="mt-10 border border-border bg-card p-10 text-center">
            <p className="font-display text-3xl text-midnight">No Matching Order Found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Double-check your order number (starting with <strong>MLC-</strong>) or clear the
              email filter.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {/* Status Header Card */}
            <div className="border border-border bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-earth">
                    Order #{matchedOrder.id}
                  </span>
                  <h2 className="mt-1 font-display text-3xl text-midnight">
                    {ORDER_STATUS_LABELS[matchedOrder.orderStatus]}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Placed on {new Date(matchedOrder.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {matchedOrder.trackingNumber ? (
                  <div className="border border-earth/40 bg-powder/35 px-4 py-3 text-right">
                    <p className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-[.15em] text-earth">
                      <Truck size={13} /> {matchedOrder.trackingCarrier || "Carrier"} Tracking
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-midnight">
                      {matchedOrder.trackingNumber}
                    </p>
                  </div>
                ) : (
                  <div className="border border-border bg-ivory px-4 py-3 text-xs text-muted-foreground">
                    Tracking number assigns upon dispatch
                  </div>
                )}
              </div>

              {matchedOrder.orderStatus === "cancelled" ? (
                <div className="mt-6 bg-red-50 p-4 text-xs text-red-800">
                  This order has been cancelled. If a refund was issued, please allow 3–5 business
                  days for it to appear on your statement.
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-5 gap-2">
                  {STEPS.map((st, idx) => {
                    const reached = idx <= currentIdx;
                    return (
                      <div key={st} className="text-center">
                        <div
                          className={`mx-auto grid size-8 place-items-center rounded-full text-xs ${
                            reached
                              ? "bg-midnight text-primary-foreground"
                              : "border border-border bg-ivory text-muted-foreground"
                          }`}
                        >
                          {reached ? <Check size={14} /> : idx + 1}
                        </div>
                        <p
                          className={`mt-2 text-[10px] uppercase tracking-[.12em] ${
                            reached ? "font-semibold text-midnight" : "text-muted-foreground"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[st]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Log & Order Summary */}
            <div className="grid gap-8 md:grid-cols-[1.1fr_.9fr]">
              <div className="border border-border bg-card p-6 md:p-8">
                <h3 className="flex items-center gap-2 font-display text-2xl text-midnight">
                  <Clock size={17} className="text-earth" /> Fulfillment Activity
                </h3>
                <div className="mt-5 space-y-5">
                  {[...matchedOrder.timeline].reverse().map((ev) => (
                    <div key={ev.id} className="relative border-l-2 border-earth/50 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-[.12em] text-midnight">
                        {ev.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{ev.note}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">
                        {new Date(ev.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-border bg-cream p-6">
                  <h3 className="flex items-center gap-2 font-display text-2xl text-midnight">
                    <PackageCheck size={17} className="text-earth" /> Candles in Shipment
                  </h3>
                  <div className="mt-4 space-y-3">
                    {matchedOrder.items.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between text-xs">
                        <span>
                          <strong className="text-midnight">{item.name}</strong> × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatMoney(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-3 font-display text-xl text-midnight">
                      <span>Total</span>
                      <span>{formatMoney(matchedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-6 text-xs text-charcoal">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.15em] text-earth">
                    <MapPin size={13} /> Shipping Destination
                  </p>
                  <p className="mt-2 font-medium text-midnight">{matchedOrder.customer.fullName}</p>
                  <p>{matchedOrder.shippingAddress.street}</p>
                  <p>
                    {matchedOrder.shippingAddress.city}, {matchedOrder.shippingAddress.state}{" "}
                    {matchedOrder.shippingAddress.postalCode}
                  </p>
                </div>

                <Link
                  to="/"
                  hash="collection"
                  className="block w-full bg-midnight py-3.5 text-center text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
                >
                  Shop More Candles
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <StoreFooter />
    </main>
  );
}
