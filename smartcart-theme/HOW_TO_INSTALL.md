# SmartCart Dark Gaming Theme — Installation Guide

## Step 1 — Add Google Fonts to `index.html`

Open `frontend/src/index.html` and add this inside `<head>`:

```html
<!-- Gaming fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
```

---

## Step 2 — Replace global styles

Copy the contents of `smartcart-theme/styles.css` into:
```
frontend/src/styles.css
```
(Replace everything that's there.)

---

## Step 3 — Copy each component's HTML + CSS

For each component below, copy the `.html` into the component's `.html` file
and the `.css` into the component's `.css` file.

| Theme file | Angular file |
|---|---|
| `navbar/navbar.html` | `src/app/core/navbar/navbar.component.html` (or wherever your navbar is) |
| `navbar/navbar.css`  | `src/app/core/navbar/navbar.component.css` |
| `home/home.html` | `src/app/features/home/home.html` |
| `home/home.css`  | `src/app/features/home/home.css` |
| `product-list/product-list.html` | `src/app/features/product-list/product-list.html` |
| `product-list/product-list.css`  | `src/app/features/product-list/product-list.css` |
| `product-detail/product-detail.html` | `src/app/features/product-detail/product-detail.html` |
| `product-detail/product-detail.css`  | `src/app/features/product-detail/product-detail.css` |
| `cart/cart.html` | `src/app/features/cart/cart.html` |
| `cart/cart.css`  | `src/app/features/cart/cart.css` |
| `checkout/checkout.html` | `src/app/features/checkout/checkout.html` |
| `checkout/checkout.css`  | `src/app/features/checkout/checkout.css` |
| `login/login.html` | `src/app/features/login/login.html` |
| `login/login.css`  | `src/app/features/login/login.css` |
| `register/register.html` | `src/app/features/register/register.html` |
| `register/register.css`  | `src/app/features/register/register.css` |
| `gift-finder/gift-finder.html` | `src/app/features/gift-finder/gift-finder.html` |
| `gift-finder/gift-finder.css`  | `src/app/features/gift-finder/gift-finder.css` |
| `account/account.html` | `src/app/features/account/account.html` |
| `account/account.css`  | `src/app/features/account/account.css` |
| `wishlist/wishlist.html` | `src/app/features/wishlist/wishlist.html` |
| `wishlist/wishlist.css`  | `src/app/features/wishlist/wishlist.css` |

---

## Step 4 — Icons

All templates use `<i class="icon icon-xxx">` classes.
Replace these with whichever icon library you already use (Lucide, Font Awesome, Bootstrap Icons, etc).

**Mapping examples:**
| Used in theme | Font Awesome | Bootstrap Icons |
|---|---|---|
| `icon-shopping-cart` | `fa-cart-shopping` | `bi-cart` |
| `icon-heart` | `fa-heart` | `bi-heart` |
| `icon-search` | `fa-magnifying-glass` | `bi-search` |
| `icon-arrow-right` | `fa-arrow-right` | `bi-arrow-right` |
| `icon-star` | `fa-star` | `bi-star-fill` |
| `icon-check` | `fa-check` | `bi-check` |
| `icon-x` | `fa-xmark` | `bi-x` |
| `icon-gift` | `fa-gift` | `bi-gift` |
| `icon-user` | `fa-user` | `bi-person` |
| `icon-lock` | `fa-lock` | `bi-lock` |
| `icon-mail` | `fa-envelope` | `bi-envelope` |
| `icon-trash-2` | `fa-trash` | `bi-trash` |
| `icon-zap` | `fa-bolt` | `bi-lightning` |

Alternatively, to use Lucide icons in Angular:
```
npm install lucide-angular
```
Then import `LucideAngularModule` in your AppModule.

---

## Step 5 — Bootstrap

The templates use Bootstrap grid + utilities.
If you have Bootstrap installed already, no changes needed.
If not: `npm install bootstrap` and import in `styles.css`:
```css
@import 'bootstrap/dist/css/bootstrap.min.css';
```
Put this **before** the theme variables so the theme overrides take effect.

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#00c3ff` | Electric cyan — CTAs, links, active states |
| `--accent` | `#a855f7` | Neon purple — secondary, gift finder |
| `--bg` | `#08080f` | Main background |
| `--bg-card` | `#0e0e1a` | Card backgrounds |
| `--font-heading` | `Orbitron` | All headings, labels |
| `--font-body` | `Exo 2` | Body text |
