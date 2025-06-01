
document.addEventListener('DOMContentLoaded', () => {
    initApp();
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
            CardManager.addCardsToCollection(cards);
            updateCollectionDisplay();
            showNotification('Cards added to your collection!', 'success');
        });
    }
    
    const groupFilter = document.getElementById('group-filter');
    if (groupFilter) {
        groupFilter.addEventListener('change', () => {
            updateCollectionDisplay();
        });
    }
    
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

let currentlyOpenedCards = [];

function getCurrentlyOpenedCards() {
    return [...currentlyOpenedCards];
}

function handlePackOpening(packType = 'basic', groupFilter = 'random') {
    const packOpeningSection = document.getElementById('pack-opening');
    packOpeningSection.classList.remove('hidden');
    const cardCount = packType === 'premium' ? 7 : (packType === 'ultimate' ? 10 : 5);
    showLoadingCards(cardCount);
    playSound('summon');
    packOpeningSection.classList.add('pack-opening');
    setTimeout(() => {
        const cards = PackManager.openPack(packType, groupFilter);
        currentlyOpenedCards = cards;
        packOpeningSection.classList.remove('pack-opening');
        displayGachaCards(cards);
    }, 800);
}

function showLoadingCards(count) {
    const cardsContainer = document.querySelector('#pack-opening .cards-container');
    cardsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const loadingCard = document.createElement('div');
        loadingCard.className = 'card loading-card';
        loadingCard.style.width = '180px';
        loadingCard.style.height = '280px';
        cardsContainer.appendChild(loadingCard);
    }
}

function displayGachaCards(cards) {
    const cardsContainer = document.querySelector('#pack-opening .cards-container');
    cardsContainer.innerHTML = '';
    const hasLegendary = cards.some(card => card.rarity === 'legendary');
    if (hasLegendary) {
        playSound('legendary');
        document.body.classList.add('legendary-pull');
        setTimeout(() => {
            document.body.classList.remove('legendary-pull');
        }, 3000);
    }
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
    cards.sort((a, b) => {
        return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
    });
    cards.forEach((card, index) => {
        const placeholderId = `placeholder-${index}-${Date.now()}`;
        const cardElement = document.createElement('div');
        cardElement.className = 'card card-placeholder';
        cardElement.style.opacity = '1';
        cardElement.id = placeholderId;
        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <div class="card-back-content">
                        <h3>Mystery Card</h3>
                        <p>Tap to reveal!</p>
                    </div>
                </div>
            </div>
        `;
        cardsContainer.appendChild(cardElement);
        setTimeout(() => {
            const actualCard = createCardElement(card);
            actualCard.classList.add('card-reveal');
            actualCard.addEventListener('animationend', function() {
                this.style.opacity = '1';
                this.style.transform = 'scale(1) rotateY(0deg)';
            });
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                cardsContainer.replaceChild(actualCard, placeholder);
            } else {
                cardsContainer.appendChild(actualCard);
            }
            playSound(card.rarity || 'common');
        }, 500 + (index * 700));
    });
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.id = card.id;
    cardDiv.dataset.group = card.group;
    cardDiv.dataset.rarity = card.rarity || 'common';
    let countBadge = '';
    if (card.count && card.count > 1) {
        countBadge = `<div class="card-count">${card.count}</div>`;
    }
    let rarityClass = '';
    if (card.rarity === 'rare') rarityClass = 'rare-card';
    if (card.rarity === 'epic') rarityClass = 'epic-card';
    if (card.rarity === 'legendary') rarityClass = 'legendary-card';
    cardDiv.innerHTML = `
        ${countBadge}
        <div class="card-inner ${rarityClass}">
            <div class="card-front">
                <div class="card-image">
                    <img src="${card.image}" alt="${card.name}">
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
    `;
    return cardDiv;
}

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

function loadCollection() {
    CardManager.loadCollection();
    updateCollectionDisplay();
}
