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
function updateCartCount(){
  const countEl = document.getElementById('cartCount');
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  if(countEl) countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
}
updateCartCount();
window.app = window.app || {};
window.app.updateCartCount = updateCartCount;
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
function initMediaAspectRatios(){
  const containers = Array.from(document.querySelectorAll('.media-card'));
  let videosToLoad = 0;
  const tryArrange = () => {
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
  if(videosToLoad===0) tryArrange();
}
function buildMediaCards(){
  if(!window.mediaAssets) return;
  const container = document.getElementById('topMediaGrid');
  if(!container) return;
  const srcFor = (filename)=> 'assets/' + encodeURIComponent(filename).replace(/%20/g,' ');
  window._mediaCards = [];
  (window.mediaAssets.videos || []).forEach((fname, idx)=>{
    const art = document.createElement('article');
    art.className = 'media-card shadow';
    art.dataset.src = fname;
    art.dataset.type = 'video';
    art.dataset.title = (window.mediaAssets.titles && window.mediaAssets.titles[idx]) || '';
    const v = document.createElement('video');
    v.setAttribute('playsinline','');
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.preload = 'metadata';
    const s = document.createElement('source');
    s.type = 'video/mp4';
    s.setAttribute('src', 'assets/' + fname);
    v.appendChild(s);
    art.appendChild(v);
    window._mediaCards.push(art);
  });
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
  const frag = document.createDocumentFragment();
  window._mediaCards.forEach(c=>frag.appendChild(c));
  const staging = document.createElement('div');
  staging.style.display='none';
  staging.id='mediaStaging';
  staging.appendChild(frag);
  document.body.appendChild(staging);
}
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
    const ar = card.style.getPropertyValue('--ar');
    if(!w && ar){ const parts = ar.split('/'); if(parts.length===2){ w=parseFloat(parts[0]); h=parseFloat(parts[1]); }}
    if(w && h){
      if(w>=h) landscapes.push(card); else portraits.push(card);
    } else {
      portraits.push(card);
    }
  });

  const topGrid = document.getElementById('topMediaGrid');
  const pills = document.getElementById('mediaPills');
  const landscapeContainer = document.getElementById('landscapeContainer');
  if(!topGrid || !pills || !landscapeContainer) return;
  topGrid.innerHTML = '';
  pills.innerHTML = '';
  landscapeContainer.innerHTML = '';
  const chosenPortraits = portraits.slice(0,3);
  chosenPortraits.forEach((card, i)=>{
    const wrap = document.createElement('div');
    wrap.className = 'media-card-wrap';
    card.style.width = '100%';
  let title = (window.mediaAssets && window.mediaAssets.positionTitles && window.mediaAssets.positionTitles[i]) || card.dataset.title || (card.dataset.src||'').replace(/\.(mp4|jpg|jpeg|png)$/i,'');
    if(typeof title === 'string' && (title.length>30 || /^[A-Za-z0-9_-]{20,}$/.test(title))){
      title = 'Hurricane Clip';
    }
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
  if(landscapes.length>0){
    const land = landscapes[0];
    const wrapper = document.createElement('div');
    wrapper.style.width='100%';
    wrapper.style.marginTop='0';
    wrapper.appendChild(land);
    land.classList.remove('shadow');
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
  try{ buildMediaCards(); }catch(e){console.warn('buildMediaCards failed', e)}
  try{ initMediaAspectRatios(); }catch(e){console.warn('media ratio init failed', e)}
  try{ markActiveMobileNavLinks(); }catch(e){}
});

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
  const footerLogo = document.querySelector('footer .footer-center img');
  if(footerLogo){
    footerLogo.style.cursor = 'pointer';
    footerLogo.addEventListener('click', ()=>{
      modal.classList.remove('hidden');
      document.getElementById('adminLogin').style.display='block';
      document.getElementById('adminPanel').style.display='none';
    });
  }

  document.getElementById('adminCancel').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('adminLoginBtn').addEventListener('click', ()=>{
    const pw = document.getElementById('adminPassword').value;
    if(pw === 'admin'){
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
// admin modal removed on user request — footer logo no longer opens admin UI