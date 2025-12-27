// State variables
let shownTreasures = 5;
let shownGames = 20; 
let shownTrophies = 5;
let notificationCount = 3;

// Animation State
let prevWinPerc = 0;
let prevWins = 0;
let prevLosses = 0;
let prevDraws = 0;

// Current Player State (Hardcoded for Demo)
const currentRankId = 3; // Alpha Whale

// --- GLOBAL STATE ---
let myInventory = []; // Tablica obiektów (instancji)
let myLoadout = {};   // Mapa: slotId -> itemUid
let invFilterState = { item: true, case: true };

// --- RENDER FUNCTIONS ---
// --- MARKET SYSTEM START ---
let marketState = {
    tab: 'global', // 'global' or 'my'
    search: '',
    types: { item: true, case: true }, // Multiselect
    slots: ['head', 'neck', 'suit', 'watch', 'gadget', 'belt', 'pants', 'shoes', 'ring', 'vehicle'], // All active by default
    priceMin: null,
    priceMax: null,
    rarities: ['Peasant', 'Rare', 'Epic', 'Relic', 'Divine'],
    sort: 'best_deal',
    listings: [] // Will be populated with mock data
};

function initMarketData() {
    marketState.listings = [];
    
    // Helper do tworzenia ofert
    const addListing = (itemTemplateId, sellerName, priceOverride, isMine = false, inventoryUid = null) => {
        const template = allTreasures.find(t => t.id === itemTemplateId);
        if(!template) return;

        // Jeśli to mój przedmiot, muszę znaleźć jego UID w moim ekwipunku
        let finalUid = `mkt_${Date.now()}_${Math.random()}`;
        
        if (isMine) {
            // Znajdź przedmiot w myInventory, który pasuje do ID i nie jest jeszcze wystawiony (teoretycznie)
            // W tym demo zakładamy, że initInventorySystem() już stworzył instancje.
            // Szukamy instancji tego przedmiotu u MrGamblera
            const myItem = myInventory.find(i => i.id === itemTemplateId && !i.isOnSale);
            if (myItem) {
                finalUid = myItem.uid;
                myItem.isOnSale = true; // Oznaczamy w ekwipunku!
            } else {
                return; // Nie mam tego przedmiotu, błąd danych
            }
        }

        // Generowanie historii cen
        const history = [];
        let cur = priceOverride;
        for(let j=0; j<10; j++) {
            cur = cur * (1 + ((Math.random() * 0.1) - 0.05));
            history.push(cur);
        }
        
        // Pobieramy zdjęcie (z bazy lub fallback)
        let sellerImg = `https://i.pravatar.cc/150?u=${sellerName}`;
        const dbPlayer = typeof playersDB !== 'undefined' ? playersDB.find(p => p.username === sellerName) : null;
        if(dbPlayer && dbPlayer.pfp) sellerImg = dbPlayer.pfp;

        marketState.listings.push({
            uid: finalUid,
            templateId: template.id,
            seller: sellerName,
            sellerImg: sellerImg, // NOWE
            price: priceOverride,
            change: ((Math.random() * 20) - 10).toFixed(1),
            history: history,
            isMine: isMine,
            date: Date.now() - Math.floor(Math.random() * 86400000 * 3),
            
            // Props for easier filtering
            name: template.name,
            rarity: template.rarity,
            type: template.type,
            icon: template.icon,
            color: template.color,
            isChest: template.type === 'chest'
        });
    };

    // 1. OFERTY MR GAMBLERA (Muszą pasować do tego co ma w data.js -> inventory)
    // MrGambler ma: Divine Case (5), Patek (16). Wystawiamy je.
    addListing(5, "MrGambler", 1250000, true); // Divine Case - Drogo
    addListing(16, "MrGambler", 2400000, true); // Patek - Okazja
    addListing(15, "MrGambler", 45000, true); // Rolex Submariner (Epic)

    // 2. OFERTY INNYCH GRACZY (Hardcoded, Specific)
    
    // Whale_Killer (Sprzedaje Top Tier)
    addListing(27, "Whale_Killer", 1900000); // Karta do Bugatti
    addListing(13, "Whale_Killer", 480000);  // Smoking Bonda
    addListing(4, "Whale_Killer", 95000);    // Relic Case

    // LuckyLuke (Mid Tier)
    addListing(7, "LuckyLuke", 1400);        // RayBan
    addListing(12, "LuckyLuke", 4200);       // Hugo Boss
    addListing(3, "LuckyLuke", 22000);       // Epic Case

    // CryptoBro (Tech & High Risk)
    addListing(30, "CryptoBro", 110000);     // Szyfrowany Telefon (Drogo)
    addListing(8, "CryptoBro", 14000);       // Gogle VR
    addListing(26, "CryptoBro", 48000);      // Kluczyki BMW

    // Bot_Network (Spam tanich itemów)
    addListing(1, "Bot_Network_01", 450);    // Peasant Case
    addListing(1, "Bot_Network_01", 440);
    addListing(25, "Bot_Network_01", 2);     // Bilet
    addListing(19, "Bot_Network_01", 120);   // Dżinsy

    // Random Fillers (Dla zapełnienia rynku)
    const fillers = [
        {id: 2, seller: "Anon_99", price: 4800},
        {id: 15, seller: "WatchMaster", price: 42000},
        {id: 22, seller: "Luigi", price: 2800},
        {id: 33, seller: "Barman", price: 90}
    ];
    fillers.forEach(f => addListing(f.id, f.seller, f.price));
}

function renderMarketView() {
    // Upewnij się, że mamy dane
    if(marketState.listings.length === 0) initMarketData();
    
    // Reset filtrów wizualnych w sidebarze (jeśli to pierwsze wejście)
    updateMarketLockIcons();
    
    // Render Grid
    filterMarket();
}

function switchMarketTab(tab) {
    marketState.tab = tab;
    
    // Update UI Styles
    document.getElementById('tabGlobalMarket').classList.toggle('active', tab === 'global');
    document.getElementById('tabMyListings').classList.toggle('active', tab === 'my');
    
    // Re-render
    filterMarket();
}

function toggleMarketType(type, btnElement) {
    marketState.types[type] = !marketState.types[type];
    
    // Visual Toggle
    btnElement.classList.toggle('active', marketState.types[type]);
    
    // Show/Hide Slot filters (only if Item is active)
    const slotSection = document.getElementById('slotFilterSection');
    if(marketState.types['item']) slotSection.classList.remove('hidden');
    else slotSection.classList.add('hidden');
    
    filterMarket();
}

