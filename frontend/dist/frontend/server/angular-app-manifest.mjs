
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
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "route": "/admin/orders"
  },
  {
    "renderMode": 0,
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "route": "/admin/products"
  },
  {
    "renderMode": 0,
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
    'index.csr.html': {size: 4942, hash: 'fd3972723211b7da861797daff926e1a225c96a67c7695946a05afc9fb7b7ae1', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 2112, hash: '5c39faca2a202c2edf29101d32ca3f349f86127ff7c3439f24454e0c3187c4ea', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-ZDF3KNS4.css': {size: 88306, hash: 'v/Qsj3cytvI', text: () => import('./assets-chunks/styles-ZDF3KNS4_css.mjs').then(m => m.default)}
  },
};
