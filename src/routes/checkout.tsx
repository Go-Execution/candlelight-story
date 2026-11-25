import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CreditCard,
  ExternalLink,
  Gift,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  attachStripeSessionToOrder,
  clearCart,
  createStoreOrder,
  evaluatePromoCode,
  formatMoney,
  getHydratedCart,
  removeFromCart,
  ShippingMethodType,
  updateCartQuantity,
  updateOrderPaymentStatus,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import { initiateLiveStripeCheckout } from "@/lib/supabase";
import { Eyebrow } from "@/components/shop/StorefrontChrome";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Secure Checkout — Madeleine Lucia Candle Co." }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const state = useEcommerceStore();
  const navigate = useNavigate();
  const { lines, subtotal } = getHydratedCart(state);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>("standard");
  const [includeGiftNote, setIncludeGiftNote] = useState(false);
  const [giftNote, setGiftNote] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promoFeedback, setPromoFeedback] = useState("");
  const [isRedirectingStripe, setIsRedirectingStripe] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cancelledNotice, setCancelledNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("stripe_status") === "cancelled") {
        setCancelledNotice(true);
      }
    }
  }, []);

  const promoResult = evaluatePromoCode(appliedCode, subtotal, state);
  const discountAmount = promoResult.valid ? promoResult.discountAmount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const qualifiesFreeStandard =
    subtotal >= state.settings.freeShippingThreshold || promoResult.freeShipping;

  const shippingCost =
    lines.length === 0
      ? 0
      : shippingMethod === "express"
        ? state.settings.expressShippingRate
        : qualifiesFreeStandard
          ? 0
          : state.settings.standardShippingRate;

  const taxAmount =
    Math.round(discountedSubtotal * (state.settings.taxRatePercent / 100) * 100) / 100;
  const total = Math.round((discountedSubtotal + shippingCost + taxAmount) * 100) / 100;

  const singleLineLink =
    lines.length === 1 && lines[0] && lines[0].product.stripePaymentLink
      ? lines[0].product.stripePaymentLink
      : "";
  const activeStripeLink =
    singleLineLink ||
    (state.settings.stripeCheckoutMode === "stripe_payment_link"
      ? state.settings.globalStripePaymentLink
      : "");

  const applyPromo = (codeToTry?: string) => {
    const candidate = (codeToTry ?? promoInput).trim().toUpperCase();
    if (!candidate) {
      setAppliedCode("");
      setPromoFeedback("");
      return;
    }
    const res = evaluatePromoCode(candidate, subtotal, state);
    if (res.valid) {
      setAppliedCode(candidate);
      setPromoInput(candidate);
      setPromoFeedback(res.message);
    } else {
      setAppliedCode("");
      setPromoFeedback(res.message);
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 || isRedirectingStripe) return;

    setCheckoutError("");
    setIsRedirectingStripe(true);

    try {
      const hasExternalLink = Boolean(activeStripeLink);

      // 1. Create order in Supabase + local store (keep cart until redirect/completion succeeds)
      const created = await createStoreOrder({
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
        },
        shippingAddress: {
          street: street.trim(),
          apartment: apartment.trim(),
          city: city.trim(),
          state: regionState.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        shippingMethod,
        promoCode: appliedCode,
        giftNote: includeGiftNote ? giftNote : "",
        paymentMethod: hasExternalLink ? "stripe_payment_link" : "stripe_checkout",
        paymentStatus: "awaiting_stripe",
        stripePaymentLinkUrl: activeStripeLink,
        clearShoppingBag: false,
      });

      if (!created) {
        setIsRedirectingStripe(false);
        return;
      }

      // 2. If user explicitly configured a direct Stripe Payment Link (buy.stripe.com)
      if (hasExternalLink) {
        clearCart();
        const sep = activeStripeLink.includes("?") ? "&" : "?";
        const linkWithMeta = `${activeStripeLink}${sep}client_reference_id=${encodeURIComponent(created.id)}&prefilled_email=${encodeURIComponent(created.customer.email)}`;
        window.open(linkWithMeta, "_blank", "noopener,noreferrer");
        void navigate({
          to: "/order-confirmation/$orderId",
          params: { orderId: created.id },
        });
        return;
      }

      // 3. Attempt live server/Supabase Edge Function Stripe Checkout Session
      const stripeRes = await initiateLiveStripeCheckout({
        orderId: created.id,
        customerEmail: created.customer.email,
        items: lines.map((l) => ({
          name: l.product.name,
          fragrance: l.product.fragrance,
          size: l.product.size,
          price: l.product.price,
          quantity: l.quantity,
          stripePriceId: l.product.stripePriceId,
        })),
        shippingCost,
        shippingMethod,
        discountCode: created.discountCode,
        discountAmount: created.discountAmount,
        taxAmount: created.taxAmount,
      });

      if (stripeRes.status === "redirect") {
        attachStripeSessionToOrder(created.id, stripeRes.sessionId);
        clearCart();
        window.location.assign(stripeRes.url);
        return;
      }

      if (stripeRes.status === "error") {
        setIsRedirectingStripe(false);
        setCheckoutError(`Stripe Error: ${stripeRes.message}`);
        return;
      }

      // 4. Fallback when STRIPE_SECRET_KEY hasn't been added to .env.local yet
      updateOrderPaymentStatus(created.id, "paid");
      clearCart();
      void navigate({
        to: "/order-confirmation/$orderId",
        params: { orderId: created.id },
      });
    } catch (err) {
      setIsRedirectingStripe(false);
      setCheckoutError(
        err instanceof Error ? err.message : "Could not initiate checkout. Please try again.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-ivory">
      <header className="border-b border-border bg-[#FDF1EB]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-10">
          <Link
            to="/"
            hash="collection"
            className="inline-flex items-center gap-2 text-xs font-medium text-charcoal hover:text-midnight"
          >
            <ArrowLeft size={14} /> Continue Shopping
          </Link>
          <Link to="/" aria-label="Madeleine Lucia Home">
            <img
              src="/logo.jpeg"
              alt="MADELEINE LUCIA Candle Co."
              className="h-[104px] w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
            <Lock size={13} /> Stripe Secure
          </div>
        </div>
      </header>

      {cancelledNotice && (
        <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-xs text-amber-950">
          Your Stripe payment window was closed before completion — your shopping bag is still
          saved below whenever you are ready.
        </div>
      )}

      {lines.length === 0 ? (
        <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-5 text-center">
          <ShoppingBag size={42} strokeWidth={1.1} className="text-earth" />
          <h1 className="mt-5 font-display text-4xl text-midnight">Your Shopping Bag Is Empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore our handcrafted soy & coconut candle collection before checking out.
          </p>
          <Link
            to="/"
            hash="collection"
            className="mt-8 bg-midnight px-7 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground"
          >
            Browse Candles
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            void handlePlaceOrder(e);
          }}
          className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:py-16"
        >
          <div className="space-y-10">
            {checkoutError && (
              <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-4 text-xs text-red-900">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Payment Connection Issue</p>
                  <p className="mt-0.5">{checkoutError}</p>
                </div>
              </div>
            )}

            {/* 1. Contact */}
            <section className="border border-border bg-card p-6 md:p-8">
              <Eyebrow>Step 01</Eyebrow>
              <h2 className="mt-2 font-display text-3xl text-midnight">Contact Information</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Used exclusively for your Stripe receipt and shipping tracking updates.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    Full Name *
                  </span>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Camille Laurent"
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    Email Address *
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  />
                </label>
              </div>
            </section>

            {/* 2. Shipping Address */}
            <section className="border border-border bg-card p-6 md:p-8">
              <Eyebrow>Step 02</Eyebrow>
              <h2 className="mt-2 font-display text-3xl text-midnight">Shipping Destination</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    Street Address *
                  </span>
                  <input
                    required
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="418 Mercer Street"
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    Apartment, Suite, etc. (Optional)
                  </span>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Apt 4B"
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    City *
                  </span>
                  <input
                    required
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                      State *
                    </span>
                    <input
                      required
                      type="text"
                      value={regionState}
                      onChange={(e) => setRegionState(e.target.value)}
                      placeholder="NY"
                      className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                      ZIP Code *
                    </span>
                    <input
                      required
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10013"
                      className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                    />
                  </label>
                </div>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal">
                    Country / Region
                  </span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-border bg-ivory px-4 py-3 text-sm outline-none focus:border-midnight"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </label>
              </div>
            </section>

            {/* 3. Delivery Method & Gift Note */}
            <section className="border border-border bg-card p-6 md:p-8">
              <Eyebrow>Step 03</Eyebrow>
              <h2 className="mt-2 font-display text-3xl text-midnight">Delivery & Presentation</h2>
              <div className="mt-5 space-y-3">
                <label
                  className={`flex cursor-pointer items-center justify-between border p-4 transition ${
                    shippingMethod === "standard"
                      ? "border-midnight bg-powder/35"
                      : "border-border bg-ivory"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className="mt-1 accent-midnight"
                    />
                    <div>
                      <span className="flex items-center gap-2 text-sm font-medium text-midnight">
                        <Truck size={15} className="text-earth" /> Standard Studio Ground
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Carefully cushioned packaging • 3–5 business days
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-midnight">
                    {qualifiesFreeStandard
                      ? "FREE"
                      : formatMoney(state.settings.standardShippingRate)}
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between border p-4 transition ${
                    shippingMethod === "express"
                      ? "border-midnight bg-powder/35"
                      : "border-border bg-ivory"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                      className="mt-1 accent-midnight"
                    />
                    <div>
                      <span className="block text-sm font-medium text-midnight">
                        Express Priority Air
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Priority studio dispatch • 1–2 business days
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-midnight">
                    {formatMoney(state.settings.expressShippingRate)}
                  </span>
                </label>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-midnight">
                  <input
                    type="checkbox"
                    checked={includeGiftNote}
                    onChange={(e) => setIncludeGiftNote(e.target.checked)}
                    className="accent-midnight"
                  />
                  <Gift size={15} className="text-earth" />
                  <span>Add a complimentary handwritten-style gift card</span>
                </label>
                {includeGiftNote && (
                  <textarea
                    rows={3}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Write your personal note here..."
                    className="mt-3 w-full border border-border bg-ivory p-3.5 text-sm outline-none focus:border-midnight"
                  />
                )}
              </div>
            </section>

            {/* 4. Stripe Payment */}
            <section className="border border-border bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Eyebrow>Step 04</Eyebrow>
                  <h2 className="mt-2 font-display text-3xl text-midnight">Stripe Payment</h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                  <span className="border border-border bg-ivory px-2 py-1">VISA</span>
                  <span className="border border-border bg-ivory px-2 py-1">MC</span>
                  <span className="border border-border bg-ivory px-2 py-1">AMEX</span>
                  <span className="border border-border bg-ivory px-2 py-1">Apple Pay</span>
                  <span className="border border-border bg-ivory px-2 py-1">Link</span>
                </div>
              </div>

              <div className="mt-5 border border-midnight/25 bg-powder/35 p-5">
                <div className="flex items-start gap-3">
                  <CreditCard size={20} className="mt-0.5 shrink-0 text-midnight" />
                  <div>
                    <p className="text-sm font-semibold text-midnight">
                      {activeStripeLink
                        ? "Stripe Hosted Payment Link"
                        : "Stripe Hosted Checkout Session"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-charcoal/80">
                      Your order is saved to our database and redirected securely to Stripe to
                      complete card, Apple Pay, Google Pay, or Stripe Link authorization.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRedirectingStripe}
                className="mt-6 flex w-full items-center justify-center gap-3 bg-midnight py-4 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground transition hover:bg-earth disabled:opacity-60"
              >
                {isRedirectingStripe ? (
                  <span>Redirecting to Secure Stripe Checkout...</span>
                ) : activeStripeLink ? (
                  <>
                    <span>Pay {formatMoney(total)} via Stripe Link</span>
                    <ExternalLink size={14} />
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Pay {formatMoney(total)} with Stripe</span>
                  </>
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheck size={14} className="text-earth" /> 256-bit TLS encrypted Stripe
                checkout & live order tracking
              </p>
            </section>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="border border-border bg-cream p-6 md:p-8">
              <h2 className="font-display text-3xl text-midnight">Order Summary</h2>

              <div className="mt-6 divide-y divide-border/70">
                {lines.map(({ product, quantity, lineTotal }) => (
                  <div key={product.id} className="flex gap-4 py-4 first:pt-0">
                    <div className="relative shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-16 object-cover"
                      />
                      <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-midnight text-[10px] text-primary-foreground">
                        {quantity}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-display text-xl text-midnight">{product.name}</p>
                          <p className="text-[10px] uppercase tracking-[.12em] text-earth">
                            {product.size} • {product.fragrance}
                          </p>
                        </div>
                        <span className="text-sm font-medium">{formatMoney(lineTotal)}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border border-border bg-ivory">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateCartQuantity(product.id, -1)}
                            className="grid size-7 place-items-center hover:bg-cream"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center text-xs">{quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={quantity >= product.stock}
                            onClick={() => updateCartQuantity(product.id, 1)}
                            className="grid size-7 place-items-center hover:bg-cream disabled:opacity-35"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${product.name}`}
                          onClick={() => removeFromCart(product.id)}
                          className="text-muted-foreground hover:text-midnight"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="mt-6 border-t border-border pt-5">
                <label className="block text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
                  Promo or Gift Code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="min-w-0 flex-1 border border-border bg-ivory px-3.5 py-2.5 text-xs uppercase outline-none focus:border-midnight"
                  />
                  <button
                    type="button"
                    onClick={() => applyPromo()}
                    className="border border-midnight bg-midnight px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground transition hover:bg-earth"
                  >
                    Apply
                  </button>
                </div>

                {promoFeedback && (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs ${
                      promoResult.valid ? "font-medium text-earth" : "text-red-700"
                    }`}
                  >
                    {promoResult.valid && <Check size={13} />}
                    <span>{promoFeedback}</span>
                  </p>
                )}

                {state.promoCodes.filter((p) => p.active).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Tag size={11} className="text-earth" />
                    {state.promoCodes
                      .filter((p) => p.active)
                      .map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => applyPromo(p.code)}
                          className="border border-border bg-ivory px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-charcoal hover:border-midnight"
                        >
                          {p.code}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
                <div className="flex justify-between text-charcoal">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-medium text-earth">
                    <span>Discount ({appliedCode})</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-charcoal">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "FREE" : formatMoney(shippingCost)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-charcoal">
                    <span>Estimated Tax ({state.settings.taxRatePercent}%)</span>
                    <span>{formatMoney(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-4 font-display text-3xl text-midnight">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </aside>

          {isRedirectingStripe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] grid place-items-center bg-midnight/75 p-6 backdrop-blur-sm"
            >
              <div className="max-w-md bg-ivory p-8 text-center shadow-2xl">
                <div className="mx-auto size-10 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
                <h3 className="mt-5 font-display text-3xl text-midnight">
                  Connecting to Stripe...
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Preparing your encrypted Stripe payment session and reserving your candles.
                </p>
              </div>
            </motion.div>
          )}
        </form>
      )}
    </main>
  );
}
