document.addEventListener('DOMContentLoaded', () => {
    console.log('App starting...');
    
    // Load saved data
    CardManager.loadCollection();
    CurrencyManager.loadCurrency();
    
    updatePackCostsDisplay();
    showActiveSection();
    setupPackOpening();
    setupModalEventListeners();
    setupBasicEventListeners();
    setupNavigation();
});

function initApp() {
    setupEventListeners();
    loadCollection();
    document.querySelectorAll('.pack').forEach((pack, index) => {
        setTimeout(() => {
            pack.classList.add('pack-opening-animation');
        }, 100 * index);
    });
}

// Pack opening buttons.
function setupEventListeners() {
    const openPackBtns = document.querySelectorAll('.open-pack-btn');
    openPackBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const packType = this.getAttribute('data-type');
            const groupFilter = this.getAttribute('data-group');
            handlePackOpening(packType, groupFilter);
        });
    });
    
    const backToPacksBtn = document.getElementById('back-to-packs');
    if (backToPacksBtn) {
        backToPacksBtn.addEventListener('click', () => {
            const packOpeningSection = document.getElementById('pack-opening');
            packOpeningSection.classList.add('hidden');
        });
    }
    
    const addToCollectionBtn = document.getElementById('add-to-collection');
    if (addToCollectionBtn) {
        addToCollectionBtn.addEventListener('click', () => {
            const cards = getCurrentlyOpenedCards();
            if (cards.length === 0) {
                showNotification('No cards to add!', 'warning');
                return;
            }
            
            CardManager.addCardsToCollection(cards);
            updateCollectionDisplay();
            
            // Create enhanced notification with collection link
            showCollectionNotification(cards.length);
            
            // Close pack opening section after a delay
            setTimeout(() => {
                const packOpeningSection = document.getElementById('pack-opening');
                packOpeningSection.classList.add('hidden');
                window.location.hash = '#packs';
            }, 2000);
        });
    }
    
    // Filter collection.
    const groupFilter = document.getElementById('group-filter');
    if (groupFilter) {
        groupFilter.addEventListener('change', () => {
            updateCollectionDisplay();
        });
    }
}

