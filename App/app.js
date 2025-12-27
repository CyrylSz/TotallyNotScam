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
    mode: 'auction', 
    searchItem: '',  
    searchPlayer: '', 
    onlyMine: false, 
    types: { item: true, case: true }, 
    slots: ['head', 'neck', 'suit', 'watch', 'gadget', 'belt', 'pants', 'shoes', 'ring', 'vehicle'], 
    priceMin: null,
    priceMax: null,
    rarities: ['Peasant', 'Rare', 'Epic', 'Relic', 'Divine'],
    sort: 'best_deal',
    listings: [],
    // Paginacja - ZMIANA NA 32
    currentPage: 1,
    itemsPerPage: 32 
};

function initMarketData() {
    marketState.listings = [];
    
    // Helper generatora
    const addListing = (itemTemplateId, sellerName, overridePrice = null, isMine = false, forceType = null) => {
        const template = allTreasures.find(t => t.id === itemTemplateId);
        if(!template) return;

        let finalUid = `mkt_${Date.now()}_${Math.random()}`;
        if (isMine) {
            const myItem = myInventory.find(i => i.id === itemTemplateId && !i.isOnSale);
            if (myItem) {
                finalUid = myItem.uid;
                myItem.isOnSale = true; 
            } else return;
        }

        let sellerImg = `https://i.pravatar.cc/150?u=${sellerName}`;
        const dbPlayer = typeof playersDB !== 'undefined' ? playersDB.find(p => p.username === sellerName) : null;
        if(dbPlayer && dbPlayer.pfp) sellerImg = dbPlayer.pfp;

        const listingType = forceType ? forceType : (Math.random() > 0.5 ? 'auction' : 'instant');
        
        // Zabezpieczenie: Minimalna wartość bazy to 100$, nawet dla śmieci, żeby uniknąć błędów mnożenia przez 0
        let rawVal = template.rawPrice > 0 ? template.rawPrice : 100;
        let baseValue = overridePrice || rawVal * (0.8 + Math.random() * 0.4); 
        
        let price = 0;
        let currentBid = 0;
        let bidCount = 0;
        let endTime = 0;

        if (listingType === 'auction') {
            // Cena startowa: 40-60% wartości (nigdy mniej niż 10$)
            price = Math.max(10, Math.floor(baseValue * (0.4 + Math.random() * 0.2))); 
            
            // Losujemy czy są już oferty (70% szans)
            if(Math.random() > 0.3) {
                bidCount = Math.floor(Math.random() * 25) + 1; // 1-25 ofert
                // CurrentBid to cena startowa + (liczba ofert * ~5% podbicia)
                // GWARANCJA: CurrentBid > Price
                currentBid = Math.floor(price * (1 + (bidCount * 0.05)));
            } else {
                bidCount = 0;
                currentBid = 0; // 0 oznacza brak ofert, UI wyświetli Price jako start
            }
            endTime = Date.now() + Math.floor(Math.random() * 86400000 * 2); 
        } else {
            // Instant Buy = Pełna cena
            price = Math.max(10, Math.floor(baseValue));
        }

        // Generowanie historii
        const history = [];
        let cur = baseValue;
        for(let j=0; j<10; j++) {
            cur = cur * (1 + ((Math.random() * 0.1) - 0.05));
            history.push(cur);
        }

        marketState.listings.push({
            uid: finalUid,
            templateId: template.id,
            seller: sellerName,
            sellerImg: sellerImg,
            listingType: listingType, 
            price: price, // Cena Kup Teraz LUB Cena Startowa Aukcji
            currentBid: currentBid, // Aktualna najwyższa oferta
            bidCount: bidCount,
            endTime: endTime,
            change: ((Math.random() * 20) - 10).toFixed(1),
            history: history,
            isMine: isMine,
            date: Date.now() - Math.floor(Math.random() * 86400000 * 3),
            
            name: template.name,
            rarity: template.rarity,
            type: template.type,
            icon: template.icon,
            color: template.color,
            isChest: template.type === 'chest'
        });
    };

    // 1. OFERTY MR GAMBLERA
    addListing(5, "MrGambler", 1250000, true, 'auction'); 
    addListing(16, "MrGambler", 2400000, true, 'instant'); 
    addListing(15, "MrGambler", 45000, true, 'instant'); 

    // 2. MASS GENERATION (300 items total -> ~150 per mode)
    const players = ["Whale_Killer", "LuckyLuke", "CryptoBro", "Bot_Network_01", "Anon_99", "WatchMaster", "HighRoller", "PokerFace"];
    const itemIds = allTreasures.map(t => t.id);

    for(let i=0; i<300; i++) {
        const rndPlayer = players[Math.floor(Math.random() * players.length)];
        const rndItem = itemIds[Math.floor(Math.random() * itemIds.length)];
        const type = i % 2 === 0 ? 'auction' : 'instant';
        addListing(rndItem, rndPlayer, null, false, type);
    }
}

