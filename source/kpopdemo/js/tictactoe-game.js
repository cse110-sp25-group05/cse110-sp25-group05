document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.tic-cell');
    const resultDiv = document.getElementById('tic-result');
    const playerScoreSpan = document.getElementById('tic-player-score');
    const botScoreSpan = document.getElementById('tic-bot-score');
    const streakSpan = document.getElementById('tic-current-streak');
    const bestStreakSpan = document.getElementById('tic-best-streak');
    const gameBoard = document.getElementById('tic-board');
    const resetBtn = document.getElementById('tic-reset-game');
    
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X'; // Player is always X
    let gameActive = true;
    let playerScore = 0;
    let botScore = 0;
    let currentStreak = 0;
    let bestStreak = parseInt(localStorage.getItem('tic-best-streak') || '0');
    let roundNumber = 1;
    let isAnimating = false;
    let gameHistory = [];
    let difficulty = 'expert'; // expert, hard, normal

    bestStreakSpan.textContent = bestStreak;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    // Strategic positions for enhanced AI
    const corners = [0, 2, 6, 8];
    const edges = [1, 3, 5, 7];
    const center = 4;

    // Opening book for strategic play
    const openingBook = {
        // If player takes center, take corner
        'X____': [0, 2, 6, 8],
        // If player takes corner, take center or opposite corner
        'X________': [4],
        '__X______': [4],
        '______X__': [4],
        '________X': [4],
        // Strategic responses
        'X_______': [4, 8],
        '_X_______': [4, 6],
        '__X_____': [4, 0],
        '___X____': [4, 2],
        '____X___': [0, 2, 6, 8],
        '_____X__': [4, 0],
        '______X_': [4, 2],
        '_______X': [4, 6],
    };

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

    function checkWinner(board) {
        for (let condition of winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], winningLine: condition };
            }
        }
        
        if (!board.includes('')) {
            return { winner: 'tie', winningLine: null };
        }
        
        return { winner: null, winningLine: null };
    }

    function getAvailableMoves(board) {
        return board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    }

    function evaluateBoard(board, depth, isMaximizing) {
        const result = checkWinner(board);
        
        if (result.winner === 'O') return 100 - depth; // Bot wins (prefer quicker wins)
        if (result.winner === 'X') return depth - 100; // Player wins (delay losses)
        if (result.winner === 'tie') return 0;
        
        // Strategic evaluation heuristics
        let score = 0;
        
        // Center control bonus
        if (board[center] === 'O') score += 10;
        else if (board[center] === 'X') score -= 10;
        
        // Corner control bonus
        corners.forEach(corner => {
            if (board[corner] === 'O') score += 5;
            else if (board[corner] === 'X') score -= 5;
        });
        
        // Evaluate potential winning/blocking opportunities
        winningConditions.forEach(condition => {
            const [a, b, c] = condition;
            const line = [board[a], board[b], board[c]];
            
            if (line.filter(cell => cell === 'O').length === 2 && line.includes('')) {
                score += 50; // Two in a row for bot
            }
            if (line.filter(cell => cell === 'X').length === 2 && line.includes('')) {
                score -= 50; // Two in a row for player (must block)
            }
            if (line.filter(cell => cell === 'O').length === 1 && line.filter(cell => cell === '').length === 2) {
                score += 5; // Potential line for bot
            }
            if (line.filter(cell => cell === 'X').length === 1 && line.filter(cell => cell === '').length === 2) {
                score -= 5; // Potential line for player
            }
        });
        
        return score;
    }

    function minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        const result = checkWinner(board);
        
        if (result.winner === 'O') return 100 - depth;
        if (result.winner === 'X') return depth - 100;
        if (result.winner === 'tie') return 0;
        
        if (depth > 8) return evaluateBoard(board, depth, isMaximizing);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const eval = minimax(board, depth + 1, false, alpha, beta);
                    board[i] = '';
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const eval = minimax(board, depth + 1, true, alpha, beta);
                    board[i] = '';
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    function getOpeningMove(board) {
        const boardString = board.join('');
        const xCount = boardString.split('X').length - 1;
        
        // First move: prefer center or corners
        if (xCount === 0) {
            return Math.random() < 0.7 ? center : corners[Math.floor(Math.random() * corners.length)];
        }
        
        // Look for opening book patterns
        for (let pattern in openingBook) {
            let matches = true;
            for (let i = 0; i < 9; i++) {
                if (pattern[i] !== '_' && pattern[i] !== boardString[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                const moves = openingBook[pattern].filter(move => board[move] === '');
                if (moves.length > 0) {
                    return moves[Math.floor(Math.random() * moves.length)];
                }
            }
        }
        
        return null;
    }

    function findWinningMove(board, player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = player;
                if (checkWinner(board).winner === player) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        return null;
    }

    function findForkMove(board, player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = player;
                let winningMoves = 0;
                for (let j = 0; j < 9; j++) {
                    if (board[j] === '') {
                        board[j] = player;
                        if (checkWinner(board).winner === player) {
                            winningMoves++;
                        }
                        board[j] = '';
                    }
                }
                board[i] = '';
                if (winningMoves >= 2) {
                    return i;
                }
            }
        }
        return null;
    }

    function getBotMove(board) {
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0) return null;

        // Reduce randomness based on difficulty
        const randomChance = {
            'expert': 0.02,   // 2% random moves
            'hard': 0.05,     // 5% random moves  
            'normal': 0.15    // 15% random moves
        };

        if (Math.random() < randomChance[difficulty]) {
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        // 1. Try to win immediately
        const winMove = findWinningMove(board, 'O');
        if (winMove !== null) return winMove;

        // 2. Block player from winning
        const blockMove = findWinningMove(board, 'X');
        if (blockMove !== null) return blockMove;

        // 3. Create a fork (two winning opportunities)
        const forkMove = findForkMove(board, 'O');
        if (forkMove !== null) return forkMove;

        // 4. Block player's fork
        const blockForkMove = findForkMove(board, 'X');
        if (blockForkMove !== null) return blockForkMove;

        // 5. Use opening book for early game
        const openingMove = getOpeningMove(board);
        if (openingMove !== null && board[openingMove] === '') {
            return openingMove;
        }

        // 6. Use minimax for optimal play
        let bestMove = availableMoves[0];
        let bestValue = -Infinity;
        
        for (let move of availableMoves) {
            board[move] = 'O';
            const moveValue = minimax(board, 0, false);
            board[move] = '';
            
            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    function updateScore(result) {
        if (result === 'win') {
            playerScore++;
            currentStreak++;
            
            // Award currency for win
            const baseReward = CurrencyManager.getReward('tic-tac-toe', 'win');
            const streakBonus = currentStreak >= 3 ? CurrencyManager.getReward('tic-tac-toe', 'streak') * Math.floor(currentStreak / 3) : 0;
            const totalReward = baseReward + streakBonus;
            
            CurrencyManager.earnCurrency(totalReward, `Tic Tac Toe Win${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`);
            
            playerScoreSpan.classList.add('score-increase');
            setTimeout(() => playerScoreSpan.classList.remove('score-increase'), 600);
            
            streakSpan.classList.add('streak-increase');
            setTimeout(() => streakSpan.classList.remove('streak-increase'), 800);
            
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
                localStorage.setItem('tic-best-streak', bestStreak.toString());
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
        }
        
        roundNumber++;
        const roundElement = document.getElementById('tic-round-number');
        if (roundElement) {
            roundElement.textContent = roundNumber;
        }
        
        playerScoreSpan.textContent = playerScore;
        botScoreSpan.textContent = botScore;
        streakSpan.textContent = currentStreak;
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

    function highlightWinningLine(winningLine) {
        if (!winningLine) return;
        
        winningLine.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell) {
                setTimeout(() => {
                    cell.classList.add('winning-cell');
                    playSound('win-cell');
                }, i * 150);
            }
        });
    }

    function animateCell(cell, symbol) {
        cell.classList.add('cell-placed');
        cell.textContent = symbol;
        
        // Add symbol-specific styling
        if (symbol === 'X') {
            cell.classList.add('player-symbol');
        } else if (symbol === 'O') {
            cell.classList.add('bot-symbol');
        }
        
        // Add entrance effect
        cell.style.transform = 'scale(0) rotate(180deg)';
        cell.style.opacity = '0';
        
        setTimeout(() => {
            cell.style.transform = 'scale(1) rotate(0deg)';
            cell.style.opacity = '1';
        }, 50);
        
        playSound('place');
    }

    function displayResult(gameResult) {
        const resultTexts = {
            win: ['You Win! 🎉', 'Victory! 💪', 'Awesome! 🌟', 'Perfect! ✨', 'Incredible! 🚀'],
            lose: ['Bot Wins! 🤖', 'Try Again! 💫', 'Almost! 🔥', 'Next Time! ⭐', 'Good Try! 💪'],
            tie: ["It's a Tie! 🤝", 'Draw! 🔄', 'Equal! ⚖️', 'Good Match! 🎯', 'Well Played! 👏']
        };
        
        const messages = resultTexts[gameResult];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        setTimeout(() => {
            resultDiv.innerHTML = `
                <div class="result-card ${gameResult}">
                    <div class="result-icon">${gameResult === 'win' ? '🏆' : gameResult === 'lose' ? '🤖' : '🤝'}</div>
                    <div class="result-main">${randomMessage}</div>
                    <div class="result-details">
                        <span class="vs-text">You vs AI Bot</span>
                        ${currentStreak > 0 ? `<div class="streak-badge">🔥 ${currentStreak} Win Streak!</div>` : ''}
                        ${gameResult === 'lose' ? '<div class="ai-taunt">🧠 AI is learning your moves!</div>' : ''}
                    </div>
                </div>
            `;

            const resultCard = resultDiv.querySelector('.result-card');
            resultCard.classList.add('result-reveal');
            
            playSound(gameResult);
            
        }, 800);
    }

    function playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                place: 600,
                'win-cell': 800,
                win: [880, 1100, 1320], // Chord
                lose: 220,
                tie: 440
            };
            
            if (type === 'win' && Array.isArray(frequencies[type])) {
                // Play chord for win
                frequencies[type].forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.03, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
                    osc.start(audioContext.currentTime + i * 0.1);
                    osc.stop(audioContext.currentTime + i * 0.1 + 0.8);
                });
            } else {
                oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (e) {
            console.log('Sound not available:', e);
        }
    }

    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        isAnimating = false;
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('cell-placed', 'player-symbol', 'bot-symbol', 'winning-cell');
            cell.style.transform = '';
            cell.style.opacity = '';
        });
        
        resultDiv.innerHTML = '<div class="game-instruction">Click a cell to start playing!</div>';
    }

    function resetStats() {
        playerScore = 0;
        botScore = 0;
        currentStreak = 0;
        roundNumber = 1;
        gameHistory = [];
        
        playerScoreSpan.textContent = playerScore;
        botScoreSpan.textContent = botScore;
        streakSpan.textContent = currentStreak;
        
        const roundElement = document.getElementById('tic-round-number');
        if (roundElement) {
            roundElement.textContent = roundNumber;
        }
        
        resetGame();
    }

    function makeMove(index) {
        if (!gameActive || board[index] !== '' || isAnimating) return;
        
        isAnimating = true;
        
        // Player move
        board[index] = 'X';
        const cell = document.querySelector(`[data-index="${index}"]`);
        animateCell(cell, 'X');
        
        // Add to game history
        gameHistory.push({
            move: index,
            player: 'X',
            board: [...board]
        });
        
        // Check for game end after player move
        const gameResult = checkWinner(board);
        if (gameResult.winner) {
            gameActive = false;
            isAnimating = false;
            
            if (gameResult.winningLine) {
                setTimeout(() => highlightWinningLine(gameResult.winningLine), 200);
            }
            
            const result = gameResult.winner === 'X' ? 'win' : gameResult.winner === 'tie' ? 'tie' : 'lose';
            updateScore(result);
            displayResult(result);
            return;
        }
        
        // Bot move after delay
        setTimeout(() => {
            if (!gameActive) {
                isAnimating = false;
                return;
            }
            
            const botMove = getBotMove(board);
            if (botMove !== null) {
                board[botMove] = 'O';
                const botCell = document.querySelector(`[data-index="${botMove}"]`);
                animateCell(botCell, 'O');
                
                // Add to game history
                gameHistory.push({
                    move: botMove,
                    player: 'O',
                    board: [...board]
                });
                
                // Check for game end after bot move
                const botGameResult = checkWinner(board);
                if (botGameResult.winner) {
                    gameActive = false;
                    
                    if (botGameResult.winningLine) {
                        setTimeout(() => highlightWinningLine(botGameResult.winningLine), 200);
                    }
                    
                    const result = botGameResult.winner === 'X' ? 'win' : botGameResult.winner === 'tie' ? 'tie' : 'lose';
                    updateScore(result);
                    displayResult(result);
                }
            }
            isAnimating = false;
        }, 1000);
    }

    // Event listeners
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => makeMove(index));
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', resetStats);
    }

    // Initialize game
    resetStats();
}); 