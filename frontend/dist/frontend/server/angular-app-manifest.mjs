
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/products"
  },
  {
    "renderMode": 2,
    "route": "/cart"
  },
  {
    "renderMode": 2,
    "route": "/checkout"
  },
  {
    "renderMode": 2,
    "route": "/login"
  },
  {
    "renderMode": 2,
    "route": "/register"
  },
  {
    "renderMode": 2,
    "route": "/account"
  },
  {
    "renderMode": 2,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 4422, hash: '827efdd41287955dea86be9ad9e894ebbdca324cfdd1d6186af0094a41654e04', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1586, hash: '24068d196eb8f1fe14a41afe640d22bb874c7f492e4eb3be8966544bffd3b541', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'account/index.html': {size: 14184, hash: 'e6fdb7e3dbea56ee02a9fd7f06b5fc65a43139c9ab02711655e3cf0db4d169d5', text: () => import('./assets-chunks/account_index_html.mjs').then(m => m.default)},
    'register/index.html': {size: 14187, hash: '82a2c791f2ae1ec9de552216a6b1cc54a30c493f8b974dbefa0c9ac426dfece0', text: () => import('./assets-chunks/register_index_html.mjs').then(m => m.default)},
    'cart/index.html': {size: 14175, hash: '3c533af8e984d2c09fd6713132d1c1431e9744c9e30023108a93806ac0cabeb7', text: () => import('./assets-chunks/cart_index_html.mjs').then(m => m.default)},
    'products/index.html': {size: 14199, hash: '136e26363687865ad4635d098f3757cf356643483a8555dfa6bea5e4561ef5df', text: () => import('./assets-chunks/products_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 14178, hash: 'e720d0472f2ce0a19ab42785ada0ee30cc3819e893d75d98d9e4fc30ac5e6e40', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'checkout/index.html': {size: 14187, hash: '8d061820a1b68005756cea4cdf54ff61d7fdced38be5186066540aff9b53dc64', text: () => import('./assets-chunks/checkout_index_html.mjs').then(m => m.default)},
    'index.html': {size: 38270, hash: '7097becc6e439ce9ed4703147d0b70c4e06a536ad208913eec0538721bfc2dd7', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-7Q3R77XB.css': {size: 82493, hash: 'Y4+Wvm8uLgg', text: () => import('./assets-chunks/styles-7Q3R77XB_css.mjs').then(m => m.default)}
  },
};
