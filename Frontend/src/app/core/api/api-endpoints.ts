/**
 * API Endpoints mapping all Backend routes and Postman Collection requests
 */
export const API_ENDPOINTS = {
  // Core & Health
  HEALTH: '/health',
  ROOT: '/',

  // Authentication
  AUTH: {
    SIGN_IN: '/api/auth/signin',
    STATUS: '/api/auth/status',
    ME: '/api/auth/me',
    TOKEN: '/api/auth/token',
    REFRESH: '/api/auth/refresh',
    TEST_TOKEN: '/api/auth/test-token',
    AUTHORIZE: '/api/auth/authorize',
    GENERATE_TOKEN: '/api/auth/generate-token'
  },

  // Restaurants
  RESTAURANTS: {
    BASE: '/api/restaurants',
    BY_ID: (uuid: string) => `/api/restaurants/${uuid}`
  },

  // Units
  UNITS: {
    BASE: '/api/units',
    CONVERSIONS: '/api/units/conversions'
  },

  // Items & Catalog
  CATALOG: {
    ITEMS: '/api/items',
    INGREDIENTS: '/api/ingredients',
    PREPARATIONS: '/api/preparations',
    PRODUCTS: '/api/products'
  },

  // Suppliers
  SUPPLIERS: {
    BASE: '/api/suppliers',
    BY_REF: (ref: string) => `/api/suppliers/${ref}`
  },

  // Purchases & Invoices
  PURCHASES: {
    BASE: '/api/purchases',
    INVOICES: '/api/invoices'
  },

  // Stock
  STOCK: {
    LEVELS: '/api/stocklevels',
    TAKES: '/api/stocktakes',
    BY_ID: (uuid: string) => `/api/stocktakes/${uuid}`
  },

  // Events
  EVENTS: {
    WASTES: '/api/events/wastes',
    STOCKTAKES: '/api/events/stocktakes',
    TRANSFERS: '/api/events/transfers',
    SALES: '/api/events/sales',
    RECEIVES: '/api/events/receives',
    POST_EVENT: (eventType: string) => `/api/events/${eventType}`
  }
};
