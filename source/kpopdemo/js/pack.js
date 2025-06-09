// Handles logic for card packs and card rarities.
const PackManager = (() => {
    const packTypes = {
        basic: {
            name: 'Basic Summon',
            cardCount: 5,
            rarity: {
                common: 75,
                rare: 20,
                epic: 5,
                legendary: 0
            }
        },
        premium: {
            name: 'Premium Summon',
            cardCount: 7,
            rarity: {
                common: 60,
                rare: 30,
                epic: 8,
                legendary: 2
            }
        },
        ultimate: {
            name: 'Legendary Summon',
            cardCount: 10,
            rarity: {
                common: 40,
                rare: 35,
                epic: 15,
                legendary: 10
            }
        }
    };

    // Pack Opening Function - Updated to give single card and avoid duplicates
    function openPack(packType = 'basic', groupFilter = 'random') {
        const cardCount = 1; // Changed to single card per pack
        const cards = [];
        
        // Get available cards based on group filter
        let availableCards = CardData.getAllCards();
        if (groupFilter !== 'random') {
            availableCards = CardData.getCardsByGroup(groupFilter);
        }
        
        if (availableCards.length === 0) {
            console.error('No cards available for the specified group');
            return [];
        }
        
        // Get owned card IDs to avoid duplicates
        const ownedCardIds = CardManager.getOwnedCardIds();
        const unownedCards = availableCards.filter(card => !ownedCardIds.includes(card.id));
        
        // Check if collection is complete for this group
        if (unownedCards.length === 0) {
            console.warn('All cards already owned for group:', groupFilter);
            // Return a special completion card
            return [{
                id: 'collection-complete-' + Date.now(),
                name: 'Collection Complete!',
                group: groupFilter === 'random' ? 'ALL GROUPS' : groupFilter,
                rarity: 'legendary',
                image: 'https://via.placeholder.com/300x400/FFD700/000000?text=🏆%0AComplete!',
                role: 'Master Collector',
                bio: `Congratulations! You've collected all available cards${groupFilter !== 'random' ? ` from ${groupFilter}` : ''}! You are a true K-pop collector!`,
                birthday: 'Today!',
                isCompletionCard: true
            }];
        }
        
        // Determine rarity based on pack type
        const pack = packTypes[packType] || packTypes.basic;
        const rarity = determineRarity(pack.rarity);
        
        // Try to get card of desired rarity
        let card = getRandomCardWithRarity(unownedCards, rarity, new Set());
        
        // If no cards of target rarity available, try fallback rarities
        if (!card) {
            card = getFallbackCard(unownedCards, rarity);
        }
        
        if (card) {
            cards.push({ ...card });
        }
        
        console.log(`Opened ${packType} pack (${groupFilter}) - No Duplicates:`, cards.map(c => `${c.name} (${c.rarity})`));
        return cards;
    }

    // Randomly choose a card within a specific rarity.
    function getRandomCardWithRarity(availableCards, rarity, selectedIndices) {
        const cardsOfRarity = availableCards.filter((card, index) => 
            card.rarity === rarity && !selectedIndices.has(index)
        );
        
        if (cardsOfRarity.length === 0) {
            return null; // Will trigger fallback logic
        }
        
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        const cardIndex = availableCards.findIndex(card => card.id === randomCard.id);
        selectedIndices.add(cardIndex);
        
        return { ...randomCard };
    }

    // Fallback function when target rarity is not available
    function getFallbackCard(availableCards, originalRarity) {
        // Define fallback priority: if target rarity not available, try these in order
        const fallbackPriority = {
            legendary: ['epic', 'rare', 'common'],
            epic: ['legendary', 'rare', 'common'],
            rare: ['epic', 'legendary', 'common'],
            common: ['rare', 'epic', 'legendary']
        };
        
        const fallbacks = fallbackPriority[originalRarity] || ['common', 'rare', 'epic', 'legendary'];
        
        for (const fallbackRarity of fallbacks) {
            const cardsOfRarity = availableCards.filter(card => card.rarity === fallbackRarity);
            if (cardsOfRarity.length > 0) {
                console.log(`No ${originalRarity} cards available, giving ${fallbackRarity} instead`);
                return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        }
        
        // Last resort: any available card
        if (availableCards.length > 0) {
            console.log(`Giving random available card as last resort`);
            return availableCards[Math.floor(Math.random() * availableCards.length)];
        }
        
        return null;
    }

    function determineRarity(rarityConfig) {
        const roll = Math.random() * 100;
        let cumulativeProbability = 0;
        for (const [rarity, probability] of Object.entries(rarityConfig)) {
            cumulativeProbability += probability;
            if (roll < cumulativeProbability) {
                return rarity;
            }
        }
        return 'common';
    }

    function getPackTypes() {
        return Object.keys(packTypes).map(key => ({
            id: key,
            ...packTypes[key]
        }));
    }

    return {
        openPack,
        getPackTypes
    };
})();
