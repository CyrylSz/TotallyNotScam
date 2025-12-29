
let shownTreasures = 5;
let shownGames = 20; 
let shownTrophies = 5;
let notificationCount = 3;


let prevWinPerc = 0;
let prevWins = 0;
let prevLosses = 0;
let prevDraws = 0;


const currentRankId = 3; 

let favoriteModes = []; 


let myInventory = []; 
let myLoadout = {};   
let invFilterState = { item: true, case: true };



let marketState = {
    mode: 'auction', 
    searchItem: '',  
    searchPlayer: '', 
    onlyMine: false, 
    types: { item: true, case: true }, 
    durability: { consumable: true, durable: true },
    slots: ['head', 'neck', 'suit', 'watch', 'gadget', 'belt', 'pants', 'shoes', 'ring', 'vehicle'], 
    priceMin: null,
    priceMax: null,
    rarities: ['Peasant', 'Rare', 'Epic', 'Relic', 'Divine'],
    sort: 'best_deal',
    listings: [],
    
    currentPage: 1,
    itemsPerPage: 32 
};

function initMarketData() {
    marketState.listings = [];
    
    
    const addListing = (itemTemplateId, sellerName, overridePrice = null, isMine = false, forceType = null) => {
        const template = allTreasures.find(t => t.id === itemTemplateId);
        if(!template) return;

        let finalUid = `mkt_${Date.now()}_${Math.random()}`;
        let specificUses = null;

        if (isMine) {
            const myItem = myInventory.find(i => i.id === itemTemplateId && !i.isOnSale);
            if (myItem) {
                finalUid = myItem.uid;
                specificUses = myItem.usesLeft;
                myItem.isOnSale = true; 
            } else return;
        }

        let sellerImg = `https://i.pravatar.cc/150?u=${sellerName}`;
        const dbPlayer = typeof playersDB !== 'undefined' ? playersDB.find(p => p.username === sellerName) : null;
        if(dbPlayer && dbPlayer.pfp) sellerImg = dbPlayer.pfp;

        const listingType = forceType ? forceType : (Math.random() > 0.5 ? 'auction' : 'instant');
        
        
        let rawVal = template.rawPrice > 0 ? template.rawPrice : 100;
        let baseValue = overridePrice || rawVal * (0.8 + Math.random() * 0.4); 
        
        let price = 0;
        let currentBid = 0;
        let bidCount = 0;
        let endTime = 0;

        if (listingType === 'auction') {
            
            price = Math.max(10, Math.floor(baseValue * (0.4 + Math.random() * 0.2))); 
            
            
            if(Math.random() > 0.3) {
                bidCount = Math.floor(Math.random() * 25) + 1; 
                
                
                currentBid = Math.floor(price * (1 + (bidCount * 0.05)));
            } else {
                bidCount = 0;
                currentBid = 0; 
            }
            endTime = Date.now() + Math.floor(Math.random() * 86400000 * 2); 
        } else {
            
            price = Math.max(10, Math.floor(baseValue));
        }

        
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
            price: price, 
            currentBid: currentBid, 
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
            isConsumable: template.isConsumable,
            maxUses: template.maxUses,
            usesLeft: specificUses !== null ? specificUses : (template.isConsumable ? Math.ceil(Math.random() * template.maxUses) : null),
            isChest: template.type === 'chest'
        });
    };

    
    addListing(5, "MrGambler", 1250000, true, 'auction'); 
    addListing(16, "MrGambler", 2400000, true, 'instant'); 
    addListing(15, "MrGambler", 45000, true, 'instant'); 

    
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
    marketState.currentPage = 1; 
    
    document.getElementById('tabAuctionMode').classList.toggle('active', mode === 'auction');
    document.getElementById('tabInstantBuy').classList.toggle('active', mode === 'instant');
    
    filterMarket();
}

function changePage(delta) {
    marketState.currentPage += delta;
    filterMarket(); 
}