function toggleSlotFilter(slot, btnElement) {
    const idx = marketState.slots.indexOf(slot);
    if(idx === -1) {
        marketState.slots.push(slot);
        btnElement.classList.add('active');
    } else {
        marketState.slots.splice(idx, 1);
        btnElement.classList.remove('active');
    }
    filterMarket();
}

function updateMarketLockIcons() {
    // Mapowanie rang do rzadkości (Hardcoded logic from prompt)
    // Divine needs Rng God (id: 2+), Relic needs Alpha Whale (id: 3+), Epic needs Table Shark (id: 5+)
    // Player Rank: currentRankId (defined in app.js as 3 - Alpha Whale)
    
    // Logic: If RankID > RequirementID (Remember: Lower ID is better rank in original code, ID 1 is King)
    // Actually looking at ranksDB: 8 is Bankrupt, 1 is King. So Higher ID = Worse Rank?
    // Let's check: Bankrupt ID 8 (bottom), King ID 1 (top).
    // So BETTER rank means LOWER ID.
    
    const pRank = currentRankId; // 3 (Alpha Whale)
    
    // Lock logic: Lock if playerRankID > requiredRankID
    const checkLock = (reqId, elId) => {
        const el = document.getElementById(elId);
        if(!el) return;
        if(pRank > reqId) el.classList.add('locked'); // E.g. Player is 5, Req is 3 -> Locked
        else el.classList.remove('locked');
    };
    
    // Divine (Req: RNG God - ID 2)
    checkLock(2, 'lockDivine');
}