function playSound(type) {
    console.log(`Playing ${type} sound`);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Pack Opening Events - Modal-based system
let currentSummonedCard = null;
let lastPackType = 'basic';
let lastGroupFilter = 'random';

function handlePackOpening(packType = 'basic', groupFilter = 'random') {
    // Check if player can afford the pack
    const cost = CurrencyManager.getPackCost(packType);
    if (!CurrencyManager.canAffordPack(packType)) {
        showNotification(`Not enough coins! You need ${cost} coins to open this pack.`, 'error');
        return;
    }
    
    // Spend currency
    const success = CurrencyManager.spendCurrency(cost, `${packType.charAt(0).toUpperCase() + packType.slice(1)} Pack`);
    if (!success) {
        showNotification('Transaction failed! Please try again.', 'error');
        return;
    }
    
    // Store last pack info for "summon again" feature
    lastPackType = packType;
    lastGroupFilter = groupFilter;
    
    // Update pack costs display after spending
    updatePackCostsDisplay();
    
    // Generate card for this pack (single card)
    const cards = PackManager.openPack(packType, groupFilter);
    if (cards.length > 0) {
        currentSummonedCard = cards[0];
        openSummonModal(currentSummonedCard);
        playSound('summon');
        
        // Add celebration effects for rare cards
        if (currentSummonedCard.rarity === 'legendary') {
            createCelebrationEffects('legendary');
        } else if (currentSummonedCard.rarity === 'epic') {
            createCelebrationEffects('epic');
        }
    }
}

function openSummonModal(card) {
    const modal = document.getElementById('summon-modal');
    const cardElement = document.getElementById('summoned-card');
    
    // Check if this is a completion card
    if (card.isCompletionCard) {
        // Special handling for completion cards
        cardElement.className = `summon-card rarity-legendary completion-card`;
        cardElement.innerHTML = `
            <div class="summon-card-image">
                <img src="${card.image}" alt="${card.name}">
            </div>
            <div class="summon-card-info">
                <div class="summon-card-name">${card.name}</div>
                <div class="summon-card-group">${card.group}</div>
                <div class="summon-card-rarity">Complete!</div>
            </div>
        `;
        
        // Update modal header for completion
        const modalHeader = document.querySelector('.summon-modal-header h2');
        const modalSubtext = document.querySelector('.summon-modal-header p');
        modalHeader.innerHTML = '<i class="fas fa-trophy"></i> Collection Complete!';
        modalSubtext.textContent = 'You\'ve collected everything available!';
        
        // Hide summon again button for completion cards
        const summonAgainBtn = document.getElementById('modal-summon-again');
        summonAgainBtn.style.display = 'none';
        
        // Change add to collection button text
        const addBtn = document.getElementById('modal-add-to-collection');
        addBtn.innerHTML = '<i class="fas fa-check-circle"></i> Awesome!';
        
    } else {
        // Normal card handling
        cardElement.className = `summon-card rarity-${card.rarity || 'common'}`;
        cardElement.innerHTML = `
            <div class="summon-card-image">
                <img src="${card.image}" alt="${card.name}">
            </div>
            <div class="summon-card-info">
                <div class="summon-card-name">${card.name}</div>
                <div class="summon-card-group">${card.group}</div>
                <div class="summon-card-rarity">${card.rarity || 'common'}</div>
            </div>
        `;
        
        // Reset modal header for normal cards
        const modalHeader = document.querySelector('.summon-modal-header h2');
        const modalSubtext = document.querySelector('.summon-modal-header p');
        modalHeader.innerHTML = '<i class="fas fa-sparkles"></i> Card Summoned!';
        modalSubtext.textContent = 'You got a new card!';
        
        // Show summon again button for normal cards
        const summonAgainBtn = document.getElementById('modal-summon-again');
        summonAgainBtn.style.display = 'flex';
        
        // Reset add to collection button text
        const addBtn = document.getElementById('modal-add-to-collection');
        addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add to Collection';
    }
    
    // Show the modal
    modal.classList.add('active');
    
    // Update "summon again" button based on affordability (only for normal cards)
    if (!card.isCompletionCard) {
        updateSummonAgainButton();
    }
}

function closeSummonModal() {
    const modal = document.getElementById('summon-modal');
    modal.classList.remove('active');
    currentSummonedCard = null;
}

function updateSummonAgainButton() {
    const summonAgainBtn = document.getElementById('modal-summon-again');
    const cost = CurrencyManager.getPackCost(lastPackType);
    const canAfford = CurrencyManager.canAffordPack(lastPackType);
    
    if (canAfford) {
        summonAgainBtn.disabled = false;
        summonAgainBtn.innerHTML = `<i class="fas fa-redo"></i> Summon Again (${cost} coins)`;
    } else {
        summonAgainBtn.disabled = true;
        summonAgainBtn.innerHTML = `<i class="fas fa-coins"></i> Need ${cost} coins`;
    }
}

function createCelebrationEffects(rarity) {
    const container = document.getElementById('celebration-effects');
    const colors = {
        legendary: ['#ff9800', '#ffc107', '#ffeb3b'],
        epic: ['#9c27b0', '#e91e63', '#673ab7']
    };
    
    const confettiColors = colors[rarity] || colors.epic;
    
    // Create confetti
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 20);
    }
}

function setupModalEventListeners() {
    // Close modal when clicking outside (but still force collection)
    const modal = document.getElementById('summon-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Don't close modal - force adding to collection
            showNotification('Please add the card to your collection first!', 'warning');
        }
    });
    
    // Add to collection button
    const addToCollectionBtn = document.getElementById('modal-add-to-collection');
    addToCollectionBtn.addEventListener('click', () => {
        if (currentSummonedCard) {
            if (currentSummonedCard.isCompletionCard) {
                // For completion cards, just show a congratulations message and close
                showNotification('🎉 Amazing collection! You\'re a true K-pop fan!', 'success');
                closeSummonModal();
            } else {
                // For normal cards, add to collection
                console.log('Adding card to collection:', currentSummonedCard);
                
                // Check collection before adding
                const collectionBefore = CardManager.getCollection();
                console.log('Collection before adding:', collectionBefore.length, 'cards');
                
                CardManager.addCardsToCollection([currentSummonedCard]);
                
                // Check collection after adding
                const collectionAfter = CardManager.getCollection();
                console.log('Collection after adding:', collectionAfter.length, 'cards');
                
                // Force save and reload
                CardManager.saveCollection();
                console.log('Collection saved to localStorage');
                
                // Verify it was saved
                const savedCollection = JSON.parse(localStorage.getItem('kpopCardCollection') || '[]');
                console.log('Verified saved collection:', savedCollection.length, 'cards');
                
                showCollectionNotification(1);
                closeSummonModal();
                
                // Update any collection displays
                if (typeof updateCollectionDisplay === 'function') {
                    updateCollectionDisplay();
                }
            }
        }
    });
    
    // Summon again button
    const summonAgainBtn = document.getElementById('modal-summon-again');
    summonAgainBtn.addEventListener('click', () => {
        if (currentSummonedCard) {
            // Automatically add current card to collection before summoning again
            if (!currentSummonedCard.isCompletionCard) {
                console.log('Auto-adding card to collection before summon again:', currentSummonedCard);
                
                const collectionBefore = CardManager.getCollection();
                console.log('Collection before auto-adding:', collectionBefore.length, 'cards');
                
                CardManager.addCardsToCollection([currentSummonedCard]);
                
                const collectionAfter = CardManager.getCollection();
                console.log('Collection after auto-adding:', collectionAfter.length, 'cards');
                
                CardManager.saveCollection();
                console.log('Collection auto-saved before summon again');
                
                showCollectionNotification(1);
            }
            
            closeSummonModal();
            // Small delay for smooth transition
            setTimeout(() => {
                handlePackOpening(lastPackType, lastGroupFilter);
            }, 200);
        }
    });
    
    // Remove ESC key closing - force collection
    // No longer allow ESC to close modal
}