function toggleMarketType(type, btnElement) {
    marketState.types[type] = !marketState.types[type];
    btnElement.classList.toggle('active', marketState.types[type]);
    
    const slotSection = document.getElementById('slotFilterSection');
    if(marketState.types['item']) slotSection.classList.remove('hidden');
    else slotSection.classList.add('hidden');
    
    filterMarket();
}
function toggleDurabilityFilter(type, btnElement) {
    marketState.durability[type] = !marketState.durability[type];
    btnElement.classList.toggle('active', marketState.durability[type]);
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
    
    
    marketState.searchItem = document.getElementById('marketSearchInput').value.toLowerCase();
    marketState.searchPlayer = document.getElementById('marketSearchPlayer').value.toLowerCase();
    marketState.onlyMine = document.getElementById('chkOnlyMine').checked;
    marketState.priceMin = document.getElementById('priceMin').value;
    marketState.priceMax = document.getElementById('priceMax').value;
    marketState.sort = document.getElementById('marketSortSelect').value;
    const checkedRarities = Array.from(document.querySelectorAll('.ms-check-row input:checked')).map(cb => cb.value);

    
    let results = marketState.listings.filter(item => {
        if (item.listingType !== marketState.mode) return false;
        if (marketState.onlyMine && !item.isMine) return false;
        if (marketState.searchPlayer && !item.seller.toLowerCase().includes(marketState.searchPlayer)) return false;
        if (marketState.searchItem && !item.name.toLowerCase().includes(marketState.searchItem)) return false;
        if(item.isChest && !marketState.types.case) return false;
        if(!item.isChest && !marketState.types.item) return false;
        if(item.isConsumable && !marketState.durability.consumable) return false;
        if(!item.isConsumable && !marketState.durability.durable) return false;

        const priceCheck = item.listingType === 'auction' ? (item.currentBid > 0 ? item.currentBid : item.price) : item.price;
        if(marketState.priceMin && priceCheck < marketState.priceMin) return false;
        if(marketState.priceMax && priceCheck > marketState.priceMax) return false;
        
        if(!item.isChest && !marketState.slots.includes(item.type)) return false;
        if(!checkedRarities.includes(item.rarity)) return false;
        
        return true;
    });
    
    
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

    
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / marketState.itemsPerPage) || 1;
    
    
    if (marketState.currentPage < 1) marketState.currentPage = 1;
    if (marketState.currentPage > totalPages) marketState.currentPage = totalPages;

    const startIndex = (marketState.currentPage - 1) * marketState.itemsPerPage;
    const endIndex = startIndex + marketState.itemsPerPage;
    const pageItems = results.slice(startIndex, endIndex);

    
    pageItems.forEach(item => {
        const card = createMarketCard(item);
        grid.appendChild(card);
    });
    
    
    if(results.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Brak ofert spełniających kryteria.</div>';
    }

    
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
    
    
    let isLocked = false;
    if(item.rarity === 'Divine' && currentRankId > 2) isLocked = true;
    const lockHtml = isLocked ? `<div class="mc-lock-overlay"><i class="fas fa-lock"></i></div>` : '';
    
    let conditionHtml = '';
    
    if (!isLocked && item.isConsumable && item.maxUses && (item.templateId < 1 || item.templateId > 5)) {
        const pct = Math.round((item.usesLeft / item.maxUses) * 100);
        conditionHtml = `<div class="mc-condition-pie" style="background: conic-gradient(var(--accent-green) 0% ${pct}%, #555 ${pct}% 100%);" title="Stan: ${item.usesLeft}/${item.maxUses}"></div>`;
    }

    
    let footerHtml = '';
    
    if (item.listingType === 'instant') {
        
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
            ${lockHtml}${conditionHtml}
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



function openMarketItemModal(item) {
    const modal = document.getElementById('marketModal');
    if(!modal) return;
    
    
    document.getElementById('mmIcon').innerHTML = item.icon;
    document.getElementById('mmIcon').className = ''; 
    
    const mmCard = document.getElementById('mmCard');
    mmCard.style.color = item.color;

    
    const oldPie = mmCard.querySelector('.mc-condition-pie');
    if(oldPie) oldPie.remove();

    if (item.isConsumable && item.maxUses && (item.templateId < 1 || item.templateId > 5)) {
        const pct = Math.round((item.usesLeft / item.maxUses) * 100);
        const pie = document.createElement('div');
        pie.className = 'mc-condition-pie';
        pie.style.background = `conic-gradient(var(--accent-green) 0% ${pct}%, #555 ${pct}% 100%)`;
        pie.style.width = '24px';
        pie.style.height = '24px';
        pie.style.top = '15px';
        pie.style.right = '15px';
        pie.title = `Stan: ${item.usesLeft}/${item.maxUses}`;
        mmCard.appendChild(pie);
    }
    
    
    document.getElementById('mmSellerName').textContent = item.seller;
    
    document.getElementById('mmSellerAvatar').style.backgroundImage = `url('${item.sellerImg}')`;
    document.getElementById('mmSellerAvatar').style.backgroundSize = 'cover';
    document.getElementById('mmSellerAvatar').style.backgroundPosition = 'center';
    

    document.getElementById('mmItemName').textContent = item.name;
    
    
    const tags = document.getElementById('mmTags');
    const badgeClass = `badge-${item.rarity.toLowerCase()}`;
    tags.innerHTML = `<span class="rarity-tag-badge ${badgeClass}">${item.rarity}</span>`;
    if(item.isChest) tags.innerHTML += `<span class="badge-slot">CASE</span>`;
    else tags.innerHTML += `<span class="badge-slot">${item.type.toUpperCase()}</span>`;

    if (item.isConsumable && item.maxUses) {
         tags.innerHTML += `<span class="badge-slot" style="color:var(--accent-green); border:1px solid var(--accent-green);">STAN: ${item.usesLeft}/${item.maxUses}</span>`;
    } else {
         tags.innerHTML += `<span class="badge-slot" style="opacity:0.7;">TRWAŁY</span>`;
    }
    
    
    const template = allTreasures.find(t => t.id === item.templateId);
    let desc = template ? (template.desc + ' ' + template.bonus) : '';
    document.getElementById('mmDesc').textContent = desc;

    
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

    
    const priceEl = document.getElementById('mmCurrentPrice');
    const btnRow = document.querySelector('.mm-btn-row');
    const lastPriceEl = document.getElementById('mmLastPrice');
    const changeEl = document.getElementById('mmChange');

    
    btnRow.innerHTML = ''; 

    if (item.listingType === 'instant') {
        
        document.getElementById('marketModalTitle').textContent = "KUP TERAZ";
        priceEl.textContent = item.price.toLocaleString() + ' $';
        priceEl.style.color = "var(--accent-green)";
        
        
        lastPriceEl.parentElement.querySelector('.mm-lbl').textContent = "Ostatnia cena";
        lastPriceEl.textContent = (item.price * 1.1).toFixed(0) + ' $'; 
        changeEl.parentElement.querySelector('.mm-lbl').textContent = "Zmienna 24h";
        changeEl.textContent = item.change + '%';
        
        
        changeEl.className = 'mm-v ' + (parseFloat(item.change) >= 0 ? 'val-up' : 'val-down');

        if (item.isMine) {
            
            const btnRemove = document.createElement('button');
            btnRemove.className = 'action-btn-large';
            btnRemove.style.background = 'var(--accent-red)';
            btnRemove.textContent = 'USUŃ OFERTĘ';
            btnRemove.onclick = () => { alert("Oferta usunięta."); closeMarketModal(); };
            btnRow.appendChild(btnRemove);
        } else {
            
            const btnBuy = document.createElement('button');
            btnBuy.className = 'action-btn-large';
            btnBuy.textContent = 'KUP TERAZ';
            btnBuy.onclick = () => { alert(`Kupiłeś ${item.name} za ${item.price}$!`); closeMarketModal(); };
            btnRow.appendChild(btnBuy);
        }

    } else {
        
        document.getElementById('marketModalTitle').textContent = "LICYTACJA";
        
        const currentPrice = item.currentBid > 0 ? item.currentBid : item.price;
        priceEl.textContent = currentPrice.toLocaleString() + ' $';
        priceEl.style.color = "var(--accent-orange)";

        
        lastPriceEl.parentElement.querySelector('.mm-lbl').textContent = "Czas do końca";
        lastPriceEl.textContent = calculateTimeLeft(item.endTime);
        lastPriceEl.style.color = "#fff";
        
        changeEl.parentElement.querySelector('.mm-lbl').textContent = "Liczba ofert";
        changeEl.textContent = item.bidCount;
        changeEl.className = "mm-v"; 

        if (item.isMine) {
            
            const btnManage = document.createElement('button');
            btnManage.className = 'action-btn-large outline';
            btnManage.textContent = 'ZAKOŃCZ WCZEŚNIEJ';
            btnManage.onclick = () => { alert("Nie możesz zakończyć aukcji przed czasem, jeśli są oferty."); };
            btnRow.appendChild(btnManage);
        } else {
            
            
            
            const bidInput = document.createElement('input');
            bidInput.type = 'number';
            bidInput.className = 'bid-input-modal';
            bidInput.placeholder = 'Kwota...';
            
            const minBid = Math.floor(currentPrice * 1.05);
            bidInput.value = minBid;
            
            
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

function initDashboard() {
    initInventorySystem();
    initGameModePersistence(); // Inicjalizacja stałych liczników graczy 
    initMarketData();
    initWalletBg();
    initGamesBg();
    initProfileStars();      
    
    
    renderDashInventory(); 
    renderTreasures();    
    renderGames(); 
    renderTrophies();
    updateStats();
    renderLadder();
    
    
    renderInventoryView();
}

function initProfileStars() {
    const container = document.getElementById('profileStarsBg');
    if(!container || container.children.length > 0) return;

    // Generujemy rzadkie gwiazdy (zwiększony zakres, mała ilość)
    const starCount = 70;

    for(let i=0; i<starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star-real';
        
        // Używamy % względem kontenera (który jest już wypozycjonowany za sidebarem)
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        const size = Math.random() * 2 + 1;
        const opacity = Math.random() * 0.4 + 0.1; 

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = opacity;
        
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${4 + Math.random() * 6}s`;

        container.appendChild(star);
    }
}

function initWalletBg() {
    const container = document.getElementById('walletBgAnim');
    if(!container || container.children.length > 0) return;

    const moneyChars = ['💵', '💸', '💰', '$'];
    const count = 30;

    for(let i=0; i<count; i++) {
        const el = document.createElement('div');
        el.className = 'falling-item';
        el.textContent = moneyChars[Math.floor(Math.random() * moneyChars.length)];
        
        const x = Math.random() * 100;
        const size = Math.random() * 20 + 15; // 15px - 35px
        const duration = Math.random() * 10 + 5; // 5s - 15s
        const delay = Math.random() * 10;

        el.style.left = `${x}%`;
        el.style.fontSize = `${size}px`;
        el.style.opacity = Math.random() * 0.3 + 0.1;
        el.style.animationDuration = `${duration}s`;
        el.style.animationDelay = `-${delay}s`; // Negative delay for instant start

        container.appendChild(el);
    }
}

function initGamesBg() {
    const container = document.getElementById('gamesBgAnim');
    if(!container || container.children.length > 0) return;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#000'];
    // Znacznie mniejsza ilość (mniejsza gęstość)
    const count = 12;

    for(let i=0; i<count; i++) {
        const el = document.createElement('div');
        el.className = 'falling-item chip-visual';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        el.style.backgroundColor = color;
        
        // Logika: tylko po bokach (0-15% lub 85-100%), aby nie zasłaniać paneli
        let x;
        if (Math.random() > 0.5) {
            x = Math.random() * 15; // Lewa strona
        } else {
            x = 85 + Math.random() * 15; // Prawa strona
        }

        // Dłuższy czas spadania = spokojniejsza animacja
        const duration = Math.random() * 20 + 15; 
        const delay = Math.random() * 20;

        el.style.left = `${x}%`;
        el.style.animationDuration = `${duration}s`;
        el.style.animationDelay = `-${delay}s`;

        container.appendChild(el);
    }
}


function initInventorySystem() {
    const player = playersDB.find(p => p.username === "MrGambler");
    if (!player) return;

    myInventory = [];
    player.inventory.forEach((invEntry, index) => {
        const itemId = typeof invEntry === 'object' ? invEntry.id : invEntry;
        const template = allTreasures.find(t => t.id === itemId);
        if (template) {
            
            const item = { ...template, uid: `item_${itemId}_${index}` };
            
            
            if (template.isConsumable) {
                if (typeof invEntry === 'object' && invEntry.usesLeft !== undefined) {
                    item.usesLeft = invEntry.usesLeft;
                } else {
                    item.usesLeft = template.maxUses;
                }
            }

            if (!item.change) {
                const changeVal = (Math.random() * 10 - 5).toFixed(1);
                item.change = (changeVal > 0 ? "+" : "") + changeVal + "%";
                
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


const navMap = {
    'dashboard': { title: "Dashboard", navId: "navDash", viewId: "viewDashboard" },
    'profile': { title: "Twój Profil", navId: "navProfile", viewId: "viewProfile" },
    'games': { title: "Gry", navId: "navGames", viewId: "viewGames" },
    'inventory': { title: "Ekwipunek", navId: "navInventory", viewId: "viewInventory", init: renderInventoryView },
    'market': { title: "Rynek", navId: "navMarket", viewId: "viewMarket", init: renderMarketView },
    'wallet': { title: "Portfel", navId: "navWallet", viewId: "viewWallet", init: renderWalletView },
    'adminDash': { title: "Dashboard Admina", navId: "navAdminDash", viewId: "viewAdminDash", init: renderAdminHeatmap },
    'users': { title: "Użytkownicy", navId: "navUsers", viewId: "viewUsers", init: renderUsersView },
    'logs': { title: "Logi", navId: "navLogs", viewId: "viewLogs", init: renderLogsView }
};

function showView(viewName) {
    const config = navMap[viewName];
    if(!config) return;

    
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    
    document.getElementById(config.viewId).classList.add('active');
    const navEl = document.getElementById(config.navId);
    if(navEl) navEl.classList.add('active');

    
    document.getElementById('pageHeaderTitle').textContent = config.title;

    
    const profileActions = document.getElementById('profileActionWrapper');
    if (profileActions) {
        profileActions.style.display = viewName === 'profile' ? 'flex' : 'none';
    }

    
    if (viewName === 'games') renderGamesHub();
    if (config.init) config.init();
}


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
    if(!list) return;
    list.innerHTML = '';
    
    
    const sortedProfileInv = [...myInventory].sort((a, b) => b.rawPrice - a.rawPrice);

    
    const currentItems = sortedProfileInv.slice(0, shownTreasures);
    
    currentItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let priceClass = 'price-neutral';
        let icon = '';
        let colorClass = '';

        
        if (item.trend === 'up' || item.type === 'up') { priceClass = 'price-up'; icon = 'fa-caret-up'; colorClass = 'val-up'; }
        else if (item.trend === 'down' || item.type === 'down') { priceClass = 'price-down'; icon = 'fa-caret-down'; colorClass = 'val-down'; }

        let changeHtml = '';
        
        if(item.change && item.change !== "0%") {
            changeHtml = `<div class="val-change-inline ${colorClass}" title="ostatnie 24h">${item.change} <i class="fas ${icon}"></i></div>`;
        }
        
        
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


function renderGames() {
    const list = document.getElementById('gamesList');
    const btn = document.getElementById('btnGames');
    list.innerHTML = '';
    
    const currentGames = allGames.slice(0, shownGames);
    updateWLDCompact(currentGames);
    
    currentGames.forEach(g => {
        let tagClass = 'tag-lose';
        let tagText = 'Przegrana';
        let iconColor = 'var(--accent-red)'; 
        
        if(g.type === 'win') { 
            tagClass = 'tag-win'; 
            tagText = 'Wygrana'; 
            iconColor = 'var(--accent-green)';
        }
        else if(g.type === 'draw') { 
            tagClass = ''; 
            tagText = 'Remis'; 
            iconColor = '#fff';
        }
        
        // Kolory walut
        let moneyColor = '#fff';
        if (g.money && g.money.includes('+')) moneyColor = 'var(--accent-green)';
        else if (g.money && g.money.includes('-')) moneyColor = 'var(--accent-red)';

        let lpColor = '#9ca3af'; // Szary dla minusa/zera
        if (g.lp && g.lp.includes('+')) lpColor = 'var(--accent-purple)';

        const div = document.createElement('div');
        div.className = `game-entry ${g.type}`;
        
        div.innerHTML = `
            <div class="ge-left">
                <div class="ge-icon" style="color:${iconColor};"><i class="fas ${g.icon}"></i></div>
                <div class="ge-info">
                    <h5>${g.name}</h5>
                    <div style="font-size:10px; margin-top:3px; display:flex; align-items:center; gap:6px;">
                        <span style="color:${lpColor}; font-weight:600;">${g.lp}</span>
                        <span style="color:rgba(255,255,255,0.2);">|</span>
                        <span style="color:${moneyColor}; font-weight:700;">${g.money}</span>
                    </div>
                </div>
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


function claimReward(id) {
    const ach = achievementsDB.find(a => a.id === id);
    if (ach) {
        ach.rewardClaimed = true;
        
        
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

    
    if (shownTrophies >= myTrophies.length) {
        if(btn) btn.classList.add('hidden');
    }
}

function showMoreTrophies() {
    shownTrophies += 5;
    renderTrophies();
}


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
        
        if(document.getElementById('viewAdminDash').classList.contains('active') ||
           document.getElementById('viewUsers').classList.contains('active') ||
           document.getElementById('viewLogs').classList.contains('active')) {
            showView('dashboard');
        }
    }
}


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

        
        const isUnlocked = rank.id >= currentRankId;
        const unlockedClass = isUnlocked ? 'rank-unlocked' : '';

        
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
        
        const spineRect = spine.getBoundingClientRect();
        const cardRect = currentCard.getBoundingClientRect();
        
        
        const cardCenterY = cardRect.top + (cardRect.height / 2);
        
        
        
        const relativeY = cardCenterY - spineRect.top;
        
        
        let percentage = (relativeY / spineRect.height) * 100;
        
        
        percentage = Math.max(0, Math.min(100, percentage));

        
        
        if (currentRankId > 7) { 
            percentage = 0;
            spine.style.boxShadow = `none`;
        } else {
            spine.style.boxShadow = `0 0 15px rgba(59, 130, 246, 0.4)`;
        }

        
        
        
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
    
    setTimeout(updateLadderVisuals, 50); 
}

function closeRankModal() {
    document.getElementById('rankModal').classList.remove('active');
}


function openBattlePassModal() {
    document.getElementById('battlePassModal').classList.add('active');
}

function closeBattlePassModal() {
    document.getElementById('battlePassModal').classList.remove('active');
}

function openAccountModal() {
    document.getElementById('accountModal').classList.add('active');
}

function closeAccountModal() {
    document.getElementById('accountModal').classList.remove('active');
}


function openPlayerStatsModal() {
    document.getElementById('playerStatsModal').classList.add('active');
}

function closePlayerStatsModal() {
    document.getElementById('playerStatsModal').classList.remove('active');
}


const chatWindow = document.getElementById('chatWindow');
const chatFriendPanel = document.getElementById('chatFriendPanel');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const chatRoastBubble = document.getElementById('chatRoastBubble');

let activeChatPartner = { type: 'ai', name: 'AI Buddy', status: 'Pomocnik Gracza', icon: 'fa-robot', img: null };

function toggleChat() {
    // If bubble is active, clicking ball just closes bubble first
    if(chatRoastBubble.classList.contains('visible')) {
        chatRoastBubble.classList.remove('visible');
        return;
    }

    const isOpen = chatWindow.classList.contains('open');
    if (isOpen) {
        chatWindow.classList.remove('open');
        chatFriendPanel.classList.remove('open'); // Close friend panel if open
        updateToggleIcon(false);
    } else {
        chatWindow.classList.add('open');
        updateToggleIcon(true);
    }
}

function updateToggleIcon(isOpen) {
    const content = document.getElementById('chatToggleContent');
    if (isOpen) {
        content.innerHTML = '<i class="fas fa-times" style="font-size:20px;"></i>';
        content.style.backgroundImage = 'none';
        content.style.backgroundColor = 'transparent';
    } else {
        // Show active partner icon/img
        if (activeChatPartner.type === 'ai') {
            content.innerHTML = `<i class="fas ${activeChatPartner.icon}" style="font-size:24px;"></i>`;
            content.style.backgroundImage = 'none';
        } else {
            content.innerHTML = '';
            content.style.backgroundImage = `url('${activeChatPartner.img}')`;
        }
    }
}

function toggleFriendPanel() {
    const isOpen = chatFriendPanel.classList.contains('open');
    if (isOpen) chatFriendPanel.classList.remove('open');
    else chatFriendPanel.classList.add('open');
}

function switchChatPartner(type, name, status, visual) {
    // 1. Update State
    activeChatPartner = { type, name, status };
    if(type === 'ai') activeChatPartner.icon = visual;
    else activeChatPartner.img = visual;

    // 2. Update UI - Header
    document.getElementById('chatHeaderName').textContent = name;
    document.getElementById('chatHeaderStatus').textContent = status;
    const headerIcon = document.getElementById('chatHeaderIcon');
    if(type === 'ai') {
        headerIcon.className = 'chat-header-avatar ai';
        headerIcon.innerHTML = `<i class="fas ${visual}"></i>`;
        headerIcon.style.backgroundImage = 'none';
    } else {
        headerIcon.className = 'chat-header-avatar';
        headerIcon.innerHTML = '';
        headerIcon.style.backgroundImage = `url('${visual}')`;
    }

    // 3. Clear/Load Messages (Mock)
    chatMessages.innerHTML = '';
    if(type === 'ai') addMessage("Cześć! Widzę, że masz dobrą passę. W czym mogę pomóc?", 'bot');
    else addMessage(`[Historia rozmowy z ${name} wczytana...]`, 'bot');

    // 4. Close upper panel
    chatFriendPanel.classList.remove('open');

    // 5. Update Ball Icon if closed (or just refresh state)
    // If window is open, icon is "X". If closed, icon is Partner.
    // Use animation class on Toggle Button
    const btn = document.getElementById('chatToggleBtn');
    btn.style.transform = "scale(0.8)";
    setTimeout(() => {
        if (!chatWindow.classList.contains('open')) updateToggleIcon(false);
        btn.style.transform = "scale(1)";
    }, 200);
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    
    // Auto reply mock
    if(activeChatPartner.type === 'ai') {
        setTimeout(() => addMessage("Jestem tylko demem UI, ale dziękuję za wiadomość!", 'bot'), 1000);
    }
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

function triggerRoastAnimation(message) {
    // 1. Force switch to AI Partner without opening panels
    activeChatPartner = { type: 'ai', name: 'AI Buddy', status: 'Roast Master', icon: 'fa-robot' };
    
    // Close everything
    chatWindow.classList.remove('open');
    chatFriendPanel.classList.remove('open');
    
    // Update Ball Icon visually with animation
    const btn = document.getElementById('chatToggleBtn');
    btn.style.transition = "transform 0.3s";
    btn.style.transform = "rotate(360deg) scale(1.2)";
    updateToggleIcon(false); // Shows robot icon
    
    setTimeout(() => {
        btn.style.transform = "scale(1)";
        
        // 2. Show Bubble with dots
        chatRoastBubble.style.display = 'flex';
        // Force reflow
        void chatRoastBubble.offsetWidth; 
        chatRoastBubble.classList.add('visible');
        
        const dots = chatRoastBubble.querySelector('.bubble-dots');
        const txt = chatRoastBubble.querySelector('.bubble-text');
        
        dots.style.display = 'flex';
        txt.style.display = 'none';
        txt.textContent = message;

        // 3. Reveal text after 1s
        setTimeout(() => {
            dots.style.display = 'none';
            txt.style.display = 'block';
            
            // Auto hide based on length (min 3s, max 10s)
            const duration = Math.max(3000, Math.min(10000, message.length * 100));
            setTimeout(() => {
                chatRoastBubble.classList.remove('visible');
                setTimeout(() => chatRoastBubble.style.display = 'none', 300);
            }, duration);
            
        }, 1000);
        
    }, 300);
}





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
    
    
    setupLoadoutSlots();

    
    let filteredInv = myInventory.filter(item => {
        const isCase = item.type === 'chest'; 
        if(isCase && !invFilterState.case) return false;
        if(!isCase && !invFilterState.item) return false;
        return true;
    });

    
    
    let displayList = [];
    let stackMap = {}; 

    filteredInv.forEach(item => {
        
        const isEquipped = Object.values(myLoadout).includes(item.uid);
        const isOnSale = item.isOnSale === true;

        
        if (isEquipped || isOnSale) {
            displayList.push({ 
                ...item, 
                stackCount: 1, 
                forceUnique: true 
            });
        } else {
            
            if (stackMap[item.id]) {
                
                stackMap[item.id].stackCount++;
            } else {
                
                
                const stackItem = { ...item, stackCount: 1, forceUnique: false };
                stackMap[item.id] = stackItem;
                displayList.push(stackItem);
            }
        }
    });

    
    const sortedInv = displayList.sort((a, b) => b.rawPrice - a.rawPrice);
    
    
    sortedInv.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'inv-grid-slot';
        
        
        
        const isEquipped = Object.values(myLoadout).includes(item.uid);
        const isOnSale = item.isOnSale === true;

        if (isEquipped) slot.classList.add('is-equipped');
        if (isOnSale) slot.classList.add('on-sale');

        
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

        
        let badgeHtml = '';
        
        
        
        if (item.stackCount > 1) {
            badgeHtml += `<div class="item-stack-count">x${item.stackCount}</div>`;
        }

        if (isEquipped) badgeHtml += `<div class="equipped-badge">EQ</div>`;
        else if (isOnSale) badgeHtml += `<div class="on-sale-badge">NA RYNKU</div>`;

        
        const isRankLocked = item.rarity === 'Divine' && currentRankId > 2;
        if (isRankLocked) {
            badgeHtml += `<div class="inv-lock-overlay"><i class="fas fa-lock"></i></div>`;
            slot.classList.add('is-rank-locked');
        }

        let conditionHtml = '';
        if (!isRankLocked && !isEquipped && item.isConsumable && item.maxUses && (item.id < 1 || item.id > 5)) {
            const pct = Math.round((item.usesLeft / item.maxUses) * 100);
            conditionHtml = `<div class="mc-condition-pie" style="background: conic-gradient(var(--accent-green) 0% ${pct}%, #555 ${pct}% 100%);" title="Stan: ${item.usesLeft}/${item.maxUses}"></div>`;
        }

        slot.innerHTML = `
            <div class="inv-item-icon" style="font-style: normal; color: initial;">${item.icon}</div>
            <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
            ${badgeHtml}
            ${conditionHtml}
        `;
        
        
        let tooltipText = `${item.name} (${item.rarity})\nTyp: ${item.type}\nBonus: ${item.bonus}\nCena: ${item.price}`;
        if(item.stackCount > 1) tooltipText += `\nIlość w magazynie: ${item.stackCount}`;
        slot.title = tooltipText;
        
        container.appendChild(slot);
    });

    
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
        
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);
        
        
        newSlot.addEventListener('dragover', handleDragOver);
        newSlot.addEventListener('drop', handleDrop);
        newSlot.addEventListener('click', handleUnequip); 
        
        
        const slotType = newSlot.dataset.type; 
        
        
        
        
        
        
        const slotClass = Array.from(newSlot.classList).find(c => c.startsWith('slot-'));
        
        if (slotClass && myLoadout[slotClass]) {
            const itemUid = myLoadout[slotClass];
            const item = myInventory.find(i => i.uid === itemUid);
            if (item) {
                renderItemInSlot(newSlot, item);
            }
        } else {
            
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
    
    
    let slot = e.target;
    while (!slot.classList.contains('pd-slot') && slot.parentElement) {
        slot = slot.parentElement;
    }

    if (!item || !slot) return;

    
    
    if (item.type !== slot.dataset.type) {
        alert(`Nie możesz włożyć ${item.name} (${item.type}) do slotu ${slot.dataset.type}!`);
        renderInventoryView(); 
        return;
    }

    
    const slotClass = Array.from(slot.classList).find(c => c.startsWith('slot-'));
    if (slotClass) {
        myLoadout[slotClass] = uid;
        
        renderInventoryView(); 
        setupLoadoutSlots();   
    }
}

function handleUnequip(e) {
    let slot = e.target;
    while (!slot.classList.contains('pd-slot') && slot.parentElement) {
        slot = slot.parentElement;
    }
    
    const slotClass = Array.from(slot.classList).find(c => c.startsWith('slot-'));
    
    
    if (slotClass && myLoadout[slotClass]) {
        delete myLoadout[slotClass];
        renderInventoryView();
        setupLoadoutSlots();
    }
}

function renderItemInSlot(slotElement, item) {
    
    let rarityColor = getRarityColor(item.rarity);
    
    let conditionHtml = '';
    const isRankLocked = item.rarity === 'Divine' && currentRankId > 2;

    if (!isRankLocked && item.isConsumable && item.maxUses && (item.id < 1 || item.id > 5)) {
        const pct = Math.round((item.usesLeft / item.maxUses) * 100);
        conditionHtml = `<div class="mc-condition-pie" style="background: conic-gradient(var(--accent-green) 0% ${pct}%, #555 ${pct}% 100%);" title="Stan: ${item.usesLeft}/${item.maxUses}"></div>`;
    }

    slotElement.innerHTML = `
        <div style="font-size: 50px; font-style: normal; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${item.icon}</div>
        <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
        ${conditionHtml}
    `;
    slotElement.style.borderColor = item.color;
    slotElement.style.background = `rgba(${hexToRgb(item.color)}, 0.15)`;
    slotElement.style.boxShadow = `0 0 15px rgba(${hexToRgb(item.color)}, 0.4)`;
    slotElement.title = `${item.name} (Kliknij aby zdjąć)`;
}

function resetSlotVisuals(slotElement) {
    
    
    slotElement.style = ""; 
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
    return '#9ca3af'; 
}


function renderDashInventory() {
    const container = document.getElementById('dashInventoryList');
    if(!container) return;
    container.innerHTML = '';
    
    
    const dashItems = myInventory.slice(0, 4);
    
    dashItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let priceClass = 'price-neutral';
        let iconHtml = '';
        
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


function hexToRgb(hex) {
    
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255,255,255';
}

function distributePlayers(total, count) {
    if (count <= 0) return [];
    if (count === 1) return [total];
    
    let distribution = [];
    let remaining = total;
    
    
    let weights = [];
    for(let i=0; i<count; i++) weights.push(Math.random());
    let sumWeights = weights.reduce((a,b) => a+b, 0);
    
    for(let i=0; i<count; i++) {
        
        if (i === count - 1) {
            distribution.push(remaining);
        } else {
            let val = Math.floor(total * (weights[i] / sumWeights));
            distribution.push(val);
            remaining -= val;
        }
    }
    
    return distribution.sort((a,b) => b-a);
}

function initGameModePersistence() {
    // Generuje liczbę graczy dla każdego trybu RAZ przy starcie,
    // aby była spójna we wszystkich widokach (Dashboard, Gry, Ulubione).
    gamesHubStructure.forEach(category => {
        if(category.games) {
            category.games.forEach(game => {
                // Zapisujemy wynik w obiekcie gry
                game.modeCounts = distributePlayers(game.onlineCount, game.modes.length);
            });
        }
    });
}

let currentDepositMethod = 'visa';
let currentWithdrawMethod = 'visa';

function renderWalletView() {
    
    
    
    const realMoney = 2450000; 
    const targetNetWorth = 5240000;
    const itemsValue = targetNetWorth - realMoney; 
    
    
    const nwTotal = document.getElementById('nwTotalDisplay');
    const nwReal = document.getElementById('nwRealDisplay');
    const nwItems = document.getElementById('nwItemsDisplay');
    
    if (nwTotal) nwTotal.textContent = targetNetWorth.toLocaleString('en-US', {minimumFractionDigits: 2});
    if (nwReal) nwReal.textContent = realMoney.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' $';
    if (nwItems) nwItems.textContent = itemsValue.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' $';

    
    selectDepositMethod(currentDepositMethod);
    selectWithdrawMethod(currentWithdrawMethod);

    
    const transferSelect = document.getElementById('transferItemSelect');
    if (transferSelect && typeof allTreasures !== 'undefined') {
        
        transferSelect.innerHTML = '<option value="">-- Wybierz przedmiot --</option>';

        allTreasures.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = `${item.name} (${item.rarity})`;
            transferSelect.appendChild(opt);
        });
    }
}


function selectDepositMethod(method) {
    currentDepositMethod = method;
    const container = document.getElementById('depositMethodsGrid');
    const dynamicContent = document.getElementById('depositDynamicContainer');
    if(!container || !dynamicContent) return;

    
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


function toggleTransferSection(type) {
    const sec = document.getElementById(`sec${type}`);
    const tog = document.getElementById(`toggle${type}`);
    
    
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
    
    
    const hideGames = document.getElementById('hideGamesSwitch')?.checked ?? true;

    walletLogsDB.forEach(t => {
        
        if (hideGames) {
            const lowerType = t.type.toLowerCase();
            const lowerDetail = t.detail.toLowerCase();
            
            if (lowerType.includes('wygrana') || lowerType.includes('przegrana') || 
                lowerType.includes('korekta') || lowerType.includes('bonus') ||
                lowerDetail.includes('game') || lowerDetail.includes('session')) {
                return; 
            }
        }

        const div = document.createElement('div');
        div.className = 'hist-row';
        
        let valColor = 'white';
        if (t.val.startsWith('+')) valColor = 'var(--accent-green)';
        if (t.val.startsWith('-')) valColor = 'var(--accent-red)';
        
        let statusClass = t.status.toLowerCase();
        
        
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


function switchWalletTab(tabName) {
    
    document.querySelectorAll('.w-tab').forEach(b => b.classList.remove('active'));
    
    document.querySelectorAll('.w-content').forEach(c => c.classList.remove('active'));

    
    const btn = document.querySelector(`.w-tab[onclick="switchWalletTab('${tabName}')"]`);
    if(btn) btn.classList.add('active');
    
    const content = document.getElementById(`tab-${tabName}`);
    if(content) content.classList.add('active');
}

function copyCrypto() {
    const input = document.getElementById('cryptoAddr');
    input.select();
    
    const btn = input.nextElementSibling;
    const originalIcon = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.color = 'var(--accent-green)';
    
    setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.style.color = '';
    }, 2000);
}

let heatmapState = { players: true, admins: true };

function renderAdminHeatmap() {
    const grid = document.getElementById('adminHeatmapGrid');
    if(!grid) return; // Allow re-render
    grid.innerHTML = '';

    const totalCells = 53 * 7;
    
    for(let i = 0; i < totalCells; i++) {
        const div = document.createElement('div');
        
        // Randomize type: 90% Player, 10% Admin logic
        // But only applies if there is activity
        const rand = Math.random();
        let type = 'player';
        if(Math.random() > 0.9) type = 'admin';

        let level = '0';
        let cellClass = 'l0'; // default empty

        // Generate activity
        if (rand > 0.70) {
            if (rand > 0.75) level = '1';
            if (rand > 0.88) level = '2';
            if (rand > 0.95) level = '3';
            if (rand > 0.98) level = '4';
            
            if(type === 'admin') cellClass = `al${level}`;
            else cellClass = `l${level}`;
        } else {
            type = 'none'; // No activity
        }

        div.className = `gh-cell ${cellClass}`;
        div.dataset.type = type;
        
        // Apply initial visibility state
        if(type === 'player' && !heatmapState.players) div.style.opacity = '0.1';
        if(type === 'admin' && !heatmapState.admins) div.style.opacity = '0.1';

        div.title = type !== 'none' ? `Aktywność: ${type.toUpperCase()} (Lvl ${level})` : 'Brak aktywności';
        grid.appendChild(div);
    }
    updateHeatmapLegend();
}

function toggleHeatmapSource(source) {
    heatmapState[source] = !heatmapState[source];
    
    // Update buttons visual state
    const btn = document.getElementById(source === 'players' ? 'btnHmPlayers' : 'btnHmAdmins');
    if(btn) btn.classList.toggle('active', heatmapState[source]);

    // Update grid cells visibility
    const cells = document.querySelectorAll('.gh-cell');
    cells.forEach(cell => {
        const type = cell.dataset.type;
        if(type === 'none') return; // Ignore empty cells

        if(type === 'player') {
            cell.style.opacity = heatmapState.players ? '1' : '0.1';
        } else if(type === 'admin') {
            cell.style.opacity = heatmapState.admins ? '1' : '0.1';
        }
    });

    updateHeatmapLegend();
}

function updateHeatmapLegend() {
    const legP = document.getElementById('legendPlayers');
    const legA = document.getElementById('legendAdmins');
    if(legP) legP.style.display = heatmapState.players ? 'flex' : 'none';
    if(legA) legA.style.display = heatmapState.admins ? 'flex' : 'none';
}

let adminUsersDB = [];
let adminUsersPage = 1;
const adminUsersPerPage = 15;

function initAdminUsers() {
    if(adminUsersDB.length > 0) return;

    const ranks = ["Bankrupt", "Small Fry", "Risk Taker", "Table Shark", "Casino Legend", "Alpha Whale", "RNG God"];
    const statuses = ["Online", "Offline", "Offline", "Banned", "Suspicious"];
    const prefixes = ["Crypto", "Super", "Mega", "Iron", "Lazy", "Lucky", "Sad", "Rich", "Poor", "Bot"];
    const suffixes = ["Gamer", "Winner", "Loser", "Whale", "King", "Dog", "Cat", "Master", "Noob", "Pro"];

    
    adminUsersDB.push({ id: 1, name: "MrGambler", rank: "Alpha Whale", balance: 5240000, lastActive: "Now", status: "Online", isAdmin: true });
    adminUsersDB.push({ id: 994, name: "Whale_Killer", rank: "RNG God", balance: 12500000, lastActive: "2 min temu", status: "Online" });
    adminUsersDB.push({ id: 552, name: "Janusz_Hazardu", rank: "Bankrupt", balance: 0, lastActive: "5 dni temu", status: "Banned" });

    
    for(let i=0; i<150; i++) {
        const id = 1000 + i;
        const name = prefixes[Math.floor(Math.random()*prefixes.length)] + "_" + suffixes[Math.floor(Math.random()*suffixes.length)] + "_" + Math.floor(Math.random()*99);
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        const balance = Math.floor(Math.random() * 500000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const lastActive = status === 'Online' ? "Now" : Math.floor(Math.random() * 24) + "h temu";

        adminUsersDB.push({ id, name, rank, balance, lastActive, status });
    }
}

function renderUsersView() {
    initAdminUsers();
    
    const container = document.getElementById('usersContainer');
    if(!container) return;
    container.innerHTML = '';

    const filterStatus = document.getElementById('userFilterStatus').value;
    const searchVal = document.getElementById('userSearchInput').value.toLowerCase();

    
    let filtered = adminUsersDB.filter(u => {
        if(filterStatus !== 'all' && u.status !== filterStatus) return false;
        if(searchVal && !u.name.toLowerCase().includes(searchVal) && !u.id.toString().includes(searchVal)) return false;
        return true;
    });

    
    const totalPages = Math.ceil(filtered.length / adminUsersPerPage) || 1;
    if(adminUsersPage < 1) adminUsersPage = 1;
    if(adminUsersPage > totalPages) adminUsersPage = totalPages;

    const start = (adminUsersPage - 1) * adminUsersPerPage;
    const pageItems = filtered.slice(start, start + adminUsersPerPage);

    pageItems.forEach(u => {
        const div = document.createElement('div');
        div.className = 'ul-row';
        
        let badgeClass = 'ul-b-offline';
        if(u.status === 'Online') badgeClass = 'ul-b-online';
        if(u.status === 'Banned') badgeClass = 'ul-b-banned';
        if(u.status === 'Suspicious') badgeClass = 'ul-b-suspicious';

        let rankColor = '#aaa';
        if(u.rank.includes('Whale') || u.rank.includes('God')) rankColor = 'var(--accent-purple)';
        if(u.rank.includes('Bankrupt')) rankColor = 'var(--text-muted)';

        let nameHtml = u.name;
        if(u.isAdmin) nameHtml += ' <span style="background:var(--accent-purple); color:white; font-size:9px; padding:2px 5px; border-radius:3px; margin-left:5px;">ADMIN</span>';

        div.innerHTML = `
            <div style="font-family:monospace; color:#666;">#${u.id}</div>
            <div style="font-weight:600; color:white;">${nameHtml}</div>
            <div style="color:${rankColor};">${u.rank}</div>
            <div style="font-family:monospace; color:${u.balance > 100000 ? 'var(--accent-green)' : '#ddd'};">${u.balance.toLocaleString()} $</div>
            <div style="color:#888;">${u.lastActive}</div>
            <div><span class="ul-badge ${badgeClass}">${u.status}</span></div>
            <div class="ul-actions">
                <button class="ul-btn" title="Edytuj" onclick="openEditUserModal(${u.id})"><i class="fas fa-edit"></i></button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('userPageIndicator').textContent = `Strona ${adminUsersPage} z ${totalPages}`;
}

function changeUserPage(delta) {
    adminUsersPage += delta;
    renderUsersView();
}


function toggleAdminAction(action) {
    let msg = "";
    switch(action) {
        case 'maintenance': msg = "Tryb konserwacji został zmieniony."; break;
        case 'block_withdrawals': msg = "Blokada wypłat została zmieniona."; break;
        case 'gate_blik': msg = "Status bramki BLIK został zmieniony."; break;
        case 'gate_crypto': msg = "Status bramki Crypto został zmieniony."; break;
    }
    
    console.log(`[ADMIN] Action: ${action}`);
    
    alert(`[SYSTEM] ${msg}`); 
}

function adminLogoutAll() {
    if(confirm("Czy na pewno chcesz wylogować WSZYSTKICH użytkowników? To przerwie aktywne gry.")) {
        alert("[SYSTEM] Wysłano polecenie: Force Logout All Sessions.");
    }
}

function sendAdminPush() {
    const msg = document.getElementById('pushMsgInput').value;
    if(msg) {
        // Trigger the Global Roast Animation
        triggerRoastAnimation(msg);
        document.getElementById('pushMsgInput').value = '';
    }
}

function updateTickerAdmin() {
    const msg = document.getElementById('tickerMsgInput').value;
    if(msg) {
        alert(`[TICKER UPDATED] Nowa treść: "${msg}"`);
        document.getElementById('tickerMsgInput').value = '';
    }
}

function adminImpersonate() {
    const target = document.getElementById('godModeInput').value;
    if(target) {
        alert(`[GOD MODE] Przełączanie widoku na gracza: ${target}...\n\n(To tylko demo UI - nic się nie zmieni, ale w produkcji przeładowałoby to kontekst aplikacji).`);
    } else {
        alert("Podaj ID lub Login gracza.");
    }
}


function openAdminFinancialLogs() {
    const modal = document.getElementById('financialLogsModal');
    if(!modal) return;
    
    // Otwórz modal
    modal.classList.add('active');
    
    // Nadpisz tytuł na adminowy
    const title = modal.querySelector('.sm-title');
    if(title) title.innerHTML = '<i class="fas fa-university"></i> System: Globalne Finanse';

    // Pobierz kontener listy
    const container = document.getElementById('financialLogsList');
    if (!container) return;
    container.innerHTML = '';

    // Generuj dane globalne
    const adminLogs = [
        { id: '#SYS_9921', type: 'Wypłata (Visa)', val: '-500,000 $', date: '2 min temu', status: 'Processing', detail: 'User: Whale_Killer | Visa **** 9921' },
        { id: '#SYS_9920', type: 'Wpłata (Crypto)', val: '+12,500 USDT', date: '5 min temu', status: 'Completed', detail: 'User: CryptoBro | Sieć: TRC20' },
        { id: '#SYS_9919', type: 'Transfer Wewn.', val: '1,000 $', date: '12 min temu', status: 'Completed', detail: 'Od: User_A -> Do: User_B' },
        { id: '#SYS_9918', type: 'Wypłata (BLIK)', val: '-200 PLN', date: '15 min temu', status: 'Completed', detail: 'User: Janusz_K | Gateway: PayU' },
        { id: '#SYS_9917', type: 'Prowizja Rynkowa', val: '+250 $', date: '22 min temu', status: 'Completed', detail: 'Market Fee (5%) | Item: Divine Case' },
        { id: '#SYS_9916', type: 'Yoink (Admin)', val: '+4,200 $', date: '30 min temu', status: 'Completed', detail: 'Przejęcie środków od Scam_Master_PL' },
        { id: '#SYS_9915', type: 'Wpłata (Visa)', val: '+50 $', date: '45 min temu', status: 'Rejected', detail: 'User: Noob_1 | Insufficient Funds' },
        { id: '#SYS_9914', type: 'Wypłata (Crypto)', val: '-10,000 USDT', date: '1h temu', status: 'Completed', detail: 'User: Anon_Whale | TXID: 0x992...' },
        { id: '#SYS_9913', type: 'Korekta Salda', val: '-5,000 $', date: '2h temu', status: 'Completed', detail: 'Admin Action: Refund Bug #22' },
        { id: '#SYS_9912', type: 'Wpłata (BLIK)', val: '+1,000 PLN', date: '3h temu', status: 'Completed', detail: 'User: Kasiasty_PL' }
    ];

    adminLogs.forEach(t => {
        const div = document.createElement('div');
        div.className = 'hist-row';
        
        let valColor = 'white';
        if (t.val.startsWith('+')) valColor = 'var(--accent-green)';
        if (t.val.startsWith('-')) valColor = 'var(--accent-red)';
        
        let statusClass = t.status.toLowerCase();
        
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
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function openEditUserModal(userId) {
    const user = adminUsersDB.find(u => u.id === userId);
    if(!user) return;

    // Populate Fields
    document.getElementById('euIdDisplay').textContent = `ID: #${user.id}`;
    document.getElementById('euInputName').value = user.name;
    document.getElementById('euInputBalance').value = user.balance;
    document.getElementById('euSelectStatus').value = user.status;
    document.getElementById('euCheckAdmin').checked = user.isAdmin || false;
    
    // Fake extended data since DB is simple
    document.getElementById('euInputLP').value = Math.floor(Math.random() * 5000);
    document.getElementById('euInputStreak').value = Math.floor(Math.random() * 10);
    document.getElementById('euInputPfp').value = ""; // Placeholder
    document.getElementById('euAvatarPreview').style.backgroundImage = "none";
    document.getElementById('euAvatarPreview').style.backgroundColor = "#333";
    
    // Simulate fetching PFP
    const pfpUrl = `https://i.pravatar.cc/150?u=${user.name}`;
    document.getElementById('euAvatarPreview').style.backgroundImage = `url('${pfpUrl}')`;

    // Populate Rank Select dynamically
    const rankSelect = document.getElementById('euSelectRank');
    rankSelect.innerHTML = '';
    const ranks = ["Bankrupt", "Small Fry", "Risk Taker", "Table Shark", "Casino Legend", "Alpha Whale", "RNG God"];
    ranks.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        if(user.rank === r) opt.selected = true;
        rankSelect.appendChild(opt);
    });

    // Config Ban Button inside Modal
    document.getElementById('euBtnBan').onclick = function() {
        if(confirm(`Czy na pewno chcesz zbanować użytkownika ${user.name} (ID: ${user.id})?`)) {
            alert(`[SYSTEM] Użytkownik ${user.name} został zbanowany.`);
            document.getElementById('euSelectStatus').value = 'Banned';
        }
    };
    document.getElementById('editUserModal').classList.add('active');
}

function saveUserEdit() {
    const name = document.getElementById('euInputName').value;
    const bal = document.getElementById('euInputBalance').value;
    const status = document.getElementById('euSelectStatus').value;
    const rank = document.getElementById('euSelectRank').value;
    
    // Update logic would go here
    alert(`[SYSTEM] Zapisano zmiany dla użytkownika ${name}.\nSaldo: ${bal}\nRanga: ${rank}\nStatus: ${status}`);
    document.getElementById('editUserModal').classList.remove('active');
    
    // Refresh list to show fake updates if we modified the object (omitted for brevity in mock)
    renderUsersView();
}

function modifyUserInv(action) {
    const itemId = document.getElementById('euInvItemId').value;
    const qty = document.getElementById('euInvQty').value;
    
    if(!itemId || itemId <= 0) {
        alert("BŁĄD: Podaj poprawne ID przedmiotu.");
        return;
    }
    if(!qty || qty <= 0) {
        alert("BŁĄD: Ilość musi być większa od 0.");
        return;
    }

    const itemName = typeof allTreasures !== 'undefined' 
        ? (allTreasures.find(t => t.id == itemId)?.name || "Nieznany Przedmiot") 
        : "Przedmiot";

    if(action === 'add') {
        alert(`[SYSTEM] Pomyślnie dodano do ekwipunku:\n\nPrzedmiot: ${itemName} (ID: ${itemId})\nIlość: ${qty}x`);
    } else {
        alert(`[SYSTEM] Pomyślnie usunięto z ekwipunku:\n\nPrzedmiot: ${itemName} (ID: ${itemId})\nIlość: ${qty}x`);
    }
}

function renderLogsView() {
    const container = document.getElementById('logsContainer');
    if(!container) return;
    container.innerHTML = '';

    const logTypes = ['INFO', 'WARN', 'ERR', 'AUTH', 'SUCCESS', 'CRIT'];
    const sources = ['SYSTEM', 'GAME_ENG', 'PAYMENT', 'USER_DB', 'RISK_AI', 'NETWORK'];
    const messages = [
        "Connection established with node #421",
        "User_992 placed bet: 50,000$ (Blackjack)",
        "Database latency spike detected (120ms)",
        "Payment gateway timeout - Retrying...",
        "User_Admin logged in from 192.168.1.1",
        "RNG Seed updated: 0x992384AA",
        "Suspicious activity detected: Bot_Net_01",
        "Daily rewards distributed to 1540 users",
        "Asset 'Dragon Egg' transferred to User_Whale",
        "WebSocket heartbeat missed - Reconnecting",
        "Cache cleared successfully",
        "New listing created on Market: ID #9921",
        "Transaction #TX992 verified on blockchain",
        "Critical Error: Logic Gate failure in Slot Engine",
        "User_LuckyLuke claimed Battle Pass Lvl 20",
        "API Rate limit approaching (85%)",
        "Server CPU load at 45%",
        "Backup process started...",
        "Backup process completed (2.4GB)",
        "User_Banned banned for 'Scripting'"
    ];

    
    for(let i=0; i<200; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - i * (Math.random() * 10));
        const timeStr = date.toTimeString().split(' ')[0];
        
        let type = 'INFO';
        const rand = Math.random();
        if (rand > 0.98) type = 'CRIT';
        else if (rand > 0.90) type = 'ERR';
        else if (rand > 0.80) type = 'WARN';
        else if (rand > 0.70) type = 'AUTH';
        else if (rand > 0.60) type = 'SUCCESS';

        const source = sources[Math.floor(Math.random() * sources.length)];
        const msg = messages[Math.floor(Math.random() * messages.length)] + (Math.random() > 0.5 ? ` [ID:${Math.floor(Math.random()*9999)}]` : '');

        const div = document.createElement('div');
        div.className = `log-line`;
        if(type === 'ERR' || type === 'CRIT') div.style.background = 'rgba(239, 68, 68, 0.05)';

        div.innerHTML = `
            <span class="ll-time">${timeStr}</span>
            <span class="ll-level lvl-${type.toLowerCase()}">${type}</span>
            <span class="ll-source">[${source}]</span>
            <span class="ll-msg">${msg}</span>
        `;
        container.appendChild(div);
    }
}


initDashboard();




let activeGamesTabId = 'casino';


function renderGamesHub() {
    renderGamesTabs();
    renderGamesContent();
    renderGlobalLeaderboard(); 
}

function renderGamesTabs() {
    const container = document.getElementById('gamesHubHeader'); 
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
    renderGamesTabs(); 
    renderGamesContent(); 
}

function renderGamesContent() {
    const container = document.getElementById('availableGamesContainer');
    if (!container) return;
    container.innerHTML = ''; 

    const currentTab = gamesHubStructure.find(t => t.id === activeGamesTabId);
    if (!currentTab) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'gh-content-area';

    const grid = document.createElement('div');
    grid.className = 'gh-grid';

    if (currentTab.games) {
        currentTab.games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'gh-card';
            card.onclick = () => openGameDetailsModal(game);
            
            const glowColor = game.color;
            const variantsText = game.variants > 1 ? `${game.variants} MODES` : '';
            
            
            const tagHtml = game.tag 
                ? `<div class="gh-game-tag" style="position:absolute; top:12px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.15); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; pointer-events:none;">${game.tag}</div>` 
                : '';

            card.innerHTML = `
                <div class="gh-card-bg-glow" style="background: ${glowColor};"></div>
                ${tagHtml}
                
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
                            <i class="fas fa-user-group gh-online-icon"></i> ${game.onlineCount.toLocaleString()}
                        </div>
                        <div class="gh-capacity-badge" title="Wymagani gracze / Miejsca">
                            <i class="fas fa-user"></i> ${game.players}
                        </div>
                    </div>
                </div>

                <div class="gh-card-body">
                    <div class="gh-title-row" style="justify-content: flex-start; gap: 8px;">
                        <h4 class="gh-game-title">${game.name}</h4>
                        <div class="gh-variants-badge">${variantsText}</div>
                    </div>
                    <p class="gh-game-desc">${game.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}



let lbShownCount = 15;

function renderGlobalLeaderboard() {
    const list = document.getElementById('globalLeaderboardList');
    if(!list) return;
    list.innerHTML = '';

    const sortedPlayers = [...globalLeaderboardDB].sort((a, b) => b.netWorth - a.netWorth);
    const visiblePlayers = sortedPlayers.slice(0, lbShownCount);

    visiblePlayers.forEach((p, index) => {
        const div = document.createElement('div');
        if (p.isMe) div.id = 'lb-my-row';
        div.className = p.isMe ? 'lb-row active-user-row' : 'lb-row';
        
        if(p.isMe) {
            div.style.background = "rgba(59, 130, 246, 0.2)";
            div.style.border = "1px solid rgba(59, 130, 246, 0.4)";
        }

        const rankNum = index + 1;
        let rankClass = '';
        let trophyIcon = '';
        if (rankNum === 1) { rankClass = 'top1'; trophyIcon = '🥇'; }
        else if (rankNum === 2) { rankClass = 'top2'; trophyIcon = '🥈'; }
        else if (rankNum === 3) { rankClass = 'top3'; trophyIcon = '🥉'; }
        else { trophyIcon = `<span style="color:#666">#</span>`; }

        const rankData = ranksDB.find(r => r.id === p.rankVal);
        let rankIconHtml = '';
        let rColor = '#888';

        if(rankData) {
            rColor = rankData.color;
            
            if(rankData.emoji) {
                rankIconHtml = `<span style="margin-left:6px; font-size:14px; line-height:1;">${rankData.emoji}</span>`;
            } else {
                rankIconHtml = `<i class="fas ${rankData.icon}" style="margin-left:6px; color:${rColor}; font-size:12px;"></i>`;
            }
        }

        
        let titleStyle = 'font-size:10px; color:#8b92a5; margin-top:2px;';
        if (p.rankName === 'King of The Gamblers') {
            titleStyle = 'font-size:10px; color:#FFD700; font-weight:700; text-shadow: 0 0 5px rgba(255,215,0,0.3); margin-top:2px;';
        }
        
        let nwDisplay = p.netWorth >= 1000000 
            ? (p.netWorth / 1000000).toFixed(1) + 'M $' 
            : (p.netWorth / 1000).toFixed(0) + 'k $';

        div.innerHTML = `
            <div class="lb-rank ${rankClass}" style="display:flex; justify-content:center; align-items:center;">
                ${rankNum <= 3 ? trophyIcon : rankNum}
            </div>
            <div class="lb-user">
                <div style="display:flex; align-items:center;">
                    <span class="lb-name" style="${p.isMe ? 'color:var(--accent-blue); font-weight:800;' : ''}">
                        ${p.name} ${p.isMe ? '(Ty)' : ''}
                    </span>
                    ${rankIconHtml}
                </div>
                <div style="${titleStyle}">
                    ${p.title}
                </div>
            </div>
            <div class="lb-stats" style="justify-content:center;">
                <div class="lb-nw" style="font-size:12px; color:var(--accent-green); font-weight:700;">${nwDisplay}</div>
            </div>
        `;
        list.appendChild(div);
    });
}


function expandLeaderboard() {
    lbShownCount += 10;
    renderGlobalLeaderboard();
}

function scrollToMyPosition() {
    const container = document.getElementById('globalLeaderboardList');
    let myRow = document.getElementById('lb-my-row');

    
    if (!myRow) {
        const sortedPlayers = [...globalLeaderboardDB].sort((a, b) => b.netWorth - a.netWorth);
        const myIndex = sortedPlayers.findIndex(p => p.isMe);
        
        if (myIndex !== -1) {
            
            lbShownCount = myIndex + 5;
            renderGlobalLeaderboard();
            myRow = document.getElementById('lb-my-row');
        }
    }
    
    if (myRow && container) {
        const topPos = myRow.offsetTop - container.offsetTop;
        container.scrollTo({
            top: topPos - 50, 
            behavior: 'smooth'
        });
        
        myRow.style.transition = "background 0.3s";
        const oldBg = myRow.style.background;
        myRow.style.background = "rgba(59, 130, 246, 0.6)";
        setTimeout(() => {
            myRow.style.background = oldBg;
        }, 1000);
    } else {
        alert("Nie znaleziono Twojej pozycji w rankingu (możesz być poza TOP listą).");
    }
}




function initDashboardExtras() {
    renderDashInventory();
    initBannerCarousel();
    renderFavoritesPanel();
    renderPopularModes();
    renderDashActiveListings();
}

function renderDashActiveListings() {
    const container = document.getElementById('dashActiveListings');
    if(!container) return;
    container.innerHTML = '';

    
    const myListings = marketState.listings.filter(l => l.isMine);

    if(myListings.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:#666; font-size:11px; text-align:center;">Brak aktywnych ofert na rynku.</div>';
        return;
    }

    myListings.forEach(item => {
        const el = document.createElement('div');
        el.className = 'mw-item';
        el.style.cursor = 'pointer';
        el.style.transition = 'background 0.2s';
        
        
        el.onclick = () => openMarketItemModal(item);

        const priceDisplay = (item.listingType === 'auction' ? (item.currentBid || item.price) : item.price).toLocaleString();
        
        
        let statusHtml = '';
        if(item.listingType === 'instant') {
            statusHtml = `<span style="color:var(--accent-green); font-size:9px; font-weight:700;">INSTANT</span>`;
        } else {
            statusHtml = `<span style="color:var(--accent-orange); font-size:9px; font-weight:700;">${item.bidCount} OFERT</span>`;
        }

        el.innerHTML = `
            <div class="mw-icon" style="color:${item.color}; font-size: 24px; background: rgba(255,255,255,0.02); width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:6px;">
                ${item.icon}
            </div>
            <div class="mw-info" style="margin-left: 10px;">
                <h5 style="color:${item.color}; font-size:12px; margin-bottom:3px;">${item.name}</h5>
                <div style="font-size:11px; font-weight:700; color:#fff;">${priceDisplay} $</div>
            </div>
            <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; justify-content:center;">
                ${statusHtml}
                <div style="font-size:9px; color:#666; margin-top:2px;">${item.type.toUpperCase()}</div>
            </div>
        `;
        
        
        el.onmouseenter = () => el.style.background = 'rgba(255,255,255,0.08)';
        el.onmouseleave = () => el.style.background = 'rgba(255,255,255,0.03)';

        container.appendChild(el);
    });
}

function renderPopularModes() {
    const grid = document.getElementById('popularModesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let allModes = [];

    
    gamesHubStructure.forEach(category => {
        if(category.games) {
            category.games.forEach(game => {
                // Pobieramy stałe dane zamiast losować na nowo
                const distrib = game.modeCounts || distributePlayers(game.onlineCount, game.modes.length);
                
                game.modes.forEach((modeName, idx) => {
                    allModes.push({
                        modeName: modeName,
                        gameName: game.name,
                        players: distrib[idx],
                        icon: game.icon,
                        color: game.color,
                        gameId: game.id
                    });
                });
            });
        }
    });

    
    allModes.sort((a, b) => b.players - a.players);

    
    const topModes = allModes.slice(0, 6);

    topModes.forEach((m, index) => {
        const card = document.createElement('div');
        card.className = 'mode-card';
        card.onclick = () => alert(`Szybki start: ${m.modeName} (${m.gameName})`);

        card.innerHTML = `
            <div class="mc-top">
                <div class="mc-icon" style="background:${m.color}40; color:${m.color};">
                    <i class="fas ${m.icon}"></i>
                </div>
                <div style="font-size:10px; color:#aaa; font-weight:700;">#${index + 1}</div>
            </div>
            <div class="mc-title">${m.modeName}</div>
            <div class="mc-sub" style="margin-bottom:2px; font-size:9px; opacity:0.7;">${m.gameName}</div>
            <div class="mc-players"><i class="fas fa-user"></i> ${m.players.toLocaleString()}</div>
             <div class="mc-overlay-play">
                <div class="play-btn-round"><i class="fas fa-play"></i></div>
            </div>
        `;
        grid.appendChild(card);
    });
}


function renderDashInventory() {
    const container = document.getElementById('dashInventoryList');
    if(!container) return;
    container.innerHTML = '';
    
    
    sortTreasures(allTreasures);
    const dashItems = allTreasures.slice(0, 4);
    
    dashItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
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
    
    
    setInterval(nextSlide, 5000);
    
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });
}


initDashboardExtras();



function openGameDetailsModal(game) {
    const modal = document.getElementById('gameDetailsModal');
    if(!modal) return;

    
    document.getElementById('gmIcon').className = `fas ${game.icon}`;
    document.getElementById('gmIcon').style.color = game.color;
    document.getElementById('gmIconBox').style.borderColor = game.color;
    document.getElementById('gmIconBox').style.background = `linear-gradient(135deg, ${game.color}20, rgba(0,0,0,0.4))`;
    
    document.getElementById('gmName').textContent = game.name;
    document.getElementById('gmDesc').textContent = game.desc;
    document.getElementById('gmOnline').textContent = game.onlineCount.toLocaleString();
    document.getElementById('gmVariants').textContent = game.modes.length;

    
    const loadoutSelect = document.getElementById('gmLoadoutSelect');
    loadoutSelect.innerHTML = '';
    const loadouts = ["Poker Face Outfit", "High Roller Suit", "Lucky Casual", "Friday Night Degen"];
    loadouts.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        loadoutSelect.appendChild(opt);
    });

    
    const grid = document.getElementById('gmModesGrid');
    grid.innerHTML = '';

    
    // Używamy zapisanych danych, aby liczby były spójne z Dashboardem
    const playersDistribution = game.modeCounts || distributePlayers(game.onlineCount, game.modes.length);

    game.modes.forEach((modeName, index) => {
        const modeId = `${game.id}_${index}`;
        const playerCount = playersDistribution[index];
        const isFav = favoriteModes.includes(modeId);

        // FIX: Ucieczka znaku apostrofu dla nazw typu "Hold'em"
        const safeModeName = modeName.replace(/'/g, "\\'");

        const card = document.createElement('div');
        card.className = 'mode-card';
        
        
        card.onclick = () => {
            alert(`Uruchamianie trybu: ${modeName} (${game.name})\nLoadout: ${loadoutSelect.value}`);
            closeGameModal();
        };

        const starClass = isFav ? 'fas fa-star mc-star active' : 'far fa-star mc-star';

        
        card.innerHTML = `
            <div class="mc-top">
                <div class="mc-icon" style="background:${game.color}40; color:${game.color};">
                    <i class="fas ${game.icon}"></i>
                </div>
                <i class="${starClass}" 
                   onclick="event.stopPropagation(); toggleFavoriteMode('${modeId}', '${game.id}', '${safeModeName}', '${game.icon}', '${game.color}', ${playerCount}, this)">
                </i>
            </div>
            
            <div class="mc-title">${modeName}</div>
            <div class="mc-players"><i class="fas fa-user"></i> ${playerCount.toLocaleString()}</div>
            
            <div class="mc-overlay-play">
                <div class="play-btn-round"><i class="fas fa-play"></i></div>
            </div>
        `;
        grid.appendChild(card);
    });

    modal.classList.add('active');
}

