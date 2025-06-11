// Card.js is how the project manages the user's card collection.
const CardManager = (() => {
  let collection = [];

  // Loads the user's card collection from local storage.
  function loadCollection() {
    const savedCollection = localStorage.getItem("kpopCardCollection");
    if (savedCollection) {
      collection = JSON.parse(savedCollection);
    }
  }

  // Saves the collection to the local storage.
  function saveCollection() {
    localStorage.setItem("kpopCardCollection", JSON.stringify(collection));
  }

  // Adds the cards to the collection. If one is already obtained, increase count.
  function addCardsToCollection(cards) {
    cards.forEach((card) => {
      const existingIndex = collection.findIndex((c) => c.id === card.id);
      if (existingIndex === -1) {
        collection.push(card);
      } else {
        if (!collection[existingIndex].count) {
          collection[existingIndex].count = 1;
        }
        collection[existingIndex].count++;
      }
    });
    saveCollection();
  }

  function getCollection() {
    return [...collection];
  }

  function getCardById(id) {
    return collection.find((card) => card.id === id) || null;
  }

  function getOwnedCardIds() {
    return collection.map(card => card.id);
  }

  function hasCard(cardId) {
    return collection.some(card => card.id === cardId);
  }

  return {
    loadCollection,
    saveCollection,
    addCardsToCollection,
    getCollection,
    getCardById,
    getOwnedCardIds,
    hasCard,
  };
})();