// Collection Display Sorting.
function updateCollectionDisplay() {
    const collectionContainer = document.querySelector('.collection-container');
    collectionContainer.innerHTML = '';
    const collection = CardManager.getCollection();
    const groupFilter = document.getElementById('group-filter');
    const selectedGroup = groupFilter ? groupFilter.value : 'all';
    const filteredCollection = selectedGroup === 'all' 
        ? collection 
        : collection.filter(card => card.group === selectedGroup);
    if (filteredCollection.length === 0) {
        collectionContainer.innerHTML = '<p class="empty-collection">No cards in this category yet. Summon some cards to build your collection!</p>';
        return;
    }
    const groupedCards = {};
    filteredCollection.forEach(card => {
        if (!groupedCards[card.group]) {
            groupedCards[card.group] = [];
        }
        groupedCards[card.group].push(card);
    });
    const collectionGrid = document.createElement('div');
    collectionGrid.className = 'collection-grid';
    const sortedGroups = Object.keys(groupedCards).sort();
    sortedGroups.forEach(group => {
        const groupTile = createGroupTile(group, groupedCards[group]);
        collectionGrid.appendChild(groupTile);
    });
    collectionContainer.appendChild(collectionGrid);
    document.querySelectorAll('.group-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            const group = this.getAttribute('data-group');
            showGroupDetail(group, groupedCards[group]);
        });
    });
}

function createGroupTile(groupName, cards) {
    const tile = document.createElement('div');
    tile.className = 'group-tile';
    tile.dataset.group = groupName;
    let coverImageUrl = `https://via.placeholder.com/400x300/${getGroupColor(groupName)}/ffffff?text=${encodeURIComponent(groupName)}`;
    let highestRarityCard = cards[0];
    const rarityValues = { legendary: 4, epic: 3, rare: 2, common: 1 };
    cards.forEach(card => {
        const cardRarityValue = rarityValues[card.rarity] || 1;
        const highestRarityValue = rarityValues[highestRarityCard.rarity] || 1;
        if (cardRarityValue > highestRarityValue) {
            highestRarityCard = card;
        }
    });
    if (highestRarityCard && highestRarityCard.image) {
        coverImageUrl = highestRarityCard.image;
    }
    const uniqueCardIds = new Set(cards.map(card => card.id));
    const uniqueCardCount = uniqueCardIds.size;
    const totalCardCount = cards.length;
    const rarityCount = {
        common: cards.filter(card => !card.rarity || card.rarity === 'common').length,
        rare: cards.filter(card => card.rarity === 'rare').length,
        epic: cards.filter(card => card.rarity === 'epic').length,
        legendary: cards.filter(card => card.rarity === 'legendary').length
    };
    let rarityInfo = '';
    if (rarityCount.rare > 0 || rarityCount.epic > 0 || rarityCount.legendary > 0) {
        rarityInfo = `
            <div class="rarity-info">
                ${rarityCount.legendary > 0 ? `<span class="rarity-legendary">⭐ ${rarityCount.legendary}</span>` : ''}
                ${rarityCount.epic > 0 ? `<span class="rarity-epic">⚡ ${rarityCount.epic}</span>` : ''}
                ${rarityCount.rare > 0 ? `<span class="rarity-rare">✧ ${rarityCount.rare}</span>` : ''}
            </div>
        `;
    }
    tile.innerHTML = `
        <div class="group-cover">
            <img src="${coverImageUrl}" alt="${groupName}">
        </div>
        <div class="group-info">
            <h3 class="group-name">${groupName}</h3>
            <p class="card-stat">
                <i class="fas fa-layer-group"></i> 
                ${uniqueCardCount} unique cards (${totalCardCount} total)
            </p>
            ${rarityInfo}
        </div>
    `;
    return tile;
}