function closeGameModal() {
    document.getElementById('gameDetailsModal').classList.remove('active');
}

function toggleFavoriteMode(modeId, gameId, modeName, icon, color, players, starElement) {
    const idx = favoriteModes.indexOf(modeId);
    
    if (idx === -1) {
        favoriteModes.push(modeId);
        starElement.className = 'fas fa-star mc-star active';
    } else {
        favoriteModes.splice(idx, 1);
        starElement.className = 'far fa-star mc-star';
    }
    renderFavoritesPanel();
}

function openLoadoutEffectsModal() {
    const modal = document.getElementById('loadoutEffectsModal');
    const container = document.getElementById('loadoutEffectsContent');
    if(!modal || !container) return;

    container.innerHTML = '';
    
    const equippedUids = Object.values(myLoadout);
    
    if(equippedUids.length === 0) {
        container.innerHTML = '<div class="le-empty">Brak założonych przedmiotów.</div>';
    } else {
        equippedUids.forEach(uid => {
            const item = myInventory.find(i => i.uid === uid);
            if(item) {
                const row = document.createElement('div');
                row.className = 'le-row';
                
                let bonusText = item.bonus;
                
                
                if (item.isConsumable && item.maxUses) {
                    bonusText += ` <span style="color:#666; font-size:10px;">(Stan: ${item.usesLeft}/${item.maxUses})</span>`;
                }

                row.innerHTML = `
                    <div class="le-icon">${item.icon}</div>
                    <div class="le-info">
                        <h5 style="color:${item.color}">${item.name}</h5>
                        <p>${bonusText}</p>
                    </div>
                `;
                container.appendChild(row);
            }
        });
    }

    modal.classList.add('active');
}

