import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Gift,
  Package,
  Printer,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatMoney,
  Order,
  ORDER_STATUS_LABELS,
  OrderStatus,
  PaymentStatus,
  showStoreToast,
  updateOrderPaymentStatus,
  updateOrderStatus,
  updateOrderTracking,
  useEcommerceStore,
} from "@/lib/ecommerce-store";

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  processing: "bg-sky-100 text-sky-900 border-sky-300",
  packed: "bg-indigo-100 text-indigo-900 border-indigo-300",
  shipped: "bg-emerald-100 text-emerald-900 border-emerald-300",
  delivered: "bg-sage/40 text-midnight border-earth/40",
  cancelled: "bg-red-100 text-red-900 border-red-300",
};

const PAYMENT_BADGE_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-800 border-emerald-300",
  awaiting_stripe: "bg-amber-50 text-amber-800 border-amber-300",
  refunded: "bg-stone-100 text-stone-700 border-stone-300",
  failed: "bg-red-50 text-red-800 border-red-300",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid (Stripe)",
  awaiting_stripe: "Awaiting Stripe",
  refunded: "Refunded",
  failed: "Failed",
};

export function AdminOrdersTab({
  initialSelectedOrderId = null,
  onClearInitialOrder,
}: {
  initialSelectedOrderId?: string | null;
  onClearInitialOrder?: () => void;
}) {
  const state = useEcommerceStore();
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialSelectedOrderId,
  );
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const activeSelectedId = selectedOrderId ?? initialSelectedOrderId;
  const selectedOrder =
    state.orders.find((o) => o.id === activeSelectedId) ?? null;

  const countsByStatus = useMemo(() => {
    const counts: Record<"all" | OrderStatus, number> = {
      all: state.orders.length,
      pending: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of state.orders) {
      counts[o.orderStatus] += 1;
    }
    return counts;
  }, [state.orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.orders.filter((order) => {
      if (statusFilter !== "all" && order.orderStatus !== statusFilter) return false;
      if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;
      if (!q) return true;
      const matchesItems = order.items.some(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      );
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer.fullName.toLowerCase().includes(q) ||
        order.customer.email.toLowerCase().includes(q) ||
        order.trackingNumber.toLowerCase().includes(q) ||
        matchesItems
      );
    });
  }, [paymentFilter, searchQuery, state.orders, statusFilter]);

  const exportOrdersCsv = () => {
    const headers = [
      "Order ID",
      "Created At",
      "Customer Name",
      "Customer Email",
      "Order Status",
      "Payment Status",
      "Items",
      "Total USD",
      "Carrier",
      "Tracking Number",
      "City",
      "State",
    ];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.createdAt,
      `"${o.customer.fullName.replace(/"/g, '""')}"`,
      o.customer.email,
      o.orderStatus,
      o.paymentStatus,
      `"${o.items.map((i) => `${i.name} x${i.quantity}`).join("; ")}"`,
      o.total.toFixed(2),
      o.trackingCarrier,
      o.trackingNumber,
      `"${o.shippingAddress.city}"`,
      o.shippingAddress.state,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `madeleine-lucia-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showStoreToast("Orders CSV exported");
  };

  const closeDetail = () => {
    setSelectedOrderId(null);
    if (onClearInitialOrder) onClearInitialOrder();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-earth">
            Fulfillment & Dispatch
          </p>
          <h2 className="mt-1 font-display text-4xl text-midnight">Order Management</h2>
        </div>
        <button
          type="button"
          onClick={exportOrdersCsv}
          className="inline-flex items-center gap-2 border border-midnight bg-ivory px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
        >
          <Download size={13} /> Export CSV ({filteredOrders.length})
        </button>
      </div>

      {/* Pipeline Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All Orders"],
            ["pending", "Pending"],
            ["processing", "Processing"],
            ["packed", "Packed"],
            ["shipped", "Shipped"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
          ] as Array<["all" | OrderStatus, string]>
        ).map(([key, label]) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-2 border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.14em] transition ${
                active
                  ? "border-midnight bg-midnight text-primary-foreground"
                  : "border-border bg-card text-charcoal hover:border-midnight"
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  active ? "bg-ivory/20 text-ivory" : "bg-cream text-midnight"
                }`}
              >
                {countsByStatus[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Payment Filter */}
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
            placeholder="Search by Order #MLC, customer name, email, candle, or tracking..."
            className="w-full border border-border bg-ivory py-2.5 pl-9 pr-8 text-xs outline-none focus:border-midnight"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-midnight"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as "all" | PaymentStatus)}
          aria-label="Filter by payment status"
          className="border border-border bg-ivory px-3 py-2.5 text-xs outline-none focus:border-midnight"
        >
          <option value="all">All Payment States</option>
          <option value="paid">Paid (Stripe)</option>
          <option value="awaiting_stripe">Awaiting Stripe Link</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[820px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-cream/70 text-[10px] font-semibold uppercase tracking-[.15em] text-charcoal">
              <th className="px-4 py-3.5">Order</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Payment</th>
              <th className="px-4 py-3.5">Fulfillment</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No orders match your current filters.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="cursor-pointer transition hover:bg-ivory/80"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-midnight">
                        <span>#{order.id}</span>
                        {order.giftNote && (
                          <span title="Contains Gift Card Note">
                            <Gift size={13} className="text-earth" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {order.shippingMethod === "express" ? "Express Air" : "Standard"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-midnight">{order.customer.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-charcoal">
                        {totalUnits} {totalUnits === 1 ? "candle" : "candles"}
                      </p>
                      <p className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                        {order.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-midnight">
                      {formatMoney(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PAYMENT_BADGE_STYLES[order.paymentStatus]}`}
                      >
                        {PAYMENT_LABELS[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE_STYLES[order.orderStatus]}`}
                      >
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 border border-midnight bg-ivory px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-midnight transition hover:bg-midnight hover:text-primary-foreground"
                      >
                        <Eye size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Order Fulfillment Drawer */}
      {selectedOrder && (
        <OrderFulfillmentDrawer
          key={selectedOrder.id}
          order={selectedOrder}
          onClose={closeDetail}
          onPrint={() => setPrintOrder(selectedOrder)}
        />
      )}

      {/* Printable Packing Slip Modal */}
      {printOrder && (
        <PackingSlipModal order={printOrder} onClose={() => setPrintOrder(null)} />
      )}
    </div>
  );
}

function OrderFulfillmentDrawer({
  order,
  onClose,
  onPrint,
}: {
  order: Order;
  onClose: () => void;
  onPrint: () => void;
}) {
  const [carrier, setCarrier] = useState(order.trackingCarrier || "USPS");
  const [trackingNum, setTrackingNum] = useState(order.trackingNumber);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes);
  const [statusNote, setStatusNote] = useState("");
  const [copiedAddr, setCopiedAddr] = useState(false);

  const copyAddress = () => {
    const lines = [
      order.customer.fullName,
      order.shippingAddress.street,
      order.shippingAddress.apartment,
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
      order.shippingAddress.country,
    ]
      .filter(Boolean)
      .join("\n");
    void navigator.clipboard.writeText(lines);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1800);
  };

  const handleStatusChange = (nextStatus: OrderStatus) => {
    updateOrderStatus(
      order.id,
      nextStatus,
      statusNote.trim(),
      carrier.trim(),
      trackingNum.trim(),
    );
    setStatusNote("");
    showStoreToast(`Order #${order.id} marked ${ORDER_STATUS_LABELS[nextStatus]}`);
  };

  const handleSaveShippingAndNotes = () => {
    updateOrderTracking(order.id, carrier, trackingNum, internalNotes);
    showStoreToast(`Tracking & studio notes saved for #${order.id}`);
  };

  const handleDispatchNow = () => {
    updateOrderTracking(order.id, carrier, trackingNum, internalNotes);
    updateOrderStatus(
      order.id,
      "shipped",
      statusNote.trim() ||
        (trackingNum.trim()
          ? `Dispatched via ${carrier} (#${trackingNum.trim()})`
          : `Dispatched via ${carrier}`),
      carrier.trim(),
      trackingNum.trim(),
    );
    setStatusNote("");
    showStoreToast(`Order #${order.id} dispatched & customer tracking updated!`);
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-midnight/60 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-ivory shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-cream px-6 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-display text-3xl text-midnight">Order #{order.id}</h3>
              <span
                className={`border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE_STYLES[order.orderStatus]}`}
              >
                {ORDER_STATUS_LABELS[order.orderStatus]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Placed{" "}
              {new Date(order.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 border border-border bg-ivory px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-midnight hover:border-midnight"
            >
              <Printer size={13} /> Packing Slip
            </button>
            <button
              type="button"
              aria-label="Close drawer"
              onClick={onClose}
              className="grid size-9 place-items-center border border-border bg-ivory hover:bg-cream"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Quick Pipeline Stage Selector */}
          <div className="border border-border bg-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-earth">
              1. Update Fulfillment Stage
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(
                [
                  "pending",
                  "processing",
                  "packed",
                  "shipped",
                  "delivered",
                  "cancelled",
                ] as OrderStatus[]
              ).map((st) => {
                const current = order.orderStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`border px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition ${
                      current
                        ? "border-midnight bg-midnight text-primary-foreground"
                        : "border-border bg-ivory text-charcoal hover:border-midnight"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Optional timeline note before clicking a stage above (e.g. Hand-poured & inspected)..."
              className="mt-3 w-full border border-border bg-ivory px-3 py-2 text-xs outline-none focus:border-midnight"
            />
          </div>

          {/* Carrier & Tracking Dispatch Box */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-earth">
                <Truck size={13} /> 2. Carrier Tracking & Studio Notes
              </p>
              <a
                href={`/track-order`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-midnight underline"
              >
                Customer Tracking Page <ExternalLink size={11} />
              </a>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                aria-label="Shipping carrier"
                className="border border-border bg-ivory px-3 py-2.5 text-xs outline-none focus:border-midnight"
              >
                <option value="USPS">USPS</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="DHL">DHL</option>
              </select>
              <input
                type="text"
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                placeholder="Enter tracking number (e.g. 940551189922...)"
                className="border border-border bg-ivory px-3.5 py-2.5 font-mono text-xs outline-none focus:border-midnight"
              />
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                Internal Studio Notes (Private)
              </span>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Packaging notes, ribbon preference, VIP instructions..."
                className="w-full border border-border bg-ivory p-3 text-xs outline-none focus:border-midnight"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveShippingAndNotes}
                className="border border-midnight bg-ivory px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-midnight hover:bg-cream"
              >
                Save Tracking / Notes
              </button>
              {order.orderStatus !== "shipped" && order.orderStatus !== "delivered" && (
                <button
                  type="button"
                  onClick={handleDispatchNow}
                  className="inline-flex items-center gap-1.5 bg-midnight px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.15em] text-primary-foreground hover:bg-earth"
                >
                  <Package size={13} /> Save & Mark Order Shipped
                </button>
              )}
            </div>
          </div>

          {/* Customer, Shipping & Stripe Payment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border bg-card p-5 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
                  Customer & Destination
                </p>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-midnight hover:text-earth"
                >
                  {copiedAddr ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAddr ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 font-semibold text-midnight">{order.customer.fullName}</p>
              <a
                href={`mailto:${order.customer.email}?subject=Your Madeleine Lucia Order %23${order.id}`}
                className="text-earth underline"
              >
                {order.customer.email}
              </a>
              <div className="mt-3 space-y-0.5 border-t border-border pt-3 text-charcoal">
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            <div className="border border-border bg-card p-5 text-xs">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
                <ShieldCheck size={13} /> Stripe Payment Record
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <select
                    value={order.paymentStatus}
                    onChange={(e) => {
                      updateOrderPaymentStatus(order.id, e.target.value as PaymentStatus);
                      showStoreToast("Payment status updated");
                    }}
                    className="border border-border bg-ivory px-2 py-1 text-[11px] font-semibold outline-none"
                  >
                    <option value="paid">Paid (Stripe)</option>
                    <option value="awaiting_stripe">Awaiting Stripe</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium text-midnight">
                    {order.paymentMethod === "stripe_payment_link"
                      ? "Stripe Payment Link"
                      : "Stripe Checkout"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Session / Ref ID:</span>
                  <code className="mt-0.5 block break-all bg-ivory px-2 py-1 text-[11px] text-midnight">
                    {order.stripeSessionId}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {order.giftNote && (
            <div className="border border-earth/40 bg-powder/35 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
                <Gift size={13} /> Handwritten Gift Card Requested
              </p>
              <p className="mt-1.5 font-display text-xl italic text-midnight">
                “{order.giftNote}”
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="border border-border bg-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
              Line Items ({order.items.reduce((s, i) => s + i.quantity, 0)} units)
            </p>
            <div className="mt-3 divide-y divide-border/70">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-3 first:pt-0">
                  <img src={item.image} alt={item.name} className="h-14 w-12 object-cover" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-midnight">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      SKU: {item.sku} • {item.size}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-midnight">
                      {formatMoney(item.price)} × {item.quantity}
                    </p>
                    <p className="text-muted-foreground">
                      {formatMoney(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-earth">
                  <span>Promo ({order.discountCode})</span>
                  <span>-{formatMoney(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping ({order.shippingMethod})
                </span>
                <span>{order.shippingCost === 0 ? "FREE" : formatMoney(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-2xl text-midnight">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="border border-border bg-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-earth">
              Order Activity Log
            </p>
            <div className="mt-4 space-y-3">
              {[...order.timeline].reverse().map((ev) => (
                <div key={ev.id} className="border-l-2 border-earth/50 pl-3.5 text-xs">
                  <p className="font-semibold text-midnight">{ev.label}</p>
                  <p className="text-muted-foreground">{ev.note}</p>
                  <p className="text-[10px] text-muted-foreground/80">
                    {new Date(ev.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackingSlipModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-midnight/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white p-8 text-charcoal shadow-2xl">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h3 className="font-display text-3xl text-midnight">
              Madeleine Lucia Candle Co.
            </h3>
            <p className="text-xs text-muted-foreground">Studio Packing Slip • Hand-Poured</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-midnight">Order #{order.id}</p>
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground">Ship To</p>
            <p className="mt-1 font-semibold text-midnight">{order.customer.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery Method
            </p>
            <p className="mt-1 font-medium text-midnight">
              {order.shippingMethod === "express" ? "Express Priority Air" : "Standard Ground"}
            </p>
            {order.trackingNumber && (
              <p className="mt-2 font-mono text-[11px]">
                {order.trackingCarrier}: {order.trackingNumber}
              </p>
            )}
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-xs">
          <thead>
            <tr className="border-y border-border text-left uppercase tracking-wider text-muted-foreground">
              <th className="py-2">SKU</th>
              <th className="py-2">Candle</th>
              <th className="py-2 text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {order.items.map((i) => (
              <tr key={i.productId}>
                <td className="py-2.5 font-mono text-[11px]">{i.sku}</td>
                <td className="py-2.5">
                  <strong>{i.name}</strong> ({i.size}) — {i.fragrance}
                </td>
                <td className="py-2.5 text-right font-bold">{i.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.giftNote && (
          <div className="mt-6 border border-border bg-cream/40 p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-earth">Gift Card Message:</p>
            <p className="mt-1 font-display text-lg italic text-midnight">“{order.giftNote}”</p>
          </div>
        )}

        <p className="mt-8 border-t border-border pt-4 text-center font-display text-lg italic text-muted-foreground">
          Thank you for welcoming Madeleine Lucia into your space.
        </p>

        <div className="mt-6 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-xs uppercase tracking-wider"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-midnight px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            <Printer size={13} /> Print Slip
          </button>
        </div>
      </div>
    </div>
  );
}
