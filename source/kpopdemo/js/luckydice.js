function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function diceEmoji(num) {
  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return diceFaces[num - 1];
}

function playLuckyDice() {
  const die1 = rollDice();
  const die2 = rollDice();
  const total = die1 + die2;

  document.getElementById("dice-display").textContent = `${diceEmoji(die1)} ${diceEmoji(die2)}`;
  document.getElementById("dice-result").textContent = `You rolled: ${die1} + ${die2} = ${total}`;

  if (total >= 10 || die1 === die2) {
    alert("🎉 You win!");
  } else {
    alert("😢 You lose. Try again!");
  }
}
