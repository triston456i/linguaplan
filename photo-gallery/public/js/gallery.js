(function () {
  const breadcrumbEl = document.getElementById('breadcrumb');
  const foldersEl = document.getElementById('folders');
  const gridEl = document.getElementById('grid');
  const emptyEl = document.getElementById('empty');
  const logoutBtn = document.getElementById('logoutBtn');

  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  let currentPhotos = [];
  let currentPath = '';
  let lightboxIndex = -1;

  function pathFromLocation() {
    const params = new URLSearchParams(window.location.search);
    return params.get('path') || '';
  }

  function joinPath(base, name) {
    return base ? `${base}/${name}` : name;
  }

  function renderBreadcrumb(relPath) {
    breadcrumbEl.innerHTML = '';
    const rootBtn = document.createElement('button');
    rootBtn.textContent = 'Home';
    rootBtn.addEventListener('click', () => navigate(''));
    breadcrumbEl.appendChild(rootBtn);

    if (!relPath) return;

    const parts = relPath.split('/').filter(Boolean);
    let acc = '';
    parts.forEach((part) => {
      acc = acc ? `${acc}/${part}` : part;
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      breadcrumbEl.appendChild(sep);

      const btn = document.createElement('button');
      btn.textContent = part;
      const target = acc;
      btn.addEventListener('click', () => navigate(target));
      breadcrumbEl.appendChild(btn);
    });
  }

  function renderFolders(folders, relPath) {
    foldersEl.innerHTML = '';
    folders.forEach((name) => {
      const card = document.createElement('div');
      card.className = 'folder-card';
      card.textContent = '📁 ' + name;
      card.addEventListener('click', () => navigate(joinPath(relPath, name)));
      foldersEl.appendChild(card);
    });
  }

  function renderPhotos(photos, relPath) {
    gridEl.innerHTML = '';
    currentPhotos = photos.map((name) => joinPath(relPath, name));

    photos.forEach((name, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = '/api/thumbnail?path=' + encodeURIComponent(joinPath(relPath, name));
      img.alt = name;
      thumb.appendChild(img);
      thumb.addEventListener('click', () => openLightbox(index));
      gridEl.appendChild(thumb);
    });
  }

  async function load(relPath) {
    currentPath = relPath;
    renderBreadcrumb(relPath);

    const res = await fetch('/api/browse?path=' + encodeURIComponent(relPath));
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (!res.ok) {
      emptyEl.hidden = false;
      emptyEl.textContent = 'Could not load this folder.';
      foldersEl.innerHTML = '';
      gridEl.innerHTML = '';
      return;
    }

    const data = await res.json();
    renderFolders(data.folders, relPath);
    renderPhotos(data.photos, relPath);
    emptyEl.hidden = data.photos.length > 0;
  }

  function navigate(relPath, replace) {
    const url = relPath ? `/?path=${encodeURIComponent(relPath)}` : '/';
    if (replace) {
      history.replaceState({ path: relPath }, '', url);
    } else {
      history.pushState({ path: relPath }, '', url);
    }
    load(relPath);
  }

  function openLightbox(index) {
    lightboxIndex = index;
    updateLightboxImage();
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImage.src = '';
  }

  function updateLightboxImage() {
    const filePath = currentPhotos[lightboxIndex];
    if (!filePath) return;
    lbImage.src = '/api/photo?path=' + encodeURIComponent(filePath);
  }

  function showPrev() {
    if (currentPhotos.length === 0) return;
    lightboxIndex = (lightboxIndex - 1 + currentPhotos.length) % currentPhotos.length;
    updateLightboxImage();
  }

  function showNext() {
    if (currentPhotos.length === 0) return;
    lightboxIndex = (lightboxIndex + 1) % currentPhotos.length;
    updateLightboxImage();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', showPrev);
  lbNext.addEventListener('click', showNext);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  window.addEventListener('popstate', (e) => {
    const relPath = (e.state && e.state.path) || pathFromLocation();
    load(relPath);
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  navigate(pathFromLocation(), true);
})();
