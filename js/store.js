/*
  js/store.js
  ----------------
  Client-side product catalog, cart, and invoice rendering for the static site.
  - Keeps cart state in localStorage.
  - Renders product cards and a simple invoice for printing/downloading.
  - Uses DOM APIs and escaping helpers to reduce XSS risk.

  Notes for maintainers: prefer DOM construction over large HTML templates when
  inserting dynamic data (see `renderProducts` and `renderCartItems`).
*/

const PRODUCTS = [
  {id: 'p1', title: 'Inner Rib Block', price: 5.00, colors: ['black','white'], img: '', imgByColor: {}},
  {id: 'p2', title: 'Upper Roof Support Bracket', price: 5.00, colors: ['black','white'], img: '', imgByColor: {}},
  {id: 'p3', title: 'Hurricane Clip', price: 3.50, colors: ['black','white'], img: '', imgByColor: {}}
];
window.PRODUCTS = PRODUCTS;
(function ensureRandCurrencyAndPrices(){
  try{
    const key = 'site_admin';
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    if(cur.currency !== 'ZAR') cur.currency = 'ZAR';
    cur.priceOverrides = cur.priceOverrides || {};
    cur.priceOverrides['p1'] = 5.00;    // Inner Rib Block
    cur.priceOverrides['p2'] = 5.00;    // Upper Roof Support Bracket
    cur.priceOverrides['p3'] = 3.50;    // Hurricane Clip
    localStorage.setItem(key, JSON.stringify(cur));
  }catch(e){}
})();
function getColorCss(name){
  const map = {white:'#ffffff', black:'#111827', blue:'#3b82f6', green:'#10b981', red:'#ef4444'};
  if(!name) return '';
  const key = String(name).toLowerCase();
  return map[key] || name;
}

