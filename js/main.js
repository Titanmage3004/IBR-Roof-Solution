function setupMobileMenu(btnId, menuId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
}

setupMobileMenu('mobileMenuBtn', 'mobileMenu');
setupMobileMenu('mobileMenuBtn2', 'mobileMenu2');
setupMobileMenu('mobileMenuBtn3', 'mobileMenu3');
setupMobileMenu('mobileMenuBtn4', 'mobileMenu4');
function updateCartCount() {
  const countEl = document.getElementById('cartCount');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
}
updateCartCount();
window.app = window.app || {};
window.app.updateCartCount = updateCartCount;
function markActiveMobileNavLinks() {
  try {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const menus = document.querySelectorAll('[id^="mobileMenu"]');
    menus.forEach((menu) => {
      const links = menu.querySelectorAll('a[href]');
      links.forEach((a) => {
        const href = a.getAttribute('href') || '';
        const page = href.split('/').pop().toLowerCase();
        a.classList.remove('active');
        if (page === current) a.classList.add('active');
      });
    });
  } catch (e) {
    console.warn('markActiveMobileNavLinks failed', e);
  }
}
function initMediaAspectRatios() {
  const containers = Array.from(document.querySelectorAll('.media-card'));
  let videosToLoad = 0;
  const tryArrange = () => {
    arrangeMediaLayout();
  };

  containers.forEach((container) => {
    const vid = container.querySelector('video');
    const img = container.querySelector('img');

    if (vid) {
      videosToLoad++;
      const setRatioFromVideo = () => {
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        if (w && h) {
          container.style.setProperty('--ar', `${w}/${h}`);
        }
        videosToLoad--;
        if (videosToLoad <= 0) tryArrange();
      };
      if (vid.readyState >= 1) {
        setRatioFromVideo();
      } else {
        vid.addEventListener('loadedmetadata', setRatioFromVideo, { once: true });
      }
    } else if (img) {
      if (img.naturalWidth && img.naturalHeight) {
        container.style.setProperty('--ar', `${img.naturalWidth}/${img.naturalHeight}`);
      } else {
        img.addEventListener(
          'load',
          () => {
            container.style.setProperty('--ar', `${img.naturalWidth}/${img.naturalHeight}`);
          },
          { once: true }
        );
      }
    }
  });
  if (videosToLoad === 0) tryArrange();
}
function buildMediaCards() {
  if (!window.mediaAssets) return;
  const container = document.getElementById('topMediaGrid');
  if (!container) return;
  // helper to build media staging; file paths are created inline where needed
  window._mediaCards = [];
  (window.mediaAssets.videos || []).forEach((fname, idx) => {
    const art = document.createElement('article');
    art.className = 'media-card shadow';
    art.dataset.src = fname;
    art.dataset.type = 'video';
    art.dataset.title = (window.mediaAssets.titles && window.mediaAssets.titles[idx]) || '';
    const v = document.createElement('video');
    v.setAttribute('playsinline', '');
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
  (window.mediaAssets.images || []).forEach((fname, idx) => {
    const art = document.createElement('article');
    art.className = 'media-card shadow';
    art.dataset.src = fname;
    art.dataset.type = 'image';
    const img = document.createElement('img');
    img.setAttribute('src', 'assets/' + fname);
    // Derive a helpful alt text for accessibility: prefer explicit titles when available,
    // fall back to a humanized filename.
    const titleFromTitles = (window.mediaAssets && window.mediaAssets.titles && window.mediaAssets.titles[idx]) || null;
    const titleFromPosition = (window.mediaAssets && window.mediaAssets.positionTitles && window.mediaAssets.positionTitles[idx]) || null;
    const fallback = fname.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
    img.setAttribute('alt', titleFromPosition || titleFromTitles || fallback);
    art.appendChild(img);
    window._mediaCards.push(art);
  });
  const frag = document.createDocumentFragment();
  window._mediaCards.forEach((c) => frag.appendChild(c));
  const staging = document.createElement('div');
  staging.style.display = 'none';
  staging.id = 'mediaStaging';
  staging.appendChild(frag);
  document.body.appendChild(staging);
}
function arrangeMediaLayout() {
  const allCards = window._mediaCards || Array.from(document.querySelectorAll('.media-card'));
  if (!allCards || allCards.length === 0) return;
  const portraits = [];
  const landscapes = [];

  allCards.forEach((card) => {
    const v = card.querySelector('video');
    const img = card.querySelector('img');
    let w = 0,
      h = 1;
    if (v && v.videoWidth && v.videoHeight) {
      w = v.videoWidth;
      h = v.videoHeight;
    } else if (img && img.naturalWidth && img.naturalHeight) {
      w = img.naturalWidth;
      h = img.naturalHeight;
    }
    const ar = card.style.getPropertyValue('--ar');
    if (!w && ar) {
      const parts = ar.split('/');
      if (parts.length === 2) {
        w = parseFloat(parts[0]);
        h = parseFloat(parts[1]);
      }
    }
    if (w && h) {
      if (w >= h) landscapes.push(card);
      else portraits.push(card);
    } else {
      portraits.push(card);
    }
  });

  const topGrid = document.getElementById('topMediaGrid');
  const pills = document.getElementById('mediaPills');
  const landscapeContainer = document.getElementById('landscapeContainer');
  if (!topGrid || !pills || !landscapeContainer) return;
  // clear containers safely
  while (topGrid.firstChild) topGrid.removeChild(topGrid.firstChild);
  while (pills.firstChild) pills.removeChild(pills.firstChild);
  while (landscapeContainer.firstChild)
    landscapeContainer.removeChild(landscapeContainer.firstChild);
  const chosenPortraits = portraits.slice(0, 3);
  chosenPortraits.forEach((card, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'media-card-wrap';
    card.style.width = '100%';
    let title =
      (window.mediaAssets &&
        window.mediaAssets.positionTitles &&
        window.mediaAssets.positionTitles[i]) ||
      card.dataset.title ||
      (card.dataset.src || '').replace(/\.(mp4|jpg|jpeg|png)$/i, '');
    if (typeof title === 'string' && (title.length > 30 || /^[A-Za-z0-9_-]{20,}$/.test(title))) {
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
  if (landscapes.length > 0) {
    const land = landscapes[0];
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.marginTop = '0';
    wrapper.appendChild(land);
    land.classList.remove('shadow');
    const landTitle =
      (window.mediaAssets && window.mediaAssets.landscapeTitle) ||
      (land.dataset && land.dataset.src) ||
      '';
    if (landTitle) {
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

document.addEventListener('DOMContentLoaded', () => {
  try {
    buildMediaCards();
  } catch (e) {
    console.warn('buildMediaCards failed', e);
  }
  try {
    initMediaAspectRatios();
  } catch (e) {
    console.warn('media ratio init failed', e);
  }
  try {
    markActiveMobileNavLinks();
  } catch (e) {
    console.warn('markActiveMobileNavLinks failed', e);
  }
  // Background transform-based parallax removed; using CSS `background-attachment: fixed` instead for a fixed scroll effect on desktop.
});