function showGroupDetail(groupName, cards) {
    const existingDetail = document.querySelector('.group-detail');
    if (existingDetail) {
        existingDetail.remove();
    }
    const groupDetail = document.createElement('div');
    groupDetail.className = 'group-detail';
    groupDetail.dataset.group = groupName;
    const detailHeader = document.createElement('div');
    detailHeader.className = 'group-detail-header';
    const detailTitle = document.createElement('h3');
    detailTitle.className = 'group-detail-title';
    detailTitle.textContent = `${groupName} Collection`;
    const closeButton = document.createElement('button');
    closeButton.className = 'close-detail';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => {
        groupDetail.remove();
    });
    detailHeader.appendChild(detailTitle);
    detailHeader.appendChild(closeButton);
    groupDetail.appendChild(detailHeader);
    const groupCards = document.createElement('div');
    groupCards.className = 'group-cards';
    const sortedCards = cards.sort((a, b) => a.name.localeCompare(b.name));
    sortedCards.forEach(card => {
        const cardElement = createCardElement(card);
        groupCards.appendChild(cardElement);
    });
    groupDetail.appendChild(groupCards);
    document.querySelector('.collection-container').appendChild(groupDetail);
    groupDetail.scrollIntoView({ behavior: 'smooth' });
}

function getGroupColor(groupName) {
    const colors = {
        'BTS': '7a3fb0',
        'BLACKPINK': 'ff007f',
        'TWICE': 'ff8b3e',
        'STRAY KIDS': '384cff',
        'ITZY': 'ff363c',
        'AESPA': '00a77d'
    };
    return colors[groupName] || 'f8a5c2';
}

// Load decorations for a specific card
function loadCardDecorations(cardId) {
    const stored = localStorage.getItem('cardDecorations');
    const decorMap = stored ? JSON.parse(stored) : {};
    return decorMap[cardId] || [];
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.id = card.id;
    cardDiv.dataset.group = card.group;
    cardDiv.dataset.rarity = card.rarity || 'common';
    
    // Load decorations for this card
    const decorations = loadCardDecorations(card.id);
    
    let countBadge = '';
    if (card.count && card.count > 1) {
        countBadge = `<div class="card-count">${card.count}</div>`;
    }
    
    // Add decoration badge if card has decorations
    let decorationBadge = '';
    if (decorations.length > 0) {
        decorationBadge = `<div class="decoration-badge" title="This card has ${decorations.length} decoration${decorations.length > 1 ? 's' : ''}">
            <i class="fas fa-palette"></i>
        </div>`;
    }
    
    let rarityClass = '';
    if (card.rarity === 'rare') rarityClass = 'rare-card';
    if (card.rarity === 'epic') rarityClass = 'epic-card';
    if (card.rarity === 'legendary') rarityClass = 'legendary-card';
    
    // Create decoration stickers HTML
    let decorationStickers = '';
    decorations.forEach(sticker => {
        decorationStickers += `
            <img src="${sticker.src}" 
                 class="card-decoration-sticker" 
                 style="position: absolute; 
                        left: ${sticker.left}; 
                        top: ${sticker.top}; 
                        width: ${sticker.width}; 
                        height: ${sticker.height}; 
                        z-index: 10; 
                        pointer-events: none;">`;
    });
    
    cardDiv.innerHTML = `
        ${countBadge}
        ${decorationBadge}
        <div class="card-inner ${rarityClass}">
            <div class="card-front">
                <div class="card-image">
                    <img src="${card.image}" alt="${card.name}">
                    ${decorationStickers}
                </div>
                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-group">${card.group}</div>
                </div>
            </div>
            <div class="card-back">
                <h3>${card.name}</h3>
                <p><strong>Group:</strong> ${card.group}</p>
                <p><strong>Role:</strong> ${card.role || 'N/A'}</p>
                <p><strong>Birthday:</strong> ${card.birthday || 'N/A'}</p>
                <p><strong>Rarity:</strong> <span class="rarity-${card.rarity || 'common'}">${card.rarity || 'Common'}</span></p>
                <p class="card-bio">${card.bio || 'No bio available'}</p>
            </div>
        </div>
        <a href="decoration.html?cardID=${card.id}" class="deco-button" onclick="event.stopPropagation()">
            <i class="fas fa-palette"></i>Decorate
        </a>
    `;
    
    return cardDiv;
}

