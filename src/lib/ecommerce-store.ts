import { useEffect, useSyncExternalStore } from "react";

export type ProductCategory =
  | "Signature"
  | "Spring & Summer"
  | "Fall & Winter"
  | "Woody & Earthy";

export interface FragranceNotes {
  top: string;
  heart: string;
  base: string;
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  name: string;
  fragrance: string;
  mood: string;
  description: string;
  category: ProductCategory;
  size: string;
  burnTime: string;
  waxType: string;
  wickType: string;
  notes: FragranceNotes;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  image: string;
  position: string;
  stripePaymentLink: string;
  stripePriceId: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface HydratedCartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "awaiting_stripe" | "paid" | "refunded" | "failed";

export type PaymentMethodType = "stripe_checkout" | "stripe_payment_link";

export type ShippingMethodType = "standard" | "express";

export interface OrderLineItem {
  productId: number;
  sku: string;
  name: string;
  fragrance: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  label: string;
  note: string;
  timestamp: string;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
}

export interface ShippingAddress {
  street: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer;
  shippingAddress: ShippingAddress;
  items: OrderLineItem[];
  shippingMethod: ShippingMethodType;
  subtotal: number;
  discountCode: string;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  giftNote: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  stripeSessionId: string;
  stripePaymentLinkUrl: string;
  trackingCarrier: string;
  trackingNumber: string;
  internalNotes: string;
  timeline: OrderTimelineEvent[];
}

export interface PromoCode {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
  active: boolean;
  usageCount: number;
  description: string;
}

export interface CustomerInquiry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  inquiryType: string;
  message: string;
  status: "new" | "read" | "replied";
}

export interface NewsletterSubscriber {
  email: string;
  joinedAt: string;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  currency: string;
  freeShippingThreshold: number;
  standardShippingRate: number;
  expressShippingRate: number;
  taxRatePercent: number;
  announcementText: string;
  announcementEnabled: boolean;
  stripeCheckoutMode: "stripe_checkout_preview" | "stripe_payment_link";
  globalStripePaymentLink: string;
  stripePublishableKey: string;
}

