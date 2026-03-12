
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
      "chunk-SGYWLWJG.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SGYWLWJG.js"
    ],
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SGYWLWJG.js"
    ],
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SGYWLWJG.js"
    ],
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SGYWLWJG.js"
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
    'index.csr.html': {size: 15768, hash: '29686ce8a1387e5535a8a125676c1fc9773d7515451e21e459df22ae1cfd8c34', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 13170, hash: '28d7a0c563f49ad5bd808ead30d1e5becbffdf919c195861621a53adce27edd6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-JHW7DH2X.css': {size: 88878, hash: 'OsgnKBiUKKk', text: () => import('./assets-chunks/styles-JHW7DH2X_css.mjs').then(m => m.default)}
  },
};
