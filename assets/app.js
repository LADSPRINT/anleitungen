const state = {
  manuals: [],
  filteredManuals: [],
  activeVideoTrigger: null,
};

const DEFAULT_MANUALS = [
  {
    name: 'Drehbares Rad V2.0',
    pdfFileName: '006_B__DH2.0__Gebrauchsanleitung__26__03__11__V02',
    imageFileName: '006_B__DH2.0__Gebrauchsanleitung__25__01__11__V01',
  },
  {
    name: 'Schlauchadapter',
    pdfFileName: '002_EF__12z__V03__Gebrauchsanleitung__26__03__11___V03',
    imageFileName: '002_EF__12z__V03__Gebrauchsanleitung__25__05__25___V02',
  },
  {
    name: 'Getränkehalter',
    pdfFileName: '005_A__T4__Gebrauchsanleitung__26_03_11__V02',
    imageFileName: '005_A__T4__Gebrauchsanleitung__24_09_22__V01',
  },
  {
    name: 'Griffe Monsieur',
    pdfFileName: '019_A__CC__Gebrauchsanweisung__26_03_11__V03',
    imageFileName: '019_A__CC__Gebrauchsanweisung__04_12_01__V02',
  },
  {
    name: 'Kippscheren',
    pdfFileName: '023_A__41A__Gebrauchsanleitung__26_03_11__V02',
    imageFileName: '023_A__41A__V01__Gebrauchsanleitung__24_10_28__V01',
  },
  {
    name: 'Laubschutzgitter',
    pdfFileName: '027_A__T4__Laubschutzgitter__Gebrauchsanleitung__V02',
    imageFileName: '027_A__T4__Laubschutzgitter__Gebrauchsanleitung__V01',
  },
  {
    name: 'Saugrüssel',
    pdfFileName: '032_A__Saug_PBD40__Gebrauchsanleitung__V02',
    imageFileName: '032_A__Saug_PBD40__Gebrauchsanleitung__V01',
  },
  {
    name: 'Spikes, alle Varianten',
    pdfFileName: 'Spikes_Montage_Betriebsanleitung__26_03_11__V04',
    imageFileName: 'Spikes_Montage_Betriebsanleitung__25_04_06__V03',
    video: 'https://www.youtube.com/embed/IlAO6DtBMdc?si=sLlY_Ztoa5T7E-OQ',
    videoTitle: 'Video ansehen',
  },
  {
    name: 'Stiftehalter Explore',
    pdfFileName: '025_A__Explore__Gebrauchsanweisung__V03',
    imageFileName: '025_A__Explore__Gebrauchsanweisung__V02',
  },
  {
    name: 'Stiftehalter Joy',
    pdfFileName: '025_B__Joy__Gebrauchsanleitung__26_03_11__V02',
    imageFileName: '025_B__Joy__Gebrauchsanleitung__24_10_28__V01',
  },
  {
    name: 'Wandhalterung GSR',
    pdfFileName: '035_B__GSR__Gebrauchsanleitung__26_03_11__V03',
    imageFileName: '035_B__GSR__V01__Gebrauchsanleitung__24__12__30__V02',
  },
  {
    name: 'Wandhalterung GWS',
    pdfFileName: '036_B__GWS_Kantteil__Gebrauchsanleitung__26_03_11__V02',
    imageFileName: '036_B__GWS_Kantteil__Gebrauchsanleitung__25__05__20__V01',
  },
];

const dom = {
  articleGrid: document.querySelector('[data-manual-grid]'),
  resultCount: document.querySelector('[data-result-count]'),
  emptyState: document.querySelector('[data-empty-state]'),
  searchInput: document.querySelector('[data-search-input]'),
  sortSelect: document.querySelector('[data-sort-select]'),
  videoModal: document.querySelector('[data-video-modal]'),
  videoDialog: document.querySelector('[data-video-dialog]'),
  videoFrame: document.querySelector('[data-video-iframe]'),
  videoPlayer: document.querySelector('[data-video-player]'),
  videoClose: document.querySelector('[data-video-close]'),
};