export interface EcommerceState {
  products: Product[];
  cart: CartItem[];
  cartDrawerOpen: boolean;
  orders: Order[];
  promoCodes: PromoCode[];
  inquiries: CustomerInquiry[];
  subscribers: NewsletterSubscriber[];
  settings: StoreSettings;
  toastMessage: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "summer-sunset",
    sku: "MLC-8OZ-001",
    name: "Summer Sunset",
    fragrance: "Peach Mango & Tropical Citrus",
    mood: "Fruity smooth with Caribbean calmness, perfect all day.",
    description:
      "Inspired by golden twilight over warm island waters, Summer Sunset blends sun-ripened orchard peach and lush mango with bright tropical citrus for an effortless, uplifting glow from morning through dusk.",
    category: "Spring & Summer",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Sparkling Mandarin, Sun-Ripened Peach",
      heart: "Golden Island Mango, Lush Papaya, Hibiscus",
      base: "Warm Sugarcane, Soft White Musk",
    },
    price: 15,
    compareAtPrice: null,
    stock: 24,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/summer-sunset.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_summer_sunset_8oz",
  },
  {
    id: 2,
    slug: "ambrevelle",
    sku: "MLC-8OZ-002",
    name: "Ambrevelle",
    fragrance: "Golden Amber & Warm Vanilla",
    mood: "Warmth in every glow, an inviting evening linger.",
    description:
      "Our signature evening scent. Ambrevelle wraps intimate spaces in luminous golden amber, Madagascar vanilla bean, and creamy sandalwood—crafted for slow nights, soft music, and conversations that linger.",
    category: "Signature",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Warm Bergamot, Spun Golden Amber",
      heart: "Madagascar Vanilla Bean, Velvet Jasmine",
      base: "Creamy Sandalwood, Tonka Bean, Soft Resin",
    },
    price: 15,
    compareAtPrice: null,
    stock: 19,
    lowStockThreshold: 5,
    active: true,
    featured: true,
    image: "/products/ambrevelle.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_ambrevelle_8oz",
  },
  {
    id: 3,
    slug: "autumn-apple",
    sku: "MLC-8OZ-003",
    name: "Autumn Apple",
    fragrance: "Macintosh Apple & Warm Orchard Spices",
    mood: "Warm apples and crisp orchard breezes, definitely a Fall season.",
    description:
      "Crisp, freshly picked Macintosh apples meet subtle cinnamon bark and crushed clove, evoking sunlit autumn afternoons wandering through quiet orchards.",
    category: "Fall & Winter",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Crisp Macintosh Apple, Orchard Pear",
      heart: "Ceylon Cinnamon, Crushed Clove, Nutmeg",
      base: "Warm Applewood, Vanilla Bean, Tonka",
    },
    price: 15,
    compareAtPrice: null,
    stock: 16,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/autumn-apple.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_autumn_apple_8oz",
  },
  {
    id: 4,
    slug: "caribbean-ocean",
    sku: "MLC-8OZ-004",
    name: "Caribbean Ocean",
    fragrance: "Caribbean Teakwood & Fresh Sea Salt",
    mood: "Fresh subtle morning smell, cool ocean breezes for Spring & Summer.",
    description:
      "Open the windows to a coastal morning. Mineral sea salt and airy ocean mist drift gracefully into warm Caribbean teakwood for a clean, restorative sanctuary.",
    category: "Spring & Summer",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Crushed Sea Salt, Coastal Mist, Citrus Peel",
      heart: "Sea Lavender, Sunlit Palm Leaf",
      base: "Caribbean Teakwood, Light Cedar, Clean Amber",
    },
    price: 15,
    compareAtPrice: null,
    stock: 22,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/caribbean-ocean.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_caribbean_ocean_8oz",
  },
  {
    id: 5,
    slug: "driftwood-haven",
    sku: "MLC-8OZ-005",
    name: "Driftwood Haven",
    fragrance: "Mahogany Teakwood & Earthy Cedar",
    mood: "The serene beauty of stillness and grounded comfort.",
    description:
      "Grounded, noble, and quietly luxurious. Rich mahogany, sun-weathered driftwood, and earthy Atlas cedar create an atmosphere of calm reflection and timeless poise.",
    category: "Woody & Earthy",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Green Cardamom, Crisp Bergamot",
      heart: "Rich Mahogany, Weathered Driftwood",
      base: "Earthy Atlas Cedar, Smoked Oak, Vetiver",
    },
    price: 15,
    compareAtPrice: null,
    stock: 14,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/driftwood-haven.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_driftwood_haven_8oz",
  },
  {
    id: 6,
    slug: "veloura-pumpkin",
    sku: "MLC-8OZ-006",
    name: "Veloura Pumpkin",
    fragrance: "Pumpkin Spice & Velvety Buttercream",
    mood: "Cozy autumn indulgence, velvety warmth, and festive comfort.",
    description:
      "An elevated gourmand ritual—heirloom roasted pumpkin folded into whipped vanilla buttercream, warm nutmeg, and golden brown sugar.",
    category: "Fall & Winter",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Heirloom Pumpkin, Fresh Grated Nutmeg",
      heart: "Velvety Buttercream, Spiced Cinnamon",
      base: "Caramelized Brown Sugar, Toasted Pecan, Vanilla",
    },
    price: 15,
    compareAtPrice: null,
    stock: 4,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/veloura-pumpkin.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_veloura_pumpkin_8oz",
  },
  {
    id: 7,
    slug: "boozy-bourbon",
    sku: "MLC-8OZ-007",
    name: "Boozy Bourbon",
    fragrance: "Butterscotch Bourbon & Sweet Honey",
    mood: "Warm and cozy with rich caramel notes, perfect for Fall and Winter.",
    description:
      "Decadent and fireside-ready. Slow-simmered butterscotch and golden wildflower honey meet barrel-aged bourbon and smoked vanilla.",
    category: "Fall & Winter",
    size: "8 oz",
    burnTime: "45–50 hours",
    waxType: "Natural Soy & Coconut Wax Blend",
    wickType: "100% Lead-Free Braided Cotton Wick",
    notes: {
      top: "Golden Butterscotch, Wildflower Honey",
      heart: "Aged Kentucky Bourbon, Warm Caramel",
      base: "Charred Oak Barrel, Smoked Vanilla, Amber",
    },
    price: 15,
    compareAtPrice: null,
    stock: 17,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    image: "/products/boozy-bourbon.jpg",
    position: "object-center",
    stripePaymentLink: "",
    stripePriceId: "price_mlc_boozy_bourbon_8oz",
  },
];

