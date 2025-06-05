/* ───────────────── helpers ───────────────── */
function loadOwnedCards() {
	// If CardManager is present, use it (and force-load from localStorage)
	if (typeof CardManager !== 'undefined') {
		CardManager.loadCollection?.(); // load once
		return CardManager.getCollection(); // shallow copy
	}
	// Fallback – read the raw array directly
	const raw = localStorage.getItem('kpopCardCollection');
	return raw ? JSON.parse(raw) : [];
}

function readDecorMap() {
	const stored = localStorage.getItem('cardDecorations');
	return stored ? JSON.parse(stored) : {};
}

function writeDecorMap(map) {
	localStorage.setItem('cardDecorations', JSON.stringify(map));
}

/* ───────────────── init ───────────────── */
function initDecorationStudio() {
	const collection = loadOwnedCards();
	const select = document.getElementById('card-select');
	select.innerHTML = '<option>Select a card to decorate...</option>';

	collection.forEach(card => {
		const option = document.createElement('option');
		option.value = card.id;
		option.textContent = `${card.name} (${card.group})`;
		select.appendChild(option);
	});

	select.addEventListener('change', function () {
		const card = collection.find(c => c.id === this.value);
		const preview = document.getElementById('decoration-preview-card');
		if (card && preview) {
			const imgPath = `assets/cards/${card.group.toLowerCase()}/${card.name}/${card.id}.png`;
			preview.innerHTML = `<img src="${imgPath}" alt="${card.name}" width="220">`;
		} else if (preview) {
			preview.innerHTML = `<img src="assets/cardselect.png" alt="Preview" width="220">`;
		}
	});

	const badgeToggle = document.getElementById('toggle-badge');
	const preview = document.getElementById('decoration-preview-card');
	if (badgeToggle && preview) {
		badgeToggle.addEventListener('change', function () {
			preview.setAttribute('data-show-badge', this.checked ? 'true' : 'false');
		});
		preview.setAttribute('data-show-badge', badgeToggle.checked ? 'true' : 'false');
	}

	const saveBtn = document.getElementById('save-decor');
	if (saveBtn) {
		saveBtn.addEventListener('click', () => {
			const selected = document.getElementById('card-select').value;
			if (!selected) {
				alert('Please select a card first!');
				return;
			}
			alert('Saved decoration!');
		});
	}

	const resetBtn = document.getElementById('reset-decor');
	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			const preview = document.getElementById('decoration-preview-card');
			const selected = document.getElementById('card-select');
			if (!selected.value || !preview) {
				alert('Please select a card first!');
				return;
			}
			preview.innerHTML = `<img src="assets/cardselect.png" alt="Preview" width="220">`;
			selected.value = '';
			alert('Reset decoration!');
		});
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDecorationStudio);