// Currency System Manager
const CurrencyManager = (() => {
  let currentBalance = 0;
  const STORAGE_KEY = 'kpopGachaCurrency';

  // Pack costs configuration
  const packCosts = {
    'basic': 100,
    'premium': 250,
    'ultimate': 500
  };

  // Minigame rewards configuration
  const rewards = {
    'lucky-dice': { win: 25, streak: 5 },
    'rock-paper-scissors': { win: 100, streak: 0 },
    'tic-tac-toe': { win: 100, streak: 0 }
  };

  // Game costs configuration (for games that cost money to play)
  const gameCosts = {
    'lucky-dice': 15  // Cost to roll the dice
  };

  function loadCurrency() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      currentBalance = parseInt(saved);
    } else {
      currentBalance = 5000; // Starting currency
      saveCurrency();
    }
    updateCurrencyDisplay();
  }

  function saveCurrency() {
    localStorage.setItem(STORAGE_KEY, currentBalance.toString());
  }

  function earnCurrency(amount, reason = '') {
    currentBalance += amount;
    saveCurrency();
    updateCurrencyDisplay();
    showCurrencyNotification(`+${amount} coins`, reason, 'earn');
  }

  function spendCurrency(amount, reason = '') {
    if (currentBalance >= amount) {
      currentBalance -= amount;
      saveCurrency();
      updateCurrencyDisplay();
      showCurrencyNotification(`-${amount} coins`, reason, 'spend');
      return true;
    }
    return false;
  }

  function getBalance() {
    return currentBalance;
  }

  function getPackCost(packType) {
    return packCosts[packType] || 0;
  }

  function getGameCost(gameType) {
    return gameCosts[gameType] || 0;
  }

  function getReward(gameType, type = 'win') {
    return rewards[gameType] ? rewards[gameType][type] : 0;
  }

  function canAffordPack(packType) {
    return currentBalance >= getPackCost(packType);
  }

  function canAffordGame(gameType) {
    return currentBalance >= getGameCost(gameType);
  }

  function setCurrency(amount) {
    currentBalance = amount;
    saveCurrency();
    updateCurrencyDisplay();
  }

  function updateCurrencyDisplay() {
    const displays = document.querySelectorAll('.currency-display');
    displays.forEach(display => {
      display.textContent = currentBalance.toLocaleString();
    });
  }

  // Initialize currency system
  loadCurrency();

  function showCurrencyNotification(text, reason, type) {
    const notification = document.createElement('div');
    notification.className = `currency-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-main">${text}</div>
      ${reason ? `<div class="notification-reason">${reason}</div>` : ''}
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'earn' ? 'linear-gradient(135deg, #4CAF50, #66BB6A)' : 'linear-gradient(135deg, #f44336, #ef5350)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 25px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      animation: slideInRight 0.5s ease-out;
      min-width: 150px;
      text-align: center;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.5s ease-in';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  return {
    loadCurrency,
    saveCurrency,
    earnCurrency,
    spendCurrency,
    getBalance,
    getPackCost,
    getGameCost,
    getReward,
    canAffordPack,
    canAffordGame,
    updateCurrencyDisplay,
    setCurrency
  };
})();

// Contains the data for each card. 
const CardData = (() => {
  // Generates a placeholder. SHOULD DELETE WHEN NOT NEEDED.
  function getPlaceholderUrl(name, group) {
      const initials = name.split(' ').map(n => n[0]).join('');
      const colorMap = {
          'BTS': '7a3fb0',
          'BLACKPINK': 'ff007f',
          'TWICE': 'ff8b3e',
          'STRAY KIDS': '384cff',
          'ITZY': 'ff363c',
          'AESPA': '00a77d'
      };
      const bgColor = colorMap[group] || 'f8a5c2';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=300&bold=true&font-size=0.33&length=2`;
  }

  // Grabs the picture of the card. Follow the filepath when creating a new card.
  function getCardImage(id, name, group) {
    const realImagePath = `assets/cards/${group.toLowerCase()}/${name}/${id}.png`;
    return realImagePath;
  }

  // Card data for all the cards in the project with proper rarity system
  const cards = [
    // BTS Members - Mixed rarities (using existing system)
    {
      id: "bts-rm",
      name: "Rap Monster",
      group: "BTS",
      role: "Leader, Main Rapper",
      birthday: "September 12, 1994",
      bio: "Kim Nam-joon, known as RM, is the leader of BTS and a skilled rapper and songwriter.",
      image: "assets/cards/bts/rm.png",
      rarity: "legendary"
    },
    {
      id: "bts-jin",
      name: "Jin",
      group: "BTS",
      role: "Vocalist, Visual",
      birthday: "December 4, 1992",
      bio: "Kim Seok-jin, known as Jin, is the oldest member of BTS and is known for his vocals and visuals.",
      image: "assets/cards/bts/jin.png",
      rarity: "rare"
    },
    {
      id: "bts-suga",
      name: "Suga",
      group: "BTS",
      role: "Lead Rapper",
      birthday: "March 9, 1993",
      bio: "Min Yoon-gi, known as Suga, is a rapper, songwriter, and producer in BTS.",
      image: "assets/cards/bts/suga.png",
      rarity: "epic"
    },
    {
      id: "bts-jhope",
      name: "J-Hope",
      group: "BTS",
      role: "Main Dancer, Sub Rapper",
      birthday: "February 18, 1994",
      bio: "Jung Ho-seok, known as J-Hope, is the main dancer and a rapper in BTS.",
      image: "assets/cards/bts/jhope.png",
      rarity: "rare"
    },
    {
      id: "bts-jimin",
      name: "Jimin",
      group: "BTS",
      role: "Main Dancer, Lead Vocalist",
      birthday: "October 13, 1995",
      bio: "Park Ji-min is a vocalist and dancer in BTS known for his expressive performances.",
      image: "assets/cards/bts/jimin.png",
      rarity: "epic"
    },
    {
      id: "bts-v",
      name: "V",
      group: "BTS",
      role: "Vocalist, Visual",
      birthday: "December 30, 1995",
      bio: "Kim Tae-hyung, known as V, is a vocalist and visual in BTS with a unique deep voice.",
      image: "assets/cards/bts/v.png",
      rarity: "legendary"
    },
    {
      id: "bts-jungkook",
      name: "Jungkook",
      group: "BTS",
      role: "Main Vocalist, Lead Dancer, Sub Rapper, Maknae",
      birthday: "September 1, 1997",
      bio: 'Jeon Jung-kook is the youngest member of BTS and is known as the "Golden Maknae" for his all-around talent.',
      image: "assets/cards/bts/Jungkook.png",
      rarity: "legendary"
    },

    // BLACKPINK Members - 2 cards each (one rare, one legendary)
    {
      id: "bp-jisoo",
      name: "Jisoo",
      group: "BLACKPINK",
      role: "Lead Vocalist, Visual",
      birthday: "January 3, 1995",
      bio: "Kim Ji-soo is the oldest member of BLACKPINK and serves as a vocalist and visual.",
      image: "assets/cards/blackpink/Jisoo/bp-jisoo.png",
      rarity: "rare"
    },
    {
      id: "bp-jisoo2",
      name: "Jisoo",
      group: "BLACKPINK",
      role: "Lead Vocalist, Visual",
      birthday: "January 3, 1995",
      bio: "Kim Ji-soo is the oldest member of BLACKPINK and serves as a vocalist and visual.",
      image: "assets/cards/blackpink/Jisoo/bp-jisoo2.png",
      rarity: "legendary"
    },
    {
      id: "bp-jennie",
      name: "Jennie",
      group: "BLACKPINK",
      role: "Main Rapper, Lead Vocalist",
      birthday: "January 16, 1996",
      bio: "Jennie Kim is a rapper and vocalist in BLACKPINK, known for her versatility.",
      image: "assets/cards/blackpink/Jennie/bp-jennie.png",
      rarity: "rare"
    },
    {
      id: "bp-jennie2",
      name: "Jennie",
      group: "BLACKPINK",
      role: "Main Rapper, Lead Vocalist",
      birthday: "January 16, 1996",
      bio: "Jennie Kim is a rapper and vocalist in BLACKPINK, known for her versatility.",
      image: "assets/cards/blackpink/Jennie/bp-jennie2.png",
      rarity: "legendary"
    },
    {
      id: "bp-rose",
      name: "Rosé",
      group: "BLACKPINK",
      role: "Main Vocalist, Lead Dancer",
      birthday: "February 11, 1997",
      bio: "Roseanne Park, known as Rosé, is the main vocalist of BLACKPINK with a unique vocal tone.",
      image: "assets/cards/blackpink/Rose/bp-rose.png",
      rarity: "rare"
    },
    {
      id: "bp-rose2",
      name: "Rosé",
      group: "BLACKPINK",
      role: "Main Vocalist, Lead Dancer",
      birthday: "February 11, 1997",
      bio: "Roseanne Park, known as Rosé, is the main vocalist of BLACKPINK with a unique vocal tone.",
      image: "assets/cards/blackpink/Rose/bp-rose2.png",
      rarity: "legendary"
    },
    {
      id: "bp-lisa",
      name: "Lisa",
      group: "BLACKPINK",
      role: "Main Dancer, Lead Rapper, Maknae",
      birthday: "March 27, 1997",
      bio: "Lalisa Manoban, known as Lisa, is a Thai rapper and dancer in BLACKPINK.",
      image: "assets/cards/blackpink/Lisa/bp-lisa.png",
      rarity: "rare"
    },
    {
      id: "bp-lisa2",
      name: "Lisa",
      group: "BLACKPINK",
      role: "Main Dancer, Lead Rapper, Maknae",
      birthday: "March 27, 1997",
      bio: "Lalisa Manoban, known as Lisa, is a Thai rapper and dancer in BLACKPINK.",
      image: "assets/cards/blackpink/Lisa/bp-lisa2.png",
      rarity: "legendary"
    },

    // TWICE Members - 1 card each (mixed rarities)
    {
      id: "twice-chaeyoung",
      name: "Chaeyoung",
      group: "TWICE",
      role: "Main Rapper, Sub Vocalist",
      birthday: "April 23, 1999",
      bio: "Son Chae-young is the main rapper and sub vocalist of TWICE, known for her creativity and charisma.",
      image: "assets/cards/twice/Chaeyoung/twice-chaeyoung.png",
      rarity: "rare"
    },
    {
      id: "twice-nayeon",
      name: "Nayeon",
      group: "TWICE",
      role: "Main Vocalist, Face of the Group",
      birthday: "September 22, 1995",
      bio: "Im Na-yeon is the oldest member of TWICE and one of the main vocalists.",
      image: "assets/cards/twice/Nayeon/twice-nayeon.png",
      rarity: "legendary"
    },
    {
      id: "twice-jeongyeon",
      name: "Jeongyeon",
      group: "TWICE",
      role: "Lead Vocalist",
      birthday: "November 1, 1996",
      bio: "Yoo Jeong-yeon is a lead vocalist in TWICE and known for her strong voice.",
      image: "assets/cards/twice/Jeongyeon/twice-jeongyeon.png",
      rarity: "common"
    },
    {
      id: "twice-jihyo",
      name: "Jihyo",
      group: "TWICE",
      role: "Leader, Main Vocalist",
      birthday: "February 1, 1997",
      bio: "Park Ji-hyo is the leader and main vocalist of TWICE, known for her powerful voice and leadership.",
      image: "assets/cards/twice/Jihyo/twice-jihyo.png",
      rarity: "epic"
    },
    {
      id: "twice-momo",
      name: "Momo",
      group: "TWICE",
      role: "Main Dancer, Sub Vocalist",
      birthday: "November 9, 1996",
      bio: "Hirai Momo is a Japanese dancer and vocalist in TWICE with powerful dance skills.",
      image: "assets/cards/twice/Momo/twice-momo.png",
      rarity: "rare"
    },
    {
      id: "twice-mina",
      name: "Mina",
      group: "TWICE",
      role: "Main Dancer, Sub Vocalist",
      birthday: "March 24, 1997",
      bio: "Myoui Mina is a Japanese-American member of TWICE, known for her elegance and ballet background.",
      image: "assets/cards/twice/Mina/twice-mina.png",
      rarity: "epic"
    },
    {
      id: "twice-dahyun",
      name: "Dahyun",
      group: "TWICE",
      role: "Lead Rapper, Sub Vocalist",
      birthday: "May 28, 1998",
      bio: "Kim Da-hyun is known for her bright personality and is the lead rapper and sub vocalist of TWICE.",
      image: "assets/cards/twice/Dahyun/twice-dahyun.png",
      rarity: "common"
    },
    {
      id: "twice-tzuyu",
      name: "Tzuyu",
      group: "TWICE",
      role: "Lead Dancer, Sub Vocalist, Visual, Maknae",
      birthday: "June 14, 1999",
      bio: "Chou Tzuyu is the youngest member (maknae) of TWICE, known for her visuals and graceful dancing.",
      image: "assets/cards/twice/Tzuyu/twice-tzuyu.png",
      rarity: "legendary"
    },
    {
      id: "twice-sana",
      name: "Sana",
      group: "TWICE",
      role: "Sub Vocalist",
      birthday: "December 29, 1996",
      bio: "Minatozaki Sana is a Japanese vocalist in TWICE known for her bright personality.",
      image: "assets/cards/twice/Sana/twice-sana.png",
      rarity: "rare"
    },

    // STRAY KIDS Members - 2 cards each (one rare, one legendary)
    {
      id: "skz-bang-chan",
      name: "Bang Chan",
      group: "STRAY KIDS",
      role: "Leader, Producer, Vocalist",
      birthday: "October 3, 1997",
      bio: "Christopher Bang is the leader and producer of Stray Kids, skilled in composing and producing.",
      image: "assets/cards/stray kids/Bang Chan/skz-bang-chan.png",
      rarity: "rare"
    },
    {
      id: "skz-bang-chan2",
      name: "Bang Chan",
      group: "STRAY KIDS",
      role: "Leader, Producer, Vocalist",
      birthday: "October 3, 1997",
      bio: "Christopher Bang is the leader and producer of Stray Kids, skilled in composing and producing.",
      image: "assets/cards/stray kids/Bang Chan/skz-bang-chan2.png",
      rarity: "legendary"
    },
    {
      id: "skz-lee-know",
      name: "Lee Know",
      group: "STRAY KIDS",
      role: "Main Dancer, Sub Vocalist",
      birthday: "October 25, 1998",
      bio: "Lee Min-ho, known as Lee Know, is the main dancer of Stray Kids and a former backup dancer.",
      image: "assets/cards/stray kids/Lee Know/skz-lee-know.png",
      rarity: "rare"
    },
    {
      id: "skz-lee-know2",
      name: "Lee Know",
      group: "STRAY KIDS",
      role: "Main Dancer, Sub Vocalist",
      birthday: "October 25, 1998",
      bio: "Lee Min-ho, known as Lee Know, is the main dancer of Stray Kids and a former backup dancer.",
      image: "assets/cards/stray kids/Lee Know/skz-lee-know2.png",
      rarity: "legendary"
    },
    {
      id: "skz-felix",
      name: "Felix",
      group: "STRAY KIDS",
      role: "Lead Dancer, Rapper",
      birthday: "September 15, 2000",
      bio: "Lee Felix is an Australian member of Stray Kids known for his deep voice and dancing skills.",
      image: "assets/cards/stray kids/Felix/skz-felix.png",
      rarity: "rare"
    },
    {
      id: "skz-felix2",
      name: "Felix",
      group: "STRAY KIDS",
      role: "Lead Dancer, Rapper",
      birthday: "September 15, 2000",
      bio: "Lee Felix is an Australian member of Stray Kids known for his deep voice and dancing skills.",
      image: "assets/cards/stray kids/Felix/skz-felix2.png",
      rarity: "legendary"
    },
    {
      id: "skz-han",
      name: "Han",
      group: "STRAY KIDS",
      role: "Rapper, Vocalist",
      birthday: "September 14th, 2000",
      bio: "Han Jisung is a South Korean member of Stray Kids, known for his songwriting and rap skills.",
      image: "assets/cards/stray kids/Han/skz-han.png",
      rarity: "rare"
    },
    {
      id: "skz-han2",
      name: "Han",
      group: "STRAY KIDS",
      role: "Rapper, Vocalist",
      birthday: "September 14th, 2000",
      bio: "Han Jisung is a South Korean member of Stray Kids, known for his songwriting and rap skills.",
      image: "assets/cards/stray kids/Han/skz-han2.png",
      rarity: "legendary"
    },
    {
      id: "skz-changbin",
      name: "Changbin",
      group: "STRAY KIDS",
      role: "Rapper, Producer",
      birthday: "August 11, 1999",
      bio: "Seo Chang-bin, known as Changbin in the group STRAY KIDS, is known for his producing and rapping.",
      image: "assets/cards/stray kids/Changbin/skz-changbin.png",
      rarity: "rare"
    },
    {
      id: "skz-changbin2",
      name: "Changbin",
      group: "STRAY KIDS",
      role: "Rapper, Producer",
      birthday: "August 11, 1999",
      bio: "Seo Chang-bin, known as Changbin in the group STRAY KIDS, is known for his producing and rapping.",
      image: "assets/cards/stray kids/Changbin/skz-changbin2.png",
      rarity: "legendary"
    },
    {
      id: "skz-hyunjin",
      name: "Hyunjin",
      group: "STRAY KIDS",
      role: "Rapper, Dancer, Visual",
      birthday: "March 20, 2000",
      bio: "South Korean STRAY KIDS member Hyunjin is known for his impressive rap and dancing skills",
      image: "assets/cards/stray kids/Hyunjin/skz-hyunjin.png",
      rarity: "rare"
    },
    {
      id: "skz-hyunjin2",
      name: "Hyunjin",
      group: "STRAY KIDS",
      role: "Rapper, Dancer, Visual",
      birthday: "March 20, 2000",
      bio: "South Korean STRAY KIDS member Hyunjin is known for his impressive rap and dancing skills",
      image: "assets/cards/stray kids/Hyunjin/skz-hyunjin2.png",
      rarity: "legendary"
    },
    {
      id: "skz-in",
      name: "I.N",
      group: "STRAY KIDS",
      role: "Vocalist, Maknae",
      birthday: "February 8, 2001",
      bio: "Yang Jeong-in, known as I.N, is a vocalist member of STRAY KIDS is known for his range.",
      image: "assets/cards/stray kids/I.N/skz-in.png",
      rarity: "rare"
    },
    {
      id: "skz-in2",
      name: "I.N",
      group: "STRAY KIDS",
      role: "Vocalist, Maknae",
      birthday: "February 8, 2001",
      bio: "Yang Jeong-in, known as I.N, is a vocalist member of STRAY KIDS is known for his range.",
      image: "assets/cards/stray kids/I.N/skz-in2.png",
      rarity: "legendary"
    },
    {
      id: "skz-seungmin",
      name: "Seungmin",
      group: "STRAY KIDS",
      role: "Vocalist",
      birthday: "September 22, 2000",
      bio: "Seungmin is a member of STRAY KIDS known for taking on some of the most challenging parts of their songs.",
      image: "assets/cards/stray kids/Seungmin/skz-seungmin.png",
      rarity: "rare"
    },
    {
      id: "skz-seungmin2",
      name: "Seungmin",
      group: "STRAY KIDS",
      role: "Vocalist",
      birthday: "September 22, 2000",
      bio: "Seungmin is a member of STRAY KIDS known for taking on some of the most challenging parts of their songs.",
      image: "assets/cards/stray kids/Seungmin/skz-seungmin2.png",
      rarity: "legendary"
    },
    {
      id: "itzy-yeji",
      name: "Yeji",
      group: "ITZY",
      role: "Leader, Lead Dancer, Lead Rapper, Sub Vocalist",
      birthday: "May 26, 2000",
      bio: "Hwang Ye-ji is the leader of ITZY known for her fierce performances and cat-like features.",
      image: "assets/cards/itzy/Yeji/itzy-yeji.png",
      rarity: "rare"
    },
    {
      id: "itzy-ryujin",
      name: "Ryujin",
      group: "ITZY",
      role: "Center, Main Rapper, Lead Dancer, Sub Vocalist",
      birthday: "April 17, 2001",
      bio: "Shin Ryu-jin is the center of ITZY and won MIXNINE before debuting with the group.",
      image: "assets/cards/itzy/Ryujin/itzy-ryujin.png",
      rarity: "legendary"
    },
    {
      id: "itzy-yuna",
      name: "Yuna",
      group: "ITZY",
      role: "Lead Dancer, Sub Rapper, Sub Vocalist, Visual, Maknae",
      birthday: "December 9, 2003",
      bio: "Shin Yu-na is the youngest member of ITZY and is known for her height and visuals.",
      image: "assets/cards/itzy/Yuna/itzy-yuna.png",
      rarity: "rare"
    },
    {
      id: 'itzy-lia',
      name: 'Lia',
      group: 'ITZY',
      role: 'Main Vocalist, Sub Rapper',
      birthday: 'July 21, 2000',
      bio: 'Choi Ji-su, known as Lia, is the main vocalist of ITZY and is recognized for her elegant visuals and powerful voice.',
      image: "assets/cards/itzy/Lia/itzy-lia.png",
      rarity: "legendary"
    },
    {
      id: 'itzy-chaeryeong',
      name: 'Chaeryeong',
      group: 'ITZY',
      role: 'Main Dancer, Sub Vocalist, Sub Rapper',
      birthday: 'June 5, 2001',
      bio: 'Lee Chaeryeong is praised for her expressive dancing and has trained the longest among ITZY members, previously appearing on survival shows.',
      image: "assets/cards/itzy/Chaeryeong/itzy-chaeryeong.png",
      rarity: "rare"
    },
    {
      id: "aespa-karina",
      name: "Karina",
      group: "AESPA",
      role: "Leader, Main Dancer, Lead Rapper, Sub Vocalist",
      birthday: "April 11, 2000",
      bio: "Yu Ji-min, known as Karina, is the leader of aespa and the face of the group.",
      image: "assets/cards/aespa/Karina/aespa-karina.png",
      rarity: "legendary"
    },
    {
      id: "aespa-winter",
      name: "Winter",
      group: "AESPA",
      role: "Main Vocalist, Lead Dancer, Sub Rapper",
      birthday: "January 1, 2001",
      bio: "Kim Min-jeong, known as Winter, is a vocalist in aespa known for her strong vocals.",
      image: "assets/cards/aespa/Winter/aespa-winter.png",
      rarity: "rare"
    },
    {
      id: "aespa-ningning",
      name: "Ningning",
      group: "AESPA",
      role: "Main Vocalist, Maknae",
      birthday: "October 23, 2002",
      bio: "Ning Yi-zhou, known as Ningning, is a Chinese vocalist in aespa.",
      image: "assets/cards/aespa/Ningning/aespa-ningning.png",
      rarity: "rare"
    },
    {
      id: "aespa-giselle",
      name: "Giselle",
      group: "AESPA",
      role: "Main Rapper, Sub Vocalist",
      birthday: "October 30, 2000",
      bio: "Aeri Uchinaga, known as Giselle, is a Japanese-American rapper in aespa.",
      image: "assets/cards/aespa/Giselle/giselle.jpeg",
      rarity: "epic"
    }
  ];

  function getAllCards() {
    return [...cards];
  }

  function getCardsByGroup(groupName) {
    return cards.filter((card) => card.group === groupName);
  }

  function getCardById(id) {
    return cards.find((card) => card.id === id) || null;
  }

  return {
    getAllCards,
    getCardsByGroup,
    getCardById,
  };
})();

// Pack Manager - Handles card pack opening with rarity system
const PackManager = (() => {
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

  function openPack(packType = 'basic', groupFilter = 'random') {
    const cardCount = getPackCardCount(packType);
    const cards = [];
    
    // Get available cards based on group filter
    const availableCards = getAvailableCards(groupFilter);
    
    if (availableCards.length === 0) {
      console.warn('No cards available for group:', groupFilter);
      return [];
    }

    // Generate cards based on pack type and rarity rates
    for (let i = 0; i < cardCount; i++) {
      const rarity = determineCardRarity(packType, groupFilter, i, cardCount);
      const card = selectRandomCardByRarity(availableCards, rarity);
      if (card) {
        cards.push({ ...card });
      }
    }

    // Ensure at least one guaranteed rarity for group packs
    if (groupFilter !== 'random' && groupPackConfigs[groupFilter]) {
      ensureGuaranteedRarity(cards, availableCards, groupFilter);
    }

    console.log(`Opened ${packType} pack (${groupFilter}):`, cards.map(c => `${c.name} (${c.rarity})`));
    return cards;
  }

  function getPackCardCount(packType) {
    const counts = {
      basic: 1,
      premium: 1,
      ultimate: 1
    };
    return counts[packType] || 1;
  }

  function getAvailableCards(groupFilter) {
    const allCards = CardData.getAllCards();
    
    if (groupFilter === 'random') {
      return allCards;
    }
    
    return allCards.filter(card => card.group === groupFilter);
  }

  function determineCardRarity(packType, groupFilter, cardIndex, totalCards) {
    const rates = packRarityRates[packType] || packRarityRates.basic;
    
    // Apply group bonus for legendary chance
    let adjustedRates = { ...rates };
    if (groupFilter !== 'random' && groupPackConfigs[groupFilter]) {
      const bonus = groupPackConfigs[groupFilter].bonusLegendary;
      adjustedRates.legendary += bonus;
      adjustedRates.common -= bonus; // Reduce common to compensate
    }

    // Guarantee at least one rare+ card in the last slot for premium/ultimate packs
    if ((packType === 'premium' || packType === 'ultimate') && cardIndex === totalCards - 1) {
      const hasRareOrBetter = false; // We'll check this in a real implementation
      if (!hasRareOrBetter) {
        adjustedRates = {
          common: 0,
          rare: 0.60,
          epic: 0.30,
          legendary: 0.10
        };
      }
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

  function selectRandomCardByRarity(availableCards, targetRarity) {
    const cardsOfRarity = availableCards.filter(card => card.rarity === targetRarity);
    
    if (cardsOfRarity.length === 0) {
      // Fallback to any available card if no cards of target rarity exist
      console.warn(`No ${targetRarity} cards available, selecting random card`);
      return availableCards[Math.floor(Math.random() * availableCards.length)];
    }
    
    return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
  }

  function ensureGuaranteedRarity(cards, availableCards, groupFilter) {
    const config = groupPackConfigs[groupFilter];
    if (!config) return;

    const guaranteedRarity = config.guaranteed;
    const hasGuaranteed = cards.some(card => 
      card.rarity === guaranteedRarity || 
      (guaranteedRarity === 'rare' && (card.rarity === 'epic' || card.rarity === 'legendary')) ||
      (guaranteedRarity === 'epic' && card.rarity === 'legendary')
    );

    if (!hasGuaranteed && cards.length > 0) {
      // Replace the first common card with guaranteed rarity
      const commonIndex = cards.findIndex(card => card.rarity === 'common');
      if (commonIndex !== -1) {
        const guaranteedCard = selectRandomCardByRarity(availableCards, guaranteedRarity);
        if (guaranteedCard) {
          cards[commonIndex] = { ...guaranteedCard };
        }
      }
    }
  }

  return {
    openPack
  };
})();
