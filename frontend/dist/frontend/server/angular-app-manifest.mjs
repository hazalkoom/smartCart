
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
    "preload": [
      "chunk-HWBU3NKT.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-HWBU3NKT.js"
    ],
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-HWBU3NKT.js"
    ],
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-HWBU3NKT.js"
    ],
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-HWBU3NKT.js"
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
    'index.csr.html': {size: 3104, hash: '380ef262621460ab0ecc513c0096149c9f2c6802e85865b68d2431ce747a2301', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1848, hash: '73198014bc542444e99a6a58f485acfaf7afee52dea2e2b60ad2532cb2354add', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-HYLH6NO5.css': {size: 81578, hash: 'gtPlpaslqbg', text: () => import('./assets-chunks/styles-HYLH6NO5_css.mjs').then(m => m.default)}
  },
};
