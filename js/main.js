// Main JS used across pages: mobile menu toggles
function setupMobileMenu(btnId, menuId){
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if(!btn || !menu) return;
  btn.addEventListener('click', ()=>{
    menu.classList.toggle('hidden');
  });
}

setupMobileMenu('mobileMenuBtn','mobileMenu');
setupMobileMenu('mobileMenuBtn2','mobileMenu2');
setupMobileMenu('mobileMenuBtn3','mobileMenu3');
setupMobileMenu('mobileMenuBtn4','mobileMenu4');

// small helper to update cart count displayed in header
function updateCartCount(){
  const countEl = document.getElementById('cartCount');
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  if(countEl) countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
}
updateCartCount();

// expose for other scripts
window.app = window.app || {};
window.app.updateCartCount = updateCartCount;

// Mark the current page link inside any mobile menu (mobileMenu, mobileMenu2, ...) as active
function markActiveMobileNavLinks(){
  try{
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const menus = document.querySelectorAll('[id^="mobileMenu"]');
    menus.forEach(menu=>{
      const links = menu.querySelectorAll('a[href]');
      links.forEach(a=>{
        const href = a.getAttribute('href') || '';
        const page = href.split('/').pop().toLowerCase();
        a.classList.remove('active');
        if(page === current) a.classList.add('active');
      });
    });
  }catch(e){console.warn('markActiveMobileNavLinks failed', e)}
}

// Initialize media containers to use each media's intrinsic aspect ratio
function initMediaAspectRatios(){
  const containers = Array.from(document.querySelectorAll('.media-card'));
  let videosToLoad = 0;
  const tryArrange = () => {
    // once media ratios are set we can rearrange layout
    arrangeMediaLayout();
  };

  containers.forEach(container => {
    const vid = container.querySelector('video');
    const img = container.querySelector('img');

    if(vid){
      videosToLoad++;
      const setRatioFromVideo = () => {
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        if(w && h){
          container.style.setProperty('--ar', `${w}/${h}`);
        }
        videosToLoad--;
        if(videosToLoad<=0) tryArrange();
      };
      if(vid.readyState >= 1){
        setRatioFromVideo();
      } else {
        vid.addEventListener('loadedmetadata', setRatioFromVideo, {once:true});
      }
    } else if(img){
      if(img.naturalWidth && img.naturalHeight){
        container.style.setProperty('--ar', `${img.naturalWidth}/${img.naturalHeight}`);
      } else {
        img.addEventListener('load', ()=>{
          container.style.setProperty('--ar', `${img.naturalWidth}/${img.naturalHeight}`);
        }, {once:true});
      }
    }
  });
  // If there were no videos, arrange immediately
  if(videosToLoad===0) tryArrange();
}

// Build media cards from `window.mediaAssets` if present
function buildMediaCards(){
  if(!window.mediaAssets) return;
  const container = document.getElementById('topMediaGrid');
  if(!container) return;

  // helper to encode src safely
  const srcFor = (filename)=> 'assets/' + encodeURIComponent(filename).replace(/%20/g,' ');

  // create cards for all videos first (we will arrange them after metadata)
  window._mediaCards = [];
  (window.mediaAssets.videos || []).forEach((fname, idx)=>{
    const art = document.createElement('article');
    art.className = 'media-card shadow';
    art.dataset.src = fname;
    art.dataset.type = 'video';
    // store a title if provided mapping by index
    art.dataset.title = (window.mediaAssets.titles && window.mediaAssets.titles[idx]) || '';
    const v = document.createElement('video');
    v.setAttribute('playsinline','');
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.preload = 'metadata';
    const s = document.createElement('source');
    s.type = 'video/mp4';
    // use setAttribute to allow filenames with spaces/parentheses
    s.setAttribute('src', 'assets/' + fname);
    v.appendChild(s);
    art.appendChild(v);
    window._mediaCards.push(art);
  });

  // also add images if needed (kept as secondary content)
  (window.mediaAssets.images || []).forEach((fname)=>{
    const art = document.createElement('article');
    art.className = 'media-card shadow';
    art.dataset.src = fname;
    art.dataset.type = 'image';
    const img = document.createElement('img');
    img.setAttribute('src','assets/' + fname);
    img.setAttribute('alt','');
    art.appendChild(img);
    window._mediaCards.push(art);
  });

  // append all built cards into a hidden fragment (we'll rearrange them into the grid)
  const frag = document.createDocumentFragment();
  window._mediaCards.forEach(c=>frag.appendChild(c));
  // place temporarily into a hidden staging container
  const staging = document.createElement('div');
  staging.style.display='none';
  staging.id='mediaStaging';
  staging.appendChild(frag);
  document.body.appendChild(staging);
}

