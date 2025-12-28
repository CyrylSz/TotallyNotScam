
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



function openMarketItemModal(item) {
    const modal = document.getElementById('marketModal');
    if(!modal) return;
    
    
    document.getElementById('mmIcon').innerHTML = item.icon;
    document.getElementById('mmIcon').className = ''; 
    document.getElementById('mmCard').style.color = item.color;
    
    
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
    initMarketData();      
    
    
    renderDashInventory(); 
    renderTreasures();    
    renderGames(); 
    renderTrophies();
    updateStats();
    renderLadder();
    
    
    renderInventoryView();
}


function initInventorySystem() {
    const player = playersDB.find(p => p.username === "MrGambler");
    if (!player) return;

    myInventory = [];
    player.inventory.forEach((itemId, index) => {
        const template = allTreasures.find(t => t.id === itemId);
        if (template) {
            
            const item = { ...template, uid: `item_${itemId}_${index}` };
            
            
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

    
    const browseProfilesBtn = document.getElementById('browseProfilesBtn');
    if (browseProfilesBtn) {
        browseProfilesBtn.style.display = viewName === 'profile' ? 'inline-block' : 'none';
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

        
        if (item.rarity === 'Divine' && currentRankId > 2) {
            badgeHtml += `<div class="inv-lock-overlay"><i class="fas fa-lock"></i></div>`;
            slot.classList.add('is-rank-locked');
        }

        slot.innerHTML = `
            <div class="inv-item-icon" style="font-style: normal; color: initial;">${item.icon}</div>
            <div class="inv-item-name" style="color: ${item.color};">${item.name}</div>
            ${badgeHtml}
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

function renderAdminHeatmap() {
    const grid = document.getElementById('adminHeatmapGrid');
    if(!grid || grid.children.length > 0) return;

    // 53 kolumny (tygodnie) x 7 wierszy (dni)
    const totalCells = 53 * 7;
    
    for(let i = 0; i < totalCells; i++) {
        const div = document.createElement('div');
        const rand = Math.random();
        let level = 'l0';
        
        // Symulacja rozkładu aktywności
        if (rand > 0.75) level = 'l1';
        if (rand > 0.88) level = 'l2';
        if (rand > 0.95) level = 'l3';
        if (rand > 0.98) level = 'l4';

        div.className = `gh-cell ${level}`;
        div.title = `Aktywność: ${level.toUpperCase()}`;
        grid.appendChild(div);
    }
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

    // Dodanie statycznych ważnych graczy
    adminUsersDB.push({ id: 1, name: "Admin", rank: "King of The Gamblers", balance: 999999999, lastActive: "Now", status: "Online" });
    adminUsersDB.push({ id: 994, name: "Whale_Killer", rank: "RNG God", balance: 12500000, lastActive: "2 min temu", status: "Online" });
    adminUsersDB.push({ id: 552, name: "Janusz_Hazardu", rank: "Bankrupt", balance: 0, lastActive: "5 dni temu", status: "Banned" });

    // Generowanie 150 randomów
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

    // Filtrowanie
    let filtered = adminUsersDB.filter(u => {
        if(filterStatus !== 'all' && u.status !== filterStatus) return false;
        if(searchVal && !u.name.toLowerCase().includes(searchVal) && !u.id.toString().includes(searchVal)) return false;
        return true;
    });

    // Paginacja
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

        div.innerHTML = `
            <div style="font-family:monospace; color:#666;">#${u.id}</div>
            <div style="font-weight:600; color:white;">${u.name}</div>
            <div style="color:${rankColor};">${u.rank}</div>
            <div style="font-family:monospace; color:${u.balance > 100000 ? 'var(--accent-green)' : '#ddd'};">${u.balance.toLocaleString()} $</div>
            <div style="color:#888;">${u.lastActive}</div>
            <div><span class="ul-badge ${badgeClass}">${u.status}</span></div>
            <div class="ul-actions">
                <button class="ul-btn" title="Edytuj"><i class="fas fa-edit"></i></button>
                <button class="ul-btn danger" title="Zbanuj" onclick="alert('Zbanowano użytkownika ${u.name}')"><i class="fas fa-ban"></i></button>
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

    // Generowanie 200 logów
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



function renderGlobalLeaderboard() {
    const list = document.getElementById('globalLeaderboardList');
    if(!list) return;
    list.innerHTML = '';

    const sortedPlayers = [...globalLeaderboardDB].sort((a, b) => b.netWorth - a.netWorth);

    sortedPlayers.forEach((p, index) => {
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
                    ${p.rankName}
                </div>
            </div>
            <div class="lb-stats" style="justify-content:center;">
                <div class="lb-nw" style="font-size:12px; color:var(--accent-green); font-weight:700;">${nwDisplay}</div>
            </div>
        `;
        list.appendChild(div);
    });
}


function scrollToMyPosition() {
    const myRow = document.getElementById('lb-my-row');
    const container = document.getElementById('globalLeaderboardList');
    
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

    // Pobieramy oferty gracza (MrGambler)
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
        
        // Kliknięcie otwiera ten sam modal co na Rynku
        el.onclick = () => openMarketItemModal(item);

        const priceDisplay = (item.listingType === 'auction' ? (item.currentBid || item.price) : item.price).toLocaleString();
        
        // Status: Instant lub Licytacja (z czasem)
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
        
        // Dodajemy hover effect w JS inline dla prostoty
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

    // Spłaszczanie struktury i przypisywanie graczy
    gamesHubStructure.forEach(category => {
        if(category.games) {
            category.games.forEach(game => {
                const distrib = distributePlayers(game.onlineCount, game.modes.length);
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

    // Sortowanie malejąco po liczbie graczy
    allModes.sort((a, b) => b.players - a.players);

    // Pobranie TOP 6
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

    
    const playersDistribution = distributePlayers(game.onlineCount, game.modes.length);

    game.modes.forEach((modeName, index) => {
        const modeId = `${game.id}_${index}`;
        const playerCount = playersDistribution[index];
        const isFav = favoriteModes.includes(modeId);

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
                   onclick="event.stopPropagation(); toggleFavoriteMode('${modeId}', '${game.id}', '${modeName}', '${game.icon}', '${game.color}', ${playerCount}, this)">
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
        const [gameId, modeIndexStr] = favId.split('_g_'); 
        
        const lastUnderscore = favId.lastIndexOf('_');
        const gId = favId.substring(0, lastUnderscore);
        const mIdx = parseInt(favId.substring(lastUnderscore + 1));

        
        let foundGame = null;
        gamesHubStructure.forEach(cat => {
            cat.subcategories.forEach(sub => {
                const g = sub.games.find(x => x.id === gId);
                if(g) foundGame = g;
            });
        });

        if (foundGame) {
            const modeName = foundGame.modes[mIdx];
            
            
            const displayPlayers = Math.floor(foundGame.onlineCount / foundGame.modes.length); 

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
                <div class="mc-players"><i class="fas fa-user"></i> ~${displayPlayers}</div>
                 <div class="mc-overlay-play">
                    <div class="play-btn-round"><i class="fas fa-play"></i></div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}
