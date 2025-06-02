const PackManager = (() => 
{
    const packTypes = 
    {
        basic: 
        {
            name: 'Basic Summon',
            cardCount: 5,
            rarity: 
            {
                common: 75,
                rare: 20,
                epic: 5,
                legendary: 0
            }
        },
        premium: 
        {
            name: 'Premium Summon',
            cardCount: 7,
            rarity: 
            {
                common: 60,
                rare: 30,
                epic: 8,
                legendary: 2
            }
        },
        ultimate: 
        {
            name: 'Legendary Summon',
            cardCount: 10,
            rarity: 
            {
                common: 40,
                rare: 35,
                epic: 15,
                legendary: 10
            }
        }
    };

    function openPack(packType = 'basic', groupFilter = 'random') 
    {
        const pack = packTypes[packType] || packTypes.basic;
        let cardCount = pack.cardCount;
        const cards = [];
        let availableCards = CardData.getAllCards();
        if (groupFilter !== 'random') 
        {
            availableCards = CardData.getCardsByGroup(groupFilter);
            if (availableCards.length < cardCount) 
            {
                cardCount = availableCards.length;
            }
        }
        if (availableCards.length === 0) 
        {
            console.error('No cards available for the specified group');
            return [];
        }
        const guaranteedSlots = [];
        if (packType === 'premium') 
        {
            guaranteedSlots.push('rare');
        }
        if (packType === 'ultimate') 
        {
            guaranteedSlots.push('epic');
            if (Math.random() < 0.5) 
            {
                guaranteedSlots.push('legendary');
            }
        }
        const selectedIndices = new Set();
        guaranteedSlots.forEach(guaranteedRarity => 
        {
            const card = getRandomCardWithRarity(availableCards, guaranteedRarity, selectedIndices);
            if (card) 
            {
                cards.push(card);
            }
        });
        while (cards.length < cardCount && selectedIndices.size < availableCards.length) 
        {
            const rarity = determineRarity(pack.rarity);
            const card = getRandomCardWithRarity(availableCards, rarity, selectedIndices);
            if (card) 
            {
                cards.push(card);
            }
        }
        return cards;
    }

    function getRandomCardWithRarity(availableCards, rarity, selectedIndices) 
    {
        const availableIndices = [];
        for (let i = 0; i < availableCards.length; i++) 
        {
            if (!selectedIndices.has(i)) 
            {
                availableIndices.push(i);
            }
        }
        if (availableIndices.length === 0) 
        {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const cardIndex = availableIndices[randomIndex];
        selectedIndices.add(cardIndex);
        const card = { ...availableCards[cardIndex] };
        card.rarity = rarity;
        return card;
    }

    function determineRarity(rarityConfig) 
    {
        const roll = Math.random() * 100;
        let cumulativeProbability = 0;
        for (const [rarity, probability] of Object.entries(rarityConfig)) 
        {
            cumulativeProbability += probability;
            if (roll < cumulativeProbability) 
            {
                return rarity;
            }
        }
        return 'common';
    }

    function getPackTypes() 
    {
        return Object.keys(packTypes).map(key => 
        ({
            id: key,
            ...packTypes[key]
        }));
    }

    return {
        openPack,
        getPackTypes
    };
})();
