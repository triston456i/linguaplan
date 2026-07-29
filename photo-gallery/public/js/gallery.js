(function () {
  const breadcrumbEl = document.getElementById('breadcrumb');
  const foldersEl = document.getElementById('folders');
  const gridEl = document.getElementById('grid');
  const emptyEl = document.getElementById('empty');
  const logoutBtn = document.getElementById('logoutBtn');

  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbVideo = document.getElementById('lbVideo');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  const selectionBar = document.getElementById('selectionBar');
  const selectionCountEl = document.getElementById('selectionCount');
  const selectionCancelBtn = document.getElementById('selectionCancelBtn');
  const selectionDownloadBtn = document.getElementById('selectionDownloadBtn');

  let currentItems = [];
  let currentPath = '';
  let lightboxIndex = -1;
  const selected = new Set();

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

  function renderItems(items, relPath) {
    gridEl.innerHTML = '';
    selected.clear();
    updateSelectionBar();
    currentItems = items.map((item) => ({ ...item, path: joinPath(relPath, item.name) }));

    currentItems.forEach((item, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = '/api/thumbnail?path=' + encodeURIComponent(item.path);
      img.alt = item.name;
      thumb.appendChild(img);

      if (item.type === 'video') {
        const playIcon = document.createElement('span');
        playIcon.className = 'play-icon';
        playIcon.textContent = '▶';
        thumb.appendChild(playIcon);
      }

      const selectToggle = document.createElement('button');
      selectToggle.type = 'button';
      selectToggle.className = 'select-toggle';
      selectToggle.setAttribute('aria-label', 'Select ' + item.name);
      selectToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSelect(item.path, thumb);
      });
      thumb.appendChild(selectToggle);

      thumb.addEventListener('click', () => openLightbox(index));
      gridEl.appendChild(thumb);
    });
  }

  function toggleSelect(itemPath, thumbEl) {
    if (selected.has(itemPath)) {
      selected.delete(itemPath);
      thumbEl.classList.remove('selected');
    } else {
      selected.add(itemPath);
      thumbEl.classList.add('selected');
    }
    updateSelectionBar();
  }

  function updateSelectionBar() {
    const count = selected.size;
    selectionBar.hidden = count === 0;
    selectionCountEl.textContent = count === 1 ? '1 item selected' : `${count} items selected`;
  }

  function clearSelection() {
    selected.clear();
    gridEl.querySelectorAll('.thumb.selected').forEach((el) => el.classList.remove('selected'));
    updateSelectionBar();
  }

  async function downloadSelection() {
    const paths = Array.from(selected);
    if (paths.length === 0) return;

    if (paths.length === 1) {
      window.location.href = '/api/download?path=' + encodeURIComponent(paths[0]);
      return;
    }

    const res = await fetch('/api/download-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });

    if (!res.ok) {
      alert('Download failed. Please try again.');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photos.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  selectionCancelBtn.addEventListener('click', clearSelection);
  selectionDownloadBtn.addEventListener('click', downloadSelection);

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
    renderItems(data.items, relPath);
    emptyEl.hidden = data.items.length > 0;
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
    updateLightboxMedia();
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImage.src = '';
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    lbVideo.load();
  }

  function updateLightboxMedia() {
    const item = currentItems[lightboxIndex];
    if (!item) return;

    if (item.type === 'video') {
      lbImage.style.display = 'none';
      lbImage.src = '';
      lbVideo.style.display = 'block';
      lbVideo.src = '/api/media?path=' + encodeURIComponent(item.path);
      lbVideo.load();
    } else {
      lbVideo.pause();
      lbVideo.style.display = 'none';
      lbVideo.removeAttribute('src');
      lbImage.style.display = 'block';
      lbImage.src = '/api/media?path=' + encodeURIComponent(item.path);
    }
  }

  function showPrev() {
    if (currentItems.length === 0) return;
    lightboxIndex = (lightboxIndex - 1 + currentItems.length) % currentItems.length;
    updateLightboxMedia();
  }

  function showNext() {
    if (currentItems.length === 0) return;
    lightboxIndex = (lightboxIndex + 1) % currentItems.length;
    updateLightboxMedia();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', showPrev);
  lbNext.addEventListener('click', showNext);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (e.target === lbVideo) return;
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