// Arrange media layout: place up to 3 portrait videos into top grid, and move the first landscape to full width below
function arrangeMediaLayout(){
  const allCards = window._mediaCards || Array.from(document.querySelectorAll('.media-card'));
  if(!allCards || allCards.length===0) return;
  const portraits = [];
  const landscapes = [];

  allCards.forEach(card=>{
    const v = card.querySelector('video');
    const img = card.querySelector('img');
    let w=0,h=1;
    if(v && v.videoWidth && v.videoHeight){ w=v.videoWidth; h=v.videoHeight; }
    else if(img && img.naturalWidth && img.naturalHeight){ w=img.naturalWidth; h=img.naturalHeight; }
    // fallback: check CSS --ar if set
    const ar = card.style.getPropertyValue('--ar');
    if(!w && ar){ const parts = ar.split('/'); if(parts.length===2){ w=parseFloat(parts[0]); h=parseFloat(parts[1]); }}
    if(w && h){
      if(w>=h) landscapes.push(card); else portraits.push(card);
    } else {
      // unknown assume portrait to favor tall cards
      portraits.push(card);
    }
  });

  const topGrid = document.getElementById('topMediaGrid');
  const pills = document.getElementById('mediaPills');
  const landscapeContainer = document.getElementById('landscapeContainer');
  if(!topGrid || !pills || !landscapeContainer) return;

  // Clear existing
  topGrid.innerHTML = '';
  pills.innerHTML = '';
  landscapeContainer.innerHTML = '';

  // Put first up to 3 portrait cards into top grid
  const chosenPortraits = portraits.slice(0,3);
  chosenPortraits.forEach((card, i)=>{
    // Wrap the card so the caption can match its width
    const wrap = document.createElement('div');
    wrap.className = 'media-card-wrap';
    // ensure card has no inline width styles that would prevent responsive sizing
    card.style.width = '100%';
  // determine title: prefer explicit positionTitles mapping, then dataset.title, otherwise derive from filename
  let title = (window.mediaAssets && window.mediaAssets.positionTitles && window.mediaAssets.positionTitles[i]) || card.dataset.title || (card.dataset.src||'').replace(/\.(mp4|jpg|jpeg|png)$/i,'');
    // heuristic: if title looks like long gibberish (no spaces, >30 chars), replace with friendly title
    if(typeof title === 'string' && (title.length>30 || /^[A-Za-z0-9_-]{20,}$/.test(title))){
      title = 'Hurricane Clip';
    }
    // Create caption element and append
    const caption = document.createElement('div');
    caption.className = 'media-caption';
    const a = document.createElement('a');
    a.className = 'pill-btn';
    a.href = '#';
    a.textContent = title;
    caption.appendChild(a);

    wrap.appendChild(card);
    wrap.appendChild(caption);
    topGrid.appendChild(wrap);
  });

  // If there are landscape cards, take the first and move it to the landscapeContainer full-width
  if(landscapes.length>0){
    const land = landscapes[0];
    // create wrapper to make it full-width and retain aspect ratio
    const wrapper = document.createElement('div');
    wrapper.style.width='100%';
    wrapper.style.marginTop='0';
    wrapper.appendChild(land);
    // remove any grid classes so it stretches
    land.classList.remove('shadow');
    // add a caption under the landscape video if requested
    const landTitle = (window.mediaAssets && window.mediaAssets.landscapeTitle) || (land.dataset && land.dataset.src) || '';
    if(landTitle){
      const capWrap = document.createElement('div');
      capWrap.className = 'media-caption landscape-caption';
      const a = document.createElement('a');
      a.className = 'pill-btn';
      a.href = '#';
      a.textContent = landTitle;
      capWrap.appendChild(a);
      wrapper.appendChild(capWrap);
    }
    landscapeContainer.appendChild(wrapper);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  // build media cards then initialize media aspect ratios on page load
  try{ buildMediaCards(); }catch(e){console.warn('buildMediaCards failed', e)}
  try{ initMediaAspectRatios(); }catch(e){console.warn('media ratio init failed', e)}
  try{ markActiveMobileNavLinks(); }catch(e){/* no-op */}
  try{ initLoadAnimations(); }catch(e){/* ignore if animation init fails */}
});

