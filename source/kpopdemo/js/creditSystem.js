const CreditSystem = (() => {
    // Credit storage key in localStorage
    const CREDITS_STORAGE_KEY = 'kpop_gacha_credits';
    
    // Pack costs in credits
    const PACK_COSTS = {
        basic: 100,
        premium: 250,
        ultimate: 500
    };
    
    // Mini-game rewards
    const MINI_GAME_REWARDS = {
        rockPaperScissors: {
            win: 50,
            draw: 10,
            lose: 5
        },
        ticTacToe: {
            win: 75,
            draw: 15,
            lose: 10
        }
    };
    
    // Daily bonus credits
    const DAILY_BONUS = 100;
    const DAILY_BONUS_KEY = 'kpop_gacha_daily_bonus';
    
    /**
     * Initialize the credit system
     */
    function init() {
        updateCreditDisplay();
        checkDailyBonus();
        setupCreditEventListeners();
        updatePackButtonStates();
    }
    
    /**
     * Get current credit balance
     */
    function getCredits() 
    {
        const credits = localStorage.getItem(CREDITS_STORAGE_KEY);
        return credits ? parseInt(credits, 10) : 0;
    }
    
    /**
     * Set credit balance
     */
    function setCredits(amount) {
        const newAmount = Math.max(0, amount); // Ensure credits never go negative
        localStorage.setItem(CREDITS_STORAGE_KEY, newAmount.toString());
        updateCreditDisplay();
        updatePackButtonStates();
        return newAmount;
    }
    
    /**
     * Add credits to current balance
     */
    function addCredits(amount) {
        const currentCredits = getCredits();
        const newCredits = setCredits(currentCredits + amount);
        showCreditNotification(`+${amount} credits earned!`, 'success');
        return newCredits;
    }
    
    /**
     * Subtract credits from current balance
     */
    function spendCredits(amount) {
        const currentCredits = getCredits();
        if (currentCredits >= amount) {
            const newCredits = setCredits(currentCredits - amount);
            showCreditNotification(`-${amount} credits spent`, 'info');
            return { success: true, newBalance: newCredits };
        } else {
            showCreditNotification('Insufficient credits!', 'error');
            return { success: false, newBalance: currentCredits };
        }
    }
    
    /**
     * Check if user can afford a pack
     */
    function canAffordPack(packType) {
        const cost = PACK_COSTS[packType] || PACK_COSTS.basic;
        return getCredits() >= cost;
    }
    
    /**
     * Get pack cost
     */
    function getPackCost(packType) {
        return PACK_COSTS[packType] || PACK_COSTS.basic;
    }
    
    /**
     * Process pack purchase
     */
    function purchasePack(packType) {
        const cost = getPackCost(packType);
        const result = spendCredits(cost);
        return result;
    }
    
    /**
     * Reward credits for mini-game completion
     */
    function rewardMiniGame(gameType, result) {
        const gameRewards = MINI_GAME_REWARDS[gameType];
        if (!gameRewards) {
            console.error(`Unknown mini-game type: ${gameType}`);
            return 0;
        }
        
        const reward = gameRewards[result] || 0;
        if (reward > 0) {
            addCredits(reward);
            showGameRewardNotification(gameType, result, reward);
        }
        return reward;
    }
    
    /**
     * Check and give daily bonus
     */
    function checkDailyBonus() {
        const today = new Date().toDateString();
        const lastBonus = localStorage.getItem(DAILY_BONUS_KEY);
        
        if (lastBonus !== today) {
            addCredits(DAILY_BONUS);
            localStorage.setItem(DAILY_BONUS_KEY, today);
            showCreditNotification(`Daily bonus: +${DAILY_BONUS} credits!`, 'bonus');
        }
    }
    
    /**
     * Update credit display in UI
     */
    function updateCreditDisplay() {
        const creditDisplay = document.getElementById('credit-display');
        if (creditDisplay) {
            const newAmount = getCredits().toLocaleString();
            if (creditDisplay.textContent !== newAmount) {
                // Add animation class for credit change
                creditDisplay.classList.add('credit-change');
                creditDisplay.textContent = newAmount;
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    creditDisplay.classList.remove('credit-change');
                }, 600);
            }
        }
    }
    
    /**
     * Update pack button states based on available credits
     */
    function updatePackButtonStates() {
        const packButtons = document.querySelectorAll('.open-pack-btn');
        packButtons.forEach(button => {
            const packType = button.getAttribute('data-type');
            const cost = getPackCost(packType);
            const canAfford = canAffordPack(packType);
            
            // Update button text to show cost
            const originalText = button.textContent;
            if (!originalText.includes('credits')) {
                button.textContent = `${originalText} (${cost} credits)`;
            }
            
            // Enable/disable button based on affordability
            button.disabled = !canAfford;
            button.classList.toggle('insufficient-credits', !canAfford);
            
            // Update tooltip
            button.title = canAfford ? 
                `Cost: ${cost} credits` : 
                `Insufficient credits! Need ${cost} credits`;
        });
    }
    
    /**
     * Setup event listeners for credit-related interactions
     */
    function setupCreditEventListeners() {
        // Add click listeners to pack buttons to handle credit spending
        const packButtons = document.querySelectorAll('.open-pack-btn');
        packButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                const packType = this.getAttribute('data-type');
                const canAfford = canAffordPack(packType);
                
                if (!canAfford) {
                    event.preventDefault();
                    event.stopPropagation();
                    showCreditNotification('Not enough credits to open this pack!', 'error');
                    showEarnCreditsModal();
                    return false;
                }
                
                // Purchase the pack (deduct credits)
                const result = purchasePack(packType);
                if (!result.success) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            });
        });
    }
    
    /**
     * Show credit notification
     */
    function showCreditNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `credit-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-coins"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Show specific game reward notification
     */
    function showGameRewardNotification(gameType, result, reward) {
        const gameNames = {
            rockPaperScissors: 'Rock Paper Scissors',
            ticTacToe: 'Tic Tac Toe'
        };
        
        const resultMessages = {
            win: 'Victory!',
            draw: 'Draw!',
            lose: 'Good try!'
        };
        
        const message = `${gameNames[gameType]} - ${resultMessages[result]} +${reward} credits`;
        showCreditNotification(message, result === 'win' ? 'success' : 'info');
    }
    
    /**
     * Show modal with options to earn credits
     */
    function showEarnCreditsModal() {
        const modal = document.createElement('div');
        modal.className = 'credit-modal';
        modal.innerHTML = `
            <div class="credit-modal-content">
                <div class="credit-modal-header">
                    <h3><i class="fas fa-coins"></i> Need More Credits?</h3>
                    <button class="credit-modal-close">&times;</button>
                </div>
                <div class="credit-modal-body">
                    <p>You need more credits to open this pack. Here's how you can earn them:</p>
                    <div class="earn-options">
                        <div class="earn-option">
                            <i class="fas fa-hand-rock"></i>
                            <h4>Rock Paper Scissors</h4>
                            <p>Win: 50 credits | Draw: 10 credits | Lose: 5 credits</p>
                            <button class="play-game-btn" data-game="rockPaperScissors">Play Now</button>
                        </div>
                        <div class="earn-option">
                            <i class="fas fa-th"></i>
                            <h4>Tic Tac Toe</h4>
                            <p>Win: 75 credits | Draw: 15 credits | Lose: 10 credits</p>
                            <button class="play-game-btn" data-game="ticTacToe">Play Now</button>
                        </div>
                        <div class="earn-option">
                            <i class="fas fa-gift"></i>
                            <h4>Daily Bonus</h4>
                            <p>Come back tomorrow for 100 free credits!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.credit-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add game button listeners (placeholder - will be connected to actual games)
        modal.querySelectorAll('.play-game-btn').forEach(button => {
            button.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                modal.remove();
                // This will be connected to the actual mini-games
                if (window.MiniGames && window.MiniGames[gameType]) {
                    window.MiniGames[gameType].start();
                } else {
                    showCreditNotification('Mini-game coming soon!', 'info');
                }
            });
        });
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }
    
    /**
     * Reset credits (for testing purposes)
     */
    function resetCredits() {
        setCredits(1000); // Give starting amount
        localStorage.removeItem(DAILY_BONUS_KEY);
        showCreditNotification('Credits reset to 1000!', 'info');
    }
    
    /**
     * Get mini-game rewards info
     */
    function getMiniGameRewards() {
        return { ...MINI_GAME_REWARDS };
    }
    
    /**
     * Get pack costs info
     */
    function getPackCosts() {
        return { ...PACK_COSTS };
    }
    
    // Public API
    return {
        init,
        getCredits,
        setCredits,
        addCredits,
        spendCredits,
        canAffordPack,
        getPackCost,
        purchasePack,
        rewardMiniGame,
        checkDailyBonus,
        updateCreditDisplay,
        updatePackButtonStates,
        showEarnCreditsModal,
        resetCredits,
        getMiniGameRewards,
        getPackCosts
    };
})();

// Initialize credit system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CreditSystem.init();
}); 