function renderMarketView() {
    if(marketState.listings.length === 0) initMarketData();
    filterMarket();
}

function switchMarketMode(mode) {
    marketState.mode = mode;
    marketState.currentPage = 1; // Reset strony przy zmianie trybu
    
    document.getElementById('tabAuctionMode').classList.toggle('active', mode === 'auction');
    document.getElementById('tabInstantBuy').classList.toggle('active', mode === 'instant');
    
    filterMarket();
}

function changePage(delta) {
    marketState.currentPage += delta;
    filterMarket(); // Re-render z nową stroną
}

function toggleMarketType(type, btnElement) {
    marketState.types[type] = !marketState.types[type];
    btnElement.classList.toggle('active', marketState.types[type]);
    
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

function filterMarket() {
    const grid = document.getElementById('marketGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    // Inputs
    marketState.searchItem = document.getElementById('marketSearchInput').value.toLowerCase();
    marketState.searchPlayer = document.getElementById('marketSearchPlayer').value.toLowerCase();
    marketState.onlyMine = document.getElementById('chkOnlyMine').checked;
    marketState.priceMin = document.getElementById('priceMin').value;
    marketState.priceMax = document.getElementById('priceMax').value;
    marketState.sort = document.getElementById('marketSortSelect').value;
    const checkedRarities = Array.from(document.querySelectorAll('.ms-check-row input:checked')).map(cb => cb.value);

    // FILTERING
    let results = marketState.listings.filter(item => {
        if (item.listingType !== marketState.mode) return false;
        if (marketState.onlyMine && !item.isMine) return false;
        if (marketState.searchPlayer && !item.seller.toLowerCase().includes(marketState.searchPlayer)) return false;
        if (marketState.searchItem && !item.name.toLowerCase().includes(marketState.searchItem)) return false;
        if(item.isChest && !marketState.types.case) return false;
        if(!item.isChest && !marketState.types.item) return false;

        const priceCheck = item.listingType === 'auction' ? (item.currentBid > 0 ? item.currentBid : item.price) : item.price;
        if(marketState.priceMin && priceCheck < marketState.priceMin) return false;
        if(marketState.priceMax && priceCheck > marketState.priceMax) return false;
        
        if(!item.isChest && !marketState.slots.includes(item.type)) return false;
        if(!checkedRarities.includes(item.rarity)) return false;
        
        return true;
    });
    
    // SORTING
    results.sort((a, b) => {
        const pA = a.listingType === 'auction' ? (a.currentBid || a.price) : a.price;
        const pB = b.listingType === 'auction' ? (b.currentBid || b.price) : b.price;

        switch(marketState.sort) {
            case 'price_asc': return pA - pB;
            case 'price_desc': return pB - pA;
            case 'newest': return b.date - a.date;
            case 'time_left': 
                if(a.listingType === 'auction') return (a.endTime || 0) - (b.endTime || 0);
                return 0; 
            case 'best_deal': 
                const ratioA = (allTreasures.find(t=>t.id===a.templateId).rawPrice) / pA;
                const ratioB = (allTreasures.find(t=>t.id===b.templateId).rawPrice) / pB;
                return ratioB - ratioA;
            default: return 0;
        }
    });

    // PAGINATION LOGIC
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / marketState.itemsPerPage) || 1;
    
    // Zabezpieczenie bounds
    if (marketState.currentPage < 1) marketState.currentPage = 1;
    if (marketState.currentPage > totalPages) marketState.currentPage = totalPages;

    const startIndex = (marketState.currentPage - 1) * marketState.itemsPerPage;
    const endIndex = startIndex + marketState.itemsPerPage;
    const pageItems = results.slice(startIndex, endIndex);

    // RENDER ITEMS
    pageItems.forEach(item => {
        const card = createMarketCard(item);
        grid.appendChild(card);
    });
    
    // EMPTY STATE
    if(results.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Brak ofert spełniających kryteria.</div>';
    }

    // UPDATE PAGINATION UI
    document.getElementById('pageIndicator').textContent = `Strona ${marketState.currentPage} z ${totalPages} (${totalItems} ofert)`;
    document.getElementById('btnPrevPage').disabled = marketState.currentPage === 1;
    document.getElementById('btnNextPage').disabled = marketState.currentPage === totalPages;
    document.getElementById('btnPrevPage').style.opacity = marketState.currentPage === 1 ? '0.3' : '1';
    document.getElementById('btnNextPage').style.opacity = marketState.currentPage === totalPages ? '0.3' : '1';
}

function createMarketCard(item) {
    const el = document.createElement('div');
    el.className = 'm-card';
    el.style.borderColor = `rgba(${hexToRgb(item.color)}, 0.5)`;
    el.onclick = () => openMarketItemModal(item);
    
    // Lock logic
    let isLocked = false;
    if(item.rarity === 'Divine' && currentRankId > 2) isLocked = true;
    const lockHtml = isLocked ? `<div class="mc-lock-overlay"><i class="fas fa-lock"></i></div>` : '';

    // DYNAMIC CONTENT BASED ON MODE
    let footerHtml = '';
    
    if (item.listingType === 'instant') {
        // INSTANT BUY LAYOUT
        const changeClass = parseFloat(item.change) >= 0 ? 'val-up' : 'val-down';
        const changeIcon = parseFloat(item.change) >= 0 ? '+' : '';
        
        footerHtml = `
            <div class="mc-price-row">
                <div class="mc-price">${item.price.toLocaleString()} $</div>
                <div class="mc-change ${changeClass}">${changeIcon}${item.change}%</div>
            </div>
            <div style="font-size:9px; color:#666; margin-top:4px; text-align:right;">Kup Teraz</div>
        `;
    } else {
        // AUCTION LAYOUT
        const timeLeft = calculateTimeLeft(item.endTime);
        
        const priceToDisplay = item.currentBid > 0 ? item.currentBid : item.price;
        const bidDisplay = priceToDisplay.toLocaleString() + ' $';
        
        const bidCountDisplay = item.bidCount > 0 ? `${item.bidCount} ofert` : 'Brak ofert';
        
        footerHtml = `
            <div class="mc-price-row">
                <div class="mc-price" style="color:var(--accent-orange);">${bidDisplay}</div>
                <div class="mc-change" style="background:rgba(255,255,255,0.1); color:#ccc;">${bidCountDisplay}</div>
            </div>
            <div style="font-size:10px; color:#aaa; margin-top:4px; display:flex; justify-content:space-between;">
                <span><i class="fas fa-clock"></i> ${timeLeft}</span>
                <span style="color:var(--accent-purple);">Licytacja</span>
            </div>
        `;
    }

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
            <div class="mc-title" style="color:${item.color}; font-size: 12px; margin-bottom: 8px;">${item.name}</div>
            ${footerHtml}
        </div>
    `;
    return el;
}

function calculateTimeLeft(endTime) {
    const diff = endTime - Date.now();
    if(diff <= 0) return "Zakończona";
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if(hrs > 24) return Math.floor(hrs/24) + " dni";
    return `${hrs}h ${mins}m`;
}

// --- DYNAMIC MODAL (The core of the request) ---

function openMarketItemModal(item) {
    const modal = document.getElementById('marketModal');
    if(!modal) return;
    
    // 1. Podstawowe Dane
    document.getElementById('mmIcon').innerHTML = item.icon;
    document.getElementById('mmIcon').className = ''; 
    document.getElementById('mmCard').style.color = item.color;
    
    // --- FIX: NAPRAWA ZDJĘCIA SPRZEDAWCY ---
    document.getElementById('mmSellerName').textContent = item.seller;
    // Ustawiamy styl inline background-image. Ważne są backticki ` ` 
    document.getElementById('mmSellerAvatar').style.backgroundImage = `url('${item.sellerImg}')`;
    document.getElementById('mmSellerAvatar').style.backgroundSize = 'cover';
    document.getElementById('mmSellerAvatar').style.backgroundPosition = 'center';
    // ---------------------------------------

    document.getElementById('mmItemName').textContent = item.name;
    
    // Renderowanie Tagów (Rzadkość + Slot)
    const tags = document.getElementById('mmTags');
    const badgeClass = `badge-${item.rarity.toLowerCase()}`;
    tags.innerHTML = `<span class="rarity-tag-badge ${badgeClass}">${item.rarity}</span>`;
    if(item.isChest) tags.innerHTML += `<span class="badge-slot">CASE</span>`;
    else tags.innerHTML += `<span class="badge-slot">${item.type.toUpperCase()}</span>`;
    
    // Opis
    const template = allTreasures.find(t => t.id === item.templateId);
    let desc = template ? (template.desc + ' ' + template.bonus) : '';
    document.getElementById('mmDesc').textContent = desc;

    // Warning o randze
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

    // --- DYNAMICZNE CENY I PRZYCISKI (Zależne od trybu) ---
    const priceEl = document.getElementById('mmCurrentPrice');
    const btnRow = document.querySelector('.mm-btn-row');
    const lastPriceEl = document.getElementById('mmLastPrice');
    const changeEl = document.getElementById('mmChange');

    // Reset przycisków
    btnRow.innerHTML = ''; 

    if (item.listingType === 'instant') {
        // --- TRYB INSTANT BUY ---
        document.getElementById('marketModalTitle').textContent = "KUP TERAZ";
        priceEl.textContent = item.price.toLocaleString() + ' $';
        priceEl.style.color = "var(--accent-green)";
        
        // Statystyki dla Instant
        lastPriceEl.parentElement.querySelector('.mm-lbl').textContent = "Ostatnia cena";
        lastPriceEl.textContent = (item.price * 1.1).toFixed(0) + ' $'; // Fake stat
        changeEl.parentElement.querySelector('.mm-lbl').textContent = "Zmienna 24h";
        changeEl.textContent = item.change + '%';
        
        // Kolorowanie zmiennej
        changeEl.className = 'mm-v ' + (parseFloat(item.change) >= 0 ? 'val-up' : 'val-down');

        if (item.isMine) {
            // Mój przedmiot -> Usuń
            const btnRemove = document.createElement('button');
            btnRemove.className = 'action-btn-large';
            btnRemove.style.background = 'var(--accent-red)';
            btnRemove.textContent = 'USUŃ OFERTĘ';
            btnRemove.onclick = () => { alert("Oferta usunięta."); closeMarketModal(); };
            btnRow.appendChild(btnRemove);
        } else {
            // Cudzy -> Kup
            const btnBuy = document.createElement('button');
            btnBuy.className = 'action-btn-large';
            btnBuy.textContent = 'KUP TERAZ';
            btnBuy.onclick = () => { alert(`Kupiłeś ${item.name} za ${item.price}$!`); closeMarketModal(); };
            btnRow.appendChild(btnBuy);
        }

    } else {
        // --- TRYB AUCTION ---
        document.getElementById('marketModalTitle').textContent = "LICYTACJA";
        // Wyświetlamy najwyższą ofertę LUB cenę startową
        const currentPrice = item.currentBid > 0 ? item.currentBid : item.price;
        priceEl.textContent = currentPrice.toLocaleString() + ' $';
        priceEl.style.color = "var(--accent-orange)";

        // Statystyki dla Aukcji
        lastPriceEl.parentElement.querySelector('.mm-lbl').textContent = "Czas do końca";
        lastPriceEl.textContent = calculateTimeLeft(item.endTime);
        lastPriceEl.style.color = "#fff";
        
        changeEl.parentElement.querySelector('.mm-lbl').textContent = "Liczba ofert";
        changeEl.textContent = item.bidCount;
        changeEl.className = "mm-v"; // Reset koloru (biały)

        if (item.isMine) {
            // Moja aukcja -> Zarządzaj
            const btnManage = document.createElement('button');
            btnManage.className = 'action-btn-large outline';
            btnManage.textContent = 'ZAKOŃCZ WCZEŚNIEJ';
            btnManage.onclick = () => { alert("Nie możesz zakończyć aukcji przed czasem, jeśli są oferty."); };
            btnRow.appendChild(btnManage);
        } else {
            // Cudza aukcja -> Licytuj
            
            // 1. Input
            const bidInput = document.createElement('input');
            bidInput.type = 'number';
            bidInput.className = 'bid-input-modal';
            bidInput.placeholder = 'Kwota...';
            // Minimalne przebicie: 5% więcej
            const minBid = Math.floor(currentPrice * 1.05);
            bidInput.value = minBid;
            
            // 2. Button
            const btnBid = document.createElement('button');
            btnBid.className = 'action-btn-large';
            btnBid.style.background = 'var(--accent-orange)';
            btnBid.textContent = 'PODBIJ';
            btnBid.onclick = () => { 
                if(bidInput.value >= minBid) {
                    alert(`Twoja oferta ${bidInput.value}$ została przyjęta!`); 
                    closeMarketModal();
                } else {
                    alert(`Minimalne przebicie to ${minBid}$`);
                }
            };
            
            // Kontener na input i przycisk
            const bidContainer = document.createElement('div');
            bidContainer.style.display = 'flex';
            bidContainer.style.gap = '10px';
            bidContainer.style.width = '100%';
            
            bidContainer.appendChild(bidInput);
            bidContainer.appendChild(btnBid);
            btnRow.appendChild(bidContainer);
        }
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

    // 1. Wstępne filtrowanie (według typu Item/Case)
    let filteredInv = myInventory.filter(item => {
        const isCase = item.type === 'chest'; 
        if(isCase && !invFilterState.case) return false;
        if(!isCase && !invFilterState.item) return false;
        return true;
    });

    // 2. LOGIKA STAKOWANIA
    // Tworzymy nową listę do wyświetlenia
    let displayList = [];
    let stackMap = {}; // Mapa: templateId -> referencja do obiektu w displayList

    filteredInv.forEach(item => {
        // Sprawdzamy stan unikalny
        const isEquipped = Object.values(myLoadout).includes(item.uid);
        const isOnSale = item.isOnSale === true;

        // Jeśli przedmiot jest "zajęty" (założony lub na rynku), nie stakujemy go
        if (isEquipped || isOnSale) {
            displayList.push({ 
                ...item, 
                stackCount: 1, // Pojedyncza sztuka
                forceUnique: true // Flaga pomocnicza
            });
        } else {
            // Przedmiot jest "wolny" w magazynie - próbujemy stakować
            if (stackMap[item.id]) {
                // Już mamy taki przedmiot w displayList, inkrementujemy licznik
                stackMap[item.id].stackCount++;
            } else {
                // Pierwszy raz widzimy ten przedmiot (wolny), dodajemy do listy
                // Tworzymy kopię obiektu, żeby nie modyfikować oryginału w myInventory
                const stackItem = { ...item, stackCount: 1, forceUnique: false };
                stackMap[item.id] = stackItem;
                displayList.push(stackItem);
            }
        }
    });

    // 3. Sortowanie listy wyświetlania (od najdroższego)
    const sortedInv = displayList.sort((a, b) => b.rawPrice - a.rawPrice);
    
    // 4. Render Grid
    sortedInv.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'inv-grid-slot';
        
        // Sprawdź czy przedmiot jest założony (ponowne sprawdzenie na obiekcie display)
        // Musimy użyć oryginalnego myLoadout check, bo item.uid w stacku to UID "reprezentanta"
        const isEquipped = Object.values(myLoadout).includes(item.uid);
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

        // Badges & Counters
        let badgeHtml = '';
        
        // --- STACK COUNTER ---
        // Dodajemy licznik tylko jeśli jest więcej niż 1 sztuka
        if (item.stackCount > 1) {
            badgeHtml += `<div class="item-stack-count">x${item.stackCount}</div>`;
        }

        if (isEquipped) badgeHtml += `<div class="equipped-badge">EQ</div>`;
        else if (isOnSale) badgeHtml += `<div class="on-sale-badge">NA RYNKU</div>`;

        // Rank Lock Logic
        if (item.rarity === 'Divine' && currentRankId > 2) {
            badgeHtml += `<div class="inv-lock-overlay"><i class="fas fa-lock"></i></div>`;
            slot.classList.add('is-rank-locked');
        }

        slot.innerHTML = `
            <div class="inv-item-icon" style="font-style: normal; color: initial;">${item.icon}</div>
            <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
            ${badgeHtml}
        `;
        
        // Tooltip
        let tooltipText = `${item.name} (${item.rarity})\nTyp: ${item.type}\nBonus: ${item.bonus}\nCena: ${item.price}`;
        if(item.stackCount > 1) tooltipText += `\nIlość w magazynie: ${item.stackCount}`;
        slot.title = tooltipText;
        
        container.appendChild(slot);
    });

    // Puste sloty (Wypełniacz)
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

let activeGamesTabId = 'casino';

// Main function to initialize the Games View
function renderGamesHub() {
    renderGamesTabs();
    renderGamesContent();
    renderGlobalLeaderboard(); // Keep existing leaderboard
}

function renderGamesTabs() {
    const container = document.getElementById('gamesHubHeader'); // We will create this in HTML
    if (!container) return;
    container.innerHTML = '';

    const tabContainer = document.createElement('div');
    tabContainer.className = 'gh-tabs-container';

    gamesHubStructure.forEach(tab => {
        const el = document.createElement('div');
        el.className = `gh-tab ${tab.id === activeGamesTabId ? 'active' : ''}`;
        el.style.color = tab.id === activeGamesTabId ? tab.color : '#8b92a5';
        el.onclick = () => switchGameHubTab(tab.id);

        el.innerHTML = `
            <i class="fas ${tab.icon} gh-tab-icon"></i>
            <div class="gh-tab-info">
                <div class="gh-tab-title">${tab.label}</div>
                <div class="gh-tab-desc">${tab.desc}</div>
            </div>
        `;
        tabContainer.appendChild(el);
    });

    container.appendChild(tabContainer);
}

function switchGameHubTab(id) {
    activeGamesTabId = id;
    renderGamesTabs(); // Re-render tabs for active state
    renderGamesContent(); // Re-render content
}

function renderGamesContent() {
    const container = document.getElementById('availableGamesContainer');
    if (!container) return;
    container.innerHTML = ''; 

    const currentTab = gamesHubStructure.find(t => t.id === activeGamesTabId);
    if (!currentTab) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'gh-content-area';

    currentTab.subcategories.forEach(sub => {
        const subSection = document.createElement('div');
        subSection.className = 'gh-sub-section';

        subSection.innerHTML = `<div class="gh-sub-header"><i class="fas fa-layer-group"></i> ${sub.title}</div>`;

        const grid = document.createElement('div');
        grid.className = 'gh-grid';

        sub.games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'gh-card';
            
            // Interaction
            card.onclick = () => alert(`Uruchamianie: ${game.name}\nTryb: ${game.variants > 1 ? 'Wybór wariantu' : 'Standard'}\nOnline: ${game.onlineCount}`);
            
            // Dynamic Color styles
            const glowColor = game.color;
            const variantsText = game.variants > 1 ? `${game.variants} WARIACJE` : 'CLASSIC';

            card.innerHTML = `
                <!-- Background Glow -->
                <div class="gh-card-bg-glow" style="background: ${glowColor};"></div>
                
                <!-- Hover Play Overlay -->
                <div class="gh-play-overlay">
                    <div class="gh-play-icon-container">
                        <i class="fas fa-play"></i>
                    </div>
                </div>

                <div class="gh-card-header">
                    <div class="gh-icon-large" style="color: ${glowColor}; text-shadow: 0 0 20px ${glowColor}40;">
                        <i class="fas ${game.icon}"></i>
                    </div>
                    <div class="gh-card-meta">
                        <div class="gh-online-badge">
                            <div class="gh-online-dot"></div> ${game.onlineCount.toLocaleString()}
                        </div>
                        <div class="gh-variants-badge">${variantsText}</div>
                    </div>
                </div>

                <div class="gh-card-body">
                    <h4 class="gh-game-title">${game.name}</h4>
                    <p class="gh-game-desc">${game.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });

        subSection.appendChild(grid);
        wrapper.appendChild(subSection);
    });

    container.appendChild(wrapper);
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