// Page load animations initializer: marks common elements with .will-animate and
// assigns staggered --delay CSS variables so they animate when body.loaded is added.
function initLoadAnimations(){
  // Ordered selectors to create a pleasing stagger
  const selectors = [
    'header .logo',
    'header .pill-btn',
    '.hero-top-logo',
    'main h1, main h2, main h3',
    '.hero-visual-column img',
    '.hero-prod-item',
    '.section-pill',
    '.product-card',
    '.media-card-wrap',
    '.two-col .left',
    '.two-col .right',
    '.max-w-5xl .left .p-3',
    '.max-w-5xl .right input, .max-w-5xl .right textarea',
    '.contact-actions .contact-btn',
    '.pill-btn',
    'footer.site-footer .footer-center img'
  ];

  const nodes = [];
  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=> nodes.push(el));
  });

  // remove duplicates while preserving order
  const seen = new Set();
  const uniq = nodes.filter(n=>{ if(seen.has(n)) return false; seen.add(n); return true });

  // Apply will-animate and compute stagger so the full sequence finishes ~1s
  const totalTime = 1.0; // seconds total desired for full sequence
  const animDuration = 0.6; // should match CSS duration for will-animate
  const count = uniq.length || 1;
  const maxDelay = Math.max(0, totalTime - animDuration);
  const step = count > 1 ? (maxDelay / (count - 1)) : 0;
  uniq.forEach((el, i)=>{
    try{
      el.classList.add('will-animate');
      if(el.matches && (el.matches('.product-card') || el.matches('.media-card-wrap') )) el.classList.add('card-pop');
      if(el.tagName === 'IMG' || (el.querySelector && el.querySelector('img'))) el.classList.add('img-pop');
      if(el.matches && el.matches('.pill-btn, .contact-actions .contact-btn')) el.classList.add('btn-pop');
      const delay = (i * step).toFixed(3) + 's';
      el.style.setProperty('--delay', delay);
    }catch(e){/* ignore individual failures */}
  });

  // After a short tick, add .loaded to body so transitions run
  window.requestAnimationFrame(()=>{
    setTimeout(()=> document.body.classList.add('loaded'), 80);
  });
}

// Animate nav items from the logo center outward into their natural positions.
function animateNavFromLogo(){
  try{
    // If user prefers reduced motion, skip
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Instead of clone animation, do a gentle fade-in from opacity/translate using will-animate
    const leftItems = Array.from(document.querySelectorAll('header .nav-left .pill-btn'));
    const rightItems = Array.from(document.querySelectorAll('header .nav-right .pill-btn'));
    const all = leftItems.concat(rightItems).filter(el=> el.offsetWidth && el.offsetHeight);
    if(all.length===0) return;

    // Apply will-animate and btn-pop and compute stagger so nav finishes near 1s
    const totalTime = 1.0; // seconds
    const animDuration = 0.6; // seconds (match CSS)
    const count = all.length || 1;
    const maxDelay = Math.max(0, totalTime - animDuration);
    const step = count > 1 ? (maxDelay / (count - 1)) : 0;
    all.forEach((el, i)=>{
      try{
        if(!el.classList.contains('will-animate')) el.classList.add('will-animate');
        if(!el.classList.contains('btn-pop')) el.classList.add('btn-pop');
        const delay = (i * step).toFixed(3) + 's';
        el.style.setProperty('--delay', delay);
        el.style.visibility = 'visible';
      }catch(e){}
    });

    // ensure body.loaded is present so the transitions run; if not, add it after a short pause
    if(!document.body.classList.contains('loaded')){
      setTimeout(()=> document.body.classList.add('loaded'), 160);
    }
  }catch(e){ console.warn('animateNavFromLogo failed', e) }
}

// call nav fade-in after DOMContentLoaded (post load animations)
document.addEventListener('DOMContentLoaded', ()=>{
  try{ setTimeout(animateNavFromLogo, 300); }catch(e){}
});

/* Admin modal: clicking the footer logo opens a login/admin panel to change prices and currency.
   Default admin password: 'admin' (client-side only). Settings stored in localStorage under 'site_admin'.
*/
function createAdminModal(){
  if(document.getElementById('adminModal')) return; // already created
  const modal = document.createElement('div');
  modal.id = 'adminModal';
  modal.className = 'admin-modal hidden';
  modal.innerHTML = `
    <div class="admin-panel">
      <h2>Admin Login</h2>
      <div id="adminLogin">
        <div class="admin-row">
          <label>Password</label>
          <input id="adminPassword" type="password" class="p-2 border rounded" />
        </div>
        <div class="admin-footer">
          <button id="adminCancel" class="px-3 py-2 rounded border">Cancel</button>
          <button id="adminLoginBtn" class="px-3 py-2 rounded bg-blue-600 text-white">Login</button>
        </div>
      </div>
      <div id="adminPanel" style="display:none">
        <h2>Admin Panel</h2>
        <div class="admin-row">
          <label>Currency</label>
          <select id="adminCurrency" class="p-2 border rounded"><option value="USD">USD ($)</option><option value="ZAR">ZAR (R)</option></select>
        </div>
        <div class="admin-row"><label>Products</label><div style="flex:1">Change prices below</div></div>
        <div class="admin-products" id="adminProducts"></div>
        <div class="admin-footer">
          <button id="adminLogout" class="px-3 py-2 rounded border">Logout</button>
          <button id="adminSave" class="px-3 py-2 rounded bg-green-600 text-white">Save changes</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // handlers
  const footerLogo = document.querySelector('footer .footer-center img');
  if(footerLogo){
    footerLogo.style.cursor = 'pointer';
    footerLogo.addEventListener('click', ()=>{
      modal.classList.remove('hidden');
      // default to login view
      document.getElementById('adminLogin').style.display='block';
      document.getElementById('adminPanel').style.display='none';
    });
  }

  document.getElementById('adminCancel').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('adminLoginBtn').addEventListener('click', ()=>{
    const pw = document.getElementById('adminPassword').value;
    if(pw === 'admin'){
      // show admin panel
      document.getElementById('adminLogin').style.display='none';
      document.getElementById('adminPanel').style.display='block';
      loadAdminSettingsIntoPanel();
    } else {
      alert('Incorrect password');
    }
  });

  document.getElementById('adminLogout').addEventListener('click', ()=>{
    modal.classList.add('hidden');
  });

  document.getElementById('adminSave').addEventListener('click', ()=>{
    saveAdminSettingsFromPanel();
    modal.classList.add('hidden');
    // notify store to re-render
    if(window.renderProducts) try{ window.renderProducts(); }catch(e){}
    if(window.renderCartItems) try{ window.renderCartItems(); }catch(e){}
    window.app.updateCartCount();
  });
}

function getAdminSettings(){
  try{ return JSON.parse(localStorage.getItem('site_admin')||'{}'); }catch(e){return {}}}

function saveAdminSettings(settings){ localStorage.setItem('site_admin', JSON.stringify(settings||{})); }

function loadAdminSettingsIntoPanel(){
  const s = getAdminSettings();
  document.getElementById('adminCurrency').value = s.currency || 'USD';
  const productsDiv = document.getElementById('adminProducts');
  productsDiv.innerHTML = '';
  // get products from PRODUCTS if available
  const products = window.PRODUCTS || [];
  products.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'admin-product';
    const price = (s.priceOverrides && s.priceOverrides[p.id])!=null ? s.priceOverrides[p.id] : p.price;
    row.innerHTML = `<div><strong>${p.title}</strong><div class="text-sm text-gray-600">${p.id}</div></div>
      <div style="display:flex;gap:.5rem;align-items:center"><input type="number" min="0" step="0.01" data-id="${p.id}" value="${price.toFixed(2)}" class="p-2 border rounded"/></div>`;
    productsDiv.appendChild(row);
  });
}

function saveAdminSettingsFromPanel(){
  const currency = document.getElementById('adminCurrency').value || 'USD';
  const productsDiv = document.getElementById('adminProducts');
  const inputs = productsDiv.querySelectorAll('input[data-id]');
  const overrides = {};
  inputs.forEach(inp=>{ const id = inp.getAttribute('data-id'); const v = parseFloat(inp.value||'0'); overrides[id]=v; });
  const settings = { currency, priceOverrides: overrides };
  saveAdminSettings(settings);
}

// create admin modal early
// admin modal removed on user request — footer logo no longer opens admin UI