document.addEventListener('DOMContentLoaded', () => {
  if (dom.articleGrid) {
    initManualsPage();
  }

  initVideoModal();
});

async function initManualsPage() {
  bindControls();

  try {
    const response = await fetch('data/anleitungen.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const manuals = normalizeManuals(await response.json());

    state.manuals = manuals;
    updateManualView();
  } catch (error) {
    state.manuals = normalizeManuals(DEFAULT_MANUALS);

    if (state.manuals.length > 0) {
      updateManualView();
      return;
    }

    showLoadError();
    console.error('Anleitungen konnten nicht geladen werden.', error);
  }
}

function bindControls() {
  dom.searchInput?.addEventListener('input', updateManualView);
  dom.sortSelect?.addEventListener('change', updateManualView);
}

function updateManualView() {
  const query = (dom.searchInput?.value || '').trim().toLowerCase();
  const sortMode = dom.sortSelect?.value || 'name-asc';

  const filtered = state.manuals.filter((manual) => {
    const haystack = [manual.name, manual.pdfFileName, manual.imageFileName, manual.videoTitle]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });

  filtered.sort((left, right) => compareManuals(left, right, sortMode));
  state.filteredManuals = filtered;
  renderManuals(filtered);
}

function compareManuals(left, right, sortMode) {
  if (sortMode === 'name-desc') {
    return right.name.localeCompare(left.name, 'de');
  }

  if (sortMode === 'video-first') {
    if (Boolean(left.video) !== Boolean(right.video)) {
      return left.video ? -1 : 1;
    }
  }

  return left.name.localeCompare(right.name, 'de');
}

function renderManuals(manuals) {
  if (!dom.articleGrid || !dom.resultCount || !dom.emptyState) {
    return;
  }

  dom.articleGrid.innerHTML = '';
  dom.resultCount.textContent = `${manuals.length} Anleitung${manuals.length === 1 ? '' : 'en'} gefunden`;
  dom.emptyState.hidden = manuals.length > 0;

  const fragment = document.createDocumentFragment();

  manuals.forEach((manual) => {
    fragment.appendChild(createManualCard(manual));
  });

  dom.articleGrid.appendChild(fragment);
}

function createManualCard(manual) {
  const article = document.createElement('article');
  article.className = 'manual-card';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'manual-card-media';

  const image = document.createElement('img');
  image.src = `bilder/${manual.imageFileName}.jpg`;
  image.alt = manual.name;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    imageWrapper.classList.add('is-fallback');
  });

  const fallback = document.createElement('div');
  fallback.className = 'manual-card-fallback';
  fallback.textContent = 'Kein Vorschaubild verfügbar';

  imageWrapper.append(image, fallback);

  const body = document.createElement('div');
  body.className = 'manual-card-body';

  const title = document.createElement('h2');
  title.className = 'manual-card-title';
  title.textContent = manual.name;

  const meta = document.createElement('div');
  meta.className = 'manual-card-meta';

  const pdfBadge = document.createElement('span');
  pdfBadge.className = 'badge';
  pdfBadge.textContent = 'PDF';
  meta.appendChild(pdfBadge);

  const videoBadge = document.createElement('span');
  videoBadge.className = `badge${manual.video ? '' : ' is-muted'}`;
  videoBadge.textContent = manual.video ? 'Mit Video' : 'Ohne Video';
  meta.appendChild(videoBadge);

  const actions = document.createElement('div');
  actions.className = 'manual-card-actions';

  const pdfLink = document.createElement('a');
  pdfLink.className = 'btn';
  pdfLink.href = `pdfs/${manual.pdfFileName}.pdf`;
  pdfLink.target = '_blank';
  pdfLink.rel = 'noopener noreferrer';
  pdfLink.textContent = 'PDF öffnen';
  actions.appendChild(pdfLink);

  if (manual.video) {
    const videoButton = document.createElement('button');
    videoButton.type = 'button';
    videoButton.className = 'btn is-secondary';
    videoButton.textContent = manual.videoTitle || 'Video ansehen';

    if (isYouTubeUrl(manual.video)) {
      videoButton.addEventListener('click', () => openExternalVideo(manual.video));
    } else {
      videoButton.addEventListener('click', () => openVideoModal(manual.video, videoButton));
    }

    actions.appendChild(videoButton);
  }

  body.append(title, meta, actions);
  article.append(imageWrapper, body);
  return article;
}