function closeLoadoutEffectsModal() {
    document.getElementById('loadoutEffectsModal').classList.remove('active');
}
const dailyHistoryDB = [
    { date: "Wczoraj", val: "-1,200 $", type: "loss" },
    { date: "26 Dec", val: "+5,400 $", type: "profit" },
    { date: "25 Dec", val: "+12,050 $", type: "profit" },
    { date: "24 Dec", val: "-3,200 $", type: "loss" },
    { date: "23 Dec", val: "+800 $", type: "profit" },
    { date: "22 Dec", val: "-50 $", type: "loss" },
    { date: "21 Dec", val: "+2,100 $", type: "profit" },
];

function openDailyPLModal() {
    const modal = document.getElementById('dailyPLModal');
    const container = document.getElementById('dailyPLContent');
    if(!modal || !container) return;

    container.innerHTML = '';

    dailyHistoryDB.forEach(day => {
        const div = document.createElement('div');
        div.className = 'pl-row';
        
        const color = day.type === 'profit' ? 'var(--accent-green)' : 'var(--accent-red)';
        
        div.innerHTML = `
            <div class="pl-date">${day.date}</div>
            <div class="pl-val" style="color: ${color};">${day.val}</div>
        `;
        container.appendChild(div);
    });

    modal.classList.add('active');
}

