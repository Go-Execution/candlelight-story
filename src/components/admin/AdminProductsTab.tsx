import {
  AlertTriangle,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  Minus,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  adjustProductStock,
  deleteProduct,
  formatMoney,
  Product,
  ProductCategory,
  saveProduct,
  showStoreToast,
  slugifyProductName,
  toggleProductActive,
  useEcommerceStore,
} from "@/lib/ecommerce-store";

const CATEGORIES: ProductCategory[] = [
  "Signature",
  "Spring & Summer",
  "Fall & Winter",
  "Woody & Earthy",
];

type EditableProductDraft = Omit<Product, "id"> & { id?: number };

function createEmptyDraft(nextIndex: number): EditableProductDraft {
  return {
    slug: "",
    sku: `MLC-8OZ-00${nextIndex}`,
    name: "",
    fragrance: "",
    mood: "",
    description: "",
    category: "Signature",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "",
      heart: "",
      base: "",
    },
    price: 15,
    compareAtPrice: null,
    stock: 20,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/ambrevelle.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "",
  };
}

export function AdminProductsTab() {
  const state = useEcommerceStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ProductCategory>("All");
  const [editingDraft, setEditingDraft] = useState<EditableProductDraft | null>(null);

  const lowOrOutProducts = useMemo(
    () => state.products.filter((p) => p.stock <= p.lowStockThreshold),
    [state.products],
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.fragrance.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery, state.products]);

  const totalUnitsInStock = state.products.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-earth">
            Catalog, Stock & Stripe Links
          </p>
          <h2 className="mt-1 font-display text-4xl text-midnight">Products & Inventory</h2>
        </div>

        <button
          type="button"
          onClick={() => setEditingDraft(createEmptyDraft(state.products.length + 1))}
          className="inline-flex items-center gap-2 bg-midnight px-5 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
        >
          <Plus size={14} /> Add New Candle
        </button>
      </div>

      {/* Inventory Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Active Scents
          </p>
          <p className="mt-1 font-display text-3xl text-midnight">
            {state.products.filter((p) => p.active).length}{" "}
            <span className="font-sans text-xs text-muted-foreground">
              / {state.products.length} total
            </span>
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Total Studio Inventory
          </p>
          <p className="mt-1 font-display text-3xl text-midnight">
            {totalUnitsInStock}{" "}
            <span className="font-sans text-xs text-muted-foreground">jars ready</span>
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Low / Out of Stock Alerts
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-3xl text-midnight">
            <span>{lowOrOutProducts.length}</span>
            {lowOrOutProducts.length > 0 && (
              <AlertTriangle size={18} className="text-amber-600" />
            )}
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candle name, SKU, or fragrance..."
            className="w-full border border-border bg-ivory py-2.5 pl-9 pr-4 text-xs outline-none focus:border-midnight"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "All" | ProductCategory)}
          aria-label="Filter by category"
          className="border border-border bg-ivory px-3 py-2.5 text-xs outline-none focus:border-midnight"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-cream/70 text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
              <th className="px-4 py-3.5">Candle</th>
              <th className="px-4 py-3.5">SKU / Category</th>
              <th className="px-4 py-3.5">Price</th>
              <th className="px-4 py-3.5">Inventory</th>
              <th className="px-4 py-3.5">Stripe Link</th>
              <th className="px-4 py-3.5">Visibility</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = !isOut && product.stock <= product.lowStockThreshold;
              return (
                <tr key={product.id} className="hover:bg-ivory/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-12 shrink-0 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-display text-xl text-midnight">{product.name}</p>
                          {product.featured && (
                            <span title="Featured Spotlight Candle">
                              <Star size={13} className="fill-earth text-earth" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {product.fragrance} • {product.size}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-[11px] text-midnight">{product.sku}</p>
                    <p className="text-[11px] text-muted-foreground">{product.category}</p>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-midnight">
                    {formatMoney(product.price)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-border bg-ivory">
                        <button
                          type="button"
                          aria-label="Decrease stock"
                          onClick={() => adjustProductStock(product.id, -1)}
                          className="grid size-7 place-items-center hover:bg-cream"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-9 text-center font-semibold">{product.stock}</span>
                        <button
                          type="button"
                          aria-label="Increase stock"
                          onClick={() => adjustProductStock(product.id, 1)}
                          className="grid size-7 place-items-center hover:bg-cream"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      {isOut && (
                        <span className="bg-red-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-red-800">
                          Out
                        </span>
                      )}
                      {isLow && (
                        <span className="bg-amber-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-900">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {product.stripePaymentLink ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Check size={11} /> Linked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Link2 size={12} /> Checkout Session
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleProductActive(product.id);
                        showStoreToast(
                          `${product.name} ${product.active ? "hidden from" : "published to"} storefront`,
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        product.active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-stone-300 bg-stone-100 text-stone-600"
                      }`}
                    >
                      {product.active ? <Eye size={11} /> : <EyeOff size={11} />}
                      {product.active ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingDraft({ ...product, notes: { ...product.notes } })}
                        className="inline-flex items-center gap-1 border border-midnight bg-ivory px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-midnight hover:bg-midnight hover:text-primary-foreground"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${product.name}" from the product catalog?`,
                            )
                          ) {
                            deleteProduct(product.id);
                            showStoreToast(`${product.name} removed`);
                          }
                        }}
                        className="grid size-8 place-items-center border border-border text-muted-foreground hover:border-red-400 hover:text-red-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {editingDraft && (
        <ProductEditorModal
          draft={editingDraft}
          onClose={() => setEditingDraft(null)}
          onSaved={() => setEditingDraft(null)}
        />
      )}
    </div>
  );
}

function ProductEditorModal({
  draft: initialDraft,
  onClose,
  onSaved,
}: {
  draft: EditableProductDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<EditableProductDraft>(initialDraft);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanSlug = draft.slug.trim() || slugifyProductName(draft.name);
    const saved = saveProduct({
      ...draft,
      slug: cleanSlug,
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      stripePaymentLink: draft.stripePaymentLink.trim(),
      stripePriceId: draft.stripePriceId.trim(),
    });
    showStoreToast(`${saved.name} saved to storefront catalog`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center overflow-y-auto bg-midnight/65 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="my-6 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden bg-ivory shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-cream px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-earth">
              {typeof draft.id === "number" ? `Editing Product #${draft.id}` : "New Catalog Item"}
            </p>
            <h3 className="font-display text-3xl text-midnight">
              {draft.name || "Untitled Candle"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center border border-border bg-ivory"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Candle Name *
              </span>
              <input
                required
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    name: e.target.value,
                    slug: typeof d.id === "number" ? d.slug : slugifyProductName(e.target.value),
                  }))
                }
                placeholder="Ambrevelle"
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                URL Slug *
              </span>
              <input
                required
                type="text"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: slugifyProductName(e.target.value) }))}
                placeholder="ambrevelle"
                className="w-full border border-border bg-card px-3.5 py-2.5 font-mono outline-none focus:border-midnight"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                SKU *
              </span>
              <input
                required
                type="text"
                value={draft.sku}
                onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                className="w-full border border-border bg-card px-3.5 py-2.5 font-mono outline-none focus:border-midnight"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Collection Category
              </span>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, category: e.target.value as ProductCategory }))
                }
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Price (USD) *
              </span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={draft.price}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: Number.parseFloat(e.target.value) || 0 }))
                }
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                  Stock Units *
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stock: Number.parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                  Size
                </span>
                <input
                  type="text"
                  value={draft.size}
                  onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
                  className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_96px]">
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Product Image Path or URL *
              </span>
              <input
                required
                type="text"
                value={draft.image}
                onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
                placeholder="/products/ambrevelle.jpg"
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Built-in mockups: /products/summer-sunset.jpg, /products/ambrevelle.jpg,
                /products/autumn-apple.jpg, /products/caribbean-ocean.jpg,
                /products/driftwood-haven.jpg, /products/veloura-pumpkin.jpg,
                /products/boozy-bourbon.jpg
              </span>
            </label>
            <img
              src={draft.image}
              alt="Preview"
              className="h-24 w-24 border border-border object-cover"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Fragrance Subtitle *
              </span>
              <input
                required
                type="text"
                value={draft.fragrance}
                onChange={(e) => setDraft((d) => ({ ...d, fragrance: e.target.value }))}
                placeholder="Golden Amber & Warm Vanilla"
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
                Burn Time
              </span>
              <input
                type="text"
                value={draft.burnTime}
                onChange={(e) => setDraft((d) => ({ ...d, burnTime: e.target.value }))}
                placeholder="45–50 hours"
                className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Editorial Mood Line *
            </span>
            <input
              required
              type="text"
              value={draft.mood}
              onChange={(e) => setDraft((d) => ({ ...d, mood: e.target.value }))}
              className="w-full border border-border bg-card px-3.5 py-2.5 outline-none focus:border-midnight"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Full Scent Story Description
            </span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full border border-border bg-card p-3 outline-none focus:border-midnight"
            />
          </label>

          <div className="grid gap-3 border border-border bg-cream/50 p-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-midnight">
                Top Notes
              </span>
              <input
                type="text"
                value={draft.notes.top}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: { ...d.notes, top: e.target.value } }))
                }
                className="w-full border border-border bg-ivory px-3 py-2 outline-none focus:border-midnight"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-midnight">
                Heart Notes
              </span>
              <input
                type="text"
                value={draft.notes.heart}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: { ...d.notes, heart: e.target.value } }))
                }
                className="w-full border border-border bg-ivory px-3 py-2 outline-none focus:border-midnight"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-midnight">
                Base Notes
              </span>
              <input
                type="text"
                value={draft.notes.base}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: { ...d.notes, base: e.target.value } }))
                }
                className="w-full border border-border bg-ivory px-3 py-2 outline-none focus:border-midnight"
              />
            </label>
          </div>

          {/* Stripe Fields */}
          <div className="border border-midnight/25 bg-powder/35 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-midnight">
              Stripe Product Mapping (Payment Link & Price ID)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-charcoal">
                  Direct Stripe Payment Link (Optional)
                </span>
                <input
                  type="url"
                  value={draft.stripePaymentLink}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stripePaymentLink: e.target.value }))
                  }
                  placeholder="https://buy.stripe.com/..."
                  className="w-full border border-border bg-ivory px-3 py-2 font-mono text-xs outline-none focus:border-midnight"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-charcoal">
                  Stripe Price ID (For Phase 3 API Checkout)
                </span>
                <input
                  type="text"
                  value={draft.stripePriceId}
                  onChange={(e) => setDraft((d) => ({ ...d, stripePriceId: e.target.value }))}
                  placeholder="price_1Qx..."
                  className="w-full border border-border bg-ivory px-3 py-2 font-mono text-xs outline-none focus:border-midnight"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex cursor-pointer items-center gap-2 font-medium text-midnight">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                className="accent-midnight"
              />
              <span>Visible on Live Storefront</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-medium text-midnight">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                className="accent-midnight"
              />
              <span>Set as Homepage Signature Spotlight Candle</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-cream px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border bg-ivory px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-midnight px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-primary-foreground transition hover:bg-earth"
          >
            Save Candle
          </button>
        </div>
      </form>
    </div>
  );
}
