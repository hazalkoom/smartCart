
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "route": "/products"
  },
  {
    "renderMode": 0,
    "route": "/products/*"
  },
  {
    "renderMode": 0,
    "route": "/cart"
  },
  {
    "renderMode": 0,
    "route": "/checkout"
  },
  {
    "renderMode": 0,
    "route": "/login"
  },
  {
    "renderMode": 0,
    "route": "/register"
  },
  {
    "renderMode": 0,
    "route": "/about"
  },
  {
    "renderMode": 0,
    "route": "/help-center"
  },
  {
    "renderMode": 0,
    "route": "/wishlist"
  },
  {
    "renderMode": 0,
    "route": "/account"
  },
  {
    "renderMode": 0,
    "route": "/categories"
  },
  {
    "renderMode": 0,
    "route": "/orders/*"
  },
  {
    "renderMode": 0,
    "route": "/payment-callback"
  },
  {
    "renderMode": 0,
    "route": "/gift-finder"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-AIBTB3E3.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-AIBTB3E3.js"
    ],
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-AIBTB3E3.js"
    ],
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-AIBTB3E3.js"
    ],
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-AIBTB3E3.js"
    ],
    "route": "/admin/categories"
  },
  {
    "renderMode": 0,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 15768, hash: 'b1be91099fefa79c88f157e4c59c4794d8cbe5f7446d6d50c9dec764660e14ea', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 13170, hash: 'dcabed46d2245b927bad3aa9fa49d622c43d6138907cc6ed323c7d02536f5b19', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-JTCQYV2A.css': {size: 97704, hash: 'ZVdkuEIe8Cs', text: () => import('./assets-chunks/styles-JTCQYV2A_css.mjs').then(m => m.default)}
  },
};
