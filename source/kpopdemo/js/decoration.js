/* ───────────────── helpers ───────────────── */
function loadOwnedCards() {
	// If CardManager is present, use it (and force-load from localStorage)
	if (typeof CardManager !== 'undefined') {
		CardManager.loadCollection?.(); // load once
		return CardManager.getCollection(); // shallow copy
	}
	// Fallback – read the raw array directly
	const raw = localStorage.getItem('kpopCardCollection');
	return raw ? JSON.parse(raw) : [];
}

function readDecorMap() {
	const stored = localStorage.getItem('cardDecorations');
	return stored ? JSON.parse(stored) : {};
}

function writeDecorMap(map) {
	localStorage.setItem('cardDecorations', JSON.stringify(map));
}

/* ───────────────── init ───────────────── */
function initDecorationStudio() {
	const collection = loadOwnedCards();
	const select = document.getElementById('card-select');
	select.innerHTML = '<option>Select a card to decorate...</option>';

	collection.forEach(card => {
		const option = document.createElement('option');
		option.value = card.id;
		option.textContent = `${card.name} (${card.group})`;
		select.appendChild(option);
	});

	const lastSelected = localStorage.getItem('lastSelectedCard');
	if (lastSelected && collection.some(c => c.id === lastSelected)) {
    	select.value = lastSelected;
   		select.dispatchEvent(new Event('change'));
	}

	select.addEventListener('change', function () {
		const card = collection.find(c => c.id === this.value);
		const preview = document.getElementById('decoration-preview-card');
		if (card && preview) {
			const imgPath = `assets/cards/${card.group.toLowerCase()}/${card.name}/${card.id}.png`;
			preview.innerHTML = `<img src="${imgPath}" alt="${card.name}" width="220">`;
		} else if (preview) {
			preview.innerHTML = `<img src="assets/cardselect.png" alt="Preview" width="220">`;
		}
    	localStorage.setItem('lastSelectedCard', this.value);
	});

	const badgeToggle = document.getElementById('toggle-badge');
	const preview = document.getElementById('decoration-preview-card');
	if (badgeToggle && preview) {
		badgeToggle.addEventListener('change', function () {
			preview.setAttribute('data-show-badge', this.checked ? 'true' : 'false');
		});
		preview.setAttribute('data-show-badge', badgeToggle.checked ? 'true' : 'false');
	}

	const saveBtn = document.getElementById('save-decor');
	if (saveBtn) {
		saveBtn.addEventListener('click', () => {
			const selected = document.getElementById('card-select').value;
			if (!selected) {
				alert('Please select a card first!');
				return;
			}
			alert('Saved decoration!');
		});
	}

	const resetBtn = document.getElementById('reset-decor');
	if (resetBtn) {
	  resetBtn.addEventListener('click', () => {
	    const preview = document.getElementById('decoration-preview-card');
	    const selected = document.getElementById('card-select');
	    if (!selected.value || !preview) {
	      alert('Please select a card first!');
	      return;
	    }
	    Array.from(preview.querySelectorAll('.dropped-sticker')).forEach(el => el.remove());
	    const decorMap = readDecorMap();
	    delete decorMap[selected.value];
	    writeDecorMap(decorMap);
	    alert('Reset decoration!');
	  });
	}
}


function enableStickerDragDrop() {
  const stickers = document.querySelectorAll('.sticker-scroll img[draggable="true"]');
  const preview = document.getElementById('decoration-preview-card');

	stickers.forEach(sticker => {
	  sticker.addEventListener('dragstart', function (e) {
	    e.dataTransfer.setData('sticker-src', this.src);
	    e.dataTransfer.setData('from-palette', 'true');
	  });
	});


  if (trashcan) {
    trashcan.addEventListener('dragover', function(e) {
      e.preventDefault();
      trashcan.style.background = '#ffeaea';
    });
    trashcan.addEventListener('dragleave', function() {
      trashcan.style.background = '';
    });
    trashcan.addEventListener('drop', function(e) {
      e.preventDefault();
      trashcan.style.background = '';
      const dragging = document.querySelector('.dropped-sticker[style*="display: none"]');
      if (dragging) dragging.remove();
    });
  }
}

