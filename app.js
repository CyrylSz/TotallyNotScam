// State variables
let shownTreasures = 5;
let shownGames = 20; 
let shownTrophies = 5;

// Animation State
let prevWinPerc = 0;
let prevWins = 0;
let prevLosses = 0;
let prevDraws = 0;

// Current Player State (Hardcoded for Demo)
const currentRankId = 3; // Alpha Whale

// --- RENDER FUNCTIONS ---
function initDashboard() {
    renderTreasures();
    renderGames(); 
    renderTrophies();
    updateStats();
    // Render ladder initially to populate DOM, then visuals will update on modal open
    renderLadder();
}

function updateStats() {
    const earned = achievementsDB.filter(a => a.acquired).length;
    const total = achievementsDB.length;
    const perc = Math.round((earned / total) * 100);
    
    const unclaimed = achievementsDB.filter(a => a.acquired && !a.rewardClaimed).length;
    document.getElementById('rewardsCount').textContent = unclaimed;
    
    const chests = allTreasures.filter(t => t.isChest).length;
    document.getElementById('lootboxCount').textContent = chests;

    document.getElementById('mainTrophyCount').textContent = `${earned}/${total}`;
    document.getElementById('modalEarnedText').textContent = `${earned} OF ${total} ACHIEVEMENTS EARNED`;
    document.getElementById('modalEarnedPerc').textContent = `(${perc}%)`;
    document.getElementById('modalProgressBar').style.width = `${perc}%`;
}

// --- WLD COMPACT LOGIC ---
function updateWLDCompact(visibleGames) {
        let wins = 0, losses = 0, draws = 0;
        visibleGames.forEach(g => {
        if (g.type === 'win' || g.type === 'epic') wins++;
        else if (g.type === 'lose') losses++;
        else draws++;
        });
        
        animateValue("txtWin", prevWins, wins, 500);
        animateValue("txtLose", prevLosses, losses, 500);
        animateValue("txtDraw", prevDraws, draws, 500);

        prevWins = wins;
        prevLosses = losses;
        prevDraws = draws;
        
        let ratioVal = 0;
        if (losses > 0) {
            ratioVal = ((wins + draws) / losses).toFixed(2);
        } else {
            ratioVal = (wins + draws).toFixed(2);
        }
        document.getElementById('txtRatio').textContent = ratioVal;
        
        const totalDecisive = wins + losses;
        let winPerc = 0;
        if(totalDecisive > 0) {
            winPerc = Math.round((wins / totalDecisive) * 100);
        }
        
        animateDonut(prevWinPerc, winPerc, 800);
        prevWinPerc = winPerc;
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

function animateDonut(startPerc, endPerc, duration) {
    const donut = document.getElementById('wldDonut');
    const text = document.getElementById('wldPercentText');
    const greenColor = "#10b981"; 
    const redColor = "#ef4444";
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentPerc = Math.floor(progress * (endPerc - startPerc) + startPerc);
        
        text.textContent = currentPerc + "%";
        donut.style.background = `conic-gradient(${greenColor} 0% ${currentPerc}%, ${redColor} ${currentPerc}% 100%)`;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            text.textContent = endPerc + "%";
            donut.style.background = `conic-gradient(${greenColor} 0% ${endPerc}%, ${redColor} ${endPerc}% 100%)`;
        }
    };
    window.requestAnimationFrame(step);
}

// --- NAVIGATION LOGIC ---
function showView(viewName) {
    const dashboard = document.getElementById('viewDashboard');
    if (viewName === 'dashboard') {
        dashboard.classList.add('active');
    }
}

// --- ITEMS / TREASURES ---
function sortTreasures(items) {
    return items.sort((a, b) => {
        if (a.isChest && !b.isChest) return -1;
        if (!a.isChest && b.isChest) return 1;
        return b.rawPrice - a.rawPrice;
    });
}

function renderTreasures() {
    const list = document.getElementById('treasuresList');
    const btn = document.getElementById('btnTreasures');
    list.innerHTML = '';
    
    sortTreasures(allTreasures);
    const currentItems = allTreasures.slice(0, shownTreasures);
    
    currentItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let priceClass = 'price-neutral';
        if (item.type === 'up') priceClass = 'price-up';
        if (item.type === 'down') priceClass = 'price-down';

        let icon = item.type === 'up' ? 'fa-caret-up' : 'fa-caret-down';
        let colorClass = item.type === 'up' ? 'val-up' : 'val-down';

        let changeHtml = '';
        if(item.type !== 'neutral') {
            changeHtml = `<div class="val-change-inline ${colorClass}" title="ostatnie 24h">${item.change} <i class="fas ${icon}"></i></div>`;
        }
        
        let rightSideHtml = '';
        const badgeClass = `badge-${item.rarity.toLowerCase()}`;

        if (item.isChest) {
            rightSideHtml = `
                <div class="item-right-status">
                    <button class="open-chest-btn" onclick="openChest(${item.id})">Open Case!</button>
                    <div class="rarity-tag-badge ${badgeClass}">${item.rarity}</div>
                </div>
            `;
        } else {
            rightSideHtml = `
                <div class="item-right-status">
                    <div class="rarity-tag-badge ${badgeClass}">${item.rarity}</div>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="item-img" style="color: ${item.color};"><i class="fas ${item.icon}"></i></div>
            <div class="item-info">
                <h5>${item.name}</h5>
                <div class="item-price-row">
                    <p class="${priceClass}">${item.price}</p>
                    ${changeHtml}
                </div>
            </div>
            ${rightSideHtml}
        `;
        list.appendChild(div);
    });
    if (shownTreasures >= allTreasures.length) btn.classList.add('hidden');
}