function isYouTubeUrl(source) {
  return source.includes('youtube.com/') || source.includes('youtu.be/');
}

function openExternalVideo(source) {
  const targetUrl = getYouTubeWatchUrl(source);
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

function getYouTubeWatchUrl(source) {
  try {
    const url = new URL(source);

    if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace(/^\//, '').trim();

      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    if (url.pathname.includes('/embed/')) {
      const parts = url.pathname.split('/embed/');
      const videoId = (parts[1] || '').split('/')[0].trim();

      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
      return `https://www.youtube.com/watch?v=${url.searchParams.get('v')}`;
    }
  } catch (error) {
    console.error('YouTube-Link konnte nicht normalisiert werden.', error);
  }

  return source;
}

function showLoadError() {
  if (!dom.resultCount || !dom.emptyState) {
    return;
  }

  dom.resultCount.textContent = '0 Anleitungen gefunden';
  dom.emptyState.hidden = false;
  dom.emptyState.textContent = 'Die Anleitungen konnten momentan nicht geladen werden.';
}

function normalizeManuals(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((manual) => manual && typeof manual === 'object')
    .map((manual) => {
      const legacyFileName = String(manual.fileName || '').trim();
      const pdfFileName = String(manual.pdfFileName || legacyFileName).trim();
      const imageFileName = String(manual.imageFileName || legacyFileName).trim();

      return {
        name: String(manual.name || '').trim(),
        pdfFileName,
        imageFileName,
        video: manual.video ? String(manual.video).trim() : '',
        videoTitle: manual.videoTitle ? String(manual.videoTitle).trim() : '',
      };
    })
    .filter((manual) => manual.name && manual.pdfFileName);
}

function initVideoModal() {
  if (!dom.videoModal || !dom.videoDialog || !dom.videoClose || !dom.videoFrame || !dom.videoPlayer) {
    return;
  }

  dom.videoClose.addEventListener('click', closeVideoModal);
  dom.videoModal.addEventListener('click', (event) => {
    if (event.target === dom.videoModal) {
      closeVideoModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dom.videoModal.classList.contains('is-open')) {
      closeVideoModal();
    }
  });
}

function openVideoModal(source, trigger) {
  if (!dom.videoModal || !dom.videoFrame || !dom.videoPlayer || !dom.videoClose) {
    return;
  }

  if (isYouTubeUrl(source)) {
    openExternalVideo(source);
    return;
  }

  state.activeVideoTrigger = trigger;
  dom.videoModal.classList.add('is-open');
  dom.videoModal.setAttribute('aria-hidden', 'false');

  dom.videoFrame.hidden = true;
  dom.videoFrame.removeAttribute('src');
  dom.videoPlayer.hidden = false;
  dom.videoPlayer.src = source;
  void dom.videoPlayer.play().catch(() => undefined);

  dom.videoClose.focus();
}

function closeVideoModal() {
  if (!dom.videoModal || !dom.videoFrame || !dom.videoPlayer) {
    return;
  }

  dom.videoModal.classList.remove('is-open');
  dom.videoModal.setAttribute('aria-hidden', 'true');
  dom.videoFrame.removeAttribute('src');
  dom.videoFrame.hidden = true;
  dom.videoPlayer.pause();
  dom.videoPlayer.removeAttribute('src');
  dom.videoPlayer.hidden = true;
  state.activeVideoTrigger?.focus();
  state.activeVideoTrigger = null;
}
