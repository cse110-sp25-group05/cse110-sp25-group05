document.addEventListener('DOMContentLoaded', () => {
    const gameTabs = document.querySelectorAll('.game-tab');
    const gameSections = document.querySelectorAll('.game-section');

    function switchGame(gameType) {
        // Update tab active states
        gameTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.game === gameType) {
                tab.classList.add('active');
            }
        });

        // Update game section visibility
        gameSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${gameType}-game`) {
                section.classList.add('active');
            }
        });

        // Add transition animation
        const activeSection = document.querySelector('.game-section.active');
        if (activeSection) {
            activeSection.style.opacity = '0';
            activeSection.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                activeSection.style.opacity = '1';
                activeSection.style.transform = 'translateY(0)';
            }, 50);
        }
    }

    // Add click event listeners to tabs
    gameTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const gameType = tab.dataset.game;
            switchGame(gameType);
            
            // Add pressed animation
            tab.classList.add('tab-pressed');
            setTimeout(() => tab.classList.remove('tab-pressed'), 150);
        });
    });

    // Initialize with RPS game active
    switchGame('rps');
}); 