export const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minSubtotal: 0,
    active: true,
    usageCount: 14,
    description: "10% off your first candle ritual",
  },
  {
    code: "CANDLE15",
    type: "percentage",
    value: 15,
    minSubtotal: 45,
    active: true,
    usageCount: 8,
    description: "15% off orders of $45.00 or more (3+ candles)",
  },
  {
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    minSubtotal: 25,
    active: true,
    usageCount: 6,
    description: "Complimentary standard U.S. shipping on $25+",
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: "Madeleine Lucia Candle Co.",
  supportEmail: "info@madeleineluciacandle.com",
  currency: "USD",
  freeShippingThreshold: 50,
  standardShippingRate: 5,
  expressShippingRate: 12,
  taxRatePercent: 0,
  announcementText:
    "Complimentary U.S. Shipping on Orders Over $50 • Hand-Poured in Small Batches",
  announcementEnabled: true,
  stripeCheckoutMode: "stripe_checkout_preview",
  globalStripePaymentLink: "",
  stripePublishableKey: "",
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: "MLC-1045",
    createdAt: "2026-11-24T19:40:00.000Z",
    updatedAt: "2026-11-24T19:42:00.000Z",
    customer: {
      fullName: "Camille Laurent",
      email: "camille.laurent@example.com",
    },
    shippingAddress: {
      street: "418 Mercer Street",
      apartment: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10013",
      country: "United States",
    },
    items: [
      {
        productId: 2,
        sku: "MLC-8OZ-002",
        name: "Ambrevelle",
        fragrance: "Golden Amber & Warm Vanilla",
        size: "8 oz",
        price: 15,
        quantity: 2,
        image: "/products/ambrevelle.jpg",
      },
      {
        productId: 7,
        sku: "MLC-8OZ-007",
        name: "Boozy Bourbon",
        fragrance: "Butterscotch Bourbon & Sweet Honey",
        size: "8 oz",
        price: 15,
        quantity: 2,
        image: "/products/boozy-bourbon.jpg",
      },
    ],
    shippingMethod: "standard",
    subtotal: 60,
    discountCode: "",
    discountAmount: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 60,
    giftNote: "Happy housewarming, Élise! Wishing you warm evenings in your new home.",
    orderStatus: "pending",
    paymentStatus: "paid",
    paymentMethod: "stripe_checkout",
    stripeSessionId: "cs_live_a19f83b29041c7d8",
    stripePaymentLinkUrl: "",
    trackingCarrier: "",
    trackingNumber: "",
    internalNotes: "Include luxury gift card ribbon.",
    timeline: [
      {
        id: "evt-1045-1",
        status: "pending",
        label: "Order Placed & Paid via Stripe",
        note: "Stripe Checkout completed ($60.00). Awaiting fulfillment.",
        timestamp: "2026-11-24T19:40:00.000Z",
      },
    ],
  },
  {
    id: "MLC-1044",
    createdAt: "2026-11-23T15:18:00.000Z",
    updatedAt: "2026-11-24T09:10:00.000Z",
    customer: {
      fullName: "Marcus Vance",
      email: "m.vance@example.com",
    },
    shippingAddress: {
      street: "2190 Peachtree Rd NW",
      apartment: "Suite 210",
      city: "Atlanta",
      state: "GA",
      postalCode: "30309",
      country: "United States",
    },
    items: [
      {
        productId: 5,
        sku: "MLC-8OZ-005",
        name: "Driftwood Haven",
        fragrance: "Mahogany Teakwood & Earthy Cedar",
        size: "8 oz",
        price: 15,
        quantity: 1,
        image: "/products/driftwood-haven.jpg",
      },
      {
        productId: 4,
        sku: "MLC-8OZ-004",
        name: "Caribbean Ocean",
        fragrance: "Caribbean Teakwood & Fresh Sea Salt",
        size: "8 oz",
        price: 15,
        quantity: 1,
        image: "/products/caribbean-ocean.jpg",
      },
    ],
    shippingMethod: "express",
    subtotal: 30,
    discountCode: "WELCOME10",
    discountAmount: 3,
    shippingCost: 12,
    taxAmount: 0,
    total: 39,
    giftNote: "",
    orderStatus: "processing",
    paymentStatus: "paid",
    paymentMethod: "stripe_checkout",
    stripeSessionId: "cs_live_b72d9104e812f3a1",
    stripePaymentLinkUrl: "",
    trackingCarrier: "",
    trackingNumber: "",
    internalNotes: "Express Priority requested — prioritize morning batch.",
    timeline: [
      {
        id: "evt-1044-1",
        status: "pending",
        label: "Order Placed & Paid via Stripe",
        note: "Stripe Checkout completed ($39.00).",
        timestamp: "2026-11-23T15:18:00.000Z",
      },
      {
        id: "evt-1044-2",
        status: "processing",
        label: "Order in Preparation",
        note: "Quality check and protective packaging queued.",
        timestamp: "2026-11-24T09:10:00.000Z",
      },
    ],
  },
  {
    id: "MLC-1043",
    createdAt: "2026-11-21T21:05:00.000Z",
    updatedAt: "2026-11-22T17:30:00.000Z",
    customer: {
      fullName: "Nadia Desrosiers",
      email: "nadia.d@example.com",
    },
    shippingAddress: {
      street: "842 Coral Way",
      apartment: "",
      city: "Coral Gables",
      state: "FL",
      postalCode: "33134",
      country: "United States",
    },
    items: [
      {
        productId: 1,
        sku: "MLC-8OZ-001",
        name: "Summer Sunset",
        fragrance: "Peach Mango & Tropical Citrus",
        size: "8 oz",
        price: 15,
        quantity: 2,
        image: "/products/summer-sunset.jpg",
      },
      {
        productId: 6,
        sku: "MLC-8OZ-006",
        name: "Veloura Pumpkin",
        fragrance: "Pumpkin Spice & Velvety Buttercream",
        size: "8 oz",
        price: 15,
        quantity: 2,
        image: "/products/veloura-pumpkin.jpg",
      },
    ],
    shippingMethod: "standard",
    subtotal: 60,
    discountCode: "CANDLE15",
    discountAmount: 9,
    shippingCost: 0,
    taxAmount: 0,
    total: 51,
    giftNote: "",
    orderStatus: "shipped",
    paymentStatus: "paid",
    paymentMethod: "stripe_checkout",
    stripeSessionId: "cs_live_c94e2208a651d9b4",
    stripePaymentLinkUrl: "",
    trackingCarrier: "USPS",
    trackingNumber: "9405511899223847192014",
    internalNotes: "",
    timeline: [
      {
        id: "evt-1043-1",
        status: "pending",
        label: "Order Placed & Paid via Stripe",
        note: "Stripe Checkout completed ($51.00).",
        timestamp: "2026-11-21T21:05:00.000Z",
      },
      {
        id: "evt-1043-2",
        status: "packed",
        label: "Hand-Packed in Studio",
        note: "Cushioned in recyclable honeycomb wrap.",
        timestamp: "2026-11-22T13:15:00.000Z",
      },
      {
        id: "evt-1043-3",
        status: "shipped",
        label: "Shipped via USPS",
        note: "Tracking #9405511899223847192014 dispatched.",
        timestamp: "2026-11-22T17:30:00.000Z",
      },
    ],
  },
  {
    id: "MLC-1042",
    createdAt: "2026-11-18T14:22:00.000Z",
    updatedAt: "2026-11-21T16:05:00.000Z",
    customer: {
      fullName: "Hannah Sterling",
      email: "hsterling@example.com",
    },
    shippingAddress: {
      street: "1204 Newbury St",
      apartment: "Floor 2",
      city: "Boston",
      state: "MA",
      postalCode: "02115",
      country: "United States",
    },
    items: [
      {
        productId: 3,
        sku: "MLC-8OZ-003",
        name: "Autumn Apple",
        fragrance: "Macintosh Apple & Warm Orchard Spices",
        size: "8 oz",
        price: 15,
        quantity: 2,
        image: "/products/autumn-apple.jpg",
      },
      {
        productId: 2,
        sku: "MLC-8OZ-002",
        name: "Ambrevelle",
        fragrance: "Golden Amber & Warm Vanilla",
        size: "8 oz",
        price: 15,
        quantity: 1,
        image: "/products/ambrevelle.jpg",
      },
    ],
    shippingMethod: "standard",
    subtotal: 45,
    discountCode: "",
    discountAmount: 0,
    shippingCost: 5,
    taxAmount: 0,
    total: 50,
    giftNote: "",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "stripe_checkout",
    stripeSessionId: "cs_live_d18a7743c029e5f9",
    stripePaymentLinkUrl: "",
    trackingCarrier: "UPS",
    trackingNumber: "1Z999AA10123456784",
    internalNotes: "",
    timeline: [
      {
        id: "evt-1042-1",
        status: "pending",
        label: "Order Placed & Paid via Stripe",
        note: "Stripe Checkout completed ($50.00).",
        timestamp: "2026-11-18T14:22:00.000Z",
      },
      {
        id: "evt-1042-2",
        status: "shipped",
        label: "Shipped via UPS",
        note: "Tracking #1Z999AA10123456784.",
        timestamp: "2026-11-19T11:00:00.000Z",
      },
      {
        id: "evt-1042-3",
        status: "delivered",
        label: "Delivered",
        note: "Package delivered to front reception.",
        timestamp: "2026-11-21T16:05:00.000Z",
      },
    ],
  },
  {
    id: "MLC-1041",
    createdAt: "2026-11-15T18:50:00.000Z",
    updatedAt: "2026-11-18T14:12:00.000Z",
    customer: {
      fullName: "Simone Beaumont",
      email: "simone.b@example.com",
    },
    shippingAddress: {
      street: "735 Lake Shore Dr",
      apartment: "Unit 19C",
      city: "Chicago",
      state: "IL",
      postalCode: "60611",
      country: "United States",
    },
    items: [
      {
        productId: 2,
        sku: "MLC-8OZ-002",
        name: "Ambrevelle",
        fragrance: "Golden Amber & Warm Vanilla",
        size: "8 oz",
        price: 15,
        quantity: 4,
        image: "/products/ambrevelle.jpg",
      },
    ],
    shippingMethod: "standard",
    subtotal: 60,
    discountCode: "",
    discountAmount: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 60,
    giftNote: "Bridal party thank-you gifts.",
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "stripe_checkout",
    stripeSessionId: "cs_live_e63b4019d832a1c7",
    stripePaymentLinkUrl: "",
    trackingCarrier: "USPS",
    trackingNumber: "9405511899223841109822",
    internalNotes: "Repeat VIP customer.",
    timeline: [
      {
        id: "evt-1041-1",
        status: "pending",
        label: "Order Placed & Paid via Stripe",
        note: "Stripe Checkout completed ($60.00).",
        timestamp: "2026-11-15T18:50:00.000Z",
      },
      {
        id: "evt-1041-2",
        status: "shipped",
        label: "Shipped via USPS",
        note: "Tracking #9405511899223841109822.",
        timestamp: "2026-11-16T15:20:00.000Z",
      },
      {
        id: "evt-1041-3",
        status: "delivered",
        label: "Delivered",
        note: "Delivered to parcel locker.",
        timestamp: "2026-11-18T14:12:00.000Z",
      },
    ],
  },
];

