// rps-game.js manages the rock-paper-scissors part of the project.
document.addEventListener('DOMContentLoaded', () => {
    const gameButtons = document.querySelectorAll('.game-btn');
    const resultDiv = document.getElementById('game-result');
    const playerScoreSpan = document.getElementById('player-score');
    const botScoreSpan = document.getElementById('bot-score');
    const playerChoiceDiv = document.getElementById('player-choice');
    const botChoiceDiv = document.getElementById('bot-choice');
    const streakSpan = document.getElementById('current-streak');
    const bestStreakSpan = document.getElementById('best-streak');
    
    // Game state variables.
    let playerScore = 0;
    let botScore = 0;
    let currentStreak = 0;
    let bestStreak = parseInt(localStorage.getItem('rps-best-streak') || '0');
    let isPlaying = false;
    let recentBotChoices = []; // Tracks recent choices made by the bot.
    let recentPlayerChoices = []; // Tracks recent choices made by player. Info for bot's plan of strategy.
    let gameCount = 0;
    let roundNumber = 1;

    bestStreakSpan.textContent = bestStreak;

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

    window.addEventListener('hashchange', showActiveSection);
    showActiveSection();

    // Computer's logic on RPS.
    function getComputerChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        gameCount++;
        
        let baseRandomIndex;
        const crypto = window.crypto || window.msCrypto;
        if (crypto && crypto.getRandomValues) {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            baseRandomIndex = array[0] % choices.length;
        } else {
            const now = Date.now();
            const entropy1 = Math.random();
            const entropy2 = (now % 1000) / 1000;
            const entropy3 = Math.sin(now * Math.random()) * 10000 % 1;
            const combinedEntropy = (entropy1 + entropy2 + Math.abs(entropy3)) % 1;
            baseRandomIndex = Math.floor(combinedEntropy * choices.length);
        }
        
        let finalChoice = choices[baseRandomIndex];
        // Added logic for possible use of strategy.
        if (gameCount > 1) {
            const shouldUseStrategy = Math.random() < 0.4;
            
            if (shouldUseStrategy) {
                const lastBotChoice = recentBotChoices[recentBotChoices.length - 1];
                const secondLastBotChoice = recentBotChoices[recentBotChoices.length - 2];
                
                if (lastBotChoice === secondLastBotChoice && finalChoice === lastBotChoice) {
                    const alternatives = choices.filter(choice => choice !== lastBotChoice);
                    finalChoice = alternatives[Math.floor(Math.random() * alternatives.length)];
                }
                
                if (recentPlayerChoices.length >= 2) {
                    const playerPattern = recentPlayerChoices.slice(-2);
                    const lastPlayerChoice = playerPattern[1];
                    // Counter favorite choice of player.
                    const playerFavorite = getMostFrequentChoice(recentPlayerChoices);
                    if (playerFavorite && Math.random() < 0.3) {
                        finalChoice = getWinningChoice(playerFavorite);
                    }
                    // Counter alternating strategy of player.
                    if (recentPlayerChoices.length >= 3) {
                        const isAlternating = checkIfAlternating(recentPlayerChoices.slice(-3));
                        if (isAlternating && Math.random() < 0.5) {
                            const expectedNext = getExpectedAlternatingChoice(recentPlayerChoices.slice(-2));
                            if (expectedNext) {
                                finalChoice = getWinningChoice(expectedNext);
                            }
                        }
                    }
                }
            }
        }
        
        recentBotChoices.push(finalChoice);
        if (recentBotChoices.length > 5) {
            recentBotChoices.shift();
        }
        
        return finalChoice;
    }
    
    function getMostFrequentChoice(choices) {
        const counts = {};
        choices.forEach(choice => {
            counts[choice] = (counts[choice] || 0) + 1;
        });
        
        let mostFrequent = null;
        let maxCount = 0;
        for (const choice in counts) {
            if (counts[choice] > maxCount && counts[choice] >= 2) {
                maxCount = counts[choice];
                mostFrequent = choice;
            }
        }
        return mostFrequent;
    }
    
    function getWinningChoice(opponentChoice) {
        const winMap = {
            'rock': 'paper',
            'paper': 'scissors', 
            'scissors': 'rock'
        };
        return winMap[opponentChoice];
    }
    
    function checkIfAlternating(choices) {
        if (choices.length < 3) return false;
        const uniqueChoices = [...new Set(choices)];
        return uniqueChoices.length === 2 && 
               choices[0] !== choices[1] && 
               choices[1] !== choices[2] && 
               choices[0] === choices[2];
    }
    
    function getExpectedAlternatingChoice(lastTwoChoices) {
        if (lastTwoChoices.length !== 2) return null;
        return lastTwoChoices[0];
    }

    function determineWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            return 'tie';
        }
        
        if (
            (playerChoice === 'rock' && computerChoice === 'scissors') ||
            (playerChoice === 'paper' && computerChoice === 'rock') ||
            (playerChoice === 'scissors' && computerChoice === 'paper')
        ) {
            return 'win';
        }
        
        return 'lose';
    }

    function updateScore(result) {
        if (result === 'win') {
            playerScore++;
            currentStreak++;
            
            // Award currency for win
            const baseReward = CurrencyManager.getReward('rock-paper-scissors', 'win');
            const streakBonus = currentStreak >= 3 ? CurrencyManager.getReward('rock-paper-scissors', 'streak') * Math.floor(currentStreak / 3) : 0;
            const totalReward = baseReward + streakBonus;
            
            CurrencyManager.earnCurrency(totalReward, `RPS Win${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`);
            
            playerScoreSpan.classList.add('score-increase');
            setTimeout(() => playerScoreSpan.classList.remove('score-increase'), 600);
            
            streakSpan.classList.add('streak-increase');
            setTimeout(() => streakSpan.classList.remove('streak-increase'), 800);
            
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
                localStorage.setItem('rps-best-streak', bestStreak.toString());
                bestStreakSpan.textContent = bestStreak;
                
                bestStreakSpan.classList.add('streak-increase');
                setTimeout(() => bestStreakSpan.classList.remove('streak-increase'), 800);
                
                showAchievement('New Best Streak!');
            }
        } else if (result === 'lose') {
            botScore++;
            currentStreak = 0;
            
            botScoreSpan.classList.add('score-increase');
            setTimeout(() => botScoreSpan.classList.remove('score-increase'), 600);
        } else {
        }
        
        roundNumber++;
        const roundElement = document.getElementById('round-number');
        if (roundElement) {
            roundElement.textContent = roundNumber;
        }
        
        playerScoreSpan.textContent = playerScore;
        botScoreSpan.textContent = botScore;
        streakSpan.textContent = currentStreak;
    }

    function getChoiceIcon(choice) {
        const icons = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️'
        };
        return icons[choice];
    }

    function getChoiceEmoji(choice) {
        const emojis = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        return emojis[choice];
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
        }, 3000);
    }

    function createChoiceCard(choice, isPlayer = true) {
        return `
            <div class="choice-card ${isPlayer ? 'player-card' : 'bot-card'}">
                <div class="choice-card-inner">
                    <div class="choice-icon">${getChoiceIcon(choice)}</div>
                    <div class="choice-emoji">${getChoiceEmoji(choice)}</div>
                    <div class="choice-name">${choice.charAt(0).toUpperCase() + choice.slice(1)}</div>
                </div>
            </div>
        `;
    }

    function animateChoiceReveal(playerChoice, computerChoice) {
        playerChoiceDiv.innerHTML = `
            <div class="choice-card player-card thinking">
                <div class="choice-card-inner">
                    <div class="thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="choice-name">Choosing...</div>
                </div>
            </div>
        `;
        
        const usedStrategy = recentBotChoices.length > 1 && Math.random() < 0.4;
        
        botChoiceDiv.innerHTML = `
            <div class="choice-card bot-card thinking ${usedStrategy ? 'strategic-thinking' : ''}">
                <div class="choice-card-inner">
                    <div class="thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="choice-name">${usedStrategy ? 'Strategizing...' : 'Thinking...'}</div>
                    ${usedStrategy ? '<div class="strategy-indicator">🧠</div>' : ''}
                </div>
            </div>
        `;

        setTimeout(() => {
            playerChoiceDiv.innerHTML = createChoiceCard(playerChoice, true);
            botChoiceDiv.innerHTML = createChoiceCard(computerChoice, false);
            
            const playerCard = playerChoiceDiv.querySelector('.choice-card');
            const botCard = botChoiceDiv.querySelector('.choice-card');
            
            playerCard.classList.add('card-reveal');
            botCard.classList.add('card-reveal');
            
            playSound('reveal');
            
            if (usedStrategy) {
                setTimeout(() => {
                    showStrategyHint();
                }, 500);
            }
            
        }, 1500);
    }
    
    // pop up when bot uses strategy check.
    function showStrategyHint() {
        const hint = document.createElement('div');
        hint.className = 'strategy-hint';
        hint.innerHTML = '🧠 Bot is learning your patterns!';
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.classList.add('strategy-hint-show');
        }, 100);
        
        setTimeout(() => {
            hint.classList.remove('strategy-hint-show');
            setTimeout(() => hint.remove(), 500);
        }, 2000);
    }

    // Different random multiple messages depending on result of match.
    function displayResult(playerChoice, computerChoice, result) {
        const resultTexts = {
            win: ['You Win! 🎉', 'Victory! 💪', 'Awesome! 🌟', 'Perfect! ✨'],
            lose: ['Bot Wins! 🤖', 'Try Again! 💫', 'Almost! 🔥', 'Next Time! ⭐'],
            tie: ["It's a Tie! 🤝", 'Draw! 🔄', 'Equal! ⚖️', 'Same Choice! 🎯']
        };
        
        const messages = resultTexts[result];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        animateChoiceReveal(playerChoice, computerChoice);

        setTimeout(() => {
            resultDiv.innerHTML = `
                <div class="result-card ${result}">
                    <div class="result-main">${randomMessage}</div>
                    <div class="result-details">
                        <span class="vs-text">You vs Bot</span>
                        ${currentStreak > 0 ? `<div class="streak-badge">🔥 ${currentStreak} Win Streak!</div>` : ''}
                    </div>
                </div>
            `;

            const resultCard = resultDiv.querySelector('.result-card');
            resultCard.classList.add('result-reveal');
            
            playSound(result);
            
            gameButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('btn-disabled');
            });
            isPlaying = false;
            
        }, 2000);
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
                reveal: 600,
                win: 880,
                lose: 220,
                tie: 440
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Sound not available:', e);
        }
    }

    function resetGame() {
        playerScore = 0;
        botScore = 0;
        currentStreak = 0;
        roundNumber = 1;
        
        playerScoreSpan.textContent = playerScore;
        botScoreSpan.textContent = botScore;
        streakSpan.textContent = currentStreak;
        
        const roundElement = document.getElementById('round-number');
        if (roundElement) {
            roundElement.textContent = roundNumber;
        }
        
        playerChoiceDiv.innerHTML = '<div class="choice-placeholder">Make your choice!</div>';
        botChoiceDiv.innerHTML = '<div class="choice-placeholder">Waiting...</div>';
        resultDiv.innerHTML = '<div class="game-instruction">Choose Rock, Paper, or Scissors to start!</div>';
        
        recentBotChoices = [];
        recentPlayerChoices = [];
        gameCount = 0;
    }

    const resetBtn = document.getElementById('reset-game');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }

    gameButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isPlaying) return;
            
            isPlaying = true;
            const playerChoice = button.dataset.choice;
            
            recentPlayerChoices.push(playerChoice);
            if (recentPlayerChoices.length > 5) {
                recentPlayerChoices.shift();
            }
            
            const computerChoice = getComputerChoice();
            const result = determineWinner(playerChoice, computerChoice);
            
            gameButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('btn-disabled');
            });
            
            button.classList.add('btn-pressed');
            setTimeout(() => button.classList.remove('btn-pressed'), 200);
            
            playSound('click');
            updateScore(result);
            displayResult(playerChoice, computerChoice, result);
        });
    });

    resetGame();
});