// Escape HTML to prevent XSS when inserting user/product data into the DOM
function escapeHTML(input){
  const s = input == null ? '' : String(input);
  return s.replace(/[&<>"'`]/g, function(ch){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[ch]);
  });
}
// Render product cards into the `#products` container.
// Uses DOM APIs to avoid unsafe string-based `innerHTML` insertion with product data.
function renderProducts(){
  const container = document.getElementById('products');
  if(!container) return;
  // Clear container safely
  while(container.firstChild) container.removeChild(container.firstChild);
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.id;
    card.dataset.currentColor = p.colors[0];
    card.dataset.qty = 5;

    // media wrapper (empty placeholder or image when present)
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'product-image-wrapper';
    const viewport = document.createElement('div'); viewport.className = 'model-viewport';
    if(p.img){
      const img = document.createElement('img'); img.className = 'product-image'; img.src = p.img; img.alt = p.title;
      viewport.appendChild(img);
    }
    mediaWrap.appendChild(viewport);
    card.appendChild(mediaWrap);

    // title
    const title = document.createElement('h3'); title.className = 'product-title'; title.textContent = p.title;
    card.appendChild(title);

    // price block
    const priceRow = document.createElement('div'); priceRow.className = 'price-row';
    const priceLabel = document.createElement('div'); priceLabel.className = 'price-label'; priceLabel.textContent = 'Price (R):';
    const priceMainRow = document.createElement('div'); priceMainRow.className = 'price-main-row';
    const pricePill = document.createElement('div'); pricePill.className = 'price-pill'; pricePill.textContent = formatCurrency(getProductPrice(p.id));
    const perUnit = document.createElement('div'); perUnit.className = 'price-per-unit'; perUnit.textContent = 'per unit';
    priceMainRow.appendChild(pricePill); priceMainRow.appendChild(perUnit);
    const priceMin = document.createElement('div'); priceMin.className = 'price-min'; priceMin.textContent = 'Minimum order: 5 units';
    priceRow.appendChild(priceLabel); priceRow.appendChild(priceMainRow); priceRow.appendChild(priceMin);
    card.appendChild(priceRow);

    // controls (swatches + qty + add-to-cart)
    const controls = document.createElement('div'); controls.className = 'controls';
    const left = document.createElement('div'); left.className = 'controls-left';
    const colorRow = document.createElement('div'); colorRow.className = 'color-row';
    const colorLabel = document.createElement('div'); colorLabel.className = 'color-label'; colorLabel.textContent = 'Color Selection:';
    const swatches = document.createElement('div'); swatches.className = 'swatches'; swatches.setAttribute('data-id', p.id);
    p.colors.forEach(c=>{
      const b = document.createElement('button'); b.className = 'swatch'; b.setAttribute('data-color', c); b.setAttribute('title', c); b.setAttribute('aria-label', c); b.style.background = getColorCss(c);
      swatches.appendChild(b);
    });
    colorRow.appendChild(colorLabel); colorRow.appendChild(swatches);

    const unitsRow = document.createElement('div'); unitsRow.className = 'units-row';
    const unitsLabel = document.createElement('div'); unitsLabel.className = 'units-label'; unitsLabel.textContent = 'Units Required:';
    const qtyControls = document.createElement('div'); qtyControls.className = 'qty-controls'; qtyControls.setAttribute('data-id', p.id);
    const decBtn = document.createElement('button'); decBtn.className = 'qty-button btn-decrease'; decBtn.setAttribute('data-id', p.id); decBtn.setAttribute('aria-label','Decrease'); decBtn.textContent = '−';
    const valDiv = document.createElement('div'); valDiv.className = 'qty-value'; valDiv.setAttribute('data-id', p.id); valDiv.textContent = '5';
    const incBtn = document.createElement('button'); incBtn.className = 'qty-button btn-increase'; incBtn.setAttribute('data-id', p.id); incBtn.setAttribute('aria-label','Increase'); incBtn.textContent = '+';
    qtyControls.appendChild(decBtn); qtyControls.appendChild(valDiv); qtyControls.appendChild(incBtn);
    unitsRow.appendChild(unitsLabel); unitsRow.appendChild(qtyControls);

    left.appendChild(colorRow); left.appendChild(unitsRow);
    const right = document.createElement('div'); right.className = 'controls-right';
    const addBtn = document.createElement('button'); addBtn.className = 'add-to-cart'; addBtn.setAttribute('data-id', p.id); addBtn.setAttribute('aria-label','Add to cart'); addBtn.textContent = 'Add to cart';
    right.appendChild(addBtn);

    controls.appendChild(left); controls.appendChild(right);
    card.appendChild(controls);

    container.appendChild(card);
  });
  document.querySelectorAll('.swatch').forEach(s=> s.addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    const color = btn.getAttribute('data-color');
    const swatches = btn.closest('.swatches');
    const pid = swatches.getAttribute('data-id');
    swatches.querySelectorAll('.swatch').forEach(w=> w.classList.remove('selected'));
    btn.classList.add('selected');
      const card = document.querySelector(`[data-product-id="${pid}"]`);
    if(card){
      card.dataset.currentColor = color;
      const imgEl = card.querySelector('.product-image');
      const product = PRODUCTS.find(x=>x.id===pid);
      let src = product.img;
      if(product.imgByColor && product.imgByColor[color]) src = product.imgByColor[color];
      else {
        src = `assets/${pid}-${color}.jpg`;
      }
      imgEl.setAttribute('src', src);
    }
  }));
  document.querySelectorAll('.btn-increase').forEach(b=> b.addEventListener('click', (e)=>{
    const id = b.getAttribute('data-id');
    const card = document.querySelector(`[data-product-id="${id}"]`);
    const valEl = card.querySelector('.qty-value[data-id="'+id+'"]');
    let v = parseInt(valEl.textContent||'5'); v = normalizeQty(v + 5); valEl.textContent = v; card.dataset.qty = v;
  }));
  document.querySelectorAll('.btn-decrease').forEach(b=> b.addEventListener('click', (e)=>{
    const id = b.getAttribute('data-id');
    const card = document.querySelector(`[data-product-id="${id}"]`);
    const valEl = card.querySelector('.qty-value[data-id="'+id+'"]');
    let v = parseInt(valEl.textContent||'5'); v = Math.max(5, v - 5); valEl.textContent = v; card.dataset.qty = v;
  }));
  initKitHandlers();
  initModelViewerFallbacks();
  document.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      if(id){
        if(id === 'kit') return;
        const card = document.querySelector(`[data-product-id="${id}"]`);
        const color = card ? card.dataset.currentColor : PRODUCTS.find(p=>p.id===id).colors[0];
        const qty = card ? Math.max(1, parseInt(card.dataset.qty||'1')) : 1;
        const price = getProductPrice(id);
        addToCart(id, color, qty, price);
        return;
      }
    });
  });
}
function initModelViewerFallbacks(){
  const FALLBACK = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const viewers = Array.from(document.querySelectorAll('#products model-viewer, .diy-kit model-viewer'));
  viewers.forEach(v => {
    v.addEventListener('error', (ev)=>{
      try{
        const current = v.getAttribute('src') || '';
        if(current !== FALLBACK){
          console.warn('model-viewer failed to load, switching to fallback model for', v, current);
          v.setAttribute('src', FALLBACK);
          v.setAttribute('crossorigin','anonymous');
        }
      }catch(e){ console.warn('fallback switch failed', e); }
    });
    if(!v.hasAttribute('crossorigin')) v.setAttribute('crossorigin','anonymous');
  });
}
function getAdminSettings(){ try{ return JSON.parse(localStorage.getItem('site_admin')||'{}'); }catch(e){return{}} }

// Get the current price for a product id. Honors admin overrides stored in localStorage.
function getProductPrice(id){
  const base = (PRODUCTS.find(p=>p.id===id)||{}).price||0;
  const admin = getAdminSettings();
  if(admin && admin.priceOverrides && admin.priceOverrides[id]!=null) return Number(admin.priceOverrides[id]);
  return base;
}