function makeStickerMoveable(sticker, container) {
  let offsetX, offsetY, isDragging = false;

  sticker.addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    sticker.style.zIndex = 100;
    document.body.style.userSelect = 'none';

    const rect = sticker.getBoundingClientRect();
    sticker.style.position = 'fixed';
    sticker.style.left = rect.left + 'px';
    sticker.style.top = rect.top + 'px';
    sticker.style.width = rect.width + 'px';
    sticker.style.height = rect.height + 'px';
    document.body.appendChild(sticker);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    sticker.style.left = (e.clientX - offsetX) + 'px';
    sticker.style.top = (e.clientY - offsetY) + 'px';
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    sticker.style.zIndex = 20;
    document.body.style.userSelect = '';

    const trashcan = document.getElementById('sticker-trashcan');
    const trashRect = trashcan.getBoundingClientRect();
    const stickerRect = sticker.getBoundingClientRect();
    const overlap = !(
      stickerRect.right < trashRect.left ||
      stickerRect.left > trashRect.right ||
      stickerRect.bottom < trashRect.top ||
      stickerRect.top > trashRect.bottom
    );
    if (overlap) {
      sticker.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    let x = e.clientX - containerRect.left - offsetX;
    let y = e.clientY - containerRect.top - offsetY;
    x = Math.max(0, Math.min(x, container.offsetWidth - sticker.offsetWidth));
    y = Math.max(0, Math.min(y, container.offsetHeight - sticker.offsetHeight));
    sticker.style.position = 'absolute';
    sticker.style.left = x + 'px';
    sticker.style.top = y + 'px';
    container.appendChild(sticker);

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  sticker.addEventListener('mousedown', function() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

/* Screenshot Mode */
function initScreenshotMode() {
    const screenshotBtn = document.getElementById('screenshot-btn');
    const toast = document.getElementById('screenshot-toast');
    let isScreenshotMode = false;

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function toggleScreenshotMode() {
        isScreenshotMode = !isScreenshotMode;
        document.body.classList.toggle('screenshot-mode', isScreenshotMode);
        
        // Update button text and icon
        const btnIcon = screenshotBtn.querySelector('i');
        const btnText = screenshotBtn.querySelector('span');
        
        if (isScreenshotMode) {
            btnIcon.className = 'fas fa-eye';
            btnText.textContent = 'Exit Screenshot Mode';
            showToast();
            // Add data attribute for automation
            document.body.setAttribute('data-screenshot-mode', 'active');
        } else {
            btnIcon.className = 'fas fa-camera';
            btnText.textContent = 'Screenshot Mode';
            document.body.removeAttribute('data-screenshot-mode');
        }
    }

    screenshotBtn.addEventListener('click', toggleScreenshotMode);
}


function getSelectedCardId() {
  const select = document.getElementById('card-select');
  return select && select.value ? select.value : null;
}

function saveCurrentDecoration() {
  const cardId = getSelectedCardId();
  if (!cardId) return;
  const preview = document.getElementById('decoration-preview-card');
  const stickers = Array.from(preview.querySelectorAll('.dropped-sticker'));
  const stickerData = stickers.map(sticker => ({
    src: sticker.src,
    left: sticker.style.left,
    top: sticker.style.top,
    width: sticker.style.width,
    height: sticker.style.height,
  }));
  const decorMap = readDecorMap();
  decorMap[cardId] = stickerData;
  writeDecorMap(decorMap);
}

function loadDecorationForCard(cardId) {
  const preview = document.getElementById('decoration-preview-card');
  if (!preview) return;
  Array.from(preview.querySelectorAll('.dropped-sticker')).forEach(el => el.remove());
  const decorMap = readDecorMap();
  const stickerData = decorMap[cardId] || [];
  stickerData.forEach(data => {
    const stickerImg = document.createElement('img');
    stickerImg.src = data.src;
    stickerImg.className = 'dropped-sticker';
    stickerImg.style.position = 'absolute';
    stickerImg.style.left = data.left;
    stickerImg.style.top = data.top;
    stickerImg.style.width = data.width;
    stickerImg.style.height = data.height;
    stickerImg.style.pointerEvents = 'auto';
    stickerImg.draggable = false;
    makeStickerMoveable(stickerImg, preview);
    preview.appendChild(stickerImg);
    preview.style.position = 'relative';
  });
}

function enableStickerDragDrop() {
  const stickers = document.querySelectorAll('.sticker-scroll img[draggable="true"]');
  const preview = document.getElementById('decoration-preview-card');
  const trashcan = document.getElementById('sticker-trashcan');

  stickers.forEach(sticker => {
    sticker.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('sticker-src', this.src);
	  e.dataTransfer.setData('from-palette', 'true');

    });
  });

  preview.addEventListener('dragover', function (e) {
    e.preventDefault();
  });
  
  preview.addEventListener('drop', function (e) {
	e.preventDefault();
	const src = e.dataTransfer.getData('sticker-src');
	if (!src) return;
	if (e.dataTransfer.getData('from-palette') !== 'true') return;
	const rect = preview.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	const stickerImg = document.createElement('img');
	stickerImg.src = src;
	stickerImg.className = 'dropped-sticker';
	stickerImg.style.position = 'absolute';
	stickerImg.style.left = `${x - 36}px`;
	stickerImg.style.top = `${y - 36}px`;
	stickerImg.style.width = '72px';
	stickerImg.style.height = '72px';
	stickerImg.style.pointerEvents = 'auto';
	stickerImg.draggable = false;
	makeStickerMoveable(stickerImg, preview);
	preview.appendChild(stickerImg);
	preview.style.position = 'relative';
	saveCurrentDecoration();
});

  if (trashcan) {
    trashcan.addEventListener('dragover', function(e) {
      e.preventDefault();
      trashcan.style.background = '#ffeaea';
    });
    trashcan.addEventListener('dragleave', function() {
      trashcan.style.background = '';
    });
    trashcan.addEventListener('drop', function(e) {
      e.preventDefault();
      trashcan.style.background = '';
      const dragging = document.querySelector('.dropped-sticker[style*="display: none"]');
      if (dragging) {
        dragging.remove();
        saveCurrentDecoration();
      }
    });
  }
}

function makeStickerMoveable(sticker, container) {
  let offsetX, offsetY, isDragging = false;

  sticker.addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    sticker.style.zIndex = 100;
    document.body.style.userSelect = 'none';

    const rect = sticker.getBoundingClientRect();
    sticker.style.position = 'fixed';
    sticker.style.left = rect.left + 'px';
    sticker.style.top = rect.top + 'px';
    sticker.style.width = rect.width + 'px';
    sticker.style.height = rect.height + 'px';
    document.body.appendChild(sticker);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    sticker.style.left = (e.clientX - offsetX) + 'px';
    sticker.style.top = (e.clientY - offsetY) + 'px';
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    sticker.style.zIndex = 20;
    document.body.style.userSelect = '';

    const trashcan = document.getElementById('sticker-trashcan');
    const trashRect = trashcan.getBoundingClientRect();
    const stickerRect = sticker.getBoundingClientRect();
    const overlap = !(
      stickerRect.right < trashRect.left ||
      stickerRect.left > trashRect.right ||
      stickerRect.bottom < trashRect.top ||
      stickerRect.top > trashRect.bottom
    );
    if (overlap) {
      sticker.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      saveCurrentDecoration();
      return;
    }

    const containerRect = container.getBoundingClientRect();
    let x = e.clientX - containerRect.left - offsetX;
    let y = e.clientY - containerRect.top - offsetY;
    x = Math.max(0, Math.min(x, container.offsetWidth - sticker.offsetWidth));
    y = Math.max(0, Math.min(y, container.offsetHeight - sticker.offsetHeight));
    sticker.style.position = 'absolute';
    sticker.style.left = x + 'px';
    sticker.style.top = y + 'px';
    container.appendChild(sticker);

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    saveCurrentDecoration();
  }

  sticker.addEventListener('mousedown', function() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function decoratePreviewOnCardChange() {
  const select = document.getElementById('card-select');
  const collection = loadOwnedCards();
  select.addEventListener('change', function () {
    const cardId = select.value;
    const card = collection.find(c => c.id === cardId);
    const preview = document.getElementById('decoration-preview-card');
    if (card && preview) {
      const imgPath = `assets/cards/${card.group.toLowerCase()}/${card.name}/${card.id}.png`;
      preview.innerHTML = `<img src="${imgPath}" alt="${card.name}" width="220">`;
    } else if (preview) {
      preview.innerHTML = `<img src="assets/cardselect.png" alt="Preview" width="220">`;
    }
    if (cardId) {
      loadDecorationForCard(cardId);
    }
  });
  if (select.value) {
    const cardId = select.value;
    const card = collection.find(c => c.id === cardId);
    const preview = document.getElementById('decoration-preview-card');
    if (card && preview) {
      const imgPath = `assets/cards/${card.group.toLowerCase()}/${card.name}/${card.id}.png`;
      preview.innerHTML = `<img src="${imgPath}" alt="${card.name}" width="220">`;
    } else if (preview) {
      preview.innerHTML = `<img src="assets/cardselect.png" alt="Preview" width="220">`;
    }
    loadDecorationForCard(cardId);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initDecorationStudio();
  enableStickerDragDrop();
  decoratePreviewOnCardChange();
});