export const INITIAL_INQUIRIES: CustomerInquiry[] = [
  {
    id: "INQ-201",
    createdAt: "2026-11-24T16:12:00.000Z",
    name: "claire.montgomery@example.com".replace("@example.com", "")
      ? "Claire Montgomery"
      : "Claire Montgomery",
    email: "claire.montgomery@example.com",
    inquiryType: "Special Request",
    message:
      "Hello! We are planning an intimate winter wedding dinner for 35 guests and would love to order custom-ribboned Ambrevelle and Boozy Bourbon candles. Do you offer event quantities?",
    status: "new",
  },
  {
    id: "INQ-200",
    createdAt: "2026-11-22T11:45:00.000Z",
    name: "Devon Brooks",
    email: "devon.brooks@example.com",
    inquiryType: "Product Question",
    message:
      "Are your 8 oz candles made with phthalate-free fragrance oils? Loving Summer Sunset so far!",
    status: "replied",
  },
];

const STORAGE_KEY = "mlc_ecommerce_v1";
const LEGACY_CART_KEY = "cart";

const DEFAULT_STATE: EcommerceState = {
  products: INITIAL_PRODUCTS,
  cart: [],
  cartDrawerOpen: false,
  orders: INITIAL_ORDERS,
  promoCodes: INITIAL_PROMO_CODES,
  inquiries: INITIAL_INQUIRIES,
  subscribers: [
    { email: "camille.laurent@example.com", joinedAt: "2026-11-20T10:00:00.000Z" },
    { email: "simone.b@example.com", joinedAt: "2026-11-15T18:52:00.000Z" },
  ],
  settings: INITIAL_SETTINGS,
  toastMessage: "",
};

