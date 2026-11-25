import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CreditCard,
  Flame,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { useState } from "react";
import {
  addToCart,
  formatMoney,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import { Eyebrow, StoreFooter, StoreHeader } from "@/components/shop/StorefrontChrome";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [{ title: "Candle Details — Madeleine Lucia Candle Co." }],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const state = useEcommerceStore();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string>("craft");

  const product = state.products.find((p) => p.slug === slug && p.active);
  const related = state.products
    .filter((p) => p.active && p.slug !== slug)
    .slice(0, 4);

  if (!product) {
    return (
      <main className="min-h-screen bg-ivory">
        <StoreHeader />
        <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-5 pt-40 text-center">
          <Eyebrow>Collection</Eyebrow>
          <h1 className="mt-4 font-display text-5xl text-midnight">Candle Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            This scent may be temporarily unavailable or part of a seasonal release.
          </p>
          <Link
            to="/"
            hash="collection"
            className="mt-8 bg-midnight px-7 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground"
          >
            Return to the Collection
          </Link>
        </div>
        <StoreFooter />
      </main>
    );
  }

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= product.lowStockThreshold;
  const maxQty = Math.max(1, product.stock);

  const handleBuyNowWithStripe = () => {
    if (soldOut) return;
    if (product.stripePaymentLink) {
      window.open(product.stripePaymentLink, "_blank", "noopener,noreferrer");
      return;
    }
    addToCart(product.id, quantity, false);
    void navigate({ to: "/checkout" });
  };

  return (
    <main className="min-h-screen bg-ivory">
      <StoreHeader />

      <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-44 md:px-10 lg:pt-48">
        <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-1.5 hover:text-midnight">
            <ArrowLeft size={13} /> Home
          </Link>
          <span>/</span>
          <Link to="/" hash="collection" className="hover:text-midnight">
            The Collection
          </Link>
          <span>/</span>
          <span className="font-medium text-midnight">{product.name}</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          {/* Product Visual */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden bg-beige"
          >
            <img
              src={product.image}
              alt={`${product.name} handmade candle`}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="bg-ivory/95 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.2em] text-midnight">
                {product.category}
              </span>
              {soldOut && (
                <span className="bg-charcoal px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.2em] text-ivory">
                  Sold Out
                </span>
              )}
              {lowStock && (
                <span className="bg-midnight px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.2em] text-primary-foreground">
                  Low Stock • {product.stock} Remaining
                </span>
              )}
            </div>
          </motion.div>

          {/* Product Story & Purchase Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="flex flex-col justify-center"
          >
            <Eyebrow>SKU: {product.sku} • Small-Batch Pour</Eyebrow>
            <h1 className="mt-3 font-display text-5xl text-midnight md:text-6xl">{product.name}</h1>
            <p className="mt-2 text-xs font-medium uppercase tracking-[.18em] text-earth">
              {product.fragrance}
            </p>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="font-display text-4xl text-midnight">
                {formatMoney(product.price)}
              </span>
              {product.compareAtPrice !== null && product.compareAtPrice > product.price && (
                <span className="text-base text-muted-foreground line-through">
                  {formatMoney(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs uppercase tracking-[.14em] text-muted-foreground">
                • {product.size} Amber Apothecary Jar
              </span>
            </div>

            <p className="mt-6 font-display text-2xl italic text-charcoal/85">“{product.mood}”</p>
            <p className="mt-4 leading-7 text-muted-foreground">{product.description}</p>

            {/* Scent Pyramid */}
            <div className="mt-8 border border-border bg-cream/60 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-earth">
                Fragrance Architecture
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-[.15em] text-midnight">
                    Top Notes
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {product.notes.top}
                  </span>
                </div>
                <div className="border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[.15em] text-midnight">
                    Heart Notes
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {product.notes.heart}
                  </span>
                </div>
                <div className="border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[.15em] text-midnight">
                    Base Notes
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {product.notes.base}
                  </span>
                </div>
              </div>
            </div>

            {/* Specs Strip */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4 text-xs">
              <div className="flex items-center gap-2 text-charcoal">
                <Clock size={15} className="text-earth" />
                <span>{product.burnTime}</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal">
                <Flame size={15} className="text-earth" />
                <span>Cotton Wick</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal">
                <Sparkles size={15} className="text-earth" />
                <span>Clean Soy Blend</span>
              </div>
            </div>

            {/* Add to Bag + Stripe Express */}
            <div className="mt-8 space-y-3">
              <div className="flex gap-3">
                {!soldOut && (
                  <div className="flex items-center border border-border bg-cream/50">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="grid size-12 place-items-center hover:bg-cream"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="grid size-12 place-items-center hover:bg-cream"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={soldOut}
                  onClick={() => addToCart(product.id, quantity, true)}
                  className="flex flex-1 items-center justify-center gap-3 bg-midnight px-6 py-4 text-[11px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {soldOut
                    ? "Currently Sold Out"
                    : `Add to Bag — ${formatMoney(product.price * quantity)}`}{" "}
                  <ShoppingBag size={15} />
                </button>
              </div>

              {!soldOut && (
                <button
                  type="button"
                  onClick={handleBuyNowWithStripe}
                  className="flex w-full items-center justify-center gap-2.5 border border-midnight bg-powder/60 py-3.5 text-[10px] font-semibold uppercase tracking-[.18em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
                >
                  <CreditCard size={14} />
                  {product.stripePaymentLink
                    ? "Instant Checkout via Stripe Link"
                    : "Buy It Now with Stripe Checkout"}
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-earth" /> Free U.S. shipping over{" "}
                {formatMoney(state.settings.freeShippingThreshold)}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-earth" /> Encrypted Stripe Payment
              </span>
            </div>

            {/* Accordion Sections */}
            <div className="mt-8 divide-y divide-border border-t border-border">
              {[
                {
                  id: "craft",
                  title: "Wax, Wick & Craftsmanship",
                  body: `${product.waxType} paired with a ${product.wickType.toLowerCase()} and clean, phthalate-free fine fragrance oils. Hand-poured in small batches into reusable UV-protective amber glass.`,
                },
                {
                  id: "care",
                  title: "Candle Care Ritual",
                  body: "On your first lighting, allow the wax pool to reach the edges of the vessel (approx. 2–3 hours) to prevent tunneling. Trim the cotton wick to 1/4 inch before every burn and never burn for more than 4 hours at a time.",
                },
                {
                  id: "shipping",
                  title: "Shipping & Gift Presentation",
                  body: `Orders ship carefully cushioned from our studio within 1–2 business days. Complimentary standard shipping on orders of ${formatMoney(state.settings.freeShippingThreshold)}+. Gift notes can be added free of charge during checkout.`,
                },
              ].map((sec) => {
                const isOpen = openAccordion === sec.id;
                return (
                  <div key={sec.id} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(isOpen ? "" : sec.id)}
                      className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[.16em] text-midnight"
                    >
                      <span>{sec.title}</span>
                      <span>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{sec.body}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Related Scents */}
        {related.length > 0 && (
          <div className="mt-28 border-t border-border pt-20">
            <div className="flex items-end justify-between">
              <div>
                <Eyebrow>Pair your ritual</Eyebrow>
                <h2 className="mt-3 font-display text-4xl text-midnight md:text-5xl">
                  Explore More Scents
                </h2>
              </div>
              <Link
                to="/"
                hash="collection"
                className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-midnight hover:text-earth sm:inline-flex"
              >
                Full Collection <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  onClick={() => setQuantity(1)}
                  className="group block"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-beige">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-midnight">{item.name}</h3>
                  <p className="text-[10px] uppercase tracking-[.13em] text-earth">
                    {item.fragrance}
                  </p>
                  <p className="mt-1 text-sm font-medium text-charcoal">
                    {formatMoney(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <StoreFooter />
    </main>
  );
}
