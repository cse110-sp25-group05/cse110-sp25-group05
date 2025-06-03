document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.ttt-cell');
    const resetButton = document.getElementById('ttt-reset');
    const resultDiv = document.getElementById('ttt-result');
    const playerScoreSpan = document.getElementById('ttt-player-score');
    const botScoreSpan = document.getElementById('ttt-bot-score');

    let currentBoard = Array(9).fill('');
    let playerScore = 0;
    let botScore = 0;
    let gameActive = true;

    
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

    // Listen for hash changes
    window.addEventListener('hashchange', showActiveSection);
    showActiveSection();

    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], 
        [0, 3, 6], [1, 4, 7], [2, 5, 8], 
        [0, 4, 8], [2, 4, 6] 
    ];

    function checkWinner(board) {
        for (const combo of winningCombinations) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], combo };
            }
        }
        return null;
    }

    function isBoardFull(board) {
        return board.every(cell => cell !== '');
    }

    function updateScore(winner) {
        if (winner === 'X') {
            playerScore++;
            playerScoreSpan.textContent = playerScore;
        } else if (winner === 'O') {
            botScore++;
            botScoreSpan.textContent = botScore;
        }
    }

    function highlightWinningCells(combo) {
        combo.forEach(index => {
            cells[index].classList.add('winning');
        });
    }

    function getBotMove(board) {
        // Randomly decide to make a suboptimal move (30% chance)
        if (Math.random() < 0.3) {
            const availableCells = board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        }

        // Try to win
        const move = findWinningMove(board, 'O');
        if (move !== -1) return move;

        // (80% chance to block)
        const blockMove = findWinningMove(board, 'X');
        if (blockMove !== -1 && Math.random() < 0.8) return blockMove;

        // (70% chance)
        if (board[4] === '' && Math.random() < 0.7) return 4;

        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0 && Math.random() < 0.6) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take any available cell
        const availableCells = board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
        return availableCells[Math.floor(Math.random() * availableCells.length)];
    }

    function findWinningMove(board, player) {
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                const testBoard = [...board];
                testBoard[i] = player;
                if (checkWinner(testBoard)) {
                    return i;
                }
            }
        }
        return -1;
    }

    function makeMove(index, symbol) {
        if (currentBoard[index] === '' && gameActive) {
            currentBoard[index] = symbol;
            cells[index].textContent = symbol;
            cells[index].classList.add('played');
            cells[index].classList.add(symbol.toLowerCase());

            const result = checkWinner(currentBoard);
            if (result) {
                gameActive = false;
                updateScore(result.winner);
                highlightWinningCells(result.combo);
                resultDiv.textContent = `${result.winner === 'X' ? 'You win!' : 'Bot wins!'}`;
                resultDiv.className = result.winner === 'X' ? 'game-win' : 'game-lose';
            } else if (isBoardFull(currentBoard)) {
                gameActive = false;
                resultDiv.textContent = "It's a tie!";
                resultDiv.className = 'game-tie';
            }
            return true;
        }
        return false;
    }

    function handleCellClick(index) {
        if (makeMove(index, 'X')) {
            if (gameActive) {
                // Bot's turn
                setTimeout(() => {
                    const botMove = getBotMove(currentBoard);
                    makeMove(botMove, 'O');
                }, 500);
            }
        }
    }

    function resetGame() {
        currentBoard = Array(9).fill('');
        gameActive = true;
        resultDiv.textContent = '';
        resultDiv.className = '';
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'ttt-cell';
        });
    }

    // Event Listeners
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });

    resetButton.addEventListener('click', resetGame);
}); 