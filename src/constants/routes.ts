export const ROUTES = {
  // Auth
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  SIGN_UP_COMPANY: "/sign-up/company",
  SIGN_UP_COOLING_USER: "/sign-up/cooling-user",
  PASSWORD_RECOVERY: "/password-recovery",
  PASSWORD_RESET: "/password-reset",
  INVITE: "/invite",

  // Dashboard
  DASHBOARD: "/dashboard",

  // Cooling Units
  COOLING_UNITS: "/cooling-units",
  COOLING_UNIT_DETAIL: (id: number | string) => `/cooling-units/${id}`,
  COOLING_UNITS_MAP: "/cooling-units/maps",
  COOLING_UNIT_CONDITIONS: (id: number | string) => `/cooling-units/conditions/${id}`,

  // History
  HISTORY: "/history",

  // Analytics
  ANALYTICS: "/analytics",

  // Marketplace
  MARKETPLACE: "/marketplace",
  MARKETPLACE_CART: "/marketplace/cart",
  MARKETPLACE_ORDERS: "/marketplace/orders",
  MARKETPLACE_SALES: "/marketplace/sales",

  // Market Price
  MARKET_PRICE: "/market-price",

  // Management
  MANAGEMENT_COOLING_UNITS: "/management/cooling-units",
  MANAGEMENT_LOCATIONS: "/management/locations",
  MANAGEMENT_USERS: "/management/users",
  MANAGEMENT_COMPANY: "/management/company",
  MANAGEMENT_ANALYSIS: "/management/analysis",

  // Account
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_BANK_DETAILS: "/account/bank-details",
  ACCOUNT_COUPONS: "/account/coupons",

  // Other
  NOTIFICATIONS: "/notifications",
  FAQ: "/faq",
} as const;