function loadCollection() {
    CardManager.loadCollection();
    updateCollectionDisplay();
}

// init SoundCloud
const TRACK_IDS = [
  '2096744259', //BTS-Dynamitc 
  '2096744094', //BTS-DNA
  '669902048',  //BlackPink- KIll this love
  '1059662128', //BlackPink- DDU-DU
  '575498373', //ITZY- DALLA DALLA
  '1108916788', //ITZY- WANNABE
  '1209259669', //Stray Kids-God's Menue
  '1209176545', //Stray Kids-Thunderous
  '427096254', //TWICE - WHat is love
  '910923943', // TWICE- I CAN'T STOP ME
  '1655391237', // AESPA - DRAMA
  '1301753080', //AESPA - BLACK MAMBA

];

const initSoundCloudPlayer = () => {
  const iframe = document.getElementById('sc-player');
  
  // Try multiple K-pop tracks in case one doesn't work
  const kpopTracks = [
    'https://api.soundcloud.com/tracks/427096254', // TWICE - What is Love
    'https://api.soundcloud.com/tracks/575498373', // ITZY - DALLA DALLA  
    'https://api.soundcloud.com/tracks/669902048'  // BLACKPINK - Kill This Love
  ];
  
  const trackUrl = kpopTracks[0]; // Start with TWICE
  
  iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}
    &auto_play=true
    &loop=true
    &hide_related=true
    &show_comments=false
    &show_user=false
    &show_reposts=false
    &show_teaser=false
    &visual=false`.replace(/\s+/g, '');

  console.log('🎵 SoundCloud iframe initialized with TWICE - What is Love');
  console.log('📢 If you can\'t hear it clearly, refresh and try clicking the page');

  const widget = SC.Widget(iframe);

  // Add error handling
  widget.bind(SC.Widget.Events.ERROR, (error) => {
    console.warn('SoundCloud widget error (normal for hidden player):', error);
  });

  // Increase volume scaling even more
  document.getElementById('volume').addEventListener('input', (e) => {
    const sliderValue = parseInt(e.target.value);
    // Scale 0-100 to 0-2.0 for much louder maximum volume
    const volume = (sliderValue / 100) * 2.0;
    try {
      widget.setVolume(volume);
      updateVolumeIcon(sliderValue);
      console.log(`🔊 Volume set to ${sliderValue}% (actual: ${volume.toFixed(2)})`);
    } catch (e) {
      console.warn('Volume control error:', e);
    }
  });

  widget.bind(SC.Widget.Events.READY, () => {
    console.log('✅ SoundCloud widget ready');
    try {
      // Set initial volume higher - 70% of slider = 1.4 actual volume
      widget.setVolume(1.4);
      document.getElementById('volume').value = 70;
      updateVolumeIcon(70);
      console.log('🔊 Initial volume set to 70% (actual: 1.4) - should be loud!');
    } catch (e) {
      console.warn('Initial volume setting error:', e);
    }
  });

  widget.bind(SC.Widget.Events.PLAY, () => {
    console.log('🎵 MUSIC IS PLAYING: TWICE - What is Love');
    console.log('👂 You should hear K-pop music now!');
  });

  widget.bind(SC.Widget.Events.PAUSE, () => {
    console.log('⏸️ Music paused');
  });

  // Simple activation handler
  document.addEventListener('click', function enableAudio() {
    try {
      widget.play();
      console.log('🎶 ACTIVATED: Click detected - starting TWICE - What is Love');
      console.log('🎵 Listen for: Korean lyrics with upbeat pop melody');
    } catch (e) {
      console.warn('Play activation error:', e);
    }
  }, { once: true });
};

// Update the icon
const updateVolumeIcon = (volume) => {
  const icon = document.getElementById('volume-icon');
  icon.className = volume === 0 ? 'fas fa-volume-mute' :
                   volume < 30 ? 'fas fa-volume-off' :
                   volume < 70 ? 'fas fa-volume-down' : 
                   'fas fa-volume-up';
  
  // change color when at certain volume value
  icon.style.color = volume === 0 ? '#ff0000' : 
                    volume < 50 ? '#ff9900' : 
                    '#00ff00';
};

function updateVolumeControlStatus(isPlaying) {
  const volumeControl = document.getElementById('volume-control');
  if (volumeControl) {
    if (isPlaying) {
      volumeControl.style.borderColor = 'rgba(76, 175, 80, 0.5)';
      volumeControl.title = 'Music is playing';
    } else {
      volumeControl.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      volumeControl.title = 'Music is paused - click anywhere to start';
    }
  }
}

function updatePackCostsDisplay() {
    const packs = document.querySelectorAll('.pack');
    packs.forEach(pack => {
        const packType = pack.dataset.type;
        const cost = CurrencyManager.getPackCost(packType);
        const canAfford = CurrencyManager.canAffordPack(packType);
        
        // Remove existing cost display
        const existingCost = pack.querySelector('.pack-cost');
        if (existingCost) {
            existingCost.remove();
        }
        
        // Add cost display
        const costDisplay = document.createElement('div');
        costDisplay.className = `pack-cost ${canAfford ? 'affordable' : 'expensive'}`;
        costDisplay.innerHTML = `<i class="fas fa-coins"></i>${cost}`;
        pack.appendChild(costDisplay);
        
        // Update button state
        const button = pack.querySelector('.open-pack-btn');
        if (button) {
            if (canAfford) {
                button.classList.remove('disabled');
                button.disabled = false;
            } else {
                button.classList.add('disabled');
                button.disabled = true;
            }
        }
    });
}

function setupPackOpening() {
    // Set up pack opening button event listeners
    const openPackBtns = document.querySelectorAll('.open-pack-btn');
    console.log('Setting up pack opening for', openPackBtns.length, 'buttons');
    
    openPackBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Pack button clicked:', this);
            const packType = this.getAttribute('data-type');
            const groupFilter = this.getAttribute('data-group');
            console.log('Opening pack:', packType, groupFilter);
            handlePackOpening(packType, groupFilter);
        });
    });
}

function setupNavigation() {
    // Set up navigation hash changes
    window.addEventListener('hashchange', showActiveSection);
}

function showActiveSection() {
    const hash = window.location.hash || '#packs';
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
    });
    const activeSection = document.querySelector(hash);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
}

function showCollectionNotification(cardCount) {
    const notification = document.createElement('div');
    notification.className = 'notification success collection-notification';
    
    const cardText = cardCount === 1 ? 'card' : 'cards';
    const message = cardCount === 1 ? 'Card added to your collection!' : `${cardCount} cards added to your collection!`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-main">
                <i class="fas fa-check-circle"></i>
                ${message}
            </div>
            <div class="notification-actions">
                <a href="collection.html#collection" class="view-collection-btn">
                    <i class="fas fa-eye"></i> View Collection
                </a>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1.5rem;
        border-radius: 15px;
        background: linear-gradient(135deg, #4caf50, #8bc34a);
        color: white;
        box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
        z-index: 1100;
        font-weight: 500;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        transform: translateX(100%);
        opacity: 0;
        min-width: 300px;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Auto remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Start SoundCloud Player - Simplified
if(window.SC) {
  try {
    initSoundCloudPlayer();
    console.log('SoundCloud initialization started');
  } catch(e) {
    console.error("SoundCloud init failed:", e);
  }
} else {
  console.warn("SoundCloud API not loaded, trying again...");
  setTimeout(() => {
    if(window.SC) {
      try {
        initSoundCloudPlayer();
        console.log('SoundCloud initialization started (delayed)');
      } catch(e) {
        console.error("SoundCloud delayed init failed:", e);
      }
    } else {
      console.error('SoundCloud API failed to load');
    }
  }, 2000);
}

// Basic event listeners for card interactions
function setupBasicEventListeners() {
    // Card flip on click.
    document.addEventListener('click', event => {
        const card = event.target.closest('.card');
        if (card && !card.classList.contains('new-card-animation') && !card.classList.contains('card-reveal')) {
            card.classList.toggle('flipped');
            if (card.classList.contains('flipped')) {
                playSound('flip');
            }
        }
    });
}

