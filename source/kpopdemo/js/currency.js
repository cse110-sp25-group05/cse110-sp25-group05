let currency = parseInt(localStorage.getItem('currency')) || 0;

function updateCurrencyDisplay() {
  const display = document.getElementById('currency-display');
  if (display) display.textContent = `Currency: ${currency}`;
}

function addCurrency(amount) {
  currency += amount;
  localStorage.setItem('currency', currency);
  updateCurrencyDisplay();
}

function deductCurrency(amount) {
  if (currency >= amount) {
    currency -= amount;
    localStorage.setItem('currency', currency);
    updateCurrencyDisplay();
    return true;
  } else {
    alert("Not enough currency!");
    return false;
  }
}

function getRandomCards(count) {
  const allCards = ['Karina', 'Winter', 'Ningning', 'Giselle', 'Taeyeon', 'IU']; // example
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(allCards[Math.floor(Math.random() * allCards.length)]);
  }
  return selected;
}

function addCardsToCollection(cards) {
  let collection = JSON.parse(localStorage.getItem('cardCollection')) || [];
  collection = collection.concat(cards);
  localStorage.setItem('cardCollection', JSON.stringify(collection));
}

function purchasePack() {
  const packCost = 100;
  if (deductCurrency(packCost)) {
    const cards = getRandomCards(5);
    addCardsToCollection(cards);
    alert("You got new cards!");
  }
}

window.onload = () => {
  updateCurrencyDisplay();
};
