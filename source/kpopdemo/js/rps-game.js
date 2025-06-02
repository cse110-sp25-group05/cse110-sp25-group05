document.addEventListener('DOMContentLoaded', () => {
    const gameButtons = document.querySelectorAll('.game-btn');
    const resultDiv = document.getElementById('game-result');
    const playerScoreSpan = document.getElementById('player-score');
    const botScoreSpan = document.getElementById('bot-score');
    
    let playerScore = 0;
    let botScore = 0;

    // Show active section based on hash
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

    function getComputerChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
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
        if (result === 'win') playerScore++;
        if (result === 'lose') botScore++;
        
        playerScoreSpan.textContent = playerScore;
        botScoreSpan.textContent = botScore;
    }

    function displayResult(playerChoice, computerChoice, result) {
        const resultText = {
            win: 'You win!',
            lose: 'Bot wins!',
            tie: "It's a tie!"
        };

        resultDiv.innerHTML = `
            <p>You chose <strong>${playerChoice}</strong></p>
            <p>Bot chose <strong>${computerChoice}</strong></p>
            <p class="game-${result}">${resultText[result]}</p>
        `;

        // Add animation effect
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight; // Trigger reflow
        resultDiv.style.animation = 'fadeIn 0.5s ease-in-out';
    }

    gameButtons.forEach(button => {
        button.addEventListener('click', () => {
            const playerChoice = button.dataset.choice;
            const computerChoice = getComputerChoice();
            const result = determineWinner(playerChoice, computerChoice);
            
            updateScore(result);
            displayResult(playerChoice, computerChoice, result);
        });
    });
});