(() => {
  const photos = Array.isArray(window.TENNIS_PHOTOS) ? window.TENNIS_PHOTOS : [];
  const dimensions = window.TENNIS_PHOTO_DIMENSIONS || {};
  const grid = document.querySelector('#contact-grid');
  if (!grid || !photos.length) return;

  const entries = photos.map((photo, index) => {
    const fallback = photo.shape === 'landscape' ? [3, 2] : photo.shape === 'square' ? [1, 1] : [2, 3];
    const [width, height] = dimensions[photo.src] || fallback;

    return { photo, index, width, height };
  });

  const cardMarkup = ({ entry, displayWidth }) => `
    <article class="photo-card ${entry.photo.shape}" data-category="${entry.photo.primaryTag}" style="width:${displayWidth}px">
      <button type="button" data-view-index="${entry.index}" aria-label="Open ${entry.photo.title}">
        <img src="${entry.photo.src}" alt="${entry.photo.alt}" width="${entry.width}" height="${entry.height}" style="object-position:${entry.photo.position}" loading="${entry.index === 0 ? 'eager' : 'lazy'}" decoding="async"${entry.index === 0 ? ' fetchpriority="high"' : ''}>
      </button>
    </article>`;

  const partitionRows = (ordered, availableWidth, targetHeight, gap) => {
    const count = ordered.length;
    const aspectPrefix = [0];
    ordered.forEach((entry) => aspectPrefix.push(aspectPrefix.at(-1) + entry.width / entry.height));
    const costs = Array(count + 1).fill(Infinity);
    const previous = Array(count + 1).fill(-1);
    costs[0] = 0;

    for (let end = 1; end <= count; end += 1) {
      for (let length = 1; length <= Math.min(10, end); length += 1) {
        const start = end - length;
        const aspectSum = aspectPrefix[end] - aspectPrefix[start];
        const rowHeight = (availableWidth - gap * (length - 1)) / aspectSum;
        const deviation = (rowHeight - targetHeight) / targetHeight;
        const extremePenalty = rowHeight < targetHeight * .62 || rowHeight > targetHeight * 1.55 ? 20 : 0;
        const cost = costs[start] + deviation * deviation + extremePenalty;

        if (cost < costs[end]) {
          costs[end] = cost;
          previous[end] = start;
        }
      }
    }

    const lengths = [];
    for (let end = count; end > 0; end = previous[end]) lengths.unshift(end - previous[end]);
    return lengths;
  };

  const layoutRows = (ordered, lengths, availableWidth, gap) => {
    const rows = [];
    const positions = [];
    let offset = 0;
    let top = 0;

    lengths.forEach((length, rowIndex) => {
      const rowEntries = ordered.slice(offset, offset + length);
      const aspectSum = rowEntries.reduce((sum, entry) => sum + entry.width / entry.height, 0);
      const height = (availableWidth - gap * (length - 1)) / aspectSum;
      let left = 0;
      const items = rowEntries.map((entry, itemIndex) => {
        const displayWidth = itemIndex === length - 1 ? availableWidth - left : height * entry.width / entry.height;
        const position = { entry, displayWidth, left, right: left + displayWidth, top, bottom: top + height, rowIndex, orderIndex: offset + itemIndex };
        positions.push(position);
        left += displayWidth + gap;
        return position;
      });

      rows.push({ height, items });
      offset += length;
      top += height + gap;
    });

    return { rows, positions };
  };

  const categoryCollisions = (layout) => {
    const collisions = [];

    layout.rows.forEach((row) => {
      for (let index = 1; index < row.items.length; index += 1) {
        if (row.items[index].entry.photo.primaryTag === row.items[index - 1].entry.photo.primaryTag) {
          collisions.push([row.items[index - 1].orderIndex, row.items[index].orderIndex]);
        }
      }
    });

    for (let rowIndex = 1; rowIndex < layout.rows.length; rowIndex += 1) {
      const previousRow = layout.rows[rowIndex - 1];
      const currentRow = layout.rows[rowIndex];
      previousRow.items.forEach((above) => {
        currentRow.items.forEach((below) => {
          const horizontalOverlap = Math.min(above.right, below.right) - Math.max(above.left, below.left);
          if (horizontalOverlap > 1 && above.entry.photo.primaryTag === below.entry.photo.primaryTag) {
            collisions.push([above.orderIndex, below.orderIndex]);
          }
        });
      });
    }

    return collisions;
  };

  const separateCategories = (initialOrder, lengths, availableWidth, gap) => {
    const ordered = [...initialOrder];

    for (let pass = 0; pass < 80; pass += 1) {
      const layout = layoutRows(ordered, lengths, availableWidth, gap);
      const collisions = categoryCollisions(layout);
      if (!collisions.length) return layout;

      const [first, second] = collisions[0];
      let bestSwap = null;
      let bestCount = collisions.length;
      let bestAspectDifference = Infinity;

      for (const sourceIndex of [first, second]) {
        for (let targetIndex = 0; targetIndex < ordered.length; targetIndex += 1) {
          if (targetIndex === sourceIndex) continue;
          [ordered[sourceIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[sourceIndex]];
          const nextCount = categoryCollisions(layoutRows(ordered, lengths, availableWidth, gap)).length;
          const sourceAspect = ordered[targetIndex].width / ordered[targetIndex].height;
          const targetAspect = ordered[sourceIndex].width / ordered[sourceIndex].height;
          const aspectDifference = Math.abs(Math.log(sourceAspect / targetAspect));
          [ordered[sourceIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[sourceIndex]];

          if (nextCount < bestCount || (nextCount === bestCount && aspectDifference < bestAspectDifference)) {
            bestSwap = [sourceIndex, targetIndex];
            bestCount = nextCount;
            bestAspectDifference = aspectDifference;
          }
        }
      }

      if (!bestSwap || bestCount >= collisions.length) break;
      [ordered[bestSwap[0]], ordered[bestSwap[1]]] = [ordered[bestSwap[1]], ordered[bestSwap[0]]];
    }

    return layoutRows(ordered, lengths, availableWidth, gap);
  };

  const renderGallery = () => {
    const gap = 7;
    const availableWidth = grid.clientWidth;
    const targetHeight = availableWidth / (window.innerWidth <= 560 ? 3 : window.innerWidth <= 900 ? 4 : 6);
    const lengths = partitionRows(entries, availableWidth, targetHeight, gap);
    const layout = separateCategories(entries, lengths, availableWidth, gap);

    grid.innerHTML = layout.rows
      .map((row) => `<div class="photo-row" style="height:${row.height}px">${row.items.map(cardMarkup).join('')}</div>`)
      .join('');
  };

  renderGallery();

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderGallery, 150);
  });

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
