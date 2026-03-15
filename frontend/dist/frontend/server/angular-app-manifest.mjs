
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
      "chunk-LSW4J6SQ.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-LSW4J6SQ.js"
    ],
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-LSW4J6SQ.js"
    ],
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-LSW4J6SQ.js"
    ],
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-LSW4J6SQ.js"
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
    'index.csr.html': {size: 15768, hash: '1bb30845d5b968085284fe357b4d1c54933a59e7f84d6162d5c00d61fca65140', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 13170, hash: '2cb9ec3bb502297c312823fa70e103b38e5365529e6d9bb57c960e880fc167fc', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-JTCQYV2A.css': {size: 97704, hash: 'ZVdkuEIe8Cs', text: () => import('./assets-chunks/styles-JTCQYV2A_css.mjs').then(m => m.default)}
  },
};