function showMoreTreasures() {
    shownTreasures += 5;
    renderTreasures();
}

function openChest(id) {
    const index = allTreasures.findIndex(i => i.id === id);
    if (index !== -1) {
        allTreasures.splice(index, 1);
        updateStats();
        renderTreasures();
    }
}

// --- GAMES LIST ---
function renderGames() {
    const list = document.getElementById('gamesList');
    const btn = document.getElementById('btnGames');
    list.innerHTML = '';
    
    const currentGames = allGames.slice(0, shownGames);
    updateWLDCompact(currentGames);
    
    currentGames.forEach(g => {
        let tagClass = 'tag-lose';
        let tagText = 'Przegrana';
        if(g.type === 'win') { tagClass = 'tag-win'; tagText = 'Wygrana'; }
        else if(g.type === 'draw') { tagClass = ''; tagText = 'Remis'; }
        
        const div = document.createElement('div');
        div.className = `game-entry ${g.type}`;
        
        div.innerHTML = `
            <div class="ge-left">
                <div class="ge-icon" style="color:${g.iColor};"><i class="fas ${g.icon}"></i></div>
                <div class="ge-info"><h5>${g.name}</h5><span>${g.val}</span></div>
            </div>
            <div class="ge-right">
                <div class="ge-tag ${tagClass}">${tagText}</div>
                <span class="time-ago">${g.time}</span>
            </div>
        `;
        list.appendChild(div);
    });
    if (shownGames >= allGames.length) btn.classList.add('hidden');
}

function showMoreGames() {
    shownGames += 20;
    renderGames();
}

// --- TROPHIES ---
function claimReward(id) {
    const ach = achievementsDB.find(a => a.id === id);
    if (ach) {
        ach.rewardClaimed = true;
        updateStats();
        renderTrophies();
    }
}

function renderTrophies() {
    const list = document.getElementById('trophiesList');
    const btn = document.getElementById('btnTrophies');
    
    // RESET: Zawsze najpierw pokazujemy przycisk, zanim sprawdzimy czy go ukryć
    if(btn) btn.classList.remove('hidden');
    
    list.innerHTML = '';
    
    const myTrophies = achievementsDB.filter(a => a.acquired);
    
    myTrophies.sort((a, b) => {
        const aClaimable = !a.rewardClaimed;
        const bClaimable = !b.rewardClaimed;

        if (aClaimable && !bClaimable) return -1;
        if (!aClaimable && bClaimable) return 1;

        return parseFloat(a.rarity) - parseFloat(b.rarity);
    });

    // Tniemy listę do aktualnie pokazywanej liczby
    const currentTrophies = myTrophies.slice(0, shownTrophies);
    
    if (myTrophies.length === 0) {
        list.innerHTML = '<div style="padding:10px; color:#8b92a5; text-align:center; font-size:12px;">Brak zdobytych trofeów</div>';
        if(btn) btn.classList.add('hidden');
        return;
    }

    currentTrophies.forEach(t => {
        const div = document.createElement('div');
        div.className = 'trophy-row';
        let iconColor = "silver"; 
        if(parseFloat(t.rarity) < 5) iconColor = "gold";
        else if(parseFloat(t.rarity) > 50) iconColor = "#cd7f32";

        let actionContent = '';
        if (!t.rewardClaimed) {
            actionContent = `<button class="claim-btn" onclick="claimReward(${t.id})">Claim Reward!</button>`;
        }

        div.innerHTML = `
            <div class="trophy-img" style="color: ${iconColor};"><i class="fas ${t.icon}"></i></div>
            <div class="trophy-info">
                <h5>${t.title}</h5>
                <p>${t.date}</p>
            </div>
            
            <div class="trophy-right-side">
                ${actionContent}
                <div class="trophy-perc">${t.rarity}</div>
            </div>
        `;
        list.appendChild(div);
    });

    // Jeśli pokazujemy wszystkie dostępne trofea (lub więcej), ukrywamy przycisk
    if (shownTrophies >= myTrophies.length) {
        if(btn) btn.classList.add('hidden');
    }
}

