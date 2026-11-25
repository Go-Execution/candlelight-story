import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  Database,
  ExternalLink,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { refreshAdminCloudData, useEcommerceStore } from "@/lib/ecommerce-store";
import {
  fetchIntegrationHealth,
  IntegrationHealthStatus,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import {
  AdminCustomersTab,
  AdminOverviewTab,
  AdminStripeSettingsTab,
} from "@/components/admin/AdminExtraTabs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Studio Admin & Order Management — Madeleine Lucia Candle Co." }],
  }),
  component: AdminPortalPage,
});

type AdminTab = "overview" | "orders" | "products" | "customers" | "stripe";

const ADMIN_SESSION_KEY = "mlc_admin_unlocked_v1";
const DEMO_PASSCODE = "madeleine2026";

function AdminPortalPage() {
  const state = useEcommerceStore();
  const [unlocked, setUnlocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState<IntegrationHealthStatus | null>(null);

  useEffect(() => {
    void fetchIntegrationHealth().then(setHealth);

    if (typeof window !== "undefined") {
      if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
        setUnlocked(true);
      }
    }

    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setUnlocked(true);
          void refreshAdminCloudData();
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUnlocked(true);
          void refreshAdminCloudData();
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }
    return undefined;
  }, []);

  const grantLocalPreviewAccess = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    }
    setUnlocked(true);
    setAuthError("");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // If Supabase Auth is configured and user entered an email, authenticate via Supabase Auth
    if (supabase && adminEmail.trim().includes("@")) {
      setSigningIn(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: passcode,
      });
      setSigningIn(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      grantLocalPreviewAccess();
      await refreshAdminCloudData();
      return;
    }

    // Fallback studio passcode check
    if (passcode.trim() === DEMO_PASSCODE || passcode.trim().toLowerCase() === "admin") {
      grantLocalPreviewAccess();
    } else {
      setAuthError(
        isSupabaseConfigured
          ? "Enter your Supabase Admin email & password, or use passcode 'madeleine2026'."
          : "Invalid studio passcode. Use 'madeleine2026' or Quick Enter below.",
      );
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUnlocked(false);
    setPasscode("");
  };

  const openOrderCount = state.orders.filter(
    (o) =>
      o.orderStatus === "pending" ||
      o.orderStatus === "processing" ||
      o.orderStatus === "packed",
  ).length;

  const newInquiryCount = state.inquiries.filter((i) => i.status === "new").length;

  if (!unlocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-midnight px-5 py-12 text-primary-foreground">
        <div className="w-full max-w-md border border-primary-foreground/15 bg-ivory p-8 text-charcoal shadow-2xl md:p-10">
          <div className="text-center">
            <img
              src="/logo.jpeg"
              alt="MADELEINE LUCIA Candle Co."
              className="mx-auto h-[112px] w-auto object-contain"
            />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.25em] text-earth">
              Studio Operations
            </p>
            <h1 className="mt-1 font-display text-4xl text-midnight">Admin Portal</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {isSupabaseConfigured
                ? "Sign in with your Supabase Admin account to manage cloud orders & Stripe."
                : "Manage orders, fulfillment, candle inventory, and Supabase/Stripe setup."}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              void handleLogin(e);
            }}
            className="mt-7 space-y-4"
          >
            {isSupabaseConfigured && (
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
                  Admin Email (Supabase Auth)
                </span>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="info@madeleineluciacandle.com"
                  className="w-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-midnight"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
                {isSupabaseConfigured ? "Password / Studio Passcode" : "Studio Passcode"}
              </span>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-midnight"
              />
            </label>

            {authError && <p className="text-xs text-red-700">{authError}</p>}

            <button
              type="submit"
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2 bg-midnight py-3.5 text-[10px] font-semibold uppercase tracking-[.18em] text-primary-foreground transition hover:bg-earth disabled:opacity-60"
            >
              <Lock size={13} /> {signingIn ? "Signing In..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-5 border-t border-border pt-5 text-center">
            <button
              type="button"
              onClick={grantLocalPreviewAccess}
              className="w-full border border-midnight bg-powder/45 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
            >
              Quick Enter Studio Admin
            </button>
            <Link
              to="/"
              className="mt-4 inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-midnight"
            >
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: openOrderCount },
    { id: "products", label: "Products & Stock", icon: Package },
    { id: "customers", label: "Customers & Inbox", icon: Users, badge: newInquiryCount },
    { id: "stripe", label: "Supabase & Stripe", icon: CreditCard },
  ];

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-ivory text-charcoal">
      <aside className="hidden w-64 shrink-0 flex-col bg-midnight text-primary-foreground lg:flex">
        <div className="border-b border-primary-foreground/15 px-6 py-6">
          <p className="text-[9px] font-semibold uppercase tracking-[.26em] text-dusty">
            Madeleine Lucia
          </p>
          <h1 className="mt-1 font-display text-2xl">Studio Admin</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium transition ${
                  active
                    ? "bg-ivory font-semibold text-midnight"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active ? "bg-midnight text-ivory" : "bg-earth text-ivory"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-primary-foreground/15 p-4">
          <Link
            to="/"
            className="flex w-full items-center justify-between border border-primary-foreground/25 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground transition hover:bg-primary-foreground/10"
          >
            <span>Live Storefront</span>
            <ExternalLink size={13} />
          </Link>
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-primary-foreground/65 hover:text-primary-foreground"
          >
            <LogOut size={14} /> Lock Admin
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[75] flex lg:hidden">
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-midnight/60"
          />
          <aside className="relative z-10 flex w-64 flex-col bg-midnight text-primary-foreground">
            <div className="flex items-center justify-between border-b border-primary-foreground/15 px-5 py-5">
              <span className="font-display text-2xl">Studio Admin</span>
              <button type="button" onClick={() => setMobileNavOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-xs ${
                      active
                        ? "bg-ivory font-semibold text-midnight"
                        : "text-primary-foreground/80"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span className="rounded-full bg-earth px-2 py-0.5 text-[10px] text-ivory">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#FDF1EB] px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open admin navigation"
              onClick={() => setMobileNavOpen(true)}
              className="grid size-9 place-items-center border border-border bg-ivory lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs font-semibold text-midnight">
                Madeleine Lucia Candle Co. — Commerce Console
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 font-semibold uppercase tracking-wider ${
                    isSupabaseConfigured
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  <Database size={10} />
                  {isSupabaseConfigured ? "Supabase Connected" : "Supabase Keys Pending"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 font-semibold uppercase tracking-wider ${
                    health?.stripe.secretKeyConfigured
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  <CreditCard size={10} />
                  {health?.stripe.secretKeyConfigured
                    ? `Stripe ${health.stripe.mode.toUpperCase()} Ready`
                    : "Stripe Secret Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/track-order"
              className="hidden border border-border bg-ivory px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-charcoal hover:border-midnight sm:inline-block"
            >
              Order Tracker
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-midnight px-4 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground transition hover:bg-earth"
            >
              View Store <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 lg:p-10">
          <div className="mx-auto max-w-6xl">
            {activeTab === "overview" && (
              <AdminOverviewTab
                onNavigateTab={(t) => setActiveTab(t)}
                onSelectOrder={(orderId) => {
                  setFocusedOrderId(orderId);
                  setActiveTab("orders");
                }}
              />
            )}
            {activeTab === "orders" && (
              <AdminOrdersTab
                initialSelectedOrderId={focusedOrderId}
                onClearInitialOrder={() => setFocusedOrderId(null)}
              />
            )}
            {activeTab === "products" && <AdminProductsTab />}
            {activeTab === "customers" && <AdminCustomersTab />}
            {activeTab === "stripe" && <AdminStripeSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