// Format a numeric amount according to configured currency (admin setting or default).
function formatCurrency(amount){
  const admin = getAdminSettings();
  const cur = (admin && admin.currency) || 'USD';
  if(cur === 'ZAR') return `R${Number(amount).toFixed(2)}`;
  return `$${Number(amount).toFixed(2)}`;
}
// Normalize a requested quantity up to the minimum/order step.
// Business rule: quantities are rounded up to the nearest multiple of 5 and have a minimum of 5.
function normalizeQty(q){
  const n = Number(q) || 0;
  const rounded = Math.ceil(n/5) * 5;
  return Math.max(5, rounded);
}
// Simple shipping calculation: free over threshold, otherwise flat fee.
function calculateShipping(subtotal){
  try{
    const threshold = 500; // R500 free-shipping threshold
    const fee = 75; // flat fee for orders below threshold
    return Number(subtotal) >= threshold ? 0 : fee;
  }catch(e){ return 0; }
}

// Lightweight toast notification. Creates a transient element appended to <body>.
// Uses ARIA attributes for accessibility and auto-removes itself after a timeout.
function showToast(message, opts = {}){
  try{
    const timeout = opts.timeout || 3500;
    let container = document.querySelector('.toast-container');
    if(!container){ container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }

    const toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');

    const msgDiv = document.createElement('div');
    msgDiv.className = 'toast-message';
    msgDiv.textContent = String(message);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label','Close notification');
    closeBtn.textContent = '✕';

    const remove = ()=>{ toast.style.opacity = '0'; setTimeout(()=>{ try{ container.removeChild(toast); }catch(e){} }, 220); };
    closeBtn.addEventListener('click', remove);

    toast.appendChild(msgDiv);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    toast.style.transform = 'translateY(-6px)';
    toast.style.opacity = '0';
    requestAnimationFrame(()=>{ toast.style.transition = 'transform .18s ease, opacity .18s ease'; toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
    if(timeout>0) setTimeout(remove, timeout);
    return toast;
  }catch(e){ try{ console.warn('showToast failed', e); }catch(_){} }
}

// Add an item to the cart (stored in localStorage) and update UI/state.
// Preserves existing items, normalizes quantities, and triggers UI updates.
function addToCart(id, color, qty, price){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product) return;
  qty = normalizeQty(qty);
  let cart = JSON.parse(localStorage.getItem('cart')||'[]');
  let changed = false;
  cart = (cart || []).map(it=>{
    const normalized = Object.assign({}, it);
    const n = normalizeQty(Number(it.qty||0));
    if(n !== Number(it.qty||0)){ normalized.qty = n; changed = true; }
    return normalized;
  });
  if(changed) localStorage.setItem('cart', JSON.stringify(cart));
  const existing = cart.find(i=>i.id===id && i.color===color);
  if(existing){ existing.qty += qty; } else { cart.push({id, title: product.title, price: price!=null?price:product.price, color, qty}); }
  localStorage.setItem('cart', JSON.stringify(cart));
  showToast(`${product.title} (${color}) x${qty} added to cart`);
  window.app.updateCartCount();
  renderCartItems();
}

// Rebuild the cart modal contents from the cart stored in localStorage.
// Uses DOM APIs to construct rows and attach event handlers for qty/remove actions.
function renderCartItems(){
  const modal = document.getElementById('cartModal');
  const itemsDiv = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if(!itemsDiv) return;
  let cart = JSON.parse(localStorage.getItem('cart')||'[]');
  let changed = false;
  cart = (cart || []).map(it=>{
    const normalized = Object.assign({}, it);
    const n = normalizeQty(Number(it.qty||0));
    if(n !== Number(it.qty||0)){ normalized.qty = n; changed = true; }
    return normalized;
  });
  if(changed) localStorage.setItem('cart', JSON.stringify(cart));
  while(itemsDiv.firstChild) itemsDiv.removeChild(itemsDiv.firstChild);
  let subtotal = 0;
  let totalUnits = 0;
  cart.forEach((it, idx)=>{
    const currentPrice = (it.price != null) ? Number(it.price) : getProductPrice(it.id);
    subtotal += currentPrice * it.qty;
    totalUnits += Number(it.qty) || 0;
    const product = PRODUCTS.find(p=>p.id===it.id) || {};
    const row = document.createElement('div');
    row.className = 'cart-item';
    // build cart item row safely
    const left = document.createElement('div'); left.className = 'left';
    const meta = document.createElement('div'); meta.className = 'meta';
    const titleDiv = document.createElement('div'); titleDiv.className = 'title'; titleDiv.textContent = it.title;
    const colorDiv = document.createElement('div'); colorDiv.className = 'color';
    const colorSwatch = document.createElement('span'); colorSwatch.className = 'color-swatch'; colorSwatch.style.background = getColorCss(it.color);
    colorDiv.appendChild(colorSwatch);
    const colorText = document.createTextNode(String(it.color)); colorDiv.appendChild(colorText);
    meta.appendChild(titleDiv); meta.appendChild(colorDiv); left.appendChild(meta);

    const right = document.createElement('div'); right.className = 'right';
    const qtyControls = document.createElement('div'); qtyControls.className = 'qty-controls'; qtyControls.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem';
    const qtyBox = document.createElement('div'); qtyBox.className = 'qty-box'; qtyBox.style.cssText = 'display:flex;align-items:center;gap:0.5rem';
    const decBtn = document.createElement('button'); decBtn.className = 'qty-decrease'; decBtn.setAttribute('data-idx', String(idx)); decBtn.setAttribute('aria-label','Decrease quantity'); decBtn.textContent = '−';
    const qtyDisplay = document.createElement('div'); qtyDisplay.className = 'qty-display'; qtyDisplay.setAttribute('data-idx', String(idx)); qtyDisplay.setAttribute('aria-live','polite'); qtyDisplay.textContent = String(it.qty);
    const incBtn = document.createElement('button'); incBtn.className = 'qty-increase'; incBtn.setAttribute('data-idx', String(idx)); incBtn.setAttribute('aria-label','Increase quantity'); incBtn.textContent = '+';
    qtyBox.appendChild(decBtn); qtyBox.appendChild(qtyDisplay); qtyBox.appendChild(incBtn);
    const removeWrap = document.createElement('div'); removeWrap.style.cssText = 'display:flex;align-items:center;gap:0.5rem';
    const removeBtn = document.createElement('button'); removeBtn.className = 'remove-item'; removeBtn.setAttribute('data-idx', String(idx)); removeBtn.setAttribute('aria-label', `Remove ${it.title}`); removeBtn.textContent = '🗑';
    removeWrap.appendChild(removeBtn);
    qtyControls.appendChild(qtyBox); qtyControls.appendChild(removeWrap);
    right.appendChild(qtyControls);
    const lineTotal = document.createElement('div'); lineTotal.className = 'line-total text-sm'; lineTotal.style.marginTop = '0.5rem'; lineTotal.textContent = formatCurrency(currentPrice * it.qty);
    right.appendChild(lineTotal);
    row.appendChild(left); row.appendChild(right);
    itemsDiv.appendChild(row);
  });
  const shipping = calculateShipping(subtotal);
  const grandTotal = subtotal + shipping;
  if(totalEl){
    // build total summary safely
    if(totalEl){
      while(totalEl.firstChild) totalEl.removeChild(totalEl.firstChild);
      const subDiv = document.createElement('div'); subDiv.style.fontSize = '0.95rem'; subDiv.style.color = '#6b7280'; subDiv.textContent = `Subtotal: ${formatCurrency(subtotal)}`;
      const shipDiv = document.createElement('div'); shipDiv.style.fontSize = '0.95rem'; shipDiv.style.color = '#6b7280'; shipDiv.textContent = `Shipping: ${formatCurrency(shipping)}`;
      const grandDiv = document.createElement('div'); grandDiv.style.fontWeight = '800'; grandDiv.style.fontSize = '1.05rem'; grandDiv.style.marginTop = '0.25rem'; grandDiv.textContent = formatCurrency(grandTotal);
      totalEl.appendChild(subDiv); totalEl.appendChild(shipDiv); totalEl.appendChild(grandDiv);
    }
  }
  const itemsCountEl = document.getElementById('cartItemsCount');
  if(itemsCountEl) itemsCountEl.textContent = String(totalUnits);
  const checkoutBtn = document.getElementById('checkout');
  if(!cart || cart.length === 0){
    while(itemsDiv.firstChild) itemsDiv.removeChild(itemsDiv.firstChild);
    const emptyDiv = document.createElement('div'); emptyDiv.className = 'text-sm text-gray-600'; emptyDiv.textContent = 'Your cart is empty.';
    itemsDiv.appendChild(emptyDiv);
    if(checkoutBtn){ checkoutBtn.disabled = true; checkoutBtn.classList.add('opacity-50','cursor-not-allowed'); }
  } else {
    if(checkoutBtn){ checkoutBtn.disabled = false; checkoutBtn.classList.remove('opacity-50','cursor-not-allowed'); }
  }
  document.querySelectorAll('.remove-item').forEach(b=> b.addEventListener('click', (ev)=>{
    const idx = parseInt(b.getAttribute('data-idx'));
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    if(idx>=0 && idx < cart.length){ cart.splice(idx,1); }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    window.app.updateCartCount();
  }));
  document.querySelectorAll('.qty-increase').forEach(btn=> btn.addEventListener('click', ()=>{
    const idx = parseInt(btn.getAttribute('data-idx'));
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    if(cart[idx]){ cart[idx].qty = normalizeQty(Number(cart[idx].qty||0) + 5); localStorage.setItem('cart', JSON.stringify(cart)); renderCartItems(); window.app.updateCartCount(); }
  }));
  document.querySelectorAll('.qty-decrease').forEach(btn=> btn.addEventListener('click', ()=>{
    const idx = parseInt(btn.getAttribute('data-idx'));
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    if(cart[idx]){ cart[idx].qty = Math.max(5, Number(cart[idx].qty||5) - 5); localStorage.setItem('cart', JSON.stringify(cart)); renderCartItems(); window.app.updateCartCount(); }
  }));
  document.querySelectorAll('.qty-display').forEach(d=> d.addEventListener('click', ()=>{}));
}
// Init handlers for the DIY kit UI (if present). Keeps behavior localized to the kit element.
function initKitHandlers(){
  const kit = document.querySelector('.diy-kit');
  if(!kit) return;
  const swatches = kit.querySelectorAll('.swatch');
  let selectedColor = swatches.length ? swatches[0].getAttribute('data-color') : 'black';
  swatches.forEach(s=> s.addEventListener('click', (e)=>{
    swatches.forEach(x=> x.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
    selectedColor = e.currentTarget.getAttribute('data-color');
  }));

  const qtyValue = kit.querySelector('.qty-value[data-id="kit"]');
  if(qtyValue) qtyValue.textContent = String(5);
  kit.querySelectorAll('.btn-increase[data-id="kit"]').forEach(b=> b.addEventListener('click', ()=>{ qtyValue.textContent = String(normalizeQty(parseInt(qtyValue.textContent||'5')+5)); }));
  kit.querySelectorAll('.btn-decrease[data-id="kit"]').forEach(b=> b.addEventListener('click', ()=>{ qtyValue.textContent = String(Math.max(5, parseInt(qtyValue.textContent||'5')-5)); }));

  const kitAdd = kit.querySelector('.add-to-cart');
  if(kitAdd){
    kitAdd.addEventListener('click', ()=>{
      const qty = normalizeQty(parseInt(qtyValue.textContent||'5'));
      const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const kitId = 'kit';
  const kitTitle = 'DIY Kit: Inner Rib Block + Upper Support Bracket + Screw & Washer';
      const kitPrice = 15.00;
      const existing = (cart||[]).find(i=> i.id === kitId && i.color === selectedColor);
      if(existing){ existing.qty = normalizeQty(Number(existing.qty||0) + qty); }
      else { cart.push({ id: kitId, title: kitTitle, price: kitPrice, color: selectedColor, qty: qty }); }
      localStorage.setItem('cart', JSON.stringify(cart));
      showToast(`${kitTitle} (${selectedColor}) x${qty} added to cart`);
      window.app.updateCartCount();
      renderCartItems();
    });
  }
}
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const closeCart = document && document.getElementById('closeCart');
const closeCartTop = document && document.getElementById('closeCartTop');
const checkout = document && document.getElementById('checkout');

// Open the cart modal and refresh its contents.
function openCartModal(){
  renderCartItems();
  if(cartModal){ cartModal.classList.remove('hidden'); cartModal.setAttribute('aria-hidden','false'); }
  document.body.classList.add('modal-open');
}

// Close the cart modal and restore document state.
function closeCartModal(){
  if(cartModal){ cartModal.classList.add('hidden'); cartModal.setAttribute('aria-hidden','true'); }
  document.body.classList.remove('modal-open');
}

if(cartBtn) cartBtn.addEventListener('click', ()=> openCartModal());
if(closeCart) closeCart.addEventListener('click', ()=> closeCartModal());
if(closeCartTop) closeCartTop.addEventListener('click', ()=> closeCartModal());
if(checkout) checkout.addEventListener('click', ()=>{
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  renderInvoice(cart);
  openInvoiceModal();
});
const invoiceModal = document.getElementById('invoiceModal');
const invoiceBody = document.getElementById('invoiceBody');
const closeInvoiceBtn = document && document.getElementById('closeInvoice');
const printInvoiceBtn = document && document.getElementById('printInvoice');
const markPaidBtn = document && document.getElementById('markPaid');

function openInvoiceModal(){
  if(invoiceModal){ invoiceModal.classList.remove('hidden'); invoiceModal.setAttribute('aria-hidden','false'); }
  document.body.classList.add('modal-open');
  adjustInvoiceActionsForMobile();
}
function closeInvoiceModal(){
  if(invoiceModal){ invoiceModal.classList.add('hidden'); invoiceModal.setAttribute('aria-hidden','true'); }
  document.body.classList.remove('modal-open');
}
function adjustInvoiceActionsForMobile(){
  try{
    const isMobile = window.innerWidth <= 900 || /Mobi|Android|iPhone|iPad|Mobile/.test(navigator.userAgent||'');
    const printBtn = document.getElementById('printInvoice');
    const dlBtn = document.getElementById('downloadInvoice');
    if(isMobile){
      if(printBtn) printBtn.style.display = 'none';
      if(dlBtn) dlBtn.textContent = dlBtn.getAttribute('data-mobile-label') || 'Save';
    } else {
      if(printBtn) printBtn.style.display = '';
      if(dlBtn) dlBtn.textContent = dlBtn.getAttribute('data-desktop-label') || 'Download PNG';
    }
  }catch(e){}
}

if(closeInvoiceBtn) closeInvoiceBtn.addEventListener('click', ()=> closeInvoiceModal());
if(printInvoiceBtn) printInvoiceBtn.addEventListener('click', ()=>{
  if(!invoiceBody) return;
  const isMobile = window.innerWidth <= 900 || /Mobi|Android|iPhone|iPad|Mobile/.test(navigator.userAgent || '');

  const doInlinePrint = ()=>{
    const existing = document.getElementById('printInvoiceContainer');
    if(existing) existing.remove();
    const printContainer = document.createElement('div');
    printContainer.id = 'printInvoiceContainer';
    printContainer.className = 'print-only-invoice';
    // copy invoiceBody content into print container safely by cloning nodes
    while(printContainer.firstChild) printContainer.removeChild(printContainer.firstChild);
    const cloned = invoiceBody.cloneNode(true);
    // remove any script nodes for safety
    cloned.querySelectorAll('script').forEach(s=> s.remove());
    printContainer.appendChild(cloned);
    document.body.appendChild(printContainer);

    const cleanup = ()=>{ try{ const el = document.getElementById('printInvoiceContainer'); if(el) el.remove(); }catch(e){} window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 3000);
    window.print();
  };

  if(isMobile){
    try{
      const newWin = window.open('', '_blank');
      if(!newWin){ doInlinePrint(); return; }
      const cssHref = (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l=>l.getAttribute('href')).find(h=>h && h.includes('styles.css'))) || 'css/styles.css';
      const doc = newWin.document;
      doc.open();
      // build a minimal printable document using escaped text where appropriate
      const printHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice</title><link rel="stylesheet" href="${escapeHTML(cssHref)}"></head><body>`;
      // serialize current invoice safely by cloning into a temporary container
      const clonedInvoice = invoiceBody.cloneNode(true);
      clonedInvoice.querySelectorAll('script').forEach(s=> s.remove());
      const serial = clonedInvoice.outerHTML;
      doc.write(printHtml + serial + '</body></html>');
      doc.close();
      const tryPrint = ()=>{ try{ newWin.focus(); newWin.print(); }catch(e){} setTimeout(()=>{ try{ newWin.close(); }catch(e){} }, 900); };
      newWin.onload = tryPrint;
      setTimeout(tryPrint, 800);
      return;
    }catch(e){ console.warn('mobile print window failed', e); doInlinePrint(); return; }
  }
  doInlinePrint();
});
if(markPaidBtn) markPaidBtn.addEventListener('click', ()=>{
  localStorage.removeItem('cart');
  renderCartItems();
  window.app.updateCartCount();
  closeInvoiceModal();
  showToast('Payment recorded. Thank you!');
});
const downloadInvoiceBtn = document && document.getElementById('downloadInvoice');
if(downloadInvoiceBtn) downloadInvoiceBtn.addEventListener('click', async ()=>{
  if(!invoiceBody) return;
  const ensureHtml2Canvas = ()=> new Promise((resolve, reject)=>{
    if(window.html2canvas) return resolve(window.html2canvas);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = ()=> resolve(window.html2canvas);
    s.onerror = (e)=> reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(s);
  });

  try{
    const h2c = await ensureHtml2Canvas();
    const clone = invoiceBody.cloneNode(true);
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';
    clone.style.padding = '20px';
    clone.style.width = '760px';
    clone.style.maxWidth = '100%';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const imgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(imgs.map(img=>{
      return new Promise(res=>{
        if(img.complete && img.naturalWidth !== 0) return res();
        img.addEventListener('load', ()=> res());
        img.addEventListener('error', ()=> res());
        setTimeout(res, 1500);
      });
    }));

    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const canvas = await h2c(clone, {useCORS:true, scale, backgroundColor: '#ffffff'});
    canvas.toBlob((blob)=>{
      if(!blob) return;
      const a = document.createElement('a');
      const invoiceNumber = invoiceBody.dataset && invoiceBody.dataset.invoiceNumber ? invoiceBody.dataset.invoiceNumber : 'invoice';
      a.download = `invoice-${invoiceNumber}.png`;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); try{ a.remove(); }catch(e){} }, 1500);
    }, 'image/png');
    setTimeout(()=>{ try{ wrapper.remove(); }catch(e){} }, 2000);
  }catch(e){
    console.warn('Download invoice failed, falling back to print', e);
    const pBtn = document.getElementById('printInvoice');
    if(pBtn) pBtn.click();
  }
});

function renderInvoice(cart){
  if(!invoiceBody) return;
  function getNextInvoiceNumber(){
    try{
      const key = 'next_invoice_number';
      let next = Number(localStorage.getItem(key));
      if(!next || isNaN(next)) next = 1;
      const current = next;
      localStorage.setItem(key, String(next + 1));
      // return zero-padded 4-digit invoice number (e.g. 0001)
      return String(current).padStart(4, '0');
    }catch(e){ return 5000; }
  }
  let invoiceNumber = invoiceBody.dataset && invoiceBody.dataset.invoiceNumber ? invoiceBody.dataset.invoiceNumber : null;
  if(!invoiceNumber){ invoiceNumber = String(getNextInvoiceNumber()); if(invoiceBody && invoiceBody.dataset) invoiceBody.dataset.invoiceNumber = invoiceNumber; }
  const lines = (cart || []).map((it,idx)=>{
    const price = (it.price != null) ? Number(it.price) : getProductPrice(it.id);
    const lineTotal = price * it.qty;
    return `
      <tr>
        <td>${idx+1}</td>
        <td>${it.title}</td>
        <td>${it.color}</td>
        <td>${it.qty}</td>
        <td>${formatCurrency(price)}</td>
        <td>${formatCurrency(lineTotal)}</td>
      </tr>`;
  }).join('');

  const subtotal = (cart||[]).reduce((s,it)=> s + (((it.price!=null)?Number(it.price):getProductPrice(it.id)) * it.qty), 0);
  let contactEmail = 'IBRroofsolutions@gmail.com';
  let whatsappRaw = '073 435 5596';
  try{
    const emailInput = document.querySelector('input[name="contactEmail"]');
    if(emailInput && emailInput.value) contactEmail = emailInput.value.trim();
    const waInput = document.querySelector('input[name="whatsapp"]') || document.querySelector('input[name="contactNumber"]');
    if(waInput && waInput.value) whatsappRaw = waInput.value.trim();
  }catch(e){}
  const rawDigits = String(whatsappRaw).replace(/\D/g,'');
  let waDigits = rawDigits;
  if(rawDigits.length === 10 && rawDigits.startsWith('0')) waDigits = '27' + rawDigits.slice(1);
  const waText = encodeURIComponent('Payment for Invoice ' + invoiceNumber);
  const whatsappHtml = `<a href="https://wa.me/${waDigits}?text=${waText}" target="_blank" rel="noopener">${whatsappRaw}</a>`;
  const vat = 0; // placeholder
  const shipping = calculateShipping(subtotal);
  const total = subtotal + vat + shipping;
  // Build invoice DOM safely (avoid constructing large HTML strings with user/cart data)
  while(invoiceBody.firstChild) invoiceBody.removeChild(invoiceBody.firstChild);
  const header = document.createElement('div'); header.className = 'invoice-header';
  const headerLeft = document.createElement('div'); headerLeft.style.display = 'flex'; headerLeft.style.alignItems = 'center'; headerLeft.style.gap = '0.75rem';
  const logo = document.createElement('img'); logo.src = 'assets/All Products Patented.svg'; logo.alt = 'IBR Roof Solutions'; logo.style.height = '64px'; logo.style.maxHeight = '140px'; logo.style.objectFit = 'contain'; logo.style.border = '0';
  const orgWrap = document.createElement('div');
  const orgName = document.createElement('div'); orgName.style.fontWeight = '900'; orgName.style.fontSize = '1.05rem'; orgName.textContent = 'IBR Roof Solutions';
  const meta = document.createElement('div'); meta.className = 'invoice-meta'; meta.textContent = `Invoice #: ${invoiceNumber} • Date: ${new Date().toLocaleDateString()}`;
  orgWrap.appendChild(orgName); orgWrap.appendChild(meta);
  headerLeft.appendChild(logo); headerLeft.appendChild(orgWrap);
  const headerRight = document.createElement('div'); headerRight.style.textAlign = 'right';
  const amtDue = document.createElement('div'); amtDue.style.fontWeight = '800'; amtDue.style.fontSize = '1.1rem'; amtDue.textContent = formatCurrency(total);
  const amtLabel = document.createElement('div'); amtLabel.className = 'invoice-meta'; amtLabel.textContent = 'Amount Due';
  headerRight.appendChild(amtDue); headerRight.appendChild(amtLabel);
  header.appendChild(headerLeft); header.appendChild(headerRight);
  invoiceBody.appendChild(header);

  // items table
  const table = document.createElement('table'); table.className = 'invoice-table'; table.setAttribute('aria-label','Invoice items');
  const thead = document.createElement('thead'); const htr = document.createElement('tr'); ['#','Item','Color','Qty','Unit','Total'].forEach(t=>{ const th = document.createElement('th'); th.textContent = t; htr.appendChild(th); }); thead.appendChild(htr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  (cart || []).forEach((it, idx)=>{
    const tr = document.createElement('tr');
    const cols = [String(idx+1), it.title, it.color, String(it.qty), formatCurrency((it.price!=null)?Number(it.price):getProductPrice(it.id)), formatCurrency(((it.price!=null)?Number(it.price):getProductPrice(it.id)) * it.qty)];
    cols.forEach(c=>{ const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  invoiceBody.appendChild(table);

  // summary
  const summaryWrap = document.createElement('div'); summaryWrap.className = 'invoice-summary';
  const summaryInner = document.createElement('div'); summaryInner.style.textAlign = 'right';
  const subDiv = document.createElement('div'); subDiv.style.fontWeight = '700'; subDiv.textContent = `Subtotal: ${formatCurrency(subtotal)}`;
  const shipDiv = document.createElement('div'); shipDiv.style.fontWeight = '700'; shipDiv.textContent = `Shipping: ${formatCurrency(shipping)}`;
  const grandDiv = document.createElement('div'); grandDiv.style.fontWeight = '900'; grandDiv.style.marginTop = '0.25rem'; grandDiv.textContent = `Total: ${formatCurrency(total)}`;
  summaryInner.appendChild(subDiv); summaryInner.appendChild(shipDiv); summaryInner.appendChild(grandDiv); summaryWrap.appendChild(summaryInner); invoiceBody.appendChild(summaryWrap);

  // bank details + QR placeholder
  const footerWrap = document.createElement('div'); footerWrap.style.display = 'flex'; footerWrap.style.gap = '1rem'; footerWrap.style.marginTop = '1rem'; footerWrap.style.alignItems = 'flex-start';
  const bankCol = document.createElement('div'); bankCol.style.flex = '1';
  const bankDetails = document.createElement('div'); bankDetails.className = 'bank-details';
  const bankTitle = document.createElement('div'); bankTitle.style.fontWeight = '800'; bankTitle.style.marginBottom = '0.25rem'; bankTitle.textContent = 'Banking details (placeholder)';
  bankDetails.appendChild(bankTitle);
  ['Account name: IBR Roof Solutions','Bank: Example Bank','Branch code: 000000','Account number: 1234567890'].forEach(t=>{ const d = document.createElement('div'); d.textContent = t; bankDetails.appendChild(d); });
  const bankNote = document.createElement('div'); bankNote.style.marginTop = '0.5rem'; bankNote.style.fontSize = '0.95rem'; bankNote.style.color = '#6b7280'; bankNote.textContent = 'Use your invoice number as payment reference.';
  bankDetails.appendChild(bankNote); bankCol.appendChild(bankDetails); footerWrap.appendChild(bankCol);
  const qrCol = document.createElement('div'); qrCol.style.width = '180px'; qrCol.style.flex = '0 0 180px'; const qr = document.createElement('div'); qr.className = 'qr-code'; qr.setAttribute('aria-hidden','true'); qr.textContent = 'QR'; const qrNote = document.createElement('div'); qrNote.style.fontSize = '0.85rem'; qrNote.style.color = '#6b7280'; qrNote.style.marginTop = '0.5rem'; qrNote.textContent = 'Scan to pay (placeholder)'; qrCol.appendChild(qr); qrCol.appendChild(qrNote); footerWrap.appendChild(qrCol);
  invoiceBody.appendChild(footerWrap);

  // proof of payment
  const proofWrap = document.createElement('div'); proofWrap.style.marginTop = '0.85rem'; proofWrap.style.borderTop = '1px dashed rgba(0,0,0,0.06)'; proofWrap.style.paddingTop = '0.85rem';
  const proofTitle = document.createElement('div'); proofTitle.style.fontWeight = '800'; proofTitle.style.marginBottom = '0.25rem'; proofTitle.textContent = 'Send proof of payment';
  const proofText = document.createElement('div'); proofText.style.color = '#1f2937';
  const mailA = document.createElement('a'); mailA.href = `mailto:${contactEmail}?subject=Payment%20Proof%20Invoice%20${invoiceNumber}`; mailA.style.color = 'var(--brand)'; mailA.style.fontWeight = '700'; mailA.textContent = contactEmail;
  const waA = document.createElement('a'); waA.href = `https://wa.me/${waDigits}?text=${waText}`; waA.setAttribute('target','_blank'); waA.setAttribute('rel','noopener'); waA.textContent = whatsappRaw;
  proofText.appendChild(document.createTextNode('Email your proof to ')); proofText.appendChild(mailA); proofText.appendChild(document.createTextNode(' or send via WhatsApp: ')); proofText.appendChild(waA);
  const proofNote = document.createElement('div'); proofNote.style.marginTop = '0.5rem'; proofNote.style.fontSize = '0.9rem'; proofNote.style.color = '#6b7280'; proofNote.textContent = 'Please include your invoice number in the message so we can match your payment.';
  proofWrap.appendChild(proofTitle); proofWrap.appendChild(proofText); proofWrap.appendChild(proofNote);
  invoiceBody.appendChild(proofWrap);
}
renderProducts();
window.addEventListener('DOMContentLoaded', ()=>{
  window.app.updateCartCount();
  try{
    const dl = document.getElementById('downloadInvoice');
    if(dl){ dl.setAttribute('data-desktop-label', dl.textContent || 'Download PNG'); dl.setAttribute('data-mobile-label', 'Save'); }
    adjustInvoiceActionsForMobile();
    window.addEventListener('resize', ()=> adjustInvoiceActionsForMobile());
  }catch(e){}
});