function filterMarket() {
    const grid = document.getElementById('marketGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    // Get Input Values
    marketState.search = document.getElementById('marketSearchInput').value.toLowerCase();
    marketState.priceMin = document.getElementById('priceMin').value;
    marketState.priceMax = document.getElementById('priceMax').value;
    marketState.sort = document.getElementById('marketSortSelect').value;
    
    // Rarities Checkboxes
    const checkedRarities = Array.from(document.querySelectorAll('.ms-check-row input:checked')).map(cb => cb.value);

    // Filtering Logic
    let results = marketState.listings.filter(item => {
        // Tab
        if(marketState.tab === 'my' && !item.isMine) return false;
        if(marketState.tab === 'global' && item.isMine) return false; // Usually global shows all, but separate tabs implies separation. Let's show others in global. Actually prompt says: "Global: All items of all players". Usually implies excluding mine or highlighting mine. Let's keep separation for clean UI.
        
        // Type
        if(item.isChest && !marketState.types.case) return false;
        if(!item.isChest && !marketState.types.item) return false;
        
        // Search
        if(marketState.search && !item.name.toLowerCase().includes(marketState.search)) return false;
        
        // Price
        if(marketState.priceMin && item.price < marketState.priceMin) return false;
        if(marketState.priceMax && item.price > marketState.priceMax) return false;
        
        // Slots (only if items)
        if(!item.isChest) {
            if(!marketState.slots.includes(item.type)) return false;
        }
        
        // Rarity
        if(!checkedRarities.includes(item.rarity)) return false;
        
        return true;
    });
    
    // Sorting Logic
    results.sort((a, b) => {
        switch(marketState.sort) {
            case 'price_asc': return a.price - b.price;
            case 'price_desc': return b.price - a.price;
            case 'newest': return b.date - a.date;
            case 'trending': return parseFloat(b.change) - parseFloat(a.change);
            case 'best_deal': 
                // Mock best deal: high rarity + low price relative to base
                const ratioA = (allTreasures.find(t=>t.id===a.templateId).rawPrice) / a.price;
                const ratioB = (allTreasures.find(t=>t.id===b.templateId).rawPrice) / b.price;
                return ratioB - ratioA;
            default: return 0;
        }
    });
    
    // Render Results
    results.forEach(item => {
        const card = createMarketCard(item);
        grid.appendChild(card);
    });
    
    if(results.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Brak ofert spełniających kryteria.</div>';
    }
}

function createMarketCard(item) {
    const el = document.createElement('div');
    el.className = 'm-card';
    // Style match Inventory: Border in rarity color (50% opacity)
    el.style.borderColor = `rgba(${hexToRgb(item.color)}, 0.5)`;
    el.onclick = () => openMarketItemModal(item);
    
    // Background Sparkline Bars
    let barsHtml = '';
    item.history.forEach((val, idx) => {
        const prev = idx > 0 ? item.history[idx-1] : val;
        const colorClass = val >= prev ? '' : 'down';
        const height = Math.min(100, Math.max(10, (val / item.price) * 30));
        barsHtml += `<div class="mc-bar ${colorClass}" style="height:${height}%;"></div>`;
    });
    
    const changeClass = parseFloat(item.change) >= 0 ? 'val-up' : 'val-down';
    const changeIcon = parseFloat(item.change) >= 0 ? '+' : '';
    
    // Lock logic for Card
    let isLocked = false;
    if(item.rarity === 'Divine' && currentRankId > 2) isLocked = true;
    
    const lockHtml = isLocked ? `<div class="mc-lock-overlay"><i class="fas fa-lock"></i></div>` : '';

    el.innerHTML = `
        <div class="mc-header" style="color:${item.color};">
            <div style="font-size: 60px; font-style: normal; line-height: 1; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding-top: 15px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));">${item.icon}</div>
            <div class="mc-seller-row" title="Sprzedawca: ${item.seller}">
                <div class="mc-seller-avatar" style="background-image: url('${item.sellerImg}');"></div>
                <div class="mc-seller-name">${item.seller}</div>
            </div>
            ${lockHtml}
        </div>
        <div class="mc-body">
            <div class="mc-sparkline">${barsHtml}</div>
            <div class="mc-title" style="color:${item.color}; font-size: 12px; margin-bottom: 8px;">${item.name}</div>
            
            <div class="mc-price-row">
                <div class="mc-price">${item.price.toLocaleString()} $</div>
                <div class="mc-change ${changeClass}">${changeIcon}${item.change}%</div>
            </div>
        </div>
    `;
    return el;
}

// MARKET MODAL
function openMarketItemModal(item) {
    const modal = document.getElementById('marketModal');
    if(!modal) return;
    
    // Populate Data
    document.getElementById('mmIcon').innerHTML = item.icon;
    document.getElementById('mmIcon').className = ''; // Remove FontAwesome classes
    document.getElementById('mmCard').style.color = item.color;
    document.getElementById('mmSellerName').textContent = item.seller;
    
    document.getElementById('mmItemName').textContent = item.name;
    document.getElementById('mmCurrentPrice').textContent = item.price.toLocaleString() + ' $';
    document.getElementById('mmLastPrice').textContent = (item.price * (1 - (parseFloat(item.change)/100))).toFixed(0).toLocaleString() + ' $';
    
    const chgEl = document.getElementById('mmChange');
    chgEl.textContent = (parseFloat(item.change) > 0 ? '+' : '') + item.change + '%';
    chgEl.className = 'mm-v ' + (parseFloat(item.change) >= 0 ? 'val-up' : 'val-down');
    
    // Tags
    const tags = document.getElementById('mmTags');
    const badgeClass = `badge-${item.rarity.toLowerCase()}`;
    tags.innerHTML = `<span class="rarity-tag-badge ${badgeClass}">${item.rarity}</span>`;
    if(item.isChest) tags.innerHTML += `<span class="badge-slot">CASE</span>`;
    else tags.innerHTML += `<span class="badge-slot">${item.type.toUpperCase()}</span>`;
    
    // Desc & Warning
    const template = allTreasures.find(t => t.id === item.templateId);
    let desc = template ? (template.desc + ' ' + template.bonus) : '';
    document.getElementById('mmDesc').textContent = desc;
    
    // Rank Lock Warning in Modal
    const warning = document.getElementById('mmReqWarning');
    let reqRankName = '';
    let isLocked = false;
    if(item.rarity === 'Divine' && currentRankId > 2) { isLocked = true; reqRankName = "RNG God"; }
    
    if(isLocked) {
        warning.innerHTML = `<i class="fas fa-lock"></i> Wymagana ranga: ${reqRankName} (do założenia)`;
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
    
    // My Listing Actions vs Buy Actions
    const btnBuy = document.getElementById('btnBuyNow');
    const btnOffer = document.getElementById('btnOffer');
    
    if(item.isMine) {
        btnBuy.textContent = "USUŃ OFERTĘ";
        btnBuy.onclick = () => { alert("Oferta usunięta."); closeMarketModal(); };
        btnBuy.style.background = "var(--accent-red)";
        
        btnOffer.textContent = "INSTANT SELL (Floor)";
        btnOffer.onclick = () => { alert(`Sprzedano natychmiastowo za ${Math.floor(item.price*0.7)} $ (Floor Price).`); closeMarketModal(); };
    } else {
        btnBuy.textContent = "KUP TERAZ";
        btnBuy.onclick = () => { alert("Zakupiono przedmiot!"); closeMarketModal(); };
        btnBuy.style.background = "var(--accent-green)";
        
        btnOffer.textContent = "ZŁÓŻ OFERTĘ";
        btnOffer.onclick = () => { alert("Oferta wysłana do sprzedawcy."); };
    }

    modal.classList.add('active');
}

function closeMarketModal() {
    document.getElementById('marketModal').classList.remove('active');
}
// --- MARKET SYSTEM END ---
function initDashboard() {
    initInventorySystem(); // 1. Najpierw ładujemy ekwipunek gracza
    initMarketData();      // 2. Potem ładujemy rynek (żeby powiązać itemy)
    
    // 3. Renderujemy widoki
    renderDashInventory(); 
    renderTreasures();    
    renderGames(); 
    renderTrophies();
    updateStats();
    renderLadder();
    
    // 4. Odświeżamy widok inventory (bo initMarketData mogło dodać flagi 'onSale')
    renderInventoryView();
}

// Inicjalizacja danych inventory z bazy + dodanie mockowych danych rynkowych
function initInventorySystem() {
    const player = playersDB.find(p => p.username === "MrGambler");
    if (!player) return;

    myInventory = [];
    player.inventory.forEach((itemId, index) => {
        const template = allTreasures.find(t => t.id === itemId);
        if (template) {
            // Tworzymy unikalną instancję
            const item = { ...template, uid: `item_${itemId}_${index}` };
            
            // Fix dla brakujących danych rynkowych (dla nowych itemów biznesowych)
            if (!item.change) {
                const changeVal = (Math.random() * 10 - 5).toFixed(1);
                item.change = (changeVal > 0 ? "+" : "") + changeVal + "%";
                // Zmieniamy nazwę pola na 'trend', aby nie nadpisywać item.type (np. 'chest', 'watch')
                item.trend = changeVal > 0 ? "up" : (changeVal < 0 ? "down" : "neutral");
            }
            
            myInventory.push(item);
        }
    });
}

function updateStats() {
    const earned = achievementsDB.filter(a => a.acquired).length;
    const total = achievementsDB.length;
    const perc = Math.round((earned / total) * 100);

    // Update notifications logic (Badge)
    const badge = document.getElementById('headerBellBadge');
    if (notificationCount > 0) {
        badge.textContent = notificationCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

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
const navMap = {
    'dashboard': { title: "Dashboard", navId: "navDash", viewId: "viewDashboard" },
    'profile': { title: "Twój Profil", navId: "navProfile", viewId: "viewProfile" },
    'games': { title: "Gry", navId: "navGames", viewId: "viewGames" },
    'inventory': { title: "Ekwipunek", navId: "navInventory", viewId: "viewInventory", init: renderInventoryView },
    'market': { title: "Rynek", navId: "navMarket", viewId: "viewMarket", init: renderMarketView },
    'wallet': { title: "Portfel", navId: "navWallet", viewId: "viewWallet", init: renderWalletView },
    'adminDash': { title: "Dashboard Admina", navId: "navAdminDash", viewId: "viewAdminDash" },
    'users': { title: "Użytkownicy", navId: "navUsers", viewId: "viewUsers", init: renderUsersView },
    'logs': { title: "Logi", navId: "navLogs", viewId: "viewLogs", init: renderLogsView }
};

function showView(viewName) {
    const config = navMap[viewName];
    if(!config) return;

    // 1. Ukryj widoki i usuń active z nav
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // 2. Aktywuj odpowiednie elementy
    document.getElementById(config.viewId).classList.add('active');
    const navEl = document.getElementById(config.navId);
    if(navEl) navEl.classList.add('active');

    // 3. Zmień dynamiczny nagłówek
    document.getElementById('pageHeaderTitle').textContent = config.title;

    // 4. Pokaż/ukryj przycisk "Przeglądaj Profile" tylko w widoku profilu
    const browseProfilesBtn = document.getElementById('browseProfilesBtn');
    if (browseProfilesBtn) {
        browseProfilesBtn.style.display = viewName === 'profile' ? 'inline-block' : 'none';
    }

    // 5. Inicjalizacja specyficzna (jeśli istnieje)
    if (viewName === 'games') renderGamesHub();
    if (config.init) config.init();
}

// --- ITEMS / TREASURES ---
function sortTreasures(items) {
    return items.sort((a, b) => {
        if (a.isChest && !b.isChest) return -1;
        if (!a.isChest && b.isChest) return 1;
        return b.rawPrice - a.rawPrice;
    });
}

// Unified Render Function for Profile List using MrGambler's Items
function renderTreasures() {
    const list = document.getElementById('treasuresList');
    const btn = document.getElementById('btnTreasures');
    if(!list) return;
    list.innerHTML = '';
    
    // Sortujemy ekwipunek od najdroższego dla profilu (Show Off)
    const sortedProfileInv = [...myInventory].sort((a, b) => b.rawPrice - a.rawPrice);

    // Używamy posortowanej kopii zamiast surowego myInventory
    const currentItems = sortedProfileInv.slice(0, shownTreasures);
    
    currentItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let priceClass = 'price-neutral';
        let icon = '';
        let colorClass = '';

        // Używamy item.trend zamiast item.type
        if (item.trend === 'up' || item.type === 'up') { priceClass = 'price-up'; icon = 'fa-caret-up'; colorClass = 'val-up'; }
        else if (item.trend === 'down' || item.type === 'down') { priceClass = 'price-down'; icon = 'fa-caret-down'; colorClass = 'val-down'; }

        let changeHtml = '';
        // Wyświetl zmianę tylko jeśli jest różna od 0% lub jeśli item ma typ up/down
        if(item.change && item.change !== "0%") {
            changeHtml = `<div class="val-change-inline ${colorClass}" title="ostatnie 24h">${item.change} <i class="fas ${icon}"></i></div>`;
        }
        
        // Sprawdź czy założony
        const isEquipped = Object.values(myLoadout).includes(item.uid);
        let equippedTag = isEquipped ? `<span style="font-size:9px; color:var(--accent-blue); font-weight:700; margin-right:5px;">[EQ]</span>` : '';

        const badgeClass = `badge-${item.rarity.toLowerCase()}`;
        let rightSideHtml = `
            <div class="item-right-status">
                ${equippedTag}
                <div class="rarity-tag-badge ${badgeClass}">${item.rarity}</div>
            </div>
        `;

        div.innerHTML = `
            <div class="item-img" style="font-style: normal;">${item.icon}</div>
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
    
    if (shownTreasures >= myInventory.length) {
        if(btn) btn.classList.add('hidden');
    } else {
        if(btn) btn.classList.remove('hidden');
    }
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
        
        // Decrement notifications only for trophies
        if (notificationCount > 0) {
            notificationCount--;
        }
        
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
    const adminNav = document.getElementById('adminNavSection');

    if (isChecked) {
        viewLabel.textContent = "Widok Admina";
        viewLabel.style.color = "var(--accent-purple)";
        adminNav.classList.remove('hidden');
    } else {
        viewLabel.textContent = "Widok Użytkownika";
        viewLabel.style.color = "var(--text-muted)";
        adminNav.classList.add('hidden');
        // Jeśli jesteśmy w widoku admina, wróć do dashboardu
        if(document.getElementById('viewAdminDash').classList.contains('active') ||
           document.getElementById('viewUsers').classList.contains('active') ||
           document.getElementById('viewLogs').classList.contains('active')) {
            showView('dashboard');
        }
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

// --- BATTLE PASS MODAL ---
function openBattlePassModal() {
    document.getElementById('battlePassModal').classList.add('active');
}

function closeBattlePassModal() {
    document.getElementById('battlePassModal').classList.remove('active');
}
// --- ACCOUNT MODAL ---
function openAccountModal() {
    document.getElementById('accountModal').classList.add('active');
}

function closeAccountModal() {
    document.getElementById('accountModal').classList.remove('active');
}

// --- PLAYER STATS MODAL ---
function openPlayerStatsModal() {
    document.getElementById('playerStatsModal').classList.add('active');
}

function closePlayerStatsModal() {
    document.getElementById('playerStatsModal').classList.remove('active');
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

// --- NEW VIEW RENDERS ---

// --- DRAG AND DROP & INVENTORY LOGIC ---

function toggleInvFilter(type) {
    invFilterState[type] = !invFilterState[type];
    const btn = document.getElementById(type === 'item' ? 'btnInvItem' : 'btnInvCase');
    if(btn) btn.classList.toggle('active', invFilterState[type]);
    renderInventoryView();
}
function renderInventoryView() {
    const container = document.getElementById('inventoryContainer');
    if(!container) return; 
    container.innerHTML = '';
    
    // Inicjalizacja slotów loadoutu (dodanie listenerów)
    setupLoadoutSlots();

    // Filtrowanie i Sortowanie
    let filteredInv = myInventory.filter(item => {
        const isCase = item.type === 'chest'; // ID 1-5 (skrzynki) mają typ 'chest'
        if(isCase && !invFilterState.case) return false;
        if(!isCase && !invFilterState.item) return false;
        return true;
    });

    const sortedInv = filteredInv.sort((a, b) => b.rawPrice - a.rawPrice);
    
    // Render Grid
    sortedInv.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'inv-grid-slot';
        
        // Sprawdź czy przedmiot jest założony
        const isEquipped = Object.values(myLoadout).includes(item.uid);
        // Sprawdź czy jest na Rynku (dodana flaga w initMarketData)
        const isOnSale = item.isOnSale === true;

        if (isEquipped) slot.classList.add('is-equipped');
        if (isOnSale) slot.classList.add('on-sale');

        // Draggable Attributes (Zablokuj jeśli EQ lub SALE)
        const isLocked = isEquipped || isOnSale;
        slot.setAttribute('draggable', !isLocked);
        slot.dataset.uid = item.uid;
        slot.addEventListener('dragstart', handleDragStart);

        let rarityColor = getRarityColor(item.rarity);

        slot.style.borderColor = `rgba(${hexToRgb(rarityColor)}, 0.5)`;
        slot.style.backgroundColor = `rgba(${hexToRgb(rarityColor)}, 0.05)`;
        
        if (isOnSale) {
            slot.style.borderColor = 'var(--accent-orange)';
        }

        // Badges
        let badgeHtml = '';
        if (isEquipped) badgeHtml = `<div class="equipped-badge">EQ</div>`;
        else if (isOnSale) badgeHtml = `<div class="on-sale-badge">NA RYNKU</div>`;

        // Rank Lock Logic (Divine req Rank <= 2)
        if (item.rarity === 'Divine' && currentRankId > 2) {
            badgeHtml += `<div class="inv-lock-overlay"><i class="fas fa-lock"></i></div>`;
            slot.classList.add('is-rank-locked');
        }

        slot.innerHTML = `
            <div class="inv-item-icon" style="font-style: normal; color: initial;">${item.icon}</div>
            <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
            ${badgeHtml}
        `;
        
        // Rozbudowany tooltip
        slot.title = `${item.name} (${item.rarity})\nTyp: ${item.type}\nBonus: ${item.bonus}\nCena: ${item.price}`;
        
        container.appendChild(slot);
    });

    // Puste sloty
    const minSlots = 63;
    for(let i = sortedInv.length; i < minSlots; i++) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'inv-grid-slot empty';
        container.appendChild(emptySlot);
    }
}

function setupLoadoutSlots() {
    const slots = document.querySelectorAll('.pd-slot');
    slots.forEach(slot => {
        // Usuwamy stare listenery (klonowanie niszczy listenery)
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);
        
        // Dodajemy nowe
        newSlot.addEventListener('dragover', handleDragOver);
        newSlot.addEventListener('drop', handleDrop);
        newSlot.addEventListener('click', handleUnequip); // Kliknięcie zdejmuje
        
        // Rerender zawartości slota jeśli coś w nim jest
        const slotType = newSlot.dataset.type; // np. 'watch', 'suit'
        // Znajdź unikalny klucz slotu w myLoadout. 
        // UWAGA: Mamy kilka slotów tego samego typu (np. 2 ringi). 
        // W HTML musimy je rozróżnić ID lub klasą, albo użyć mapowania.
        // Dla uproszczenia w tym patchu: używamy klasy slotu jako klucza w myLoadout.
        
        // Pobieramy unikalną klasę identyfikującą slot (np. 'slot-watch')
        const slotClass = Array.from(newSlot.classList).find(c => c.startsWith('slot-'));
        
        if (slotClass && myLoadout[slotClass]) {
            const itemUid = myLoadout[slotClass];
            const item = myInventory.find(i => i.uid === itemUid);
            if (item) {
                renderItemInSlot(newSlot, item);
            }
        } else {
            // Reset do placeholder
            resetSlotVisuals(newSlot);
        }
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.uid);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
    e.preventDefault();
    const uid = e.dataTransfer.getData("text/plain");
    const item = myInventory.find(i => i.uid === uid);
    
    // Znajdź element slotu (mogł być drop na ikonę wewnątrz slotu)
    let slot = e.target;
    while (!slot.classList.contains('pd-slot') && slot.parentElement) {
        slot = slot.parentElement;
    }

    if (!item || !slot) return;

    // Walidacja Typu
    // item.type w bazie to np. 'watch', 'suit'. slot.dataset.type to też 'watch', 'suit'.
    if (item.type !== slot.dataset.type) {
        alert(`Nie możesz włożyć ${item.name} (${item.type}) do slotu ${slot.dataset.type}!`);
        renderInventoryView(); // Reset opacity
        return;
    }

    // Zapisz w loadout
    const slotClass = Array.from(slot.classList).find(c => c.startsWith('slot-'));
    if (slotClass) {
        myLoadout[slotClass] = uid;
        // Odśwież widoki
        renderInventoryView(); // To przerysuje siatkę i zablokuje przedmiot
        setupLoadoutSlots();   // To zaktualizuje wizualnie postać
    }
}

function handleUnequip(e) {
    let slot = e.target;
    while (!slot.classList.contains('pd-slot') && slot.parentElement) {
        slot = slot.parentElement;
    }
    
    const slotClass = Array.from(slot.classList).find(c => c.startsWith('slot-'));
    
    // Jeśli slot jest pełny, zdejmij przedmiot
    if (slotClass && myLoadout[slotClass]) {
        delete myLoadout[slotClass];
        renderInventoryView();
        setupLoadoutSlots();
    }
}

function renderItemInSlot(slotElement, item) {
    // Podmień HTML slotu na ikonę przedmiotu
    let rarityColor = getRarityColor(item.rarity);
    
    // Zmniejszono rozmiar ikony do 45px dla slotów 110px
    slotElement.innerHTML = `
        <div style="font-size: 50px; font-style: normal; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${item.icon}</div>
        <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
    `;
    slotElement.style.borderColor = item.color;
    slotElement.style.background = `rgba(${hexToRgb(item.color)}, 0.15)`;
    slotElement.style.boxShadow = `0 0 15px rgba(${hexToRgb(item.color)}, 0.4)`;
    slotElement.title = `${item.name} (Kliknij aby zdjąć)`;
}

function resetSlotVisuals(slotElement) {
    // Przywróć placeholder (wymaga mapy ikon dla typów, lub pobrania z HTML startowego)
    // Uproszczenie: Resetujemy styl, ikonę przywracamy generyczną
    slotElement.style = ""; // Reset inline styles
    const type = slotElement.dataset.type;
    let icon = "fa-plus";
    if(type === 'head') icon = "fa-hat-cowboy";
    if(type === 'neck') icon = "fa-link";
    if(type === 'suit') icon = "fa-user-tie";
    if(type === 'watch') icon = "fa-clock";
    if(type === 'gadget') icon = "fa-microchip";
    if(type === 'ring') icon = "fa-ring";
    if(type === 'belt') icon = "fa-grip-lines";
    if(type === 'pants') icon = "fa-columns";
    if(type === 'vehicle') icon = "fa-car";
    if(type === 'shoes') icon = "fa-shoe-prints";

    slotElement.innerHTML = `<i class="fas ${icon} placeholder"></i>`;
}

function getRarityColor(rarity) {
    if(rarity === 'Rare') return '#3b82f6';
    if(rarity === 'Epic') return '#8b5cf6';
    if(rarity === 'Relic') return '#ef4444';
    if(rarity === 'Divine') return '#ffd700';
    return '#9ca3af'; // Peasant
}

// --- DASHBOARD INVENTORY FIX ---
function renderDashInventory() {
    const container = document.getElementById('dashInventoryList');
    if(!container) return;
    container.innerHTML = '';
    
    // Pokaż pierwsze 4 przedmioty MrGamblera
    const dashItems = myInventory.slice(0, 4);
    
    dashItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let priceClass = 'price-neutral';
        let iconHtml = '';
        // Używamy item.trend zamiast item.type
        if (item.trend === 'up' || item.type === 'up') { priceClass = 'price-up'; iconHtml = '<i class="fas fa-caret-up"></i>'; }
        else if (item.trend === 'down' || item.type === 'down') { priceClass = 'price-down'; iconHtml = '<i class="fas fa-caret-down"></i>'; }
        
        const badgeClass = `badge-${item.rarity.toLowerCase()}`;
        
        div.innerHTML = `
            <div class="item-img" style="font-style: normal;">${item.icon}</div>
            <div class="item-info">
                <h5>${item.name}</h5>
                <div class="item-price-row">
                    <p class="${priceClass}">${item.price}</p>
                    <div class="val-change-inline ${item.trend === 'up' ? 'val-up' : item.trend === 'down' ? 'val-down' : ''}" style="margin-left:5px;">
                        ${item.change} ${iconHtml}
                    </div>
                </div>
            </div>
            <div class="item-right-status"><div class="rarity-tag-badge ${badgeClass}" style="min-width:auto; font-size:8px;">${item.rarity}</div></div>
        `;
        container.appendChild(div);
    });
    
    if(dashItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:11px; padding:20px;">Ekwipunek pusty</div>';
    }
}

// Helper do konwersji koloru
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255,255,255';
}

let currentDepositMethod = 'visa';
let currentWithdrawMethod = 'visa';

function renderWalletView() {
    // 1. ZMODYFIKOWANA LOGIKA NETWORTH
    // Cel: Net Worth = 5,240,000, Real Money = 2,450,000.
    // Obliczamy Items Value z różnicy.
    const realMoney = 2450000; 
    const targetNetWorth = 5240000;
    const itemsValue = targetNetWorth - realMoney; // = 2,790,000
    
    // 2. Update DOM
    const nwTotal = document.getElementById('nwTotalDisplay');
    const nwReal = document.getElementById('nwRealDisplay');
    const nwItems = document.getElementById('nwItemsDisplay');
    
    if (nwTotal) nwTotal.textContent = targetNetWorth.toLocaleString('en-US', {minimumFractionDigits: 2});
    if (nwReal) nwReal.textContent = realMoney.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' $';
    if (nwItems) nwItems.textContent = itemsValue.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' $';

    // 3. Init Deposit & Withdraw Methods
    selectDepositMethod(currentDepositMethod);
    selectWithdrawMethod(currentWithdrawMethod);

    // 4. Populate Transfer Item Select
    const transferSelect = document.getElementById('transferItemSelect');
    if (transferSelect && typeof allTreasures !== 'undefined') {
        // Reset and keep first option
        transferSelect.innerHTML = '<option value="">-- Wybierz przedmiot --</option>';

        allTreasures.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = `${item.name} (${item.rarity})`;
            transferSelect.appendChild(opt);
        });
    }
}

// Funkcja obsługująca zmianę metody wpłaty i dynamiczne panele
function selectDepositMethod(method) {
    currentDepositMethod = method;
    const container = document.getElementById('depositMethodsGrid');
    const dynamicContent = document.getElementById('depositDynamicContainer');
    if(!container || !dynamicContent) return;

    // Render Buttons
    const methods = [
        { id: 'visa', icon: 'fab fa-cc-visa', name: 'Visa' },
        { id: 'blik', icon: 'fas fa-mobile-alt', name: 'BLIK' },
        { id: 'crypto', icon: 'fab fa-bitcoin', name: 'Crypto' },
        { id: 'skrill', icon: 'fas fa-wallet', name: 'Skrill' }
    ];

    container.innerHTML = '';
    methods.forEach(m => {
        const div = document.createElement('div');
        div.className = `pm-item ${m.id === method ? 'active' : ''}`;
        div.onclick = () => selectDepositMethod(m.id);
        div.innerHTML = `<i class="${m.icon}"></i> ${m.name}`;
        container.appendChild(div);
    });

    // Render Dynamic Content Form
    dynamicContent.innerHTML = '';
    const formDiv = document.createElement('div');
    formDiv.className = 'deposit-dynamic-form';

    if (method === 'visa') {
        formDiv.innerHTML = `
            <div class="cc-visual">
                <div style="font-size:18px; margin-bottom:10px;">VISA <i class="fas fa-wifi" style="float:right; transform: rotate(90deg);"></i></div>
                <div style="font-size:20px; letter-spacing:2px; margin-bottom:10px;">•••• •••• •••• 4242</div>
                <div style="font-size:10px; opacity:0.8;">MR GAMBLER &nbsp;&nbsp;&nbsp; 12/28</div>
            </div>
            <div style="font-size:11px; color:#aaa; margin-bottom:5px;">Używasz zapisanej karty. CVV nie wymagane dla zaufanych urządzeń.</div>
        `;
    } else if (method === 'blik') {
        formDiv.innerHTML = `
            <div style="text-align:center; margin-bottom:10px; font-weight:700;">Podaj kod BLIK</div>
            <div class="blik-code-container">
                <div class="blik-digit">7</div>
                <div class="blik-digit">2</div>
                <div class="blik-digit">0</div>
                <div class="blik-digit">9</div>
                <div class="blik-digit">1</div>
                <div class="blik-digit">5</div>
            </div>
            <div style="text-align:center; font-size:10px; color:#aaa;">Potwierdź w aplikacji bankowej. Czas: 01:20</div>
        `;
    } else if (method === 'crypto') {
        formDiv.innerHTML = `
             <div class="crypto-box small-box">
                <div style="background:white; padding:5px; border-radius:4px; margin-right:15px;"><i class="fas fa-qrcode" style="font-size:40px; color:black;"></i></div>
                <div class="crypto-details">
                    <label style="font-size:10px; color:var(--accent-purple);">USDT (TRC20) Deposit Address</label>
                    <div class="copy-input">
                        <input type="text" id="cryptoAddr" readonly value="TEj3...x8L2">
                        <button onclick="copyCrypto()"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
            </div>
            <div style="margin-top:10px; font-size:10px; color:var(--accent-orange);">Minimalna wpłata: 10 USDT. Środki poniżej tej kwoty przepadną.</div>
        `;
    } else if (method === 'skrill') {
        formDiv.innerHTML = `
             <div class="input-group small" style="margin-bottom:5px;">
                <span class="curr-prefix"><i class="fas fa-envelope"></i></span>
                <input type="text" value="admin@casinolab.pl" readonly style="color:#888;">
             </div>
             <div style="font-size:11px; color:#aaa;">Zalogowany jako MrGambler. Przekierowanie nastąpi automatycznie.</div>
        `;
    }
    dynamicContent.appendChild(formDiv);
}

function selectWithdrawMethod(method) {
    currentWithdrawMethod = method;
    const container = document.getElementById('withdrawMethodsGrid');
    const dynamicContent = document.getElementById('withdrawDynamicContainer');
    if(!container || !dynamicContent) return;

    // Render Buttons
    const methods = [
        { id: 'visa', icon: 'fab fa-cc-visa', name: 'Visa' },
        { id: 'crypto', icon: 'fab fa-bitcoin', name: 'Crypto' }
    ];

    container.innerHTML = '';
    methods.forEach(m => {
        const div = document.createElement('div');
        div.className = `pm-item ${m.id === method ? 'active' : ''}`;
        div.onclick = () => selectWithdrawMethod(m.id);
        div.innerHTML = `<i class="${m.icon}"></i> ${m.name}`;
        container.appendChild(div);
    });

    // Render Dynamic Content
    dynamicContent.innerHTML = '';
    
    if (method === 'visa') {
        dynamicContent.innerHTML = `
             <div style="font-size:11px; color:#aaa; text-align:center; padding:10px; background:rgba(255,255,255,0.02); border-radius:6px;">
                Środki wrócą na kartę: <b style="color:white;">Visa •••• 4242</b><br>
                Czas realizacji: 1-3 dni robocze.
            </div>
        `;
    } else if (method === 'crypto') {
        dynamicContent.innerHTML = `
            <div class="input-group small" style="margin-bottom:5px;">
                <span class="curr-prefix" style="font-size:10px;">ADDR</span>
                <input type="text" placeholder="Wklej adres USDT (TRC20)..." style="font-size:11px;">
             </div>
             <div style="font-size:10px; color:var(--accent-orange); text-align:center;">Upewnij się, że sieć to TRC20.</div>
        `;
    }
}

// Toggle dla transferu (Money / Item)
function toggleTransferSection(type) {
    const sec = document.getElementById(`sec${type}`);
    const tog = document.getElementById(`toggle${type}`);
    
    // Toggle active class visually
    tog.classList.toggle('active');
    sec.classList.toggle('active');
}

function handleWalletAction(type) {
    if (type === 'deposit') {
        const amount = document.getElementById('depositAmount').value;
        if(amount > 0) {
            alert(`[SYSTEM] Przetwarzanie wpłaty metodą: ${currentDepositMethod.toUpperCase()}.\nKwota: ${amount} $.\n\nŚrodki dodane (symulacja).`);
        } else alert("Wprowadź poprawną kwotę wpłaty.");

    } else if (type === 'withdraw') {
        const amount = document.getElementById('withdrawAmount').value;
        if(amount > 0) alert(`Zlecono wypłatę: ${amount} $. Środki dotrą w ciągu 24h.`);
        else alert("Wprowadź poprawną kwotę wypłaty.");

    } else if (type === 'transfer') {
        const recipient = document.getElementById('transferRecipient').value;
        const sendMoney = document.getElementById('secMoney').classList.contains('active');
        const sendItem = document.getElementById('secItem').classList.contains('active');
        
        if (!recipient) {
            alert("Podaj ID odbiorcy.");
            return;
        }
        if (!sendMoney && !sendItem) {
            alert("Musisz wybrać co chcesz wysłać (Przelew lub Przedmiot).");
            return;
        }

        let msg = `Wysłano do ${recipient}:`;
        
        if (sendMoney) {
            const amount = document.getElementById('transferAmount').value;
            if(amount <= 0) { alert("Podaj poprawną kwotę przelewu."); return; }
            msg += `\n- Gotówka: ${amount} $`;
        }
        
        if (sendItem) {
            const itemVal = document.getElementById('transferItemSelect').value;
            if(!itemVal) { alert("Wybierz przedmiot z listy."); return; }
            const itemName = allTreasures.find(i => i.id == itemVal)?.name || "Przedmiot";
            msg += `\n- Przedmiot: ${itemName}`;
        }

        alert(msg);
    }
}

function openFinancialLogsModal() {
    document.getElementById('financialLogsModal').classList.add('active');
    renderFinancialLogsList();
}

function closeFinancialLogsModal() {
    document.getElementById('financialLogsModal').classList.remove('active');
}

function renderFinancialLogsList() {
    const container = document.getElementById('financialLogsList');
    if (!container) return;
    container.innerHTML = '';
    
    // Check toggle state
    const hideGames = document.getElementById('hideGamesSwitch')?.checked ?? true;

    walletLogsDB.forEach(t => {
        // Filter Logic: If filtering is ON, skip game related logs
        if (hideGames) {
            const lowerType = t.type.toLowerCase();
            const lowerDetail = t.detail.toLowerCase();
            // Simple heuristics for game logs
            if (lowerType.includes('wygrana') || lowerType.includes('przegrana') || 
                lowerType.includes('korekta') || lowerType.includes('bonus') ||
                lowerDetail.includes('game') || lowerDetail.includes('session')) {
                return; // Skip this iteration
            }
        }

        const div = document.createElement('div');
        div.className = 'hist-row';
        
        let valColor = 'white';
        if (t.val.startsWith('+')) valColor = 'var(--accent-green)';
        if (t.val.startsWith('-')) valColor = 'var(--accent-red)';
        
        let statusClass = t.status.toLowerCase();
        
        // Logic for Cancel Button (Only if status is Processing or Pending and value is negative/withdrawal)
        let actionHtml = '';
        if ((t.status === 'Processing' || t.status === 'Pending') && t.val.startsWith('-')) {
            actionHtml = `<button class="cancel-tx-btn" title="Anuluj wypłatę" onclick="alert('Wypłata ${t.id} została anulowana. Środki zwrócone.')"><i class="fas fa-times"></i></button>`;
        }

        div.innerHTML = `
            <div class="hist-left">
                <div class="hist-type">${t.type}</div>
                <div class="hist-meta">${t.date} • <span class="hist-id">${t.id}</span></div>
                <div style="font-size:9px; color:#555;">${t.detail}</div>
            </div>
            <div class="hist-right">
                <div class="hist-val" style="color:${valColor}">${t.val}</div>
                <div style="display:flex; align-items:center; justify-content:flex-end; gap:5px;">
                    <div class="hist-status st-${statusClass}">${t.status}</div>
                    ${actionHtml}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Brak logów do wyświetlenia dla wybranych filtrów.</div>';
    }
}

// WALLET HELPER FUNCTIONS
function switchWalletTab(tabName) {
    // Buttons
    document.querySelectorAll('.w-tab').forEach(b => b.classList.remove('active'));
    // Content
    document.querySelectorAll('.w-content').forEach(c => c.classList.remove('active'));

    // Activate
    const btn = document.querySelector(`.w-tab[onclick="switchWalletTab('${tabName}')"]`);
    if(btn) btn.classList.add('active');
    
    const content = document.getElementById(`tab-${tabName}`);
    if(content) content.classList.add('active');
}

function copyCrypto() {
    const input = document.getElementById('cryptoAddr');
    input.select();
    // In real app: document.execCommand('copy');
    const btn = input.nextElementSibling;
    const originalIcon = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.color = 'var(--accent-green)';
    
    setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.style.color = '';
    }, 2000);
}

function renderUsersView() {
    const container = document.getElementById('usersContainer');
    container.innerHTML = '';
    const users = [
        { id: 994, name: "Whale_Killer", rank: "Alpha Whale", status: "Online" },
        { id: 120, name: "Bot_Network_01", rank: "Small Fry", status: "Scripting" },
        { id: 552, name: "Janusz_Hazardu", rank: "Bankrupt", status: "Offline" },
        { id: 1, name: "Admin", rank: "King", status: "Hidden" }
    ];
    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'lb-row';
        div.style.gridTemplateColumns = "50px 1fr 150px 100px";
        let statusColor = u.status === 'Online' ? 'var(--accent-green)' : '#666';
        div.innerHTML = `
            <div style="color:#666;">#${u.id}</div>
            <div class="lb-name">${u.name}</div>
            <div style="font-size:11px; color:var(--accent-blue);">${u.rank}</div>
            <div style="font-size:10px; color:${statusColor};">● ${u.status}</div>
        `;
        container.appendChild(div);
    });
}

