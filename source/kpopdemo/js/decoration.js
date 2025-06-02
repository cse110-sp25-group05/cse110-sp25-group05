/* ───────────────── helpers ───────────────── */
function loadOwnedCards() {
  // If CardManager is present, use it (and force-load from localStorage)
  if (typeof CardManager !== 'undefined') {
    CardManager.loadCollection?.();                // load once
    return CardManager.getCollection();            // shallow copy
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

/* ─────────────── build the <select> ───────────── */
function populateSelect(cards) {
  const sel = document.getElementById('card-select');
  if (!sel) return;
  
  sel.innerHTML = '';                                        // clear

  // Add default option
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select a card to decorate...';
  sel.appendChild(defaultOpt);

  cards.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.group})`;
    sel.appendChild(opt);
  });

  sel.onchange = () => {
    if (!sel.value) return;
    const card = cards.find(c => c.id === sel.value);
    if (card) {
      const map = readDecorMap();
      showInPreview(card, map[card.id] || {});
    }
  };
}

/* ─────────────── live preview logic ───────────── */
let currentCard = null;

function showInPreview(card, decor) {
  currentCard = card;

  const shell = document.getElementById('decoration-preview-card');
  const inner = shell.querySelector('.card-inner');
  const cardImage = shell.querySelector('.card-image img');
  
  if (!shell || !inner || !cardImage) return;

  // Clear existing frame classes
  inner.classList.remove('rare-card', 'epic-card', 'legendary-card');
  
  // Apply frame decoration
  if (decor.frame) {
    inner.classList.add(decor.frame);
  }

  // Set card data
  shell.dataset.rarity = card.rarity || 'common';
  shell.querySelector('.card-name').textContent = card.name;
  shell.querySelector('.card-group').textContent = card.group;
  
  // Set card image
  cardImage.src = card.image || `https://via.placeholder.com/300x420?text=${encodeURIComponent(card.name)}`;
  cardImage.alt = card.name;

  // Sync controls with current decoration
  document.querySelectorAll('input[name="frame"]')
          .forEach(r => (r.checked = r.value === (decor.frame || '')));

  const badge = document.getElementById('toggle-badge');
  if (badge) {
    badge.checked = decor.badge !== false;
    
    // Apply badge visibility
    if (badge.checked) {
      shell.setAttribute('data-show-badge', 'true');
    } else {
      shell.removeAttribute('data-show-badge');
    }
  }
}

function resetPreview() {
  const shell = document.getElementById('decoration-preview-card');
  const inner = shell.querySelector('.card-inner');
  const cardImage = shell.querySelector('.card-image img');
  
  if (!shell || !inner || !cardImage) return;

  // Reset to default state
  inner.classList.remove('rare-card', 'epic-card', 'legendary-card');
  shell.dataset.rarity = 'common';
  shell.querySelector('.card-name').textContent = '';
  shell.querySelector('.card-group').textContent = '';
  cardImage.src = 'https://via.placeholder.com/300x420?text=Select+Card';
  cardImage.alt = 'Preview';
  shell.removeAttribute('data-show-badge');
  
  // Reset controls
  document.querySelectorAll('input[name="frame"]')
          .forEach(r => (r.checked = r.value === ''));
  
  const badge = document.getElementById('toggle-badge');
  if (badge) badge.checked = true;
  
  currentCard = null;
}

/* ───────────────── init ───────────────── */
function initDecorationStudio() {
  const cards = loadOwnedCards();
  
  if (!cards.length) {
    const cardSelect = document.getElementById('card-select');
    if (cardSelect) {
      cardSelect.innerHTML = '<option>(no cards owned)</option>';
    }
    resetPreview();
    return;
  }

  populateSelect(cards);
  resetPreview();

  // Frame radio buttons
  document.querySelectorAll('input[name="frame"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (!currentCard) return;
      
      const inner = document.querySelector('#decoration-preview-card .card-inner');
      if (!inner) return;
      
      // Remove all frame classes
      inner.classList.remove('rare-card', 'epic-card', 'legendary-card');
      
      // Add selected frame class
      if (e.target.value) {
        inner.classList.add(e.target.value);
      }
    });
  });

  // Badge toggle
  const badgeToggle = document.getElementById('toggle-badge');
  if (badgeToggle) {
    badgeToggle.addEventListener('change', (e) => {
      if (!currentCard) return;
      
      const shell = document.getElementById('decoration-preview-card');
      if (!shell) return;
      
      if (e.target.checked) {
        shell.setAttribute('data-show-badge', 'true');
      } else {
        shell.removeAttribute('data-show-badge');
      }
    });
  }

  // Save button
  const saveBtn = document.getElementById('save-decor');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!currentCard) {
        alert('Please select a card first!');
        return;
      }
      
      const inner = document.querySelector('#decoration-preview-card .card-inner');
      if (!inner) return;
      
      // Determine current frame
      const frame = ['rare-card', 'epic-card', 'legendary-card']
                      .find(c => inner.classList.contains(c)) || '';
      
      // Get badge setting
      const badgeToggle = document.getElementById('toggle-badge');
      const badge = badgeToggle ? badgeToggle.checked : true;
      
      // Save decoration
      const map = readDecorMap();
      map[currentCard.id] = { frame, badge };
      writeDecorMap(map);
      
      alert(`Saved decoration for ${currentCard.name}!`);
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-decor');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!currentCard) {
        alert('Please select a card first!');
        return;
      }
      
      // Remove decoration from storage
      const map = readDecorMap();
      delete map[currentCard.id];
      writeDecorMap(map);
      
      // Reset preview to default
      showInPreview(currentCard, {});
      
      alert(`Reset decoration for ${currentCard.name}!`);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDecorationStudio);