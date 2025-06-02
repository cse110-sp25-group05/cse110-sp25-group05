const CardManager = (() => 
{
    let collection = [];

    function loadCollection() 
    {
        const savedCollection = localStorage.getItem('kpopCardCollection');
        if (savedCollection) 
        {
            collection = JSON.parse(savedCollection);
        }
    }

    function saveCollection() 
    {
        localStorage.setItem('kpopCardCollection', JSON.stringify(collection));
    }

    function addCardsToCollection(cards) 
    {
        cards.forEach(card => 
        {
            const existingIndex = collection.findIndex(c => c.id === card.id);
            if (existingIndex === -1) 
            {
                collection.push(card);
            } else 
            {
                if (!collection[existingIndex].count) {
                    collection[existingIndex].count = 1;
                }
                collection[existingIndex].count++;
            }
        });
        saveCollection();
    }

    function getCollection() 
    {
        return [...collection];
    }

    function getCardById(id) 
    {
        return collection.find(card => card.id === id) || null;
    }

    return {
        loadCollection,
        saveCollection,
        addCardsToCollection,
        getCollection,
        getCardById
    };
})();

const CardData = (() => 
{
    function getPlaceholderUrl(name, group) 
    {
        const initials = name.split(' ').map(n => n[0]).join('');
        const colorMap = 
        {
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

    function getCardImage(id, name, group) 
    {
        const realImagePath = `src/assets/cards/${group.toLowerCase()}/${id}.jpg`;
        return getPlaceholderUrl(name, group);
    }

    const cards = [
        {
            id: 'bts-rm',
            name: 'RM',
            group: 'BTS',
            role: 'Leader, Main Rapper',
            birthday: 'September 12, 1994',
            bio: 'Kim Nam-joon, known as RM, is the leader of BTS and a skilled rapper and songwriter.',
            image: getCardImage('bts-rm', 'RM', 'BTS')
        },
        {
            id: 'bts-jin',
            name: 'Jin',
            group: 'BTS',
            role: 'Vocalist, Visual',
            birthday: 'December 4, 1992',
            bio: 'Kim Seok-jin, known as Jin, is the oldest member of BTS and is known for his vocals and visuals.',
            image: getCardImage('bts-jin', 'Jin', 'BTS')
        },
        {
            id: 'bts-suga',
            name: 'Suga',
            group: 'BTS',
            role: 'Lead Rapper',
            birthday: 'March 9, 1993',
            bio: 'Min Yoon-gi, known as Suga, is a rapper, songwriter, and producer in BTS.',
            image: getCardImage('bts-suga', 'Suga', 'BTS')
        },
        {
            id: 'bts-jhope',
            name: 'J-Hope',
            group: 'BTS',
            role: 'Main Dancer, Sub Rapper',
            birthday: 'February 18, 1994',
            bio: 'Jung Ho-seok, known as J-Hope, is the main dancer and a rapper in BTS.',
            image: getCardImage('bts-jhope', 'J-Hope', 'BTS')
        },
        {
            id: 'bts-jimin',
            name: 'Jimin',
            group: 'BTS',
            role: 'Main Dancer, Lead Vocalist',
            birthday: 'October 13, 1995',
            bio: 'Park Ji-min is a vocalist and dancer in BTS known for his expressive performances.',
            image: getCardImage('bts-jimin', 'Jimin', 'BTS')
        },
        {
            id: 'bts-v',
            name: 'V',
            group: 'BTS',
            role: 'Vocalist, Visual',
            birthday: 'December 30, 1995',
            bio: 'Kim Tae-hyung, known as V, is a vocalist and visual in BTS with a unique deep voice.',
            image: getCardImage('bts-v', 'V', 'BTS')
        },
        {
            id: 'bts-jungkook',
            name: 'Jungkook',
            group: 'BTS',
            role: 'Main Vocalist, Lead Dancer, Sub Rapper, Maknae',
            birthday: 'September 1, 1997',
            bio: 'Jeon Jung-kook is the youngest member of BTS and is known as the "Golden Maknae" for his all-around talent.',
            image: getCardImage('bts-jungkook', 'Jungkook', 'BTS')
        },
        {
            id: 'bp-jisoo',
            name: 'Jisoo',
            group: 'BLACKPINK',
            role: 'Lead Vocalist, Visual',
            birthday: 'January 3, 1995',
            bio: 'Kim Ji-soo is the oldest member of BLACKPINK and serves as a vocalist and visual.',
            image: getCardImage('bp-jisoo', 'Jisoo', 'BLACKPINK')
        },
        {
            id: 'bp-jennie',
            name: 'Jennie',
            group: 'BLACKPINK',
            role: 'Main Rapper, Lead Vocalist',
            birthday: 'January 16, 1996',
            bio: 'Jennie Kim is a rapper and vocalist in BLACKPINK, known for her versatility.',
            image: getCardImage('bp-jennie', 'Jennie', 'BLACKPINK')
        },
        {
            id: 'bp-rose',
            name: 'Rosé',
            group: 'BLACKPINK',
            role: 'Main Vocalist, Lead Dancer',
            birthday: 'February 11, 1997',
            bio: 'Roseanne Park, known as Rosé, is the main vocalist of BLACKPINK with a unique vocal tone.',
            image: getCardImage('bp-rose', 'Rosé', 'BLACKPINK')
        },
        {
            id: 'bp-lisa',
            name: 'Lisa',
            group: 'BLACKPINK',
            role: 'Main Dancer, Lead Rapper, Maknae',
            birthday: 'March 27, 1997',
            bio: 'Lalisa Manoban, known as Lisa, is a Thai rapper and dancer in BLACKPINK.',
            image: getCardImage('bp-lisa', 'Lisa', 'BLACKPINK')
        },
        {
            id: 'twice-nayeon',
            name: 'Nayeon',
            group: 'TWICE',
            role: 'Main Vocalist, Face of the Group',
            birthday: 'September 22, 1995',
            bio: 'Im Na-yeon is the oldest member of TWICE and one of the main vocalists.',
            image: getCardImage('twice-nayeon', 'Nayeon', 'TWICE')
        },
        {
            id: 'twice-jeongyeon',
            name: 'Jeongyeon',
            group: 'TWICE',
            role: 'Lead Vocalist',
            birthday: 'November 1, 1996',
            bio: 'Yoo Jeong-yeon is a lead vocalist in TWICE and known for her strong voice.',
            image: getCardImage('twice-jeongyeon', 'Jeongyeon', 'TWICE')
        },
        {
            id: 'twice-momo',
            name: 'Momo',
            group: 'TWICE',
            role: 'Main Dancer, Sub Vocalist',
            birthday: 'November 9, 1996',
            bio: 'Hirai Momo is a Japanese dancer and vocalist in TWICE with powerful dance skills.',
            image: getCardImage('twice-momo', 'Momo', 'TWICE')
        },
        {
            id: 'twice-sana',
            name: 'Sana',
            group: 'TWICE',
            role: 'Sub Vocalist',
            birthday: 'December 29, 1996',
            bio: 'Minatozaki Sana is a Japanese vocalist in TWICE known for her bright personality.',
            image: getCardImage('twice-sana', 'Sana', 'TWICE')
        },
        {
            id: 'skz-bang-chan',
            name: 'Bang Chan',
            group: 'STRAY KIDS',
            role: 'Leader, Producer, Vocalist',
            birthday: 'October 3, 1997',
            bio: 'Christopher Bang is the leader and producer of Stray Kids, skilled in composing and producing.',
            image: getCardImage('skz-bang-chan', 'Bang Chan', 'STRAY KIDS')
        },
        {
            id: 'skz-lee-know',
            name: 'Lee Know',
            group: 'STRAY KIDS',
            role: 'Main Dancer, Sub Vocalist',
            birthday: 'October 25, 1998',
            bio: 'Lee Min-ho, known as Lee Know, is the main dancer of Stray Kids and a former backup dancer.',
            image: getCardImage('skz-lee-know', 'Lee Know', 'STRAY KIDS')
        },
        {
            id: 'skz-felix',
            name: 'Felix',
            group: 'STRAY KIDS',
            role: 'Lead Dancer, Rapper',
            birthday: 'September 15, 2000',
            bio: 'Lee Felix is an Australian member of Stray Kids known for his deep voice and dancing skills.',
            image: getCardImage('skz-felix', 'Felix', 'STRAY KIDS')
        },
        {
            id: 'itzy-yeji',
            name: 'Yeji',
            group: 'ITZY',
            role: 'Leader, Main Dancer, Lead Vocalist',
            birthday: 'May 26, 2000',
            bio: 'Hwang Ye-ji is the leader of ITZY known for her fierce performances and cat-like features.',
            image: getCardImage('itzy-yeji', 'Yeji', 'ITZY')
        },
        {
            id: 'itzy-ryujin',
            name: 'Ryujin',
            group: 'ITZY',
            role: 'Main Rapper, Lead Dancer, Sub Vocalist',
            birthday: 'April 17, 2001',
            bio: 'Shin Ryu-jin is the center of ITZY and won MIXNINE before debuting with the group.',
            image: getCardImage('itzy-ryujin', 'Ryujin', 'ITZY')
        },
        {
            id: 'itzy-yuna',
            name: 'Yuna',
            group: 'ITZY',
            role: 'Lead Rapper, Lead Dancer, Sub Vocalist, Visual, Maknae',
            birthday: 'December 9, 2003',
            bio: 'Shin Yu-na is the youngest member of ITZY and is known for her height and visuals.',
            image: getCardImage('itzy-yuna', 'Yuna', 'ITZY')
        },
        {
            id: 'aespa-karina',
            name: 'Karina',
            group: 'AESPA',
            role: 'Leader, Main Dancer, Lead Vocalist, Visual',
            birthday: 'April 11, 2000',
            bio: 'Yu Ji-min, known as Karina, is the leader of aespa and the face of the group.',
            image: getCardImage('aespa-karina', 'Karina', 'AESPA')
        },
        {
            id: 'aespa-winter',
            name: 'Winter',
            group: 'AESPA',
            role: 'Main Vocalist, Lead Dancer',
            birthday: 'January 1, 2001',
            bio: 'Kim Min-jeong, known as Winter, is a vocalist in aespa known for her strong vocals.',
            image: getCardImage('aespa-winter', 'Winter', 'AESPA')
        },
        {
            id: 'aespa-ningning',
            name: 'Ningning',
            group: 'AESPA',
            role: 'Main Vocalist, Maknae',
            birthday: 'October 23, 2002',
            bio: 'Ning Yi-zhou, known as Ningning, is a Chinese vocalist in aespa.',
            image: getCardImage('aespa-ningning', 'Ningning', 'AESPA')
        }
    ];

    function getAllCards() 
    {
        return [...cards];
    }

    function getCardsByGroup(groupName) 
    {
        return cards.filter(card => card.group === groupName);
    }

    function getCardById(id) 
    {
        return cards.find(card => card.id === id) || null;
    }

    return {
        getAllCards,
        getCardsByGroup,
        getCardById
    };
})();
