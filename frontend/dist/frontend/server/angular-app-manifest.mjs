
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
      "chunk-BMWUGOEC.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-BMWUGOEC.js"
    ],
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-BMWUGOEC.js"
    ],
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-BMWUGOEC.js"
    ],
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-BMWUGOEC.js"
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
    'index.csr.html': {size: 15768, hash: 'f06401090f8f59a8ff75b474cab5d5eefdfddd1579d51662acdc5e0af40daf62', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 13170, hash: '9c86c00bd11ba9664eb87ffb56811fea719afff109a5ce3f5f1eee652813327c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-JTCQYV2A.css': {size: 97704, hash: 'ZVdkuEIe8Cs', text: () => import('./assets-chunks/styles-JTCQYV2A_css.mjs').then(m => m.default)}
  },
};