function showMoreTrophies() {
    shownTrophies += 5;
    renderTrophies();
}

// --- VIEW SWITCH ---
function toggleAdminView() {
    const isChecked = document.getElementById('adminSwitch').checked;
    const viewLabel = document.getElementById('viewLabel');
    const adminPanels = document.querySelector('.admin-row');
    const adminNav = document.getElementById('adminNavSection');
    const adminDivider = document.querySelector('.admin-divider-line');

    if (isChecked) {
        viewLabel.textContent = "Widok Admina";
        viewLabel.style.color = "var(--accent-purple)";
        adminPanels.classList.remove('hidden-panel');
        adminNav.classList.remove('hidden');
        adminDivider.classList.remove('hidden-panel');
    } else {
        viewLabel.textContent = "Widok Użytkownika";
        viewLabel.style.color = "var(--text-muted)";
        adminPanels.classList.add('hidden-panel');
        adminNav.classList.add('hidden');
        adminDivider.classList.add('hidden-panel');
    }
}

// --- ACHIEVEMENTS MODAL ---
let currentModalTab = 'my';
function openModal() {
    document.getElementById('achievementsModal').classList.add('active');
    renderModalAchievements(currentModalTab);
}
function closeModal() {
    document.getElementById('achievementsModal').classList.remove('active');
}
function switchTab(type) {
    currentModalTab = type;
    document.getElementById('tabMy').classList.toggle('active', type === 'my');
    document.getElementById('tabGlobal').classList.toggle('active', type === 'global');
    renderModalAchievements(type);
}
function renderModalAchievements(type) {
    const container = document.getElementById('achContent');
    container.innerHTML = '';
    
    if (type === 'my') {
        let unlocked = achievementsDB.filter(a => a.acquired);
        unlocked.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (unlocked.length > 0) {
            container.innerHTML += `<div class="sm-section-title">Unlocked Achievements</div>`;
            unlocked.forEach(item => container.appendChild(createAchRow(item, 'my')));
        } else {
            container.innerHTML += `<div style="text-align:center; padding:10px; color:var(--text-muted);">Jeszcze nic nie zdobyłeś.</div>`;
        }

        const lockedVisible = achievementsDB.filter(a => !a.acquired && !a.hidden);
        if (lockedVisible.length > 0) {
            container.innerHTML += `<div class="sm-section-title">Locked Achievements</div>`;
            lockedVisible.forEach(item => container.appendChild(createAchRow(item, 'my')));
        }

        const hiddenRemaining = achievementsDB.filter(a => !a.acquired && a.hidden).length;
        let hiddenHTML = '';
        if (hiddenRemaining > 0) {
            hiddenHTML = `
                <div class="hidden-ach-summary">
                    <div class="hidden-ach-title">${hiddenRemaining} Hidden Achievements Remaining</div>
                    <div class="hidden-ach-desc">Details for each achievement will be revealed once unlocked</div>
                </div>
            `;
        } else {
            hiddenHTML = `
                <div class="hidden-ach-summary">
                    <div class="hidden-ach-title" style="color:var(--accent-green);">All Hidden Achievements Unlocked!</div>
                </div>
            `;
        }
        container.innerHTML += `<div class="sm-section-title">Hidden Achievements</div>${hiddenHTML}`;
    } else {
        const sortedDB = [...achievementsDB].sort((a, b) => parseFloat(b.rarity) - parseFloat(a.rarity));
        sortedDB.forEach(item => {
            container.appendChild(createAchRow(item, 'global'));
        });
    }
}
function createAchRow(item, viewType) {
    const row = document.createElement('div');
    let classes = 'sm-ach-row';
    if (!item.acquired) classes += ' locked';
    row.className = classes;

    let title = item.title;
    let desc = item.desc;
    let iconClass = item.icon;

    if (item.hidden && !item.acquired) {
        title = "Hidden Achievement";
        desc = "Details revealed once unlocked.";
        iconClass = "fa-question";
    }

    let rightSide;
    if (viewType === 'my') {
        rightSide = item.acquired ? `<div class="sm-ach-date">${item.date}</div>` : '';
    } else {
        rightSide = `<div style="font-weight:600; color:#fff;">${item.rarity}</div>`;
    }

    row.innerHTML = `
        <div class="sm-ach-icon" style="background:rgba(255,255,255,0.05); display:flex; justify-content:center; align-items:center;">
            <i class="fas ${iconClass}" style="font-size:24px;"></i>
        </div>
        <div class="sm-ach-details">
            <div class="sm-ach-name">${title}</div>
            <div class="sm-ach-desc">${desc}</div>
        </div>
        ${rightSide}
    `;
    return row;
}

