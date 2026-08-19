(() => {
  const photos = Array.isArray(window.TENNIS_PHOTOS) ? window.TENNIS_PHOTOS : [];
  const dimensions = window.TENNIS_PHOTO_DIMENSIONS || {};
  const grid = document.querySelector('#contact-grid');
  if (!grid || !photos.length) return;

  grid.innerHTML = photos.map((photo, index) => {
    const fallback = photo.shape === 'landscape' ? [3, 2] : photo.shape === 'square' ? [1, 1] : [2, 3];
    const [width, height] = dimensions[photo.src] || fallback;

    return `
    <article class="photo-card ${photo.shape}">
      <button type="button" data-view-index="${index}" aria-label="Open ${photo.title}">
        <img src="${photo.src}" alt="${photo.alt}" width="${width}" height="${height}" style="object-position:${photo.position}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"${index === 0 ? ' fetchpriority="high"' : ''}>
      </button>
    </article>`;
  }).join('');

  if (!('HTMLDialogElement' in window)) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', 'Expanded photograph');
  dialog.innerHTML = `
    <button class="viewer-close" type="button" aria-label="Close photograph">×</button>
    <button class="viewer-prev" type="button" aria-label="Previous photograph">←</button>
    <button class="viewer-next" type="button" aria-label="Next photograph">→</button>
    <div class="viewer-inner">
      <img alt="">
    </div>`;
  document.body.append(dialog);

  const image = dialog.querySelector('img');
  let active = 0;

  const show = (index) => {
    active = (index + photos.length) % photos.length;
    const photo = photos[active];
    image.src = photo.src;
    image.alt = photo.alt;
  };

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-view-index]');
    if (!trigger) return;
    show(Number(trigger.dataset.viewIndex));
    dialog.showModal();
  });

  dialog.querySelector('.viewer-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.viewer-prev').addEventListener('click', () => show(active - 1));
  dialog.querySelector('.viewer-next').addEventListener('click', () => show(active + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(active - 1);
    if (event.key === 'ArrowRight') show(active + 1);
  });
})();
