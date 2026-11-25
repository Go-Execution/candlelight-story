import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
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
import { useEcommerceStore } from "@/lib/ecommerce-store";
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
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
        setUnlocked(true);
      }
    }
  }, []);

  const grantAccess = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    }
    setUnlocked(true);
    setAuthError("");
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === DEMO_PASSCODE || passcode.trim().toLowerCase() === "admin") {
      grantAccess();
    } else {
      setAuthError("Invalid studio passcode. Use 'madeleine2026' or Quick Demo Sign-In below.");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
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
              Manage orders, shipping fulfillment, candle inventory, and Stripe checkout links.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
                Studio Passcode
              </span>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter studio passcode"
                className="w-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-midnight"
              />
            </label>

            {authError && <p className="text-xs text-red-700">{authError}</p>}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-midnight py-3.5 text-[10px] font-semibold uppercase tracking-[.18em] text-primary-foreground transition hover:bg-earth"
            >
              <Lock size={13} /> Sign In to Dashboard
            </button>
          </form>

          <div className="mt-5 border-t border-border pt-5 text-center">
            <button
              type="button"
              onClick={grantAccess}
              className="w-full border border-midnight bg-powder/45 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
            >
              Quick Enter Studio Admin (Phase 1 Preview)
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
    { id: "stripe", label: "Stripe & Settings", icon: CreditCard },
  ];

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-ivory text-charcoal">
      {/* Desktop Sidebar */}
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
                    ? "bg-ivory text-midnight font-semibold"
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
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-primary-foreground/65 hover:text-primary-foreground"
          >
            <LogOut size={14} /> Lock Admin
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
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

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-[#FDF1EB] px-5 py-3.5 md:px-8">
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
              <p className="text-[11px] text-muted-foreground">
                Phase 1 Frontend Active • Storefront & Admin Live Synced
              </p>
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
