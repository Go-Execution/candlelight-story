import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Flame,
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import heroImage from "@/assets/candle-hero.jpg";
import storyImage from "@/assets/candle-story.jpg";
import heritageImage from "@/assets/candle-heritage.jpg";
import {
  addNewsletterSubscriber,
  addToCart,
  formatMoney,
  Product,
  ProductCategory,
  submitCustomerInquiry,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import {
  Eyebrow,
  QuickViewModal,
  StoreFooter,
  StoreHeader,
} from "@/components/shop/StorefrontChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madeleine Lucia Candle Co. — Light a Moment" },
      {
        name: "description",
        content:
          "Discover handcrafted candle experiences inspired by meaningful memories, beautiful spaces, and the simple luxury of slowing down.",
      },
      { property: "og:title", content: "Madeleine Lucia Candle Co. — Light a Moment" },
      { property: "og:description", content: "Handcrafted moments, made to be felt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CandleStore,
});

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
};

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const CATEGORIES: Array<"All" | ProductCategory> = [
  "All",
  "Signature",
  "Spring & Summer",
  "Fall & Winter",
  "Woody & Earthy",
];

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

function CandleStore() {
  const state = useEcommerceStore();
  const reduce = useReducedMotion();
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | ProductCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, reduce ? 0 : 45]);

  const activeProducts = useMemo(
    () => state.products.filter((p) => p.active),
    [state.products],
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = activeProducts.filter((p) => {
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.fragrance.toLowerCase().includes(q) ||
        p.mood.toLowerCase().includes(q) ||
        p.notes.top.toLowerCase().includes(q) ||
        p.notes.heart.toLowerCase().includes(q) ||
        p.notes.base.toLowerCase().includes(q)
      );
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === "name-asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id);
  }, [activeProducts, searchQuery, selectedCategory, sortBy]);

  const featuredCandle = useMemo(
    () =>
      activeProducts.find((p) => p.featured) ??
      activeProducts.find((p) => p.slug === "ambrevelle") ??
      activeProducts[0],
    [activeProducts],
  );

  return (
    <main>
      <StoreHeader isHome />

      <section
        id="home"
        className="relative min-h-[780px] overflow-hidden bg-powder pt-36 lg:h-[94vh] lg:min-h-[760px]"
      >
        <motion.div style={{ y: heroY }} className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
          <motion.img
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            src={heroImage}
            alt="Handmade ivory candle glowing among linen and botanicals"
            width={1920}
            height={1280}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-powder via-powder/60 to-transparent lg:from-powder lg:via-powder/15" />
        </motion.div>
        <div className="relative mx-auto flex h-full max-w-[1500px] items-center px-5 py-24 md:px-10 lg:py-0">
          <div className="max-w-3xl lg:w-[57%]">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-[10px] font-semibold uppercase tracking-[.3em] text-earth"
            >
              Handmade with intention
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="font-display text-[clamp(4.2rem,8vw,8rem)] font-medium leading-[.78] text-midnight"
            >
              Light a Moment.
              <br />
              <em className="font-normal">Feel Everything.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="mt-8 max-w-lg text-base leading-7 text-charcoal/80"
            >
              Discover the beauty of handcrafted candles inspired by meaningful memories, beautiful
              spaces, and the simple luxury of slowing down.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <button
                onClick={() => scrollTo("collection")}
                className="group flex items-center gap-3 bg-midnight px-6 py-4 text-xs font-semibold uppercase tracking-[.14em] text-primary-foreground transition hover:bg-earth"
              >
                Explore the Collection{" "}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollTo("story")}
                className="border border-midnight px-6 py-4 text-xs font-semibold uppercase tracking-[.14em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
              >
                Discover Our Story
              </button>
            </motion.div>
          </div>
        </div>
        <button
          onClick={() => scrollTo("story")}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[9px] uppercase tracking-[.22em] text-midnight lg:flex"
        >
          Scroll <ArrowDown size={16} />
        </button>
      </section>

      <div className="overflow-hidden bg-dusty py-4 text-midnight">
        <div className="marquee-track flex w-max whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.28em]">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <span key={i} className="mx-5">
                Handmade with Love <Sparkles className="mx-5 inline" size={11} /> Inspired by
                Feeling <Sparkles className="mx-5 inline" size={11} /> Crafted for Your Moments{" "}
                <Sparkles className="mx-5 inline" size={11} />
              </span>
            ))}
        </div>
      </div>

      <section id="story" className="bg-ivory px-5 py-24 md:px-10 lg:py-36">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-24">
          <motion.div {...fade} className="relative">
            <img
              loading="lazy"
              src={storyImage}
              alt="Candle beside an open book in warm morning light"
              width={1600}
              height={1200}
              className="aspect-[4/5] w-full object-cover md:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div className="absolute -bottom-7 -right-3 bg-midnight px-7 py-6 text-primary-foreground md:-right-8">
              <span className="font-display text-4xl italic">Pause.</span>
              <span className="ml-3 text-[9px] uppercase tracking-[.2em]">Breathe. Be here.</span>
            </div>
          </motion.div>
          <motion.div {...fade}>
            <Eyebrow>The heart behind the brand</Eyebrow>
            <h2 className="mt-5 font-display text-5xl leading-[.95] text-midnight md:text-7xl">
              More Than a Candle.
              <br />
              <em>A Moment to Remember.</em>
            </h2>
            <div className="mt-8 h-px w-20 bg-sage" />
            <p className="mt-8 text-lg leading-8 text-charcoal/85">
              At Madeleine Lucia Candle, we believe that a candle can transform an ordinary moment
              into something beautiful.
            </p>
            <p className="mt-5 leading-7 text-muted-foreground">
              From quiet mornings to intimate evenings, our handmade candles are imagined as
              companions to the memories, emotions, and spaces that make life meaningful.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="collection" className="bg-cream px-4 py-24 md:px-10 lg:py-32">
        <motion.div {...fade} className="mx-auto max-w-7xl text-center">
          <Eyebrow>The collection</Eyebrow>
          <h2 className="mt-4 font-display text-5xl text-midnight md:text-7xl">
            Find Your <em>Perfect Moment.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted-foreground">
            A curated collection of small-batch soy & coconut wax candle experiences inspired by
            comfort, warmth, beautiful memories, and everyday rituals.
          </p>
        </motion.div>

        {/* E-Commerce Filter, Search & Sort Toolbar */}
        <div className="mx-auto mt-12 max-w-[1500px] border-y border-border/80 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[.16em] transition ${
                      active
                        ? "bg-midnight text-primary-foreground"
                        : "border border-border bg-ivory/70 text-charcoal hover:border-midnight"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[230px]">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scent, note, or mood..."
                  aria-label="Search candles"
                  className="w-full border border-border bg-ivory py-2.5 pl-9 pr-8 text-xs outline-none transition focus:border-midnight"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-midnight"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <SlidersHorizontal
                  size={13}
                  className="pointer-events-none absolute left-3 text-muted-foreground"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort collection"
                  className="appearance-none border border-border bg-ivory py-2.5 pl-8 pr-8 text-[11px] font-medium uppercase tracking-[.12em] text-charcoal outline-none focus:border-midnight"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Alphabetical</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mx-auto mt-14 max-w-xl border border-border bg-ivory p-12 text-center">
            <p className="font-display text-3xl text-midnight">No matching scents found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing your search or exploring all fragrance families.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-6 bg-midnight px-6 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground"
            >
              View All Candles
            </button>
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-[1500px] grid-cols-2 gap-x-3 gap-y-10 md:gap-6 lg:grid-cols-4">
            {filteredProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickProduct} />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden bg-ivory py-24 lg:py-36">
        <motion.div {...fade} className="px-5 text-center md:px-10">
          <Eyebrow>Made for the way you feel</Eyebrow>
          <h2 className="mt-4 font-display text-5xl text-midnight md:text-7xl">
            Every Scent Tells a Story.
          </h2>
          <p className="mt-4 font-display text-2xl italic text-earth">
            What will your next moment feel like?
          </p>
        </motion.div>
        <div className="mx-auto mt-16 grid max-w-[1500px] gap-12 px-5 md:grid-cols-3 md:gap-4 md:px-10">
          <StoryPanel
            title="The Calm"
            text="For the quiet mornings, the deep breaths, and the moments that belong entirely to you."
            image={storyImage}
            position="object-left"
          />
          <StoryPanel
            title="The Warmth"
            text="For familiar spaces, meaningful conversations, and the comfort of feeling at home."
            image={"/products/p2.jpeg"}
            position="object-center"
            className="md:mt-20"
          />
          <StoryPanel
            title="The Escape"
            text="For sunlit memories, gentle breezes, and the beauty of discovering somewhere new."
            image={heritageImage}
            position="object-center"
          />
        </div>
      </section>

      {featuredCandle && (
        <section className="overflow-hidden bg-midnight text-primary-foreground">
          <div className="mx-auto grid max-w-[1500px] items-center lg:grid-cols-2">
            <motion.div {...fade} className="order-2 px-6 py-20 md:px-16 lg:order-1 lg:py-28">
              <Eyebrow light>Signature spotlight</Eyebrow>
              <h2 className="mt-5 font-display text-5xl leading-[.95] md:text-7xl">
                Let the Evening
                <br />
                <em>Linger a Little Longer.</em>
              </h2>
              <p className="mt-7 max-w-lg leading-7 text-primary-foreground/70">
                {featuredCandle.description}
              </p>
              <div className="mt-8 flex items-end gap-8 border-t border-primary-foreground/20 pt-7">
                <div>
                  <p className="text-[9px] uppercase tracking-[.2em] text-dusty">
                    {featuredCandle.fragrance} • {featuredCandle.size}
                  </p>
                  <p className="mt-2 font-display text-3xl">{featuredCandle.name}</p>
                </div>
                <span className="ml-auto font-display text-2xl">
                  {formatMoney(featuredCandle.price)}
                </span>
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  disabled={featuredCandle.stock <= 0}
                  onClick={() => addToCart(featuredCandle.id, 1, true)}
                  className="flex items-center gap-3 bg-ivory px-7 py-4 text-[11px] font-semibold uppercase tracking-[.16em] text-midnight transition hover:bg-sage disabled:opacity-45"
                >
                  {featuredCandle.stock <= 0 ? "Sold Out" : "Add to Bag"}{" "}
                  <ShoppingBag size={15} />
                </button>
                <Link
                  to="/product/$slug"
                  params={{ slug: featuredCandle.slug }}
                  className="flex items-center gap-2 border border-primary-foreground/35 px-6 py-4 text-[11px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:border-ivory hover:bg-primary-foreground/10"
                >
                  Explore Scent Notes <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="order-1 h-[520px] lg:order-2 lg:h-[760px]"
            >
              <img
                loading="lazy"
                src={featuredCandle.image}
                alt={`${featuredCandle.name} candle`}
                width={480}
                height={620}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </section>
      )}

      <section className="bg-powder px-5 py-24 md:px-10 lg:py-36">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-24">
          <motion.div {...fade}>
            <Eyebrow>Rooted in heritage</Eyebrow>
            <h2 className="mt-5 font-display text-5xl leading-[.95] text-midnight md:text-7xl">
              Inspired by Heritage.
              <br />
              <em>Made for Meaningful Moments.</em>
            </h2>
            <p className="mt-8 text-lg leading-8 text-charcoal/85">
              Madeleine Lucia Candle celebrates the warmth of personal memories, the beauty of
              meaningful spaces, and the individuality that comes from our roots.
            </p>
            <p className="mt-5 leading-7 text-charcoal/70">
              With Haitian and Caribbean heritage as part of the founder's story, the brand embraces
              a sense of warmth, connection, and cultural identity.
            </p>
          </motion.div>
          <motion.div
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <img
              loading="lazy"
              src={heritageImage}
              alt="Midnight blue candle in warm Caribbean-inspired botanical setting"
              width={1280}
              height={1536}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute -bottom-5 left-6 right-6 border border-ivory/50 bg-midnight/90 px-6 py-4 font-display text-xl italic text-primary-foreground backdrop-blur">
              Warmth, connection & cultural identity
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-ivory px-5 py-24 md:px-10 lg:py-32">
        <motion.div {...fade} className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-5xl text-midnight md:text-7xl">
            The Beauty Is in the <em>Little Things.</em>
          </h2>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              [
                Flame,
                "Made with Intention",
                "Thoughtful candle experiences designed to complement meaningful moments.",
              ],
              [
                Heart,
                "Inspired by Feeling",
                "Fragrances imagined around comfort, emotion, and personal memories.",
              ],
              [
                Sparkles,
                "A Personal Touch",
                "A handmade candle experience created to feel special and personal.",
              ],
            ].map(([Icon, title, text], i) => {
              const C = Icon as typeof Flame;
              return (
                <motion.div
                  whileHover={{ y: -6 }}
                  key={String(title)}
                  className="border-t border-border pt-8"
                >
                  <C size={25} strokeWidth={1.3} className="text-earth" />
                  <p className="mt-8 text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                    0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-3xl text-midnight">{String(title)}</h3>
                  <p className="mt-4 max-w-sm leading-7 text-muted-foreground">{String(text)}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <ContactSection />
      <Newsletter />
      <StoreFooter isHome />

      <AnimatePresence>
        {quickProduct && (
          <QuickViewModal product={quickProduct} close={() => setQuickProduct(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function ProductCard({
  product,
  index,
  onQuickView,
}: {
  product: Product;
  index: number;
  onQuickView: (p: Product) => void;
}) {
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= product.lowStockThreshold;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.07, duration: 0.65 }}
      className="group"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <img
            loading="lazy"
            src={product.image}
            alt={`${product.name} candle`}
            width={480}
            height={620}
            className={`h-full w-full cursor-pointer object-cover transition duration-700 group-hover:scale-[1.04] ${product.position} ${
              soldOut ? "opacity-75 grayscale-[25%]" : ""
            }`}
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {soldOut && (
            <span className="bg-charcoal px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.16em] text-ivory">
              Sold Out
            </span>
          )}
          {lowStock && (
            <span className="bg-ivory/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.15em] text-midnight shadow-sm">
              Only {product.stock} Left
            </span>
          )}
          {product.featured && !soldOut && (
            <span className="bg-midnight px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.16em] text-primary-foreground">
              Signature
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full gap-2 p-3 transition-transform duration-300 group-hover:translate-y-0 sm:flex">
          <button
            disabled={soldOut}
            onClick={() => addToCart(product.id, 1, false)}
            className="flex flex-1 items-center justify-center gap-2 bg-midnight px-2 py-3 text-[9px] font-semibold uppercase tracking-[.1em] text-primary-foreground transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-60"
          >
            {soldOut ? "Sold Out" : "Add to Bag"} {!soldOut && <ArrowRight size={12} />}
          </button>
          <button
            aria-label={`Quick view ${product.name}`}
            onClick={() => onQuickView(product)}
            className="grid size-10 place-items-center bg-ivory text-midnight transition hover:bg-cream"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="font-display text-2xl text-midnight transition hover:opacity-80 md:text-3xl"
          >
            {product.name}
          </Link>
          <div className="text-right">
            <span className="block pt-1 text-sm font-medium text-charcoal">
              {formatMoney(product.price)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {product.size}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-[.13em] text-earth">
          {product.fragrance}
        </p>
        <p className="mt-2 hidden font-display text-lg italic text-muted-foreground sm:block">
          {product.mood}
        </p>
        <div className="mt-4 flex gap-2 sm:hidden">
          <button
            disabled={soldOut}
            onClick={() => addToCart(product.id, 1, false)}
            className="flex-1 bg-midnight px-2 py-3 text-[9px] font-semibold uppercase tracking-[.08em] text-primary-foreground disabled:opacity-50"
          >
            {soldOut ? "Sold Out" : "Add to Bag"}
          </button>
          <button
            aria-label={`Quick view ${product.name}`}
            onClick={() => onQuickView(product)}
            className="grid size-10 place-items-center border border-midnight"
          >
            <Search size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function StoryPanel({
  title,
  text,
  image,
  position,
  className = "",
}: {
  title: string;
  text: string;
  image: string;
  position: string;
  className?: string;
}) {
  return (
    <motion.article {...fade} className={`group ${className}`}>
      <div className="h-[430px] overflow-hidden md:h-[620px]">
        <img
          loading="lazy"
          src={image}
          alt="Candle moment"
          width={1280}
          height={1536}
          className={`h-full w-full object-cover transition duration-1000 group-hover:scale-[1.03] ${position}`}
        />
      </div>
      <div className="relative -mt-12 mx-4 bg-ivory px-5 py-7 md:mx-6">
        <Eyebrow>{title}</Eyebrow>
        <p className="mt-4 font-display text-2xl leading-snug text-midnight">{text}</p>
      </div>
    </motion.article>
  );
}

function ContactSection() {
  const state = useEcommerceStore();
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    submitCustomerInquiry({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      inquiryType: String(fd.get("inquiry_type") ?? "General Inquiry"),
      message: String(fd.get("message") ?? ""),
    });
    setSent(true);
  };

  return (
    <section id="contact" className="bg-cream px-5 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
        <motion.div {...fade}>
          <Eyebrow>Get in touch</Eyebrow>
          <h2 className="mt-5 font-display text-5xl leading-[.95] text-midnight md:text-7xl">
            Let's Create Something <em>Beautiful Together.</em>
          </h2>
          <p className="mt-7 max-w-lg leading-7 text-muted-foreground">
            Have a question about our candles, your order, or a special event inquiry? We'd love to
            hear from you.
          </p>
          <div className="mt-10 space-y-3 text-sm">
            <a
              href={`mailto:${state.settings.supportEmail}`}
              className="block underline decoration-dusty underline-offset-4"
            >
              {state.settings.supportEmail}
            </a>
          </div>
        </motion.div>
        {sent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <Check size={48} className="mb-6 text-earth" />
            <h3 className="mb-4 font-display text-4xl text-midnight">Message Received</h3>
            <p className="max-w-md text-muted-foreground">
              Thank you for reaching out to Madeleine Lucia Candle Co. Your inquiry has been logged
              for our studio team and we will reply shortly.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-xs font-semibold uppercase tracking-[.15em] text-midnight underline underline-offset-4"
            >
              Send Another Message
            </button>
          </motion.div>
        ) : (
          <motion.form {...fade} onSubmit={submit} className="grid gap-7 md:grid-cols-2">
            {[
              ["Full Name", "text", "name"],
              ["Email Address", "email", "email"],
            ].map(([label, type, name]) => (
              <label key={label} className="group relative pt-5">
                <input
                  required
                  name={name}
                  type={type}
                  placeholder=" "
                  className="peer w-full border-0 border-b border-charcoal/30 bg-transparent py-3 outline-none transition focus:border-midnight"
                />
                <span className="absolute left-0 top-7 text-sm text-muted-foreground transition-all peer-focus:top-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[.15em] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                  {label}
                </span>
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="mb-2 block text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                Inquiry Type
              </span>
              <div className="relative">
                <select
                  name="inquiry_type"
                  className="w-full appearance-none border-0 border-b border-charcoal/30 bg-transparent py-3 outline-none focus:border-midnight"
                >
                  <option>General Inquiry</option>
                  <option>Product Question</option>
                  <option>Order Support</option>
                  <option>Special Request / Events</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-3" size={16} />
              </div>
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                Message
              </span>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full resize-none border-0 border-b border-charcoal/30 bg-transparent py-3 outline-none focus:border-midnight"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-midnight px-8 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
              >
                Send Message
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </section>
  );
}

function Newsletter() {
  const [joined, setJoined] = useState(false);
  return (
    <section className="bg-sage px-5 py-20 md:px-10">
      <motion.div
        {...fade}
        className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_.9fr]"
      >
        <div>
          <Eyebrow>A note from us</Eyebrow>
          <h2 className="mt-3 font-display text-5xl text-midnight md:text-6xl">
            A Little Light in Your Inbox.
          </h2>
          <p className="mt-4 max-w-xl text-charcoal/75">
            Discover seasonal pours, thoughtful stories, and early access to limited batches from
            Madeleine Lucia Candle.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addNewsletterSubscriber(String(fd.get("email") ?? ""));
            setJoined(true);
            e.currentTarget.reset();
          }}
          className="flex border-b border-midnight pb-2"
        >
          <input
            required
            name="email"
            type="email"
            placeholder="Your email address"
            aria-label="Your email address"
            className="min-w-0 flex-1 bg-transparent px-2 outline-none placeholder:text-charcoal/60"
          />
          <button className="flex items-center gap-2 px-3 py-3 text-[10px] font-semibold uppercase tracking-[.15em] text-midnight">
            {joined ? "Subscribed" : "Join the List"}{" "}
            {joined ? <Check size={15} /> : <ArrowRight size={15} />}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