let currentState: EcommerceState = DEFAULT_STATE;
let hasHydratedClient = false;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function persistToStorage(next: EcommerceState) {
  if (typeof window === "undefined") return;
  try {
    const serializable = {
      products: next.products,
      cart: next.cart,
      orders: next.orders,
      promoCodes: next.promoCodes,
      inquiries: next.inquiries,
      subscribers: next.subscribers,
      settings: next.settings,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota errors safely
  }
}

function parseSavedState(raw: string | null): Partial<EcommerceState> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EcommerceState>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hydrateEcommerceStore() {
  if (typeof window === "undefined" || hasHydratedClient) return;
  hasHydratedClient = true;

  const saved = parseSavedState(window.localStorage.getItem(STORAGE_KEY));
  if (saved) {
    currentState = {
      ...DEFAULT_STATE,
      products: Array.isArray(saved.products) && saved.products.length > 0
        ? saved.products
        : INITIAL_PRODUCTS,
      cart: Array.isArray(saved.cart) ? saved.cart : [],
      orders: Array.isArray(saved.orders) ? saved.orders : INITIAL_ORDERS,
      promoCodes: Array.isArray(saved.promoCodes) ? saved.promoCodes : INITIAL_PROMO_CODES,
      inquiries: Array.isArray(saved.inquiries) ? saved.inquiries : INITIAL_INQUIRIES,
      subscribers: Array.isArray(saved.subscribers)
        ? saved.subscribers
        : DEFAULT_STATE.subscribers,
      settings: saved.settings
        ? { ...INITIAL_SETTINGS, ...saved.settings }
        : INITIAL_SETTINGS,
      cartDrawerOpen: false,
      toastMessage: "",
    };
    emitChange();
  } else {
    // Migrate legacy cart if user had items from earlier storefront version
    try {
      const legacyRaw = window.localStorage.getItem(LEGACY_CART_KEY);
      if (legacyRaw) {
        const legacyItems = JSON.parse(legacyRaw) as Array<{ id?: number; quantity?: number }>;
        if (Array.isArray(legacyItems) && legacyItems.length > 0) {
          const migratedCart: CartItem[] = legacyItems
            .filter(
              (item): item is { id: number; quantity: number } =>
                typeof item.id === "number" &&
                typeof item.quantity === "number" &&
                item.quantity > 0,
            )
            .map((item) => ({ productId: item.id, quantity: item.quantity }));
          currentState = { ...currentState, cart: migratedCart };
          persistToStorage(currentState);
          emitChange();
        }
      }
    } catch {
      // Ignore legacy parse issue
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      const external = parseSavedState(event.newValue);
      if (external) {
        currentState = {
          ...currentState,
          products: Array.isArray(external.products) ? external.products : currentState.products,
          cart: Array.isArray(external.cart) ? external.cart : currentState.cart,
          orders: Array.isArray(external.orders) ? external.orders : currentState.orders,
          promoCodes: Array.isArray(external.promoCodes)
            ? external.promoCodes
            : currentState.promoCodes,
          inquiries: Array.isArray(external.inquiries)
            ? external.inquiries
            : currentState.inquiries,
          subscribers: Array.isArray(external.subscribers)
            ? external.subscribers
            : currentState.subscribers,
          settings: external.settings
            ? { ...INITIAL_SETTINGS, ...external.settings }
            : currentState.settings,
        };
        emitChange();
      }
    }
  });
}