function closeDailyPLModal() {
    document.getElementById('dailyPLModal').classList.remove('active');
}

function renderFavoritesPanel() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (favoriteModes.length === 0) {
        grid.innerHTML = `
            <div class="fav-placeholder">
                <i class="far fa-star"></i>
                <span>Dodaj gry do ulubionych, aby mieć do nich szybki dostęp.</span>
            </div>`;
        return;
    }

    
    
    favoriteModes.forEach(favId => {
        const lastUnderscore = favId.lastIndexOf('_');
        const gId = favId.substring(0, lastUnderscore);
        const mIdx = parseInt(favId.substring(lastUnderscore + 1));

        let foundGame = null;
        
        
        gamesHubStructure.forEach(cat => {
            if (cat.games) {
                const g = cat.games.find(x => x.id === gId);
                if (g) foundGame = g;
            }
        });

        if (foundGame) {
            const modeName = foundGame.modes[mIdx];
            
            // Pobieramy dokładną liczbę z persystencji, zamiast średniej
            const displayPlayers = foundGame.modeCounts ? foundGame.modeCounts[mIdx] : 0;

            const card = document.createElement('div');
            card.className = 'mode-card';
            card.onclick = (e) => {
                if(e.target.classList.contains('mc-star')) return;
                alert(`Szybki start: ${modeName}`);
            };

            card.innerHTML = `
                <div class="mc-top">
                    <div class="mc-icon" style="background:${foundGame.color}40; color:${foundGame.color};">
                        <i class="fas ${foundGame.icon}"></i>
                    </div>
                    <i class="fas fa-star mc-star active" onclick="toggleFavoriteMode('${favId}', null, null, null, null, 0, this)"></i>
                </div>
                <div class="mc-title">${modeName}</div>
                <div class="mc-players"><i class="fas fa-user"></i> ${displayPlayers}</div>
                 <div class="mc-overlay-play">
                    <div class="play-btn-round"><i class="fas fa-play"></i></div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}
