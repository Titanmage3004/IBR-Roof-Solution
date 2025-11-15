# Responsive 4-Page Static Website

This is a simple static website (no build) with 4 pages: Home, About, Store, Contact.

What you'll find:
- `index.html` — Home page with hero, a 3D model viewer (`<model-viewer>`) and a hero photo.
- `about.html` — About page with embedded videos and description.
- `store.html` — Store page showing product listings, color selection, quantity, Add to Cart and a cart modal. Cart is persisted in `localStorage`.
- `contact.html` — Contact form that saves submissions to `localStorage` (simulates sending to a backend).
- `css/styles.css` — small custom styles.
- `js/main.js` — shared UI helpers.
- `js/store.js` — store and cart logic.
- `assets/ibr_header_logo.webp` — site header/footer logo (added by user).
- `assets/*.mp4` and `assets/*.jpg` — media files used on the About page (videos and photos).

How to use:
1. Open `index.html` in your browser (no server required). On Windows you can right-click -> Open with -> Browser.
2. Try the 3D model on the home page (requires an internet connection for the model-viewer script and model file).
3. Go to the Store, add items to the cart, click Cart to see the items and adjust quantities. Data persists in localStorage.
4. Go to Contact, submit the form — submissions are saved in localStorage under the `contacts` key.

Next steps & improvements:
- Hook contact form to a backend (Formspree, Netlify Forms, or your own API).
- Add real product images and prices; integrate a payment provider for checkout.
- Add automated tests or TypeScript for stronger correctness.
- Deploy to static hosts: Vercel, Netlify, GitHub Pages.

If you want, I can:
- Convert this into a React + Vite + TypeScript project.
- Add serverless form handling or Stripe checkout.
- Replace placeholder images with yours and add more products.

Enjoy — open `index.html` to preview the site.