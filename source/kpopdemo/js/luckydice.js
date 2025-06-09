document.addEventListener('DOMContentLoaded', () => {
    // Game Elements
    const gameTabButtons = document.querySelectorAll('.game-tab');
    const gameSections = document.querySelectorAll('.game-section');
    const betButtons = document.querySelectorAll('.bet-btn');
    const rollButton = document.getElementById('roll-dice-btn');
    const resetButton = document.getElementById('reset-dice-game');
    const diceDisplay = document.getElementById('dice-display');
    const resultDiv = document.getElementById('dice-result');
    
    // Score Elements
    const winsSpan = document.getElementById('dice-wins');
    const lossesSpan = document.getElementById('dice-losses');
    const currentStreakSpan = document.getElementById('dice-current-streak');
    const bestStreakSpan = document.getElementById('dice-best-streak');
    const roundSpan = document.getElementById('dice-round');
    
    // Game State
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let bestStreak = parseInt(localStorage.getItem('dice-best-streak') || '0');
    let currentBet = 'low';
    let isRolling = false;
    let roundNumber = 1;
    let rollHistory = [];
    let hotStreak = 0;
    let coldStreak = 0;
    let bonusRoundActive = false;
    let consecutiveWins = 0;
    
    // Initialize game
    if (bestStreakSpan) bestStreakSpan.textContent = bestStreak;
    
    // Dice face emojis
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    // Enhanced betting configurations with dynamic multipliers
    const betConfigs = {
        low: {
            name: 'Low (2-6)',
            condition: total => total >= 2 && total <= 6,
            multiplier: 2,
            icon: '⬇️',
            color: '#4CAF50',
            probability: 0.417 // 15/36 combinations
        },
        high: {
            name: 'High (8-12)',
            condition: total => total >= 8 && total <= 12,
            multiplier: 2,
            icon: '⬆️',
            color: '#2196F3',
            probability: 0.417 // 15/36 combinations
        },
        lucky7: {
            name: 'Lucky 7',
            condition: total => total === 7,
            multiplier: 5,
            icon: '⭐',
            color: '#FF6F00',
            probability: 0.167 // 6/36 combinations
        },
        doubles: {
            name: 'Doubles',
            condition: (total, die1, die2) => die1 === die2,
            multiplier: 4,
            icon: '💎',
            color: '#9C27B0',
            probability: 0.167 // 6/36 combinations
        }
    };
    
    // Game tab switching
    gameTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetGame = button.dataset.game;
            
            // Update active tab
            gameTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show/hide game sections
            gameSections.forEach(section => {
                section.classList.remove('active');
                if ((targetGame === 'lucky-dice' && section.id === 'lucky-dice-section') ||
                    (targetGame === 'rock-paper-scissors' && section.id === 'rps-section') ||
                    (targetGame === 'tic-tac-toe' && section.id === 'tic-tac-toe-section')) {
                    section.classList.add('active');
                }
            });
            
            playSound('click');
        });
    });
    
    // Enhanced betting system with hints
    if (betButtons.length > 0) {
        betButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (isRolling) return;
                
                betButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentBet = button.dataset.bet;
                
                playSound('click');
                updateBetDisplay();
                showBettingHint();
            });
        });
    }
    
    function updateBetDisplay() {
        if (!resultDiv) return;
        const config = betConfigs[currentBet];
        const streakBonus = getStreakBonus();
        const effectiveMultiplier = config.multiplier + streakBonus;
        const rollCost = CurrencyManager.getGameCost('lucky-dice');
        const canAfford = CurrencyManager.canAffordGame('lucky-dice');
        
        resultDiv.innerHTML = `
            <div class="game-instruction">
                ${config.icon} Selected: <strong>${config.name}</strong> 
                (${effectiveMultiplier}x payout${streakBonus > 0 ? ` +${streakBonus}x streak bonus!` : ''}) 
                ${bonusRoundActive ? '🎊 <strong>BONUS ROUND!</strong>' : `- Cost: ${rollCost} coins to roll!`}
                ${!canAfford ? '<br><span style="color: #f44336;">⚠️ Not enough coins!</span>' : ''}
            </div>
        `;
        
        updateRollButtonState();
    }
    
    function updateRollButtonState() {
        if (!rollButton) return;
        
        const rollCost = CurrencyManager.getGameCost('lucky-dice');
        const canAfford = CurrencyManager.canAffordGame('lucky-dice');
        
        if (canAfford && !isRolling) {
            rollButton.disabled = false;
            rollButton.classList.remove('btn-disabled');
            rollButton.innerHTML = `
                <i class="fas fa-dice"></i>
                <span>Roll Dice (${rollCost} coins)</span>
            `;
        } else if (!canAfford) {
            rollButton.disabled = true;
            rollButton.classList.add('btn-disabled');
            rollButton.innerHTML = `
                <i class="fas fa-coins"></i>
                <span>Need ${rollCost} coins</span>
            `;
        }
    }
    
    function getStreakBonus() {
        if (currentStreak >= 5) return 2;
        if (currentStreak >= 3) return 1;
        return 0;
    }
    
    function showBettingHint() {
        if (rollHistory.length < 3) return;
        
        const recentRolls = rollHistory.slice(-3);
        const avgTotal = recentRolls.reduce((sum, roll) => sum + roll.total, 0) / recentRolls.length;
        const hasRecentDoubles = recentRolls.some(roll => roll.die1 === roll.die2);
        
        let hint = '';
        if (avgTotal < 6 && currentBet === 'high') {
            hint = '🔥 Hot Tip: Recent rolls have been low!';
        } else if (avgTotal > 8 && currentBet === 'low') {
            hint = '🔥 Hot Tip: Recent rolls have been high!';
        } else if (!hasRecentDoubles && currentBet === 'doubles') {
            hint = '💎 Doubles are due for a comeback!';
        } else if (recentRolls.filter(r => r.total === 7).length === 0 && currentBet === 'lucky7') {
            hint = '⭐ Lucky 7 hasn\'t appeared recently!';
        }
        
        if (hint) {
            showTemporaryHint(hint);
        }
    }
    
    function showTemporaryHint(message) {
        const hint = document.createElement('div');
        hint.className = 'betting-hint';
        hint.innerHTML = message;
        hint.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF6F00, #FFB74D);
            color: white;
            padding: 0.8rem 1.2rem;
            border-radius: 25px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 8px 25px rgba(255, 111, 0, 0.3);
            animation: slideInRight 0.5s ease-out;
        `;
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => hint.remove(), 500);
        }, 3000);
    }
    
    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }
    
    function createDiceElement(value, isAnimating = false, isHot = false) {
        return `
            <div class="dice-card ${isAnimating ? 'rolling' : ''} ${isHot ? 'hot-dice' : ''}">
                <div class="dice-face">
                    <span class="dice-emoji">${diceFaces[value - 1]}</span>
                    <span class="dice-number">${value}</span>
                </div>
                ${isHot ? '<div class="hot-indicator">🔥 HOT!</div>' : ''}
            </div>
        `;
    }

    function createOperatorElement(symbol) {
        return `<div class="dice-operator">${symbol}</div>`;
    }

    function createTotalElement(total, isBonus = false, isHot = false) {
        return `
            <div class="dice-total ${isBonus ? 'bonus-total' : ''}">
                <span>${total}</span>
                <div class="total-label">Total</div>
                ${isHot ? '<div class="hot-indicator">🔥 HOT!</div>' : ''}
            </div>
        `;
    }
    
    function animateDiceRoll(die1, die2, callback) {
        if (!diceDisplay) return;
        
        // Enhanced rolling animation with effects - DICE + DICE = TOTAL format
        diceDisplay.innerHTML = `
            <div class="dice-container rolling ${bonusRoundActive ? 'bonus-glow' : ''}">
                <div class="dice-card rolling">
                    <div class="dice-face">
                        <span class="dice-emoji">🎲</span>
                        <span class="dice-number">?</span>
                    </div>
                </div>
                ${createOperatorElement('+')}
                <div class="dice-card rolling">
                    <div class="dice-face">
                        <span class="dice-emoji">🎲</span>
                        <span class="dice-number">?</span>
                    </div>
                </div>
                ${createOperatorElement('=')}
                <div class="dice-total">
                    <span>?</span>
                    <div class="total-label">Total</div>
                </div>
            </div>
        `;
        
        // Add enhanced sound effects
        playSound('roll');
        if (bonusRoundActive) playSound('bonus');
        
        // Show final result with enhanced effects
        setTimeout(() => {
            const isHotRoll = hotStreak >= 3;
            const total = die1 + die2;
            
            diceDisplay.innerHTML = `
                <div class="dice-container ${bonusRoundActive ? 'bonus-glow' : ''}">
                    ${createDiceElement(die1, false, isHotRoll)}
                    ${createOperatorElement('+')}
                    ${createDiceElement(die2, false, isHotRoll)}
                    ${createOperatorElement('=')}
                    ${createTotalElement(total, bonusRoundActive, isHotRoll)}
                </div>
            `;
            
            const diceCards = diceDisplay.querySelectorAll('.dice-card, .dice-total');
            diceCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('reveal');
                }, index * 200);
            });
            
            playSound('reveal');
            if (isHotRoll) playSound('hot');
            callback();
        }, 1500);
    }
    
    function checkWin(total, die1, die2) {
        const config = betConfigs[currentBet];
        return config.condition(total, die1, die2);
    }
    
    function updateScore(won, multiplier) {
        if (won) {
            wins++;
            currentStreak++;
            consecutiveWins++;
            hotStreak++;
            coldStreak = 0;
            
            // Award currency for win
            const baseReward = CurrencyManager.getReward('lucky-dice', 'win');
            const streakBonus = currentStreak >= 3 ? CurrencyManager.getReward('lucky-dice', 'streak') * Math.floor(currentStreak / 3) : 0;
            const totalReward = baseReward + streakBonus;
            
            CurrencyManager.earnCurrency(totalReward, `Lucky Dice Win${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`);
            
            // Check for bonus round activation
            if (consecutiveWins === 3 && !bonusRoundActive) {
                bonusRoundActive = true;
                showAchievement('🎊 BONUS ROUND ACTIVATED! 🎊');
                setTimeout(() => {
                    bonusRoundActive = false;
                }, 10000); // 10 seconds bonus round
            }
            
            if (winsSpan) {
                winsSpan.classList.add('score-increase');
                setTimeout(() => winsSpan.classList.remove('score-increase'), 600);
            }
            
            if (currentStreakSpan) {
                currentStreakSpan.classList.add('streak-increase');
                setTimeout(() => currentStreakSpan.classList.remove('streak-increase'), 800);
            }
            
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
                localStorage.setItem('dice-best-streak', bestStreak.toString());
                if (bestStreakSpan) {
                    bestStreakSpan.textContent = bestStreak;
                    bestStreakSpan.classList.add('streak-increase');
                    setTimeout(() => bestStreakSpan.classList.remove('streak-increase'), 800);
                }
                showAchievement('🏆 New Best Streak! 🏆');
            }
            
            // Hot streak achievements
            if (hotStreak === 5) {
                showAchievement('🔥 ON FIRE! 5 in a row! 🔥');
            } else if (hotStreak === 10) {
                showAchievement('🌟 LEGENDARY STREAK! 🌟');
            }
        } else {
            losses++;
            currentStreak = 0;
            consecutiveWins = 0;
            hotStreak = 0;
            coldStreak++;
            
            if (lossesSpan) {
                lossesSpan.classList.add('score-increase');
                setTimeout(() => lossesSpan.classList.remove('score-increase'), 600);
            }
            
            if (currentStreakSpan && currentStreakSpan.textContent !== '0') {
                currentStreakSpan.classList.add('streak-break');
                setTimeout(() => currentStreakSpan.classList.remove('streak-break'), 800);
            }
        }
        
        if (winsSpan) winsSpan.textContent = wins;
        if (lossesSpan) lossesSpan.textContent = losses;
        if (currentStreakSpan) currentStreakSpan.textContent = currentStreak;
        if (roundSpan) roundSpan.textContent = roundNumber;
    }
    
    function showResult(won, total, die1, die2, baseMultiplier) {
        if (!resultDiv) return;
        
        const config = betConfigs[currentBet];
        const streakBonus = getStreakBonus();
        const bonusMultiplier = bonusRoundActive ? 2 : 1;
        const finalMultiplier = (baseMultiplier + streakBonus) * bonusMultiplier;
        
        const winMessages = [
            '🎉 You Win!', '💰 Jackpot!', '🌟 Amazing!', '🎊 Fantastic!', '✨ Perfect!',
            '🚀 Incredible!', '💎 Brilliant!', '🎯 Bullseye!'
        ];
        const loseMessages = [
            '😔 Better luck next time!', '🎲 Try again!', '🔄 Another roll?', '💪 Don\'t give up!',
            '🌈 Next one\'s yours!', '⭐ Stay positive!', '🎮 Keep playing!'
        ];
        
        const messages = won ? winMessages : loseMessages;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Store roll in history
        rollHistory.push({ die1, die2, total, won, bet: currentBet });
        if (rollHistory.length > 10) rollHistory.shift();
        
        setTimeout(() => {
            resultDiv.innerHTML = `
                <div class="result-card ${won ? 'win' : 'lose'} ${bonusRoundActive ? 'bonus-result' : ''}">
                    <div class="result-main">${randomMessage}</div>
                    <div class="result-details">
                        <div class="bet-result">
                            ${config.icon} <strong>${config.name}</strong>
                        </div>
                        <div class="dice-breakdown">
                            Rolled: ${diceFaces[die1-1]} ${diceFaces[die2-1]} = ${total}
                        </div>
                        ${won ? `<div class="payout">💰 ${finalMultiplier}x Total Multiplier!</div>` : ''}
                        ${streakBonus > 0 ? `<div class="streak-bonus">🔥 +${streakBonus}x Streak Bonus!</div>` : ''}
                        ${bonusRoundActive ? `<div class="bonus-indicator">🎊 2x Bonus Round!</div>` : ''}
                        ${currentStreak > 0 ? `<div class="streak-badge">🔥 ${currentStreak} Win Streak!</div>` : ''}
                        ${hotStreak >= 3 ? `<div class="hot-badge">🔥 ${hotStreak} Hot Streak!</div>` : ''}
                    </div>
                </div>
            `;
            
            const resultCard = resultDiv.querySelector('.result-card');
            if (resultCard) resultCard.classList.add('result-reveal');
            
            playSound(won ? 'win' : 'lose');
            if (bonusRoundActive && won) playSound('jackpot');
            
            if (rollButton) {
                rollButton.disabled = false;
                rollButton.classList.remove('btn-disabled');
            }
            betButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('btn-disabled');
            });
            isRolling = false;
            
            updateScore(won, finalMultiplier);
            
            // Update button state after currency changes
            setTimeout(() => {
                updateBetDisplay();
                updateRollButtonState();
            }, 100);
            
        }, 800);
    }
    
    function showAchievement(message) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-popup';
        achievement.innerHTML = `
            <i class="fas fa-trophy"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.classList.add('achievement-show');
        }, 100);
        
        setTimeout(() => {
            achievement.classList.remove('achievement-show');
            setTimeout(() => achievement.remove(), 500);
        }, 4000);
    }
    
    function playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                click: 800,
                roll: 300,
                reveal: 600,
                win: 880,
                lose: 220,
                bonus: 1200,
                hot: 1000,
                jackpot: 1500
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
            oscillator.type = type === 'roll' ? 'sawtooth' : 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Sound not available:', e);
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1100;
            font-weight: 500;
            transition: transform 0.3s ease, opacity 0.3s ease;
            background-color: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    function resetGame() {
        wins = 0;
        losses = 0;
        currentStreak = 0;
        roundNumber = 1;
        currentBet = 'low';
        rollHistory = [];
        hotStreak = 0;
        coldStreak = 0;
        bonusRoundActive = false;
        consecutiveWins = 0;
        
        if (winsSpan) winsSpan.textContent = wins;
        if (lossesSpan) lossesSpan.textContent = losses;
        if (currentStreakSpan) currentStreakSpan.textContent = currentStreak;
        if (roundSpan) roundSpan.textContent = roundNumber;
        
        betButtons.forEach(btn => btn.classList.remove('active'));
        if (betButtons.length > 0) betButtons[0].classList.add('active');
        
        if (diceDisplay) {
            diceDisplay.innerHTML = `
                <div class="dice-container">
                    <div class="dice-card">
                        <div class="dice-face">
                            <span class="dice-emoji">🎲</span>
                            <span class="dice-number">-</span>
                        </div>
                    </div>
                    ${createOperatorElement('+')}
                    <div class="dice-card">
                        <div class="dice-face">
                            <span class="dice-emoji">🎲</span>
                            <span class="dice-number">-</span>
                        </div>
                    </div>
                    ${createOperatorElement('=')}
                    <div class="dice-total">
                        <span>-</span>
                        <div class="total-label">Total</div>
                    </div>
                </div>
            `;
        }
        
        updateBetDisplay();
        playSound('click');
    }
    
    // Main roll dice functionality
    if (rollButton) {
        rollButton.addEventListener('click', () => {
            if (isRolling) return;
            
            // Check if player can afford to roll
            const rollCost = CurrencyManager.getGameCost('lucky-dice');
            if (!CurrencyManager.canAffordGame('lucky-dice')) {
                showNotification(`Need ${rollCost} coins to roll!`, 'error');
                return;
            }
            
            // Spend currency for the roll
            const success = CurrencyManager.spendCurrency(rollCost, 'Lucky Dice Roll');
            if (!success) {
                showNotification('Transaction failed!', 'error');
                return;
            }
            
            isRolling = true;
            rollButton.disabled = true;
            rollButton.classList.add('btn-disabled');
            rollButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Rolling...</span>
            `;
            betButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('btn-disabled');
            });
            
            const die1 = rollDice();
            const die2 = rollDice();
            const total = die1 + die2;
            
            animateDiceRoll(die1, die2, () => {
                const config = betConfigs[currentBet];
                const won = config.condition(total, die1, die2);
                const multiplier = won ? config.multiplier : 0;
                
                showResult(won, total, die1, die2, multiplier);
            });
        });
    }
    
    // Reset game functionality
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    
    // Initialize game
    updateBetDisplay();
    
    // Set up periodic updates to check currency status
    setInterval(() => {
        if (!isRolling) {
            updateRollButtonState();
        }
    }, 1000);
    
    // Legacy function for backwards compatibility
    window.playLuckyDice = function() {
        if (rollButton && !isRolling && CurrencyManager.canAffordGame('lucky-dice')) {
            rollButton.click();
        }
    };
});