// --- LADDER SYSTEM (UPDATED LOGIC) ---

function renderLadder() {
    const container = document.getElementById('ladderContainer');
    const spine = document.getElementById('ladderSpine');
    container.innerHTML = '';
    container.appendChild(spine);

    ranksDB.forEach((rank, index) => {
        const stepDiv = document.createElement('div');
        let stepClass = 'center-step';
        let extraZ = '';

        if (rank.align === 'left') {
            stepClass = 'left-step';
            if (rank.margin.includes('-60px')) extraZ = 'step-z-2';
        } else if (rank.align === 'right') {
            stepClass = 'right-step';
            if (rank.margin.includes('-60px')) extraZ = 'step-z-1'; 
            if (index > 0 && ranksDB[index-1].align === 'left') extraZ = 'step-z-1';
        }

        // SPRAWDZAMY ODBLOKOWANIE
        const isUnlocked = rank.id >= currentRankId;
        const unlockedClass = isUnlocked ? 'rank-unlocked' : '';

        // WAŻNE: Dodajemy unlockedClass również do stepDiv (dla linii), a nie tylko do karty
        stepDiv.className = `ladder-step ${stepClass} ${extraZ} ${unlockedClass}`;
        if (rank.margin) stepDiv.style = rank.margin;
        
        let iconHtml = `<i class="fas ${rank.icon} rank-icon-large" style="color:${rank.color};"></i>`;
        if (rank.emoji) {
            iconHtml = `<div style="font-size: 28px; margin-bottom: 8px;">${rank.emoji}</div>`;
        }

        stepDiv.innerHTML = `
            <div class="ladder-card ${rank.cardClass} ${unlockedClass}" id="rank-card-${rank.id}">
                <div class="rank-number">#${rank.id}</div>
                ${iconHtml}
                <div class="rank-name">${rank.name} ${rank.id === currentRankId ? '(Ty)' : ''}</div>
                <div class="rank-desc">${rank.desc}</div>
                <div class="rank-reqs">${rank.req}</div>
            </div>
        `;
        container.appendChild(stepDiv);
    });
}

function updateLadderVisuals() {
    const spine = document.getElementById('ladderSpine');
    const currentCard = document.getElementById(`rank-card-${currentRankId}`);
    
    if (currentCard && spine) {
        // Pobieramy wymiary i pozycje
        const spineRect = spine.getBoundingClientRect();
        const cardRect = currentCard.getBoundingClientRect();
        
        // Obliczamy środek karty (w pionie)
        const cardCenterY = cardRect.top + (cardRect.height / 2);
        
        // Obliczamy pozycję tego środka względem góry linii (spine)
        // Odejmujemy spineRect.top, aby dostać wartość lokalną wewnątrz linii
        const relativeY = cardCenterY - spineRect.top;
        
        // Zamieniamy na procent wysokości samej linii
        let percentage = (relativeY / spineRect.height) * 100;
        
        // Ograniczenia (clamp)
        percentage = Math.max(0, Math.min(100, percentage));

        // ZMIANA: Wyłączamy światło tylko jeśli ranga to 8 (Degenerate).
        // Jeśli jest 7 (Small Fry), światło działa i łączy #8 z #7.
        if (currentRankId > 7) { 
            percentage = 0;
            spine.style.boxShadow = `none`;
        } else {
            spine.style.boxShadow = `0 0 15px rgba(59, 130, 246, 0.4)`;
        }

        // Aplikujemy gradient
        // Zauważ, że Blue kończy się na 'percentage', a Dark zaczyna od 'percentage'.
        // To tworzy efekt "tamy" idealnie na środku karty.
        spine.style.background = `linear-gradient(
            to bottom, 
            #3b82f6 0%, 
            #3b82f6 ${percentage}%, 
            #2d3748 ${percentage}%, 
            #2d3748 100%
        )`;
    }
}

function openRankModal() {
    document.getElementById('rankModal').classList.add('active');
    // Recalculate visuals after modal is visible (DOM rendered)
    setTimeout(updateLadderVisuals, 50); 
}

function closeRankModal() {
    document.getElementById('rankModal').classList.remove('active');
}

// --- CHATBOT ---
const chatWindow = document.getElementById('chatWindow');
const toggleIcon = document.getElementById('toggleIcon');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
function toggleChat() {
    const isOpen = chatWindow.classList.contains('open');
    if (isOpen) {
        chatWindow.classList.remove('open');
        toggleIcon.className = 'fas fa-robot';
    } else {
        chatWindow.classList.add('open');
        toggleIcon.className = 'fas fa-times';
    }
}
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    setTimeout(() => addMessage("Jestem tylko demem UI, ale dziękuję za wiadomość!", 'bot'), 1000);
}
function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

// Initialize
initDashboard();