function updateState(updater: (prev: EcommerceState) => EcommerceState, persist = true) {
  currentState = updater(currentState);
  if (persist) {
    persistToStorage(currentState);
  }
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): EcommerceState {
  return currentState;
}

function getServerSnapshot(): EcommerceState {
  return DEFAULT_STATE;
}

export function useEcommerceStore(): EcommerceState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    hydrateEcommerceStore();
  }, []);
  return state;
}

export function showStoreToast(message: string) {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  updateState((prev) => ({ ...prev, toastMessage: message }), false);
  toastTimer = setTimeout(() => {
    updateState((prev) => ({ ...prev, toastMessage: "" }), false);
  }, 2600);
}

export function setCartDrawerOpen(open: boolean) {
  updateState((prev) => ({ ...prev, cartDrawerOpen: open }), false);
}

export function addToCart(productId: number, quantity = 1, openDrawer = false) {
  const product = currentState.products.find((p) => p.id === productId);
  if (!product || !product.active) return;
  if (product.stock <= 0) {
    showStoreToast(`${product.name} is currently sold out`);
    return;
  }

  updateState((prev) => {
    const existing = prev.cart.find((item) => item.productId === productId);
    const currentQty = existing ? existing.quantity : 0;
    const nextQty = Math.min(product.stock, currentQty + quantity);
    const nextCart = existing
      ? prev.cart.map((item) =>
          item.productId === productId ? { ...item, quantity: nextQty } : item,
        )
      : [...prev.cart, { productId, quantity: Math.min(product.stock, quantity) }];

    return {
      ...prev,
      cart: nextCart,
      cartDrawerOpen: openDrawer ? true : prev.cartDrawerOpen,
    };
  });

  showStoreToast(`${product.name} added to your bag`);
}

export function updateCartQuantity(productId: number, delta: number) {
  const product = currentState.products.find((p) => p.id === productId);
  const maxStock = product ? product.stock : 99;

  updateState((prev) => ({
    ...prev,
    cart: prev.cart
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(maxStock, Math.max(0, item.quantity + delta)) }
          : item,
      )
      .filter((item) => item.quantity > 0),
  }));
}

export function removeFromCart(productId: number) {
  updateState((prev) => ({
    ...prev,
    cart: prev.cart.filter((item) => item.productId !== productId),
  }));
}

export function clearCart() {
  updateState((prev) => ({ ...prev, cart: [] }));
}

export function getHydratedCart(state: EcommerceState): {
  lines: HydratedCartLine[];
  itemCount: number;
  subtotal: number;
} {
  const lines: HydratedCartLine[] = [];
  for (const item of state.cart) {
    const product = state.products.find((p) => p.id === item.productId);
    if (product && product.active) {
      const safeQty = Math.min(item.quantity, Math.max(1, product.stock));
      lines.push({
        product,
        quantity: safeQty,
        lineTotal: product.price * safeQty,
      });
    }
  }
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return { lines, itemCount, subtotal };
}

export function evaluatePromoCode(
  codeRaw: string,
  subtotal: number,
  state: EcommerceState,
): {
  valid: boolean;
  promo: PromoCode | null;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
} {
  const normalized = codeRaw.trim().toUpperCase();
  if (!normalized) {
    return {
      valid: false,
      promo: null,
      discountAmount: 0,
      freeShipping: false,
      message: "",
    };
  }

  const found = state.promoCodes.find((p) => p.code.toUpperCase() === normalized && p.active);
  if (!found) {
    return {
      valid: false,
      promo: null,
      discountAmount: 0,
      freeShipping: false,
      message: "Invalid or inactive promo code.",
    };
  }

  if (subtotal < found.minSubtotal) {
    return {
      valid: false,
      promo: found,
      discountAmount: 0,
      freeShipping: false,
      message: `Minimum order of ${formatMoney(found.minSubtotal)} required for ${found.code}.`,
    };
  }

  if (found.type === "percentage") {
    const discountAmount = Math.round(subtotal * (found.value / 100) * 100) / 100;
    return {
      valid: true,
      promo: found,
      discountAmount,
      freeShipping: false,
      message: `${found.code} applied (${found.value}% off)`,
    };
  }

  if (found.type === "fixed") {
    const discountAmount = Math.min(subtotal, found.value);
    return {
      valid: true,
      promo: found,
      discountAmount,
      freeShipping: false,
      message: `${found.code} applied (-${formatMoney(discountAmount)})`,
    };
  }

  return {
    valid: true,
    promo: found,
    discountAmount: 0,
    freeShipping: true,
    message: `${found.code} applied (Free Standard Shipping)`,
  };
}

