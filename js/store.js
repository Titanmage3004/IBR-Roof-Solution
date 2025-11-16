const PRODUCTS = [
  {id: 'p1', title: 'Inner Rib Block', price: 5.00, colors: ['black','white','green','blue'], img: 'assets/476221519_594834240113185_7203426001611182768_n.jpg', imgByColor: {}, model: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'},
  {id: 'p2', title: 'Upper Roof Support Bracket', price: 5.00, colors: ['black','white','green','blue'], img: 'assets/476500581_595370980059511_6236944891318466094_n.jpg', imgByColor: {}, model: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb'},
  {id: 'p3', title: 'Hurricane Clip', price: 3.50, colors: ['black','white','green','blue'], img: 'assets/476508509_595371040059505_2143475231093520394_n.jpg', imgByColor: {}, model: 'https://modelviewer.dev/shared-assets/models/BoomBox.glb'}
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

function renderProducts(){
  const container = document.getElementById('products');
  if(!container) return;
  container.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.id;
  card.dataset.currentColor = p.colors[0];
  card.dataset.qty = 5;

    card.innerHTML = `
      <div class="product-image-wrapper">
  <model-viewer src="${p.model || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}" crossorigin="anonymous" alt="${p.title}" camera-controls auto-rotate reveal="auto" class="model-viewport" shadow-intensity="1"></model-viewer>
      </div>
      <h3 class="product-title">${p.title}</h3>
      <div class="price-row">
        <div class="price-label">Price (R):</div>
        <div class="price-main-row">
          <div class="price-pill">${formatCurrency(getProductPrice(p.id))}</div>
          <div class="price-per-unit">per unit</div>
        </div>
        <div class="price-min">Minimum order: 5 units</div>
  </div>
      <div class="controls">
        <div class="controls-left">
          <div class="color-row">
            <div class="color-label">Color Selection:</div>
            <div class="swatches" data-id="${p.id}">
              ${p.colors.map(c=>`<button data-color="${c}" title="${c}" class="swatch" style="background:${getColorCss(c)}" aria-label="${c}"></button>`).join('')}
            </div>
          </div>
          <div class="units-row">
            <div class="units-label">Units Required:</div>
            <div class="qty-controls" data-id="${p.id}">
              <button class="qty-button btn-decrease" data-id="${p.id}" aria-label="Decrease">−</button>
              <div class="qty-value" data-id="${p.id}">5</div>
              <button class="qty-button btn-increase" data-id="${p.id}" aria-label="Increase">+</button>
            </div>
          </div>
        </div>
        <div class="controls-right">
          <button data-id="${p.id}" class="add-to-cart" aria-label="Add to cart">Add to cart</button>
        </div>
      </div>
    `;
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

function getProductPrice(id){
  const base = (PRODUCTS.find(p=>p.id===id)||{}).price||0;
  const admin = getAdminSettings();
  if(admin && admin.priceOverrides && admin.priceOverrides[id]!=null) return Number(admin.priceOverrides[id]);
  return base;
}

function formatCurrency(amount){
  const admin = getAdminSettings();
  const cur = (admin && admin.currency) || 'USD';
  if(cur === 'ZAR') return `R${Number(amount).toFixed(2)}`;
  return `$${Number(amount).toFixed(2)}`;
}
function normalizeQty(q){
  const n = Number(q) || 0;
  const rounded = Math.ceil(n/5) * 5;
  return Math.max(5, rounded);
}
function calculateShipping(subtotal){
  try{
    const threshold = 500; // R500 free-shipping threshold
    const fee = 75; // flat fee for orders below threshold
    return Number(subtotal) >= threshold ? 0 : fee;
  }catch(e){ return 0; }
}

function showToast(message, opts = {}){
  try{
    const timeout = opts.timeout || 3500;
    let container = document.querySelector('.toast-container');
    if(!container){ container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }

    const toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.innerHTML = `
      <div class="toast-message">${String(message)}</div>
      <button class="toast-close" aria-label="Close notification">✕</button>
    `;
    const closeBtn = toast.querySelector('.toast-close');
    const remove = ()=>{ toast.style.opacity = '0'; setTimeout(()=>{ try{ container.removeChild(toast); }catch(e){} }, 220); };
    closeBtn.addEventListener('click', remove);
    container.appendChild(toast);
    toast.style.transform = 'translateY(-6px)';
    toast.style.opacity = '0';
    requestAnimationFrame(()=>{ toast.style.transition = 'transform .18s ease, opacity .18s ease'; toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
    if(timeout>0) setTimeout(remove, timeout);
    return toast;
  }catch(e){ try{ console.warn('showToast failed', e); }catch(_){} }
}

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
  itemsDiv.innerHTML = '';
  let subtotal = 0;
  let totalUnits = 0;
  cart.forEach((it, idx)=>{
    const currentPrice = (it.price != null) ? Number(it.price) : getProductPrice(it.id);
    subtotal += currentPrice * it.qty;
    totalUnits += Number(it.qty) || 0;
    const product = PRODUCTS.find(p=>p.id===it.id) || {};
    const thumb = product.img || '';
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="left">
        <img src="${thumb}" alt="${it.title} thumbnail" onerror="this.style.display='none'" />
        <div class="meta">
          <div class="title">${it.title}</div>
          <div class="color"><span class="color-swatch" style="background:${getColorCss(it.color)}"></span>${it.color}</div>
        </div>
      </div>
      <div class="right">
        <div class="qty-controls" style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
          <div class="qty-box" style="display:flex;align-items:center;gap:0.5rem">
            <button class="qty-decrease" data-idx="${idx}" aria-label="Decrease quantity">−</button>
            <div class="qty-display" data-idx="${idx}" aria-live="polite" style="font-weight:900">${it.qty}</div>
            <button class="qty-increase" data-idx="${idx}" aria-label="Increase quantity">+</button>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <button data-idx="${idx}" class="remove-item" aria-label="Remove ${it.title}">🗑</button>
          </div>
        </div>
        <div class="line-total text-sm font-semibold" style="margin-top:0.5rem">${formatCurrency(currentPrice*it.qty)}</div>
      </div>
    `;
    itemsDiv.appendChild(row);
  });
  const shipping = calculateShipping(subtotal);
  const grandTotal = subtotal + shipping;
  if(totalEl){
    totalEl.innerHTML = `<div style="font-size:0.95rem;color:#6b7280">Subtotal: ${formatCurrency(subtotal)}</div><div style="font-size:0.95rem;color:#6b7280">Shipping: ${formatCurrency(shipping)}</div><div style="font-weight:800;font-size:1.05rem;margin-top:0.25rem">${formatCurrency(grandTotal)}</div>`;
  }
  const itemsCountEl = document.getElementById('cartItemsCount');
  if(itemsCountEl) itemsCountEl.textContent = String(totalUnits);
  const checkoutBtn = document.getElementById('checkout');
  if(!cart || cart.length === 0){
    itemsDiv.innerHTML = '<div class="text-sm text-gray-600">Your cart is empty.</div>';
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

function openCartModal(){
  renderCartItems();
  if(cartModal){ cartModal.classList.remove('hidden'); cartModal.setAttribute('aria-hidden','false'); }
  document.body.classList.add('modal-open');
}

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
    printContainer.innerHTML = invoiceBody.innerHTML;
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
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice</title><link rel="stylesheet" href="${cssHref}"></head><body>${invoiceBody.innerHTML}</body></html>`);
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
      if(!next || isNaN(next)) next = 5000;
      const current = next;
      localStorage.setItem(key, String(next + 1));
      return current;
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
  invoiceBody.innerHTML = `
    <div class="invoice-header">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <img src="assets/ibr_header_logo.webp" alt="IBR Roof Solutions" />
        <div>
          <div style="font-weight:900;font-size:1.05rem">IBR Roof Solutions</div>
          <div class="invoice-meta">Invoice #: ${invoiceNumber} • Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800;font-size:1.1rem">${formatCurrency(total)}</div>
        <div class="invoice-meta">Amount Due</div>
      </div>
    </div>
    <table class="invoice-table" aria-label="Invoice items">
      <thead>
        <tr><th>#</th><th>Item</th><th>Color</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${lines}
      </tbody>
    </table>

    <div class="invoice-summary">
      <div style="text-align:right">
        <div style="font-weight:700">Subtotal: ${formatCurrency(subtotal)}</div>
        <div style="font-weight:700">Shipping: ${formatCurrency(shipping)}</div>
        <div style="font-weight:900;margin-top:0.25rem">Total: ${formatCurrency(total)}</div>
      </div>
    </div>

    <div style="display:flex;gap:1rem;margin-top:1rem;align-items:flex-start">
      <div style="flex:1">
        <div class="bank-details">
          <div style="font-weight:800;margin-bottom:0.25rem">Banking details (placeholder)</div>
          <div>Account name: IBR Roof Solutions</div>
          <div>Bank: Example Bank</div>
          <div>Branch code: 000000</div>
          <div>Account number: 1234567890</div>
          <div style="margin-top:0.5rem;font-size:0.95rem;color:#6b7280">Use your invoice number as payment reference.</div>
        </div>
      </div>
      <div style="width:180px;flex:0 0 180px">
        <div class="qr-code" aria-hidden="true">QR</div>
        <div style="font-size:0.85rem;color:#6b7280;margin-top:0.5rem">Scan to pay (placeholder)</div>
      </div>
    </div>
    <div style="margin-top:0.85rem;border-top:1px dashed rgba(0,0,0,0.06);padding-top:0.85rem;">
      <div style="font-weight:800;margin-bottom:0.25rem">Send proof of payment</div>
      <div style="color:#1f2937">Email your proof to <a href="mailto:${contactEmail}?subject=Payment%20Proof%20Invoice%20${invoiceNumber}" style="color:var(--brand);font-weight:700">${contactEmail}</a> or send via WhatsApp: ${whatsappHtml}</div>
  <div style="margin-top:0.5rem;font-size:0.9rem;color:#6b7280">Please include your invoice number in the message so we can match your payment.</div>
    </div>
  `;
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
