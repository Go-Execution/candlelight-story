import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Instagram,
  Lock,
  Menu,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addToCart,
  formatMoney,
  getHydratedCart,
  Product,
  removeFromCart,
  setCartDrawerOpen,
  updateCartQuantity,
  useEcommerceStore,
} from "@/lib/ecommerce-store";

export function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[.28em] ${light ? "text-dusty" : "text-earth"}`}
    >
      {children}
    </p>
  );
}

export function StoreHeader({ isHome = false }: { isHome?: boolean }) {
  const state = useEcommerceStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { itemCount } = getHydratedCart(state);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goSection = (sectionId: string) => {
    setMenuOpen(false);
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      void navigate({ to: "/", hash: sectionId });
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 bg-[#FDF1EB] ${
          scrolled ? "border-b border-border shadow-sm" : ""
        }`}
      >
        {state.settings.announcementEnabled && state.settings.announcementText && (
          <div className="bg-midnight px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.2em] text-primary-foreground">
            {state.settings.announcementText}
          </div>
        )}
        <div className="mx-auto flex h-auto max-w-[1500px] items-center justify-between px-5 md:px-10">
          {isHome ? (
            <button aria-label="Go home" onClick={() => goSection("home")}>
              <img
                src="/logo.jpeg"
                alt="MADELEINE LUCIA Candle Co."
                className="h-[132px] w-auto object-contain md:h-[152px]"
              />
            </button>
          ) : (
            <Link to="/" aria-label="Go home">
              <img
                src="/logo.jpeg"
                alt="MADELEINE LUCIA Candle Co."
                className="h-[120px] w-auto object-contain md:h-[140px]"
              />
            </Link>
          )}

          <nav className="hidden items-center gap-8 lg:flex">
            {[
              { label: "Home", id: "home" },
              { label: "Our Story", id: "story" },
              { label: "The Collection", id: "collection" },
              { label: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => goSection(item.id)}
                className="group relative py-2 text-xs font-medium text-charcoal"
              >
                <span>{item.label}</span>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-midnight transition-transform group-hover:scale-x-100" />
              </button>
            ))}
            <Link
              to="/track-order"
              className="group relative flex items-center gap-1.5 py-2 text-xs font-medium text-charcoal"
            >
              <PackageSearch size={14} className="text-earth" />
              <span>Track Order</span>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-midnight transition-transform group-hover:scale-x-100" />
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goSection("collection")}
              className="hidden border border-midnight bg-midnight px-5 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-primary-foreground transition hover:bg-earth sm:block"
            >
              Shop Candles
            </button>
            <button
              aria-label={`Open shopping bag with ${itemCount} items`}
              onClick={() => setCartDrawerOpen(true)}
              className="relative grid size-11 place-items-center text-midnight"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-earth text-[10px] text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="grid size-11 place-items-center lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-midnight text-primary-foreground lg:hidden"
          >
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-5 top-5 grid size-12 place-items-center"
            >
              <X />
            </button>
            <div className="flex h-full flex-col justify-center px-10">
              {[
                { label: "Home", id: "home" },
                { label: "Our Story", id: "story" },
                { label: "The Collection", id: "collection" },
                { label: "Contact", id: "contact" },
              ].map((n, i) => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
                  onClick={() => goSection(n.id)}
                  className="border-b border-primary-foreground/20 py-5 text-left font-display text-4xl"
                >
                  {n.label}
                </motion.button>
              ))}
              <Link
                to="/track-order"
                onClick={() => setMenuOpen(false)}
                className="border-b border-primary-foreground/20 py-5 text-left font-display text-4xl"
              >
                Track Your Order
              </Link>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="py-5 text-left text-xs uppercase tracking-[.22em] text-dusty"
              >
                Store Admin Dashboard →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function StoreFooter({ isHome = false }: { isHome?: boolean }) {
  const state = useEcommerceStore();
  const navigate = useNavigate();

  const goSection = (id: string) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      void navigate({ to: "/", hash: id });
    }
  };

  return (
    <footer className="bg-midnight px-5 pb-8 pt-20 text-primary-foreground md:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 border-b border-primary-foreground/20 pb-16 md:grid-cols-[1.3fr_.65fr_.65fr_.8fr]">
        <div>
          <img
            src="/logo.jpeg"
            alt="MADELEINE LUCIA Candle Co."
            className="h-[150px] w-auto object-contain"
          />
          <p className="mt-6 font-display text-2xl italic text-primary-foreground/70">
            Handcrafted moments, made to be felt.
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[.2em] text-dusty">Explore</p>
          <div className="mt-5 flex flex-col items-start gap-3">
            {[
              { label: "Home", id: "home" },
              { label: "Our Story", id: "story" },
              { label: "The Collection", id: "collection" },
              { label: "Contact", id: "contact" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => goSection(n.id)}
                className="text-sm text-primary-foreground/75 transition hover:text-primary-foreground"
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[.2em] text-dusty">Customer Care</p>
          <div className="mt-5 flex flex-col items-start gap-3">
            <Link
              to="/track-order"
              className="text-sm text-primary-foreground/75 transition hover:text-primary-foreground"
            >
              Track Your Order
            </Link>
            <Link
              to="/checkout"
              className="text-sm text-primary-foreground/75 transition hover:text-primary-foreground"
            >
              Shopping Bag & Checkout
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm text-dusty transition hover:text-primary-foreground"
            >
              <Lock size={12} /> Admin Portal
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[.2em] text-dusty">Contact</p>
          <a
            href={`mailto:${state.settings.supportEmail}`}
            className="mt-5 block text-sm text-primary-foreground/75 transition hover:text-primary-foreground"
          >
            {state.settings.supportEmail}
          </a>
          <div className="mt-6 flex gap-3">
            <span
              aria-label="Instagram"
              className="grid size-9 place-items-center border border-primary-foreground/30"
            >
              <Instagram size={15} />
            </span>
            <span
              aria-label="Pinterest"
              className="grid size-9 place-items-center border border-primary-foreground/30 font-display text-lg"
            >
              P
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-7 flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[10px] text-primary-foreground/50">
        <span>© Madeleine Lucia Candle LLC. All rights reserved.</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-dusty" /> Secure Checkout Powered by Stripe
        </span>
      </div>
    </footer>
  );
}

export function GlobalStoreOverlays() {
  const state = useEcommerceStore();
  const navigate = useNavigate();
  const { lines, itemCount, subtotal } = getHydratedCart(state);

  const threshold = state.settings.freeShippingThreshold;
  const remainingForFreeShip = Math.max(0, threshold - subtotal);
  const progressPercent =
    threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;

  return (
    <>
      <AnimatePresence>
        {state.toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 bg-midnight px-5 py-4 text-sm text-primary-foreground shadow-xl"
          >
            <Check size={16} className="text-sage" />
            <span>{state.toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.cartDrawerOpen && (
          <>
            <motion.button
              aria-label="Close shopping bag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-midnight/55 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed bottom-0 right-0 top-0 z-[60] flex w-full max-w-md flex-col bg-ivory shadow-2xl"
            >
              <div className="flex items-center justify-between border-b p-6">
                <div>
                  <p className="font-display text-3xl text-midnight">Your Bag</p>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "candle" : "candles"}
                  </p>
                </div>
                <button
                  aria-label="Close shopping bag"
                  onClick={() => setCartDrawerOpen(false)}
                  className="grid size-10 place-items-center transition hover:bg-cream"
                >
                  <X size={20} />
                </button>
              </div>

              {lines.length > 0 && threshold > 0 && (
                <div className="border-b bg-cream/70 px-6 py-3.5">
                  <div className="flex items-center gap-2 text-xs text-midnight">
                    <Truck size={14} className="text-earth" />
                    {remainingForFreeShip === 0 ? (
                      <span className="font-medium">
                        You unlocked <strong>Complimentary U.S. Shipping</strong>!
                      </span>
                    ) : (
                      <span>
                        Add <strong>{formatMoney(remainingForFreeShip)}</strong> more for{" "}
                        <strong>Free Shipping</strong>
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden bg-border/60">
                    <div
                      className="h-full bg-earth transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <ShoppingBag size={38} strokeWidth={1} className="text-earth" />
                  <h3 className="mt-5 font-display text-3xl text-midnight">Your bag is waiting</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Find a handcrafted candle for your next meaningful moment.
                  </p>
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      void navigate({ to: "/", hash: "collection" });
                    }}
                    className="mt-7 bg-midnight px-6 py-4 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground transition hover:bg-earth"
                  >
                    Explore the Collection
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto p-6">
                    {lines.map(({ product, quantity, lineTotal }) => (
                      <div key={product.id} className="mb-6 flex gap-4 border-b pb-6 last:mb-0">
                        <Link
                          to="/product/$slug"
                          params={{ slug: product.slug }}
                          onClick={() => setCartDrawerOpen(false)}
                          className="shrink-0"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-28 w-24 object-cover"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <div>
                              <Link
                                to="/product/$slug"
                                params={{ slug: product.slug }}
                                onClick={() => setCartDrawerOpen(false)}
                                className="font-display text-xl text-midnight hover:opacity-75"
                              >
                                {product.name}
                              </Link>
                              <p className="text-[10px] uppercase tracking-[.1em] text-earth">
                                {product.fragrance} • {product.size}
                              </p>
                            </div>
                            <p className="text-sm font-medium">{formatMoney(lineTotal)}</p>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border bg-ivory">
                              <button
                                aria-label="Decrease quantity"
                                onClick={() => updateCartQuantity(product.id, -1)}
                                className="grid size-8 place-items-center hover:bg-cream"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-medium">{quantity}</span>
                              <button
                                aria-label="Increase quantity"
                                disabled={quantity >= product.stock}
                                onClick={() => updateCartQuantity(product.id, 1)}
                                className="grid size-8 place-items-center hover:bg-cream disabled:opacity-35"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              aria-label={`Remove ${product.name}`}
                              onClick={() => removeFromCart(product.id)}
                              className="text-muted-foreground transition hover:text-charcoal"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t bg-cream p-6">
                    <div className="flex justify-between font-display text-2xl text-midnight">
                      <span>Subtotal</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Promo codes, gift notes, and Stripe payment available at checkout.
                    </p>
                    <button
                      onClick={() => {
                        setCartDrawerOpen(false);
                        void navigate({ to: "/checkout" });
                      }}
                      className="mt-5 flex w-full items-center justify-center gap-2 bg-midnight py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
                    >
                      Proceed to Stripe Checkout <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function QuickViewModal({
  product,
  close,
}: {
  product: Product;
  close: () => void;
}) {
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  const soldOut = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <motion.button
        aria-label="Close quick view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="absolute inset-0 bg-midnight/65 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15 }}
        className="relative grid max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto overflow-x-hidden rounded-sm bg-ivory shadow-2xl md:grid-cols-2 md:overflow-hidden"
      >
        <button
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center bg-ivory/90 transition hover:bg-cream"
        >
          <X size={18} />
        </button>
        <div className="relative">
          <img
            src={product.image}
            alt={`${product.name} candle`}
            className="h-72 w-full object-cover md:h-[620px]"
          />
          <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[.18em] text-midnight">
            {product.category}
          </span>
        </div>

        <div className="flex flex-col justify-center p-7 md:p-11">
          <Eyebrow>Quick view • {product.sku}</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-midnight md:text-5xl">{product.name}</h2>
          <p className="mt-1.5 text-xs uppercase tracking-[.15em] text-earth">
            {product.fragrance} • {product.size} • {product.burnTime}
          </p>
          <p className="mt-5 font-display text-xl italic text-muted-foreground">{product.mood}</p>
          <p className="mt-4 text-sm leading-6 text-charcoal/80">{product.description}</p>

          <div className="mt-5 space-y-1.5 border-y border-border/70 py-4 text-xs">
            <p>
              <span className="font-semibold uppercase tracking-[.12em] text-midnight">Top: </span>
              <span className="text-muted-foreground">{product.notes.top}</span>
            </p>
            <p>
              <span className="font-semibold uppercase tracking-[.12em] text-midnight">Heart: </span>
              <span className="text-muted-foreground">{product.notes.heart}</span>
            </p>
            <p>
              <span className="font-semibold uppercase tracking-[.12em] text-midnight">Base: </span>
              <span className="text-muted-foreground">{product.notes.base}</span>
            </p>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <p className="font-display text-3xl text-midnight">
              {formatMoney(product.price)}{" "}
              <span className="font-sans text-xs text-muted-foreground">({product.size})</span>
            </p>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[.15em] ${
                soldOut
                  ? "text-red-700"
                  : product.stock <= product.lowStockThreshold
                    ? "text-amber-700"
                    : "text-earth"
              }`}
            >
              {soldOut
                ? "Sold Out"
                : product.stock <= product.lowStockThreshold
                  ? `Only ${product.stock} left`
                  : "In Stock"}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            {!soldOut && (
              <div className="flex items-center border border-border bg-cream/50">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center hover:bg-cream"
                >
                  <Minus size={14} />
                </button>
                <span className="w-9 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="grid size-11 place-items-center hover:bg-cream"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            <button
              disabled={soldOut}
              onClick={() => {
                addToCart(product.id, qty, true);
                close();
              }}
              className="flex flex-1 items-center justify-center gap-3 bg-midnight py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-45"
            >
              {soldOut ? "Currently Sold Out" : "Add to Bag"} <ShoppingBag size={15} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                close();
                void navigate({ to: "/product/$slug", params: { slug: product.slug } });
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.15em] text-midnight underline underline-offset-4 hover:text-earth"
            >
              <Sparkles size={12} /> View Full Scent Story & Care
            </button>
            {product.stripePaymentLink && !soldOut && (
              <a
                href={product.stripePaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold uppercase tracking-[.14em] text-earth hover:underline"
              >
                Express Stripe Link →
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