function renderLogsView() {
    const container = document.getElementById('logsContainer');
    container.innerHTML = '';
    const logs = [
        "[SYSTEM] Server started at 00:00:01",
        "[AUTH] Admin logged in from 127.0.0.1",
        "[GAME] User_99 won 5000 in Roulette",
        "[RISK] High bet detected: User_99 (Risk: Low)",
        "[ERROR] Payment Gateway Timeout (Retrying...)",
        "[SYSTEM] Daily rewards distributed"
    ];
    logs.forEach(l => {
        const div = document.createElement('div');
        div.style.padding = "4px 0";
        div.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        div.textContent = `> ${l}`;
        container.appendChild(div);
    });
}

// Initialize
initDashboard();


// --- GAMES HUB LOGIC ---

function renderGamesHub() {
    renderAvailableGames();
    renderGlobalLeaderboard();
}

function renderAvailableGames() {
    const container = document.getElementById('availableGamesContainer');
    container.innerHTML = '';
    const sortedGames = [...availableGamesDB].sort((a, b) => b.players - a.players);

    sortedGames.forEach(game => {
        const div = document.createElement('div');
        div.className = 'game-card';
        let hotBadge = game.isHot ? `<span class="gc-badge hot">HOT</span>` : '';
        let bgStyle = `background: linear-gradient(135deg, ${game.imgColor} 0%, #151a2d 100%);`;

        // ZMIANA: Wstawiamy ${game.icon} w sekcji icony (dolny lewy róg nagłówka)
        div.innerHTML = `
            <div class="gc-header" style="${bgStyle}">
                <div class="gc-overlay"></div>
                <div class="gc-badges">
                    ${hotBadge}
                    <span class="gc-badge">${game.type}</span>
                </div>
                <div style="position:absolute; bottom:10px; left:12px;">
                    <i class="fas ${game.icon}" style="font-size:24px; color:rgba(255,255,255,0.8);"></i>
                </div>
            </div>
            <div class="gc-body">
                <div class="gc-title">${game.name}</div>
                <div class="gc-pop"><i class="fas fa-user"></i> ${game.players.toLocaleString()} online</div>
                
                <div class="gc-actions">
                    <button class="gc-btn play">GRAJ TERAZ</button>
                    <button class="gc-btn lobby">Lobby</button>
                    <button class="gc-btn offline">Offline</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderGlobalLeaderboard() {
    const list = document.getElementById('globalLeaderboardList');
    list.innerHTML = '';

    const sortedPlayers = [...globalLeaderboardDB].sort((a, b) => {
        if (b.rankVal !== a.rankVal) return b.rankVal - a.rankVal;
        return b.netWorth - a.netWorth;
    });

    sortedPlayers.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'lb-row';
        const rankNum = index + 1;
        
        let rankClass = '';
        if (rankNum === 1) rankClass = 'top1';
        else if (rankNum === 2) rankClass = 'top2';
        else if (rankNum === 3) rankClass = 'top3';

        // ZMIANA: Znajdź dane o randze w ranksDB (ikonę i kolor)
        const rankData = ranksDB.find(r => r.id === p.rankVal);
        const rankIconHtml = rankData 
            ? `<i class="fas ${rankData.icon}" style="color:${rankData.color}; margin-right:4px;"></i>` 
            : '';

        let nwDisplay = p.netWorth >= 1000000 
            ? (p.netWorth / 1000000).toFixed(1) + 'M $' 
            : (p.netWorth / 1000).toFixed(0) + 'k $';

        div.innerHTML = `
            <div class="lb-rank ${rankClass}">${rankNum}</div>
            <div class="lb-user">
                <div class="lb-name">
                   ${p.name} 
                </div>
                <div style="font-size:10px; color:#8b92a5;">
                    ${rankIconHtml} ${p.rankName}
                </div>
            </div>
            <div class="lb-stats">
                <div class="lb-lp">${p.lp} LP</div>
                <div class="lb-nw">${nwDisplay}</div>
            </div>
        `;
        list.appendChild(div);
    });
}

// --- NEW DASHBOARD LOGIC (Instructions Implementation) ---

// Initialize new dashboard features
function initDashboardExtras() {
    renderDashInventory();
    initBannerCarousel();
}

// Render mini inventory in the new dashboard section
function renderDashInventory() {
    const container = document.getElementById('dashInventoryList');
    if(!container) return;
    container.innerHTML = '';
    
    // Take first 4 items from the sorted list
    sortTreasures(allTreasures);
    const dashItems = allTreasures.slice(0, 4);
    
    dashItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        // Reuse existing layout but simplified
        const badgeClass = `badge-${item.rarity.toLowerCase()}`;
        div.innerHTML = `
            <div class="item-img" style="font-style: normal;">${item.icon}</div>
            <div class="item-info"><h5>${item.name}</h5></div>
            <div class="item-right-status"><div class="rarity-tag-badge ${badgeClass}" style="min-width:auto; font-size:8px;">${item.rarity}</div></div>
        `;
        container.appendChild(div);
    });
    
    if(dashItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:11px; padding:20px;">Ekwipunek pusty</div>';
    }
}

// Simple Banner Carousel Logic
function initBannerCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    if(slides.length === 0) return;
    
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        currentSlide = index;
    }
    
    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    // Auto rotate every 5 seconds
    setInterval(nextSlide, 5000);
    
    // Optional click handling for dots (not strictly required by prompt but good practice)
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });
}

// Call extra initialization at startup
initDashboardExtras();