export interface CreateOrderInput {
  customer: OrderCustomer;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodType;
  promoCode: string;
  giftNote: string;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  stripePaymentLinkUrl: string;
}

export function createStoreOrder(input: CreateOrderInput): Order | null {
  const { lines, subtotal } = getHydratedCart(currentState);
  if (lines.length === 0) return null;

  const promoResult = evaluatePromoCode(input.promoCode, subtotal, currentState);
  const discountAmount = promoResult.valid ? promoResult.discountAmount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const settings = currentState.settings;
  let shippingCost =
    input.shippingMethod === "express"
      ? settings.expressShippingRate
      : settings.standardShippingRate;

  if (
    input.shippingMethod === "standard" &&
    (subtotal >= settings.freeShippingThreshold || promoResult.freeShipping)
  ) {
    shippingCost = 0;
  }

  const taxAmount =
    Math.round(discountedSubtotal * (settings.taxRatePercent / 100) * 100) / 100;
  const total = Math.round((discountedSubtotal + shippingCost + taxAmount) * 100) / 100;

  const numericIds = currentState.orders
    .map((o) => Number.parseInt(o.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const maxNum = numericIds.length > 0 ? Math.max(...numericIds) : 1045;
  const orderId = `MLC-${maxNum + 1}`;
  const now = new Date().toISOString();
  const randomHex = Math.random().toString(16).slice(2, 14);
  const stripeSessionId =
    input.paymentMethod === "stripe_payment_link"
      ? `plink_${randomHex}`
      : `cs_test_${randomHex}`;

  const orderItems: OrderLineItem[] = lines.map((line) => ({
    productId: line.product.id,
    sku: line.product.sku,
    name: line.product.name,
    fragrance: line.product.fragrance,
    size: line.product.size,
    price: line.product.price,
    quantity: line.quantity,
    image: line.product.image,
  }));

  const newOrder: Order = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    items: orderItems,
    shippingMethod: input.shippingMethod,
    subtotal,
    discountCode: promoResult.valid && promoResult.promo ? promoResult.promo.code : "",
    discountAmount,
    shippingCost,
    taxAmount,
    total,
    giftNote: input.giftNote.trim(),
    orderStatus: "pending",
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    stripeSessionId,
    stripePaymentLinkUrl: input.stripePaymentLinkUrl,
    trackingCarrier: "",
    trackingNumber: "",
    internalNotes: "",
    timeline: [
      {
        id: `evt-${orderId}-1`,
        status: "pending",
        label:
          input.paymentStatus === "paid"
            ? "Order Placed & Paid via Stripe"
            : "Order Created — Redirected to Stripe Payment Link",
        note:
          input.paymentStatus === "paid"
            ? `Payment authorized (${formatMoney(total)}). Queued for studio fulfillment.`
            : `Order total ${formatMoney(total)}. Awaiting Stripe Payment Link webhook confirmation.`,
        timestamp: now,
      },
    ],
  };

  updateState((prev) => ({
    ...prev,
    orders: [newOrder, ...prev.orders],
    cart: [],
    cartDrawerOpen: false,
    products: prev.products.map((prod) => {
      const ordered = orderItems.find((item) => item.productId === prod.id);
      if (!ordered) return prod;
      return { ...prod, stock: Math.max(0, prod.stock - ordered.quantity) };
    }),
    promoCodes:
      promoResult.valid && promoResult.promo
        ? prev.promoCodes.map((p) =>
            p.code === promoResult.promo?.code
              ? { ...p, usageCount: p.usageCount + 1 }
              : p,
          )
        : prev.promoCodes,
  }));

  return newOrder;
}

// --- Admin Order Management Actions ---

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  note = "",
  trackingCarrier?: string,
  trackingNumber?: string,
) {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    orders: prev.orders.map((order) => {
      if (order.id !== orderId) return order;
      const carrier =
        trackingCarrier !== undefined ? trackingCarrier : order.trackingCarrier;
      const tracking =
        trackingNumber !== undefined ? trackingNumber : order.trackingNumber;

      const defaultNote =
        nextStatus === "shipped" && tracking
          ? `Dispatched via ${carrier || "Carrier"} — Tracking #${tracking}`
          : note || `Status updated to ${ORDER_STATUS_LABELS[nextStatus]}.`;

      const event: OrderTimelineEvent = {
        id: `evt-${orderId}-${Date.now()}`,
        status: nextStatus,
        label:
          nextStatus === "shipped" && carrier
            ? `Shipped via ${carrier}`
            : ORDER_STATUS_LABELS[nextStatus],
        note: defaultNote,
        timestamp: now,
      };

      return {
        ...order,
        orderStatus: nextStatus,
        updatedAt: now,
        trackingCarrier: carrier,
        trackingNumber: tracking,
        timeline: [...order.timeline, event],
      };
    }),
  }));
}

