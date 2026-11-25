import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CloudUpload,
  CreditCard,
  Database,
  DollarSign,
  Download,
  KeyRound,
  Mail,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  deletePromoCode,
  formatMoney,
  ORDER_STATUS_LABELS,
  resetStoreToDefaults,
  saveProduct,
  seedCatalogToSupabase,
  showStoreToast,
  togglePromoCode,
  updateInquiryStatus,
  updateStoreSettings,
  upsertPromoCode,
  useEcommerceStore,
} from "@/lib/ecommerce-store";
import {
  fetchIntegrationHealth,
  IntegrationHealthStatus,
  isSupabaseConfigured,
} from "@/lib/supabase";

// ------------------------------------------------------------
// 1. OVERVIEW & ANALYTICS TAB
// ------------------------------------------------------------
export function AdminOverviewTab({
  onSelectOrder,
  onNavigateTab,
}: {
  onSelectOrder: (orderId: string) => void;
  onNavigateTab: (tab: "orders" | "products" | "customers" | "stripe") => void;
}) {
  const state = useEcommerceStore();

  const validOrders = state.orders.filter((o) => o.orderStatus !== "cancelled");
  const grossRevenue = validOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const aov = validOrders.length > 0 ? grossRevenue / validOrders.length : 0;

  const unfulfilledOrders = state.orders.filter(
    (o) =>
      o.orderStatus === "pending" ||
      o.orderStatus === "processing" ||
      o.orderStatus === "packed",
  );
  const lowStockProducts = state.products.filter((p) => p.stock <= p.lowStockThreshold);

  const chartData = useMemo(() => {
    const grouped = new Map<string, { dateLabel: string; revenue: number; orders: number }>();
    const chronological = [...validOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const order of chronological) {
      const label = new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = grouped.get(label);
      if (existing) {
        existing.revenue += order.total;
        existing.orders += 1;
      } else {
        grouped.set(label, { dateLabel: label, revenue: order.total, orders: 1 });
      }
    }
    return Array.from(grouped.values());
  }, [validOrders]);

  const topCandles = useMemo(() => {
    const tally = new Map<string, { name: string; units: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const entry = tally.get(item.name);
        if (entry) {
          entry.units += item.quantity;
          entry.revenue += item.price * item.quantity;
        } else {
          tally.set(item.name, {
            name: item.name,
            units: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      }
    }
    return Array.from(tally.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [validOrders]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-earth">
          Studio Performance
        </p>
        <h2 className="mt-1 font-display text-4xl text-midnight">Store Overview</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-border bg-card p-5">
          <div className="flex items-center justify-between text-earth">
            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Stripe Revenue
            </span>
            <DollarSign size={16} />
          </div>
          <p className="mt-3 font-display text-4xl text-midnight">{formatMoney(grossRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Avg. Order Value: {formatMoney(aov)}
          </p>
        </div>

        <div className="border border-border bg-card p-5">
          <div className="flex items-center justify-between text-earth">
            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Total Orders
            </span>
            <ShoppingBag size={16} />
          </div>
          <p className="mt-3 font-display text-4xl text-midnight">{state.orders.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.orders.filter((o) => o.orderStatus === "delivered").length} delivered
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("orders")}
          className="border border-border bg-card p-5 text-left transition hover:border-midnight"
        >
          <div className="flex items-center justify-between text-earth">
            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Awaiting Fulfillment
            </span>
            <Package size={16} />
          </div>
          <p className="mt-3 font-display text-4xl text-midnight">{unfulfilledOrders.length}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-midnight">
            Open Order Queue <ArrowRight size={12} />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("products")}
          className="border border-border bg-card p-5 text-left transition hover:border-midnight"
        >
          <div className="flex items-center justify-between text-earth">
            <span className="text-[10px] font-semibold uppercase tracking-[.16em]">
              Stock Alerts
            </span>
            <AlertTriangle size={16} />
          </div>
          <p className="mt-3 font-display text-4xl text-midnight">{lowStockProducts.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lowStockProducts.length > 0
              ? lowStockProducts.map((p) => p.name).join(", ")
              : "All scents well-stocked"}
          </p>
        </button>
      </div>

      {/* Revenue Chart + Top Scents */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
                Revenue Trend
              </p>
              <h3 className="font-display text-2xl text-midnight">Sales by Order Date</h3>
            </div>
            <TrendingUp size={18} className="text-earth" />
          </div>

          <div className="mt-6 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ddd3" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#182b49"
                  fill="#8da9b6"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
            Bestsellers
          </p>
          <h3 className="font-display text-2xl text-midnight">Top Selling Scents</h3>
          <div className="mt-5 space-y-4">
            {topCandles.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-midnight">
                    0{idx + 1}. {c.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{c.units} jars sold</p>
                </div>
                <span className="font-semibold text-midnight">{formatMoney(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Orders Requiring Action */}
      <div className="border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
              Priority Queue
            </p>
            <h3 className="font-display text-2xl text-midnight">
              Orders Ready to Pack & Dispatch
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-semibold uppercase tracking-[.14em] text-midnight underline"
          >
            View All Orders
          </button>
        </div>

        {unfulfilledOrders.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            All open orders have been shipped!
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border/70">
            {unfulfilledOrders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-midnight">#{o.id}</span>{" "}
                  <span className="text-muted-foreground">— {o.customer.fullName}</span>
                  <p className="text-[11px] text-muted-foreground">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-midnight">{formatMoney(o.total)}</span>
                  <span className="border border-border bg-cream px-2.5 py-1 text-[10px] font-semibold uppercase">
                    {ORDER_STATUS_LABELS[o.orderStatus]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectOrder(o.id)}
                    className="bg-midnight px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-primary-foreground hover:bg-earth"
                  >
                    Fulfill
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 2. CUSTOMERS, INQUIRIES & NEWSLETTER TAB
// ------------------------------------------------------------
export function AdminCustomersTab() {
  const state = useEcommerceStore();
  const [subTab, setSubTab] = useState<"customers" | "inquiries" | "subscribers">("customers");

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        fullName: string;
        cityState: string;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: string;
      }
    >();

    for (const order of state.orders) {
      if (order.orderStatus === "cancelled") continue;
      const key = order.customer.email.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = order.createdAt;
        }
      } else {
        map.set(key, {
          email: order.customer.email,
          fullName: order.customer.fullName,
          cityState: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderAt: order.createdAt,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [state.orders]);

  const exportSubscribersCsv = () => {
    const csv = [
      "Email,Joined At",
      ...state.subscribers.map((s) => `${s.email},${s.joinedAt}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "madeleine-lucia-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
    showStoreToast("Subscriber list exported");
  };

  const unreadCount = state.inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-earth">
          Relationships & Support
        </p>
        <h2 className="mt-1 font-display text-4xl text-midnight">Customers & Inquiries</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab("customers")}
          className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.15em] ${
            subTab === "customers"
              ? "border-midnight bg-midnight text-primary-foreground"
              : "border-border bg-card text-charcoal"
          }`}
        >
          Customers ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("inquiries")}
          className={`inline-flex items-center gap-2 border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.15em] ${
            subTab === "inquiries"
              ? "border-midnight bg-midnight text-primary-foreground"
              : "border-border bg-card text-charcoal"
          }`}
        >
          <span>Contact Inquiries ({state.inquiries.length})</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-earth px-1.5 py-0.5 text-[9px] text-ivory">
              {unreadCount} new
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSubTab("subscribers")}
          className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[.15em] ${
            subTab === "subscribers"
              ? "border-midnight bg-midnight text-primary-foreground"
              : "border-border bg-card text-charcoal"
          }`}
        >
          Newsletter ({state.subscribers.length})
        </button>
      </div>

      {subTab === "customers" && (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-cream/70 text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Lifetime Spend</th>
                <th className="px-4 py-3.5">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {customers.map((c) => (
                <tr key={c.email} className="hover:bg-ivory/60">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-midnight">{c.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-charcoal">{c.cityState}</td>
                  <td className="px-4 py-3.5 font-medium">{c.orderCount}</td>
                  <td className="px-4 py-3.5 font-semibold text-midnight">
                    {formatMoney(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {new Date(c.lastOrderAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "inquiries" && (
        <div className="space-y-4">
          {state.inquiries.map((inq) => (
            <div key={inq.id} className="border border-border bg-card p-5 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-midnight">{inq.name}</span>
                    <span className="text-muted-foreground">({inq.email})</span>
                    <span className="border border-border bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {inq.inquiryType}
                    </span>
                    {inq.status === "new" && (
                      <span className="bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(inq.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={(e) =>
                      updateInquiryStatus(
                        inq.id,
                        e.target.value as "new" | "read" | "replied",
                      )
                    }
                    className="border border-border bg-ivory px-2.5 py-1.5 text-[11px] outline-none"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                  <a
                    href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.inquiryType)} — Madeleine Lucia Candle Co.`}
                    onClick={() => updateInquiryStatus(inq.id, "replied")}
                    className="inline-flex items-center gap-1.5 bg-midnight px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground"
                  >
                    <Mail size={12} /> Reply
                  </a>
                </div>
              </div>
              <p className="mt-3 leading-6 text-charcoal">{inq.message}</p>
            </div>
          ))}
        </div>
      )}

      {subTab === "subscribers" && (
        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-midnight">Newsletter Subscribers</h3>
            <button
              type="button"
              onClick={exportSubscribersCsv}
              className="inline-flex items-center gap-1.5 border border-midnight px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-midnight"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
          <div className="mt-4 divide-y divide-border/70 text-xs">
            {state.subscribers.map((sub) => (
              <div key={sub.email} className="flex justify-between py-3">
                <span className="font-medium text-midnight">{sub.email}</span>
                <span className="text-muted-foreground">
                  Joined {new Date(sub.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 3. SUPABASE + STRIPE INTEGRATION & STORE SETTINGS TAB
// ------------------------------------------------------------
export function AdminStripeSettingsTab() {
  const state = useEcommerceStore();
  const [health, setHealth] = useState<IntegrationHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [seedingCloud, setSeedingCloud] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoType, setPromoType] = useState<"percentage" | "fixed" | "free_shipping">(
    "percentage",
  );
  const [promoValue, setPromoValue] = useState("10");
  const [promoMin, setPromoMin] = useState("0");
  const [promoDesc, setPromoDesc] = useState("");

  const refreshHealth = async () => {
    setCheckingHealth(true);
    const res = await fetchIntegrationHealth();
    setHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    void refreshHealth();
  }, []);

  const handleSeedSupabase = async () => {
    setSeedingCloud(true);
    const res = await seedCatalogToSupabase();
    setSeedingCloud(false);
    showStoreToast(res.message);
  };

  const handleAddPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    upsertPromoCode({
      code: promoCode.trim().toUpperCase(),
      type: promoType,
      value: promoType === "free_shipping" ? 0 : Number.parseFloat(promoValue) || 0,
      minSubtotal: Number.parseFloat(promoMin) || 0,
      active: true,
      usageCount: 0,
      description: promoDesc.trim() || "Store promotional code",
    });
    setPromoCode("");
    setPromoDesc("");
    showStoreToast("Promo code saved");
  };

  const webhookEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/stripe/webhook`
      : "/api/stripe/webhook";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-earth">
            Cloud Backend, Payments & Store Rules
          </p>
          <h2 className="mt-1 font-display text-4xl text-midnight">
            Supabase & Stripe Configuration
          </h2>
        </div>

        <button
          type="button"
          disabled={checkingHealth}
          onClick={() => {
            void refreshHealth();
          }}
          className="inline-flex items-center gap-2 border border-midnight bg-ivory px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-midnight hover:bg-midnight hover:text-primary-foreground"
        >
          <RefreshCw size={13} className={checkingHealth ? "animate-spin" : ""} />
          Re-Check Keys Status
        </button>
      </div>

      {/* Live Environment Keys Health Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-midnight">
              <Database size={15} className="text-earth" /> Supabase Database & Auth
            </p>
            {isSupabaseConfigured && (
              <button
                type="button"
                disabled={seedingCloud}
                onClick={() => {
                  void handleSeedSupabase();
                }}
                className="inline-flex items-center gap-1.5 bg-midnight px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-earth"
              >
                <CloudUpload size={12} />
                {seedingCloud ? "Syncing..." : "Push Catalog to Supabase"}
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <StatusRow
              label="VITE_SUPABASE_URL"
              ok={Boolean(health?.supabase.urlConfigured)}
            />
            <StatusRow
              label="VITE_SUPABASE_ANON_KEY"
              ok={Boolean(health?.supabase.anonKeyConfigured)}
            />
            <StatusRow
              label="SUPABASE_SERVICE_ROLE_KEY (Server Webhooks)"
              ok={Boolean(health?.supabase.serviceRoleConfigured)}
            />
          </div>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
            Run <code>supabase/migrations/001_ecommerce_schema.sql</code> once in your Supabase SQL
            Editor to create all tables, RLS policies, and seed all 7 candles.
          </p>
        </div>

        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-midnight">
              <CreditCard size={15} className="text-earth" /> Stripe Live Checkout & Webhooks
            </p>
            <span className="border border-border bg-ivory px-2.5 py-0.5 text-[10px] font-semibold uppercase">
              Mode: {health?.stripe.mode ?? "checking"}
            </span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <StatusRow
              label="VITE_STRIPE_PUBLISHABLE_KEY (pk_...)"
              ok={Boolean(health?.stripe.publishableKeyConfigured)}
            />
            <StatusRow
              label="STRIPE_SECRET_KEY (sk_... Server Only)"
              ok={Boolean(health?.stripe.secretKeyConfigured)}
            />
            <StatusRow
              label="STRIPE_WEBHOOK_SECRET (whsec_...)"
              ok={Boolean(health?.stripe.webhookSecretConfigured)}
            />
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-midnight">Webhook URL:</span>{" "}
            <code className="break-all bg-ivory px-1.5 py-0.5 text-midnight">
              {webhookEndpoint}
            </code>
            <br />
            <span>Listen to event: </span>
            <code>checkout.session.completed</code>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Mode & Payment Links */}
      <div className="border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-earth" />
          <h3 className="font-display text-2xl text-midnight">Stripe Checkout Mode & Links</h3>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1.5 block font-semibold uppercase tracking-wider text-charcoal">
              Checkout Payment Flow
            </span>
            <select
              value={state.settings.stripeCheckoutMode}
              onChange={(e) => {
                updateStoreSettings({
                  stripeCheckoutMode: e.target.value as
                    | "stripe_checkout_preview"
                    | "stripe_payment_link",
                });
                showStoreToast("Stripe checkout mode updated");
              }}
              className="w-full border border-border bg-ivory px-3.5 py-2.5 outline-none focus:border-midnight"
            >
              <option value="stripe_checkout_preview">
                Dynamic Stripe Checkout Session API (/api/stripe/create-checkout-session)
              </option>
              <option value="stripe_payment_link">
                Direct Stripe Hosted Payment Link Redirect (buy.stripe.com)
              </option>
            </select>
          </label>

          <label className="block text-xs">
            <span className="mb-1.5 block font-semibold uppercase tracking-wider text-charcoal">
              Global Fallback Stripe Payment Link (Optional)
            </span>
            <input
              type="url"
              value={state.settings.globalStripePaymentLink}
              onChange={(e) =>
                updateStoreSettings({ globalStripePaymentLink: e.target.value.trim() })
              }
              placeholder="https://buy.stripe.com/..."
              className="w-full border border-border bg-ivory px-3.5 py-2.5 font-mono text-xs outline-none focus:border-midnight"
            />
          </label>

          <label className="block text-xs md:col-span-2">
            <span className="mb-1.5 flex items-center gap-1.5 font-semibold uppercase tracking-wider text-charcoal">
              <KeyRound size={13} className="text-earth" /> Public Publishable Key Reference (
              <code>pk_test_...</code> or <code>pk_live_...</code>)
            </span>
            <input
              type="text"
              value={state.settings.stripePublishableKey}
              onChange={(e) =>
                updateStoreSettings({ stripePublishableKey: e.target.value.trim() })
              }
              placeholder="pk_live_... (Keep sk_live_... strictly inside .env.local / Supabase Secrets)"
              className="w-full border border-border bg-ivory px-3.5 py-2.5 font-mono text-xs outline-none focus:border-midnight"
            />
          </label>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
            Optional Per-Candle Stripe Payment Links
          </p>
          <div className="mt-4 space-y-2.5">
            {state.products.map((prod) => (
              <div
                key={prod.id}
                className="grid items-center gap-2 border border-border/70 bg-ivory p-3 text-xs sm:grid-cols-[200px_1fr_auto]"
              >
                <span className="font-medium text-midnight">
                  {prod.name}{" "}
                  <span className="text-[11px] text-muted-foreground">
                    ({formatMoney(prod.price)})
                  </span>
                </span>
                <input
                  type="url"
                  defaultValue={prod.stripePaymentLink}
                  onBlur={(e) => {
                    const nextVal = e.target.value.trim();
                    if (nextVal !== prod.stripePaymentLink) {
                      saveProduct({ ...prod, stripePaymentLink: nextVal });
                      showStoreToast(`Stripe link updated for ${prod.name}`);
                    }
                  }}
                  placeholder="https://buy.stripe.com/... (leave blank to use Dynamic API Session)"
                  className="border border-border bg-card px-3 py-1.5 font-mono text-xs outline-none focus:border-midnight"
                />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {prod.stripePaymentLink ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-earth">
                      <Check size={12} /> Direct Link
                    </span>
                  ) : (
                    "API Session"
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping, Tax & Announcement Banner */}
      <div className="border border-border bg-card p-6">
        <h3 className="font-display text-2xl text-midnight">
          Shipping Rates, Tax & Storefront Banner
        </h3>
        <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Free Shipping Min ($)
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={state.settings.freeShippingThreshold}
              onChange={(e) =>
                updateStoreSettings({
                  freeShippingThreshold: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-full border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Standard Shipping ($)
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={state.settings.standardShippingRate}
              onChange={(e) =>
                updateStoreSettings({
                  standardShippingRate: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-full border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Express Shipping ($)
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={state.settings.expressShippingRate}
              onChange={(e) =>
                updateStoreSettings({
                  expressShippingRate: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-full border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold uppercase tracking-wider text-charcoal">
              Tax Rate (%)
            </span>
            <input
              type="number"
              min="0"
              max="25"
              step="0.1"
              value={state.settings.taxRatePercent}
              onChange={(e) =>
                updateStoreSettings({
                  taxRatePercent: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-full border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-5 text-xs sm:grid-cols-[auto_1fr] sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 font-semibold text-midnight">
            <input
              type="checkbox"
              checked={state.settings.announcementEnabled}
              onChange={(e) =>
                updateStoreSettings({ announcementEnabled: e.target.checked })
              }
              className="accent-midnight"
            />
            <span>Show Top Announcement Bar</span>
          </label>
          <input
            type="text"
            value={state.settings.announcementText}
            onChange={(e) => updateStoreSettings({ announcementText: e.target.value })}
            className="w-full border border-border bg-ivory px-3.5 py-2.5 outline-none focus:border-midnight"
          />
        </div>
      </div>

      {/* Promo Codes Manager */}
      <div className="border border-border bg-card p-6">
        <h3 className="font-display text-2xl text-midnight">Promo & Discount Codes</h3>

        <form onSubmit={handleAddPromo} className="mt-4 grid gap-3 text-xs sm:grid-cols-5">
          <input
            required
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="CODE (e.g. SPRING20)"
            className="border border-border bg-ivory px-3 py-2.5 uppercase outline-none focus:border-midnight"
          />
          <select
            value={promoType}
            onChange={(e) =>
              setPromoType(e.target.value as "percentage" | "fixed" | "free_shipping")
            }
            className="border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed USD ($)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <input
            type="number"
            min="0"
            disabled={promoType === "free_shipping"}
            value={promoValue}
            onChange={(e) => setPromoValue(e.target.value)}
            placeholder="Value"
            className="border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight disabled:opacity-45"
          />
          <input
            type="number"
            min="0"
            value={promoMin}
            onChange={(e) => setPromoMin(e.target.value)}
            placeholder="Min Subtotal ($)"
            className="border border-border bg-ivory px-3 py-2.5 outline-none focus:border-midnight"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 bg-midnight px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground hover:bg-earth"
          >
            <Plus size={13} /> Add Code
          </button>
        </form>

        <div className="mt-5 divide-y divide-border/70 text-xs">
          {state.promoCodes.map((p) => (
            <div key={p.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <span className="font-mono font-bold text-midnight">{p.code}</span>
                <span className="ml-2 text-muted-foreground">
                  {p.type === "percentage"
                    ? `${p.value}% off`
                    : p.type === "fixed"
                      ? `$${p.value} off`
                      : "Free Standard Shipping"}
                  {p.minSubtotal > 0 ? ` (Min ${formatMoney(p.minSubtotal)})` : ""} • Used{" "}
                  {p.usageCount}×
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePromoCode(p.code)}
                  className={`border px-2.5 py-1 text-[10px] font-semibold uppercase ${
                    p.active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-stone-300 bg-stone-100 text-stone-600"
                  }`}
                >
                  {p.active ? "Active" : "Paused"}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.code}`}
                  onClick={() => deletePromoCode(p.code)}
                  className="grid size-7 place-items-center border border-border text-muted-foreground hover:text-red-700"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Demo Data */}
      <div className="flex items-center justify-between border border-border bg-cream/60 p-5 text-xs">
        <div>
          <p className="font-semibold text-midnight">Reset Local Cache Data</p>
          <p className="text-muted-foreground">
            Clear local browser cache and reload from Supabase / initial defaults.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset local browser cache back to defaults?")) {
              resetStoreToDefaults();
              showStoreToast("Local store cache reset");
            }
          }}
          className="inline-flex items-center gap-1.5 border border-midnight bg-ivory px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.14em] text-midnight hover:bg-midnight hover:text-primary-foreground"
        >
          <RotateCcw size={13} /> Reset Cache
        </button>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border border-border/60 bg-ivory px-3 py-2">
      <code className="text-[11px] text-charcoal">{label}</code>
      {ok ? (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
          <CheckCircle2 size={13} /> Configured
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-800">
          <XCircle size={13} /> Not Set Yet
        </span>
      )}
    </div>
  );
}
