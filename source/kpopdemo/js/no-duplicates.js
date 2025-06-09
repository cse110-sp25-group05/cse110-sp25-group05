// No Duplicates Pack Manager - Enhanced pack opening that prevents duplicate cards
window.NoDuplicatesPackManager = (() => {
  
  function openPackWithoutDuplicates(packType = 'basic', groupFilter = 'random') {
    const cardCount = 1; // All packs give 1 card
    const cards = [];
    
    // Get available cards based on group filter
    const availableCards = getAvailableCards(groupFilter);
    
    // Get owned card IDs to avoid duplicates
    const ownedCardIds = CardManager.getOwnedCardIds();
    const unownedCards = availableCards.filter(card => !ownedCardIds.includes(card.id));
    
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

    // Generate cards based on pack type and rarity rates
    for (let i = 0; i < cardCount; i++) {
      let rarity = determineCardRarity(packType, groupFilter, i, cardCount);
      let card = selectRandomCardByRarity(unownedCards, rarity);
      
      // If no cards of target rarity available, try fallback rarities
      if (!card) {
        card = selectFallbackCard(unownedCards, rarity);
      }
      
      if (card) {
        cards.push({ ...card });
        // Remove selected card from unowned pool to prevent duplicates in same pack
        const cardIndex = unownedCards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          unownedCards.splice(cardIndex, 1);
        }
      }
    }

    console.log(`Opened ${packType} pack (${groupFilter}) - No Duplicates:`, cards.map(c => `${c.name} (${c.rarity})`));
    return cards;
  }

  function selectFallbackCard(availableCards, originalRarity) {
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

  function selectRandomCardByRarity(availableCards, targetRarity) {
    const cardsOfRarity = availableCards.filter(card => card.rarity === targetRarity);
    
    if (cardsOfRarity.length === 0) {
      return null; // Will trigger fallback logic
    }
    
    return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
  }

  function getAvailableCards(groupFilter) {
    const allCards = CardData.getAllCards();
    
    if (groupFilter === 'random') {
      return allCards;
    }
    
    return allCards.filter(card => card.group === groupFilter);
  }

  function determineCardRarity(packType, groupFilter, cardIndex, totalCards) {
    // Rarity drop rates for different pack types
    const packRarityRates = {
      basic: {
        common: 0.50,    // 50%
        rare: 0.35,      // 35%
        epic: 0.12,      // 12%
        legendary: 0.03  // 3%
      },
      premium: {
        common: 0.30,    // 30%
        rare: 0.45,      // 45%
        epic: 0.20,      // 20%
        legendary: 0.05  // 5%
      },
      ultimate: {
        common: 0.15,    // 15%
        rare: 0.40,      // 40%
        epic: 0.30,      // 30%
        legendary: 0.15  // 15%
      }
    };

    // Group-specific pack configurations
    const groupPackConfigs = {
      'BTS': { guaranteed: 'epic', bonusLegendary: 0.10 },
      'BLACKPINK': { guaranteed: 'rare', bonusLegendary: 0.08 },
      'TWICE': { guaranteed: 'rare', bonusLegendary: 0.06 },
      'STRAY KIDS': { guaranteed: 'rare', bonusLegendary: 0.08 },
      'ITZY': { guaranteed: 'rare', bonusLegendary: 0.07 },
      'AESPA': { guaranteed: 'epic', bonusLegendary: 0.09 }
    };
    
    const rates = packRarityRates[packType] || packRarityRates.basic;
    
    // Apply group bonus for legendary chance
    let adjustedRates = { ...rates };
    if (groupFilter !== 'random' && groupPackConfigs[groupFilter]) {
      const bonus = groupPackConfigs[groupFilter].bonusLegendary;
      adjustedRates.legendary += bonus;
      adjustedRates.common -= bonus; // Reduce common to compensate
    }

    return selectRarityByProbability(adjustedRates);
  }

  function selectRarityByProbability(rates) {
    const random = Math.random();
    let cumulative = 0;
    
    const rarities = ['legendary', 'epic', 'rare', 'common'];
    
    for (const rarity of rarities) {
      cumulative += rates[rarity] || 0;
      if (random <= cumulative) {
        return rarity;
      }
    }
    
    return 'common'; // Fallback
  }

  // Override the original PackManager openPack function
  if (window.PackManager) {
    window.PackManager.openPack = openPackWithoutDuplicates;
  }

  return {
    openPack: openPackWithoutDuplicates
  };
})(); 