export function updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    orders: prev.orders.map((order) => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        paymentStatus,
        updatedAt: now,
      };
    }),
  }));
}

export function updateOrderTracking(
  orderId: string,
  trackingCarrier: string,
  trackingNumber: string,
  internalNotes: string,
) {
  const now = new Date().toISOString();
  updateState((prev) => ({
    ...prev,
    orders: prev.orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            trackingCarrier: trackingCarrier.trim(),
            trackingNumber: trackingNumber.trim(),
            internalNotes,
            updatedAt: now,
          }
        : order,
    ),
  }));
}

// --- Admin Product & Inventory Management Actions ---

export function saveProduct(productInput: Omit<Product, "id"> & { id?: number }): Product {
  let savedProduct: Product | null = null;

  updateState((prev) => {
    const existingId = productInput.id;
    let nextProducts: Product[];

    if (typeof existingId === "number") {
      nextProducts = prev.products.map((p) => {
        if (p.id !== existingId) return p;
        const updated: Product = { ...productInput, id: existingId };
        savedProduct = updated;
        return updated;
      });
    } else {
      const maxId = prev.products.reduce((m, p) => Math.max(m, p.id), 0);
      const created: Product = { ...productInput, id: maxId + 1 };
      savedProduct = created;
      nextProducts = [...prev.products, created];
    }

    // If savedProduct is marked featured, ensure only one primary featured spotlight if set
    if (savedProduct && savedProduct.featured) {
      const targetId = savedProduct.id;
      nextProducts = nextProducts.map((p) => ({
        ...p,
        featured: p.id === targetId,
      }));
    }

    return { ...prev, products: nextProducts };
  });

  return savedProduct ?? ({ ...productInput, id: 1 } as Product);
}

export function adjustProductStock(productId: number, delta: number) {
  updateState((prev) => ({
    ...prev,
    products: prev.products.map((p) =>
      p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
    ),
  }));
}

export function toggleProductActive(productId: number) {
  updateState((prev) => ({
    ...prev,
    products: prev.products.map((p) =>
      p.id === productId ? { ...p, active: !p.active } : p,
    ),
  }));
}

export function deleteProduct(productId: number) {
  updateState((prev) => ({
    ...prev,
    products: prev.products.filter((p) => p.id !== productId),
    cart: prev.cart.filter((c) => c.productId !== productId),
  }));
}

// --- Customer Inquiries, Subscribers, Promo Codes & Store Settings ---

export function submitCustomerInquiry(input: {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
}) {
  const newInquiry: CustomerInquiry = {
    id: `INQ-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
    name: input.name.trim(),
    email: input.email.trim(),
    inquiryType: input.inquiryType,
    message: input.message.trim(),
    status: "new",
  };
  updateState((prev) => ({
    ...prev,
    inquiries: [newInquiry, ...prev.inquiries],
  }));
}

export function updateInquiryStatus(id: string, status: CustomerInquiry["status"]) {
  updateState((prev) => ({
    ...prev,
    inquiries: prev.inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq)),
  }));
}

export function addNewsletterSubscriber(email: string) {
  const clean = email.trim().toLowerCase();
  if (!clean) return;
  updateState((prev) => {
    if (prev.subscribers.some((s) => s.email.toLowerCase() === clean)) {
      return prev;
    }
    return {
      ...prev,
      subscribers: [{ email: clean, joinedAt: new Date().toISOString() }, ...prev.subscribers],
    };
  });
}

export function upsertPromoCode(promo: PromoCode) {
  const normalizedCode = promo.code.trim().toUpperCase();
  if (!normalizedCode) return;
  const cleanPromo: PromoCode = { ...promo, code: normalizedCode };

  updateState((prev) => {
    const exists = prev.promoCodes.some((p) => p.code === normalizedCode);
    return {
      ...prev,
      promoCodes: exists
        ? prev.promoCodes.map((p) => (p.code === normalizedCode ? cleanPromo : p))
        : [cleanPromo, ...prev.promoCodes],
    };
  });
}

export function togglePromoCode(code: string) {
  updateState((prev) => ({
    ...prev,
    promoCodes: prev.promoCodes.map((p) =>
      p.code === code ? { ...p, active: !p.active } : p,
    ),
  }));
}

export function deletePromoCode(code: string) {
  updateState((prev) => ({
    ...prev,
    promoCodes: prev.promoCodes.filter((p) => p.code !== code),
  }));
}

export function updateStoreSettings(patch: Partial<StoreSettings>) {
  updateState((prev) => ({
    ...prev,
    settings: { ...prev.settings, ...patch },
  }));
}

export function resetStoreToDefaults() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  currentState = DEFAULT_STATE;
  persistToStorage(currentState);
  emitChange();
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
