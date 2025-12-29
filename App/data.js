

const gamesHubStructure = [
    {
        id: 'casino',
        label: 'Kasyno',
        icon: 'fa-gem',
        desc: 'Elegancja, strategia, ryzyko.',
        color: '#10b981',
        games: [
            { 
                id: 'g_poker', name: 'Poker', variants: 4, onlineCount: 4520, players: '2–10', icon: 'fa-heart', color: '#10b981', tag: 'Card Game',
                desc: 'Blefuj, licytuj i czytaj rywali. Król gier karcianych.',
                modes: ['No Limit Hold\'em', 'Pot Limit Omaha', 'Cash Games', 'Turnieje SIT&GO']
            },
            { 
                id: 'g_blackjack', name: 'Blackjack', variants: 5, onlineCount: 3105, players: '1–7', icon: 'fa-layer-group', color: '#4f46e5', tag: 'Card Game',
                desc: 'Wyścig do 21. Matematyka przeciwko krupierowi.',
                modes: ['Classic', 'European', 'Single Deck', 'Switch', 'Pontoon']
            },
            { 
                id: 'g_baccarat', name: 'Baccarat', variants: 4, onlineCount: 1240, players: '1–14', icon: 'fa-dragon', color: '#e11d48', tag: 'Card Game',
                desc: 'Gracz czy Bankier? Czysta intuicja w królewskim stylu.',
                modes: ['Punto Banco', 'Speed Baccarat', 'No Commission', 'Dragon Tiger']
            },
            { 
                id: 'g_casino_poker', name: 'Casino Poker', variants: 4, onlineCount: 890, players: '1–5', icon: 'fa-crown', color: '#7c3aed', tag: 'Card Game',
                desc: 'Pokerowe układy w pojedynku 1 na 1 z kasynem.',
                modes: ['Caribbean Stud', 'Three Card Poker', 'Casino Hold\'em', 'Ultimate Texas Hold\'em']
            },
            { 
                id: 'g_roulette', name: 'Ruletka', variants: 5, onlineCount: 5600, players: '2+', icon: 'fa-circle-notch', color: '#f59e0b', tag: 'Table Game',
                desc: 'Obstaw liczbę i zaufaj fizyce. Symbol hazardu.',
                modes: ['European', 'American', 'French', 'Lightning', 'Immersive']
            },
            { 
                id: 'g_dice', name: 'Kości', variants: 3, onlineCount: 950, players: '1+', icon: 'fa-dice', color: '#06b6d4', tag: 'Table Game',
                desc: 'Rzuć kośćmi. Emocje tłumu i złożone zakłady.',
                modes: ['Craps', 'Sic Bo', 'Lightning Dice']
            }
        ]
    },
    {
        id: 'arcade',
        label: 'Arcade',
        icon: 'fa-gamepad',
        desc: 'Refleks, algorytm, dopamina.',
        color: '#d946ef',
        games: [
            { 
                id: 'g_slots', name: 'Automaty', variants: 6, onlineCount: 12400, players: '1', icon: 'fa-star', color: '#d946ef', tag: 'Slots',
                desc: 'Pociągnij wajchę. Jackpoty, Megaways i czysty los.',
                modes: ['Classic 3-Reel', 'Video Slots', 'Megaways', 'Jackpot Progressive', 'Bonus Buy', 'Cluster Pays']
            },
            { 
                id: 'g_slotwars', name: 'Slot Wars', variants: 2, onlineCount: 320, players: '2+', icon: 'fa-trophy', color: '#f97316', tag: 'Slots',
                desc: 'Turniej spinów. Kto wykręci więcej w 5 minut?',
                modes: ['Slot Tournaments', 'Reel Races']
            },
            { 
                id: 'g_crash', name: 'Crash', variants: 5, onlineCount: 8500, players: '1+', icon: 'fa-chart-line', color: '#ef4444', tag: 'Fast Paced',
                desc: 'Chciwość vs strach. Wypłać zanim rakieta wybuchnie.',
                modes: ['Aviator', 'JetX', 'Spaceman', 'Zeppelin', 'Cash or Crash']
            },
            { 
                id: 'g_plinko', name: 'Plinko', variants: 2, onlineCount: 4100, players: '1', icon: 'fa-bowling-ball', color: '#38bdf8', tag: 'Fast Paced',
                desc: 'Grawitacja decyduje. Kulka spada prosto do mnożnika.',
                modes: ['BGaming Plinko', 'Spribe Plinko']
            },
            { 
                id: 'g_mines', name: 'Mines', variants: 2, onlineCount: 2200, players: '1', icon: 'fa-bomb', color: '#8b5cf6', tag: 'Fast Paced',
                desc: 'Saper na sterydach. Każdy krok to zysk lub koniec.',
                modes: ['Minesweeper', 'Turbo Mines']
            },
            { 
                id: 'g_hilo', name: 'Hi-Lo', variants: 1, onlineCount: 1800, players: '1', icon: 'fa-arrows-alt-v', color: '#22c55e', tag: 'Fast Paced',
                desc: 'Wyższa czy niższa? Prosta matematyka kart.',
                modes: ['Higher vs Lower']
            }
        ]
    },
    {
        id: 'originals',
        label: 'Oryginały',
        icon: 'fa-fingerprint',
        desc: 'Ekskluzywne gry PvP & Skill.',
        color: '#f59e0b',
        games: [
            { 
                id: 'g_chess', name: 'Gambling Chess', variants: 1, onlineCount: 140, players: '2', icon: 'fa-chess', color: '#94a3b8', tag: 'Exclusive',
                desc: 'Szachy, ale możesz licytować każdy ruch i obstawiać życie pionków.',
                modes: ['Gambling Chess']
            },
            { 
                id: 'g_war', name: 'Age of Gambling', variants: 1, onlineCount: 85, players: '2', icon: 'fa-shield-alt', color: '#b91c1c', tag: 'Exclusive', 
                desc: 'Age of War, ale na pieniądze i z chaotycznymi katastrofami.',
                modes: ['Age of Gambling']
            },
            { 
                id: 'g_mystery', name: 'Gambling Mystery', variants: 1, onlineCount: 210, players: '4-15', icon: 'fa-user-secret', color: '#6d28d9', tag: 'Exclusive', 
                desc: 'Murder Mystery, ale na pieniądze. Kłam, manipuluj, zgarnij pulę.',
                modes: ['Gambling Mystery']
            },
            { 
                id: 'g_worms', name: 'Degenerate Worms', variants: 1, onlineCount: 450, players: '2-8', icon: 'fa-skull-crossbones', color: '#84cc16', tag: 'Exclusive', 
                desc: 'Worms 2D, ale na pieniadze. Można się ratować portfelem, lecz zmniejsza to twoją pulę.',
                modes: ['Degenerate Worms']
            },
            { 
                id: 'g_logic', name: 'Logic Race Bet', variants: 1, onlineCount: 60, players: '2+', icon: 'fa-puzzle-piece', color: '#3b82f6', tag: 'Exclusive', 
                desc: 'Wyścig mózgów. Kto pierwszy rozwiąże zagadkę zgarnia pulę.',
                modes: ['Logic Race Bet']
            },
            { 
                id: 'g_aim', name: 'Aim Duel Bet', variants: 1, onlineCount: 320, players: '2', icon: 'fa-crosshairs', color: '#f43f5e', tag: 'Exclusive', 
                desc: 'Czysty refleks. Kto trafi jak największą ilość tarcz zgarnia pulę.',
                modes: ['Aim Duel Bet']
            }
        ]
    }
];




let allTreasures = [
    
    { id: 1, name: "Peasant Case", type: "chest", price: "500 $", rawPrice: 500, color: "#9ca3af", icon: "💼", rarity: "Peasant", desc: "Stara, skórzana teczka.", bonus: "Może zawierać kanapki.", isConsumable: true, maxUses: 1 },
    { id: 2, name: "Rare Case", type: "chest", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "💼", rarity: "Rare", desc: "Walizka z szyfrem.", bonus: "Gwarantowany gadżet.", isConsumable: true, maxUses: 1 },
    { id: 3, name: "Epic Case", type: "chest", price: "25,000 $", rawPrice: 25000, color: "#8b5cf6", icon: "💼", rarity: "Epic", desc: "Wzmocniona tytanem.", bonus: "Pachnie drogimi perfumami.", isConsumable: true, maxUses: 1 },
    { id: 4, name: "Relic Case", type: "chest", price: "100,000 $", rawPrice: 100000, color: "#ef4444", icon: "💼", rarity: "Relic", desc: "Używana przez mafię.", bonus: "Ryzykowna zawartość.", isConsumable: true, maxUses: 1 },
    { id: 5, name: "Divine Case", type: "chest", price: "1,000,000 $", rawPrice: 1000000, color: "#ffd700", icon: "💼", rarity: "Divine", desc: "Wykonana ze złota i diamentów.", bonus: "Tylko dla 1%.", isConsumable: true, maxUses: 1 },

    
    
    
    { id: 6, name: "Czapka z daszkiem", type: "head", price: "50 $", rawPrice: 50, color: "#9ca3af", icon: "🧢", rarity: "Peasant", desc: "Z logo stacji benzynowej.", bonus: "-5 do Stylu", isConsumable: false, maxUses: null },
    { id: 7, name: "RayBan Aviator", type: "head", price: "1,500 $", rawPrice: 1500, color: "#3b82f6", icon: "🕶️", rarity: "Rare", desc: "Ukrywają poker face.", bonus: "+10 do Blefowania", isConsumable: false, maxUses: null },
    { id: 8, name: "Gogle VR Pro", type: "head", price: "15,000 $", rawPrice: 15000, color: "#ef4444", icon: "🥽", rarity: "Relic", desc: "Widzisz algorytm kasyna.", bonus: "Przewidywanie Wygranej", isConsumable: false, maxUses: null },

    
    { id: 9, name: "Krawat z Poliestru", type: "neck", price: "20 $", rawPrice: 20, color: "#9ca3af", icon: "👔", rarity: "Peasant", desc: "Drapie w szyję.", bonus: "Brak", isConsumable: false, maxUses: null },
    { id: 10, name: "Złoty Łańcuch", type: "neck", price: "25,000 $", rawPrice: 25000, color: "#8b5cf6", icon: "⛓️", rarity: "Epic", desc: "Waży 2kg.", bonus: "+20 do Respectu", isConsumable: false, maxUses: null },
    
    
    { id: 11, name: "Koszula Hawajska", type: "suit", price: "80 $", rawPrice: 80, color: "#9ca3af", icon: "👕", rarity: "Peasant", desc: "Idealna na wakacje, nie do kasyna.", bonus: "Luz +100", isConsumable: false, maxUses: null },
    { id: 12, name: "Garnitur Hugo Boss", type: "suit", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "🤵", rarity: "Rare", desc: "Klasyczna elegancja.", bonus: "+5 do Negocjacji", isConsumable: false, maxUses: null },
    { id: 13, name: "Smoking Bonda", type: "suit", price: "500,000 $", rawPrice: 500000, color: "#ffd700", icon: "🍸", rarity: "Divine", desc: "Wstrząśnięty, nie zmieszany.", bonus: "Kuloodporność finansowa", isConsumable: false, maxUses: null },

    
    { id: 14, name: "Zegarek z Komunii", type: "watch", price: "100 $", rawPrice: 100, color: "#9ca3af", icon: "⌚", rarity: "Peasant", desc: "Pamiątka rodzinna.", bonus: "Pokazuje czas", isConsumable: false, maxUses: null },
    { id: 15, name: "Rolex Submariner", type: "watch", price: "40,000 $", rawPrice: 40000, color: "#8b5cf6", icon: "⌚", rarity: "Epic", desc: "Znasz jego wartość.", bonus: "+15 do Prestiżu", isConsumable: false, maxUses: null },
    { id: 16, name: "Patek Philippe", type: "watch", price: "2,500,000 $", rawPrice: 2500000, color: "#ffd700", icon: "🕰️", rarity: "Divine", desc: "Nie ty go masz, ty go przechowujesz dla pokoleń.", bonus: "Zatrzymuje czas (długów)", isConsumable: false, maxUses: null },

    
    { id: 17, name: "Sznurek", type: "belt", price: "5 $", rawPrice: 5, color: "#9ca3af", icon: "🧶", rarity: "Peasant", desc: "Trzyma spodnie.", bonus: "Brak", isConsumable: false, maxUses: null },
    { id: 18, name: "Pasek Gucci", type: "belt", price: "800 $", rawPrice: 800, color: "#3b82f6", icon: "🐍", rarity: "Rare", desc: "Wielka klamra.", bonus: "+2 do Lansu", isConsumable: false, maxUses: null },

    
    { id: 19, name: "Dżinsy z Dziurami", type: "pants", price: "150 $", rawPrice: 150, color: "#9ca3af", icon: "👖", rarity: "Peasant", desc: "Modne, ale czy w kasynie?", bonus: "Wentylacja", isConsumable: false, maxUses: null },
    { id: 20, name: "Spodnie od Garnituru", type: "pants", price: "2,000 $", rawPrice: 2000, color: "#3b82f6", icon: "👖", rarity: "Rare", desc: "Dopasowane.", bonus: "Wygoda +5", isConsumable: false, maxUses: null },

    
    { id: 21, name: "Klapki Basenowe", type: "shoes", price: "20 $", rawPrice: 20, color: "#9ca3af", icon: "🩴", rarity: "Peasant", desc: "Szur szur.", bonus: "-50 do Poważania", isConsumable: false, maxUses: null },
    { id: 22, name: "Mokasyny", type: "shoes", price: "3,000 $", rawPrice: 3000, color: "#8b5cf6", icon: "👞", rarity: "Epic", desc: "Włoska skóra.", bonus: "Cichy chód", isConsumable: false, maxUses: null },

    
    { id: 23, name: "Sygnet Rodowy", type: "ring", price: "15,000 $", rawPrice: 15000, color: "#8b5cf6", icon: "🧿", rarity: "Epic", desc: "Z herbem nieistniejącego rodu.", bonus: "+10 do Blefu", isConsumable: false, maxUses: null },
    { id: 24, name: "Obrączka", type: "ring", price: "500 $", rawPrice: 500, color: "#9ca3af", icon: "💍", rarity: "Peasant", desc: "Z grawerem.", bonus: "Wierność", isConsumable: false, maxUses: null },

    
    { id: 25, name: "Bilet Autobusowy", type: "vehicle", price: "2 $", rawPrice: 2, color: "#9ca3af", icon: "🚌", rarity: "Peasant", desc: "Ważny 20 minut.", bonus: "Transport publiczny", isConsumable: true, maxUses: 1 },
    { id: 26, name: "Kluczyki BMW", type: "vehicle", price: "50,000 $", rawPrice: 50000, color: "#3b82f6", icon: "🔑", rarity: "Rare", desc: "M3 w leasingu.", bonus: "Szybki dojazd", isConsumable: false, maxUses: null },
    { id: 27, name: "Karta do Bugatti", type: "vehicle", price: "2,000,000 $", rawPrice: 2000000, color: "#ffd700", icon: "🏎️", rarity: "Divine", desc: "Top G.", bonus: "Prędkość światła", isConsumable: false, maxUses: null },

    
    { id: 28, name: "Nokia 3310", type: "gadget", price: "50 $", rawPrice: 50, color: "#9ca3af", icon: "🧱", rarity: "Peasant", desc: "Niezniszczalna.", bonus: "Samoobrona", isConsumable: false, maxUses: null },
    { id: 29, name: "iPhone 16 Pro Max", type: "gadget", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "📱", rarity: "Rare", desc: "Więcej aparatów niż sensu.", bonus: "+5 do Selfie", isConsumable: false, maxUses: null },
    { id: 30, name: "Szyfrowany Telefon", type: "gadget", price: "100,000 $", rawPrice: 100000, color: "#ef4444", icon: "📡", rarity: "Relic", desc: "Nikt nie podsłucha.", bonus: "Anonimowość", isConsumable: false, maxUses: null },
    { id: 31, name: "Czarne American Express", type: "gadget", price: "1,000,000 $", rawPrice: 1000000, color: "#ffd700", icon: "💳", rarity: "Divine", desc: "Bez limitu.", bonus: "Nieskończony debet", isConsumable: false, maxUses: null },
    
    
    { id: 32, name: "Cygaro Kubańskie", type: "gadget", price: "500 $", rawPrice: 500, color: "#3b82f6", icon: "🚬", rarity: "Rare", desc: "Kopci jak smok.", bonus: "Relaks", isConsumable: true, maxUses: 5 },
    { id: 33, name: "Szklanka Whisky", type: "gadget", price: "100 $", rawPrice: 100, color: "#9ca3af", icon: "🥃", rarity: "Peasant", desc: "Z lodem.", bonus: "Odwaga +5", isConsumable: true, maxUses: 3 }
];


const titlesDB = [
    // Ranks as Titles
    { id: "t_r1", text: "King of The Gamblers", rarity: "Divine" },
    { id: "t_r2", text: "RNG God", rarity: "Divine" },
    { id: "t_r3", text: "Alpha Whale", rarity: "Relic" },
    { id: "t_r4", text: "Casino Legend", rarity: "Relic" },
    { id: "t_r5", text: "Table Shark", rarity: "Epic" },
    { id: "t_r6", text: "Risk Taker", rarity: "Rare" },
    { id: "t_r7", text: "Small Fry", rarity: "Peasant" },
    { id: "t_r8", text: "Bankrupt", rarity: "Peasant" },
    
    // Achievement Titles
    { id: "t_a1", text: "The Novice", rarity: "Peasant" },
    { id: "t_a5", text: "Blackjack Master", rarity: "Rare" },
    { id: "t_a7", text: "Wolf of Wall St", rarity: "Epic" },
    { id: "t_a10", text: "Sniper", rarity: "Epic" },
    { id: "t_a15", text: "The Collector", rarity: "Relic" },
    { id: "t_a18", text: "Millionaire", rarity: "Divine" },
    { id: "t_a22", text: "Legendary Finder", rarity: "Divine" },
    { id: "t_a25", text: "Glitch Hunter", rarity: "Divine" }
];
const playersDB = [
    {
        username: "MrGambler",
        rank: "Alpha Whale",
        activeTitle: "The Collector",
        pfp: "https://images.steamusercontent.com/ugc/1844796405260207307/7F82106D323071BE2E1E016868F95F494EE2C56E/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false", 
        inventory: [
            
            { id: 7 }, { id: 10 }, { id: 12 }, { id: 15 }, { id: 18 }, 
            { id: 20 }, { id: 22 }, { id: 23 }, { id: 26 }, { id: 31 },
            
            { id: 5 }, 
            { id: 16 }, 
            { id: 28 }, { id: 9 }, { id: 33, usesLeft: 1 }, { id: 21 }, 
            { id: 1 }, { id: 1 }, { id: 2 } 
        ]
    },
    {
        username: "Whale_Killer",
        rank: "RNG God",
        pfp: "https://i.pravatar.cc/150?u=Whale_Killer",
        inventory: [{id: 27}, {id: 31}, {id: 13}, {id: 16}, {id: 5}, {id: 5}, {id: 4}] 
    },
    {
        username: "LuckyLuke",
        rank: "Table Shark",
        pfp: "https://i.pravatar.cc/150?u=LuckyLuke",
        inventory: [{id: 7}, {id: 11}, {id: 21}, {id: 2}, {id: 3}, {id: 33, usesLeft: 1}] 
    },
    {
        username: "CryptoBro",
        rank: "Risk Taker",
        pfp: "https://i.pravatar.cc/150?u=CryptoBro",
        inventory: [{id: 30}, {id: 8}, {id: 26}, {id: 2}, {id: 32, usesLeft: 3}] 
    },
    {
        username: "Bot_Network_01",
        rank: "Small Fry",
        pfp: "https://i.pravatar.cc/150?u=Bot_Network_01",
        inventory: [{id: 1}, {id: 1}, {id: 1}, {id: 1}, {id: 1}, {id: 1}, {id: 1}, {id: 1}, {id: 25}, {id: 25}] 
    }
];


const staticGamesList = [
    // Page 1 (Current Session)
    { name: "Classic", money: "+2,450 $", lp: "+12 LP", type: "win", icon: "fa-layer-group", time: "2 min temu" },
    { name: "Aviator", money: "-5,000 $", lp: "-15 LP", type: "lose", icon: "fa-chart-line", time: "5 min temu" },
    { name: "Degenerate Worms", money: "+12,000 $", lp: "+18 LP", type: "win", icon: "fa-skull-crossbones", time: "12 min temu" },
    { name: "No Limit Hold'em", money: "+8,200 $", lp: "+14 LP", type: "win", icon: "fa-heart", time: "15 min temu" },
    { name: "European", money: "0 $", lp: "+1 LP", type: "draw", icon: "fa-circle-notch", time: "18 min temu" },
    { name: "Megaways", money: "-250 $", lp: "-2 LP", type: "lose", icon: "fa-star", time: "22 min temu" },
    { name: "Spribe Plinko", money: "+1,500 $", lp: "+5 LP", type: "win", icon: "fa-bowling-ball", time: "30 min temu" },
    { name: "Speed Baccarat", money: "-8,000 $", lp: "-19 LP", type: "lose", icon: "fa-dragon", time: "45 min temu" },
    { name: "Gambling Chess", money: "+3,000 $", lp: "+10 LP", type: "win", icon: "fa-chess", time: "1h temu" },
    { name: "Turbo Mines", money: "+4,200 $", lp: "+11 LP", type: "win", icon: "fa-bomb", time: "1h 10m temu" },
    
    // Page 1 (Cont.)
    { name: "Slot Tournaments", money: "-1,200 $", lp: "-8 LP", type: "lose", icon: "fa-trophy", time: "1h 20m temu" },
    { name: "Age of Gambling", money: "+15,000 $", lp: "+20 LP", type: "win", icon: "fa-shield-alt", time: "1h 30m temu" },
    { name: "Craps", money: "0 $", lp: "+1 LP", type: "draw", icon: "fa-dice", time: "1h 45m temu" },
    { name: "Aim Duel Bet", money: "-500 $", lp: "-4 LP", type: "lose", icon: "fa-crosshairs", time: "2h temu" },
    { name: "Higher vs Lower", money: "+200 $", lp: "+3 LP", type: "win", icon: "fa-arrows-alt-v", time: "2h 15m temu" },
    { name: "Switch", money: "+5,500 $", lp: "+13 LP", type: "win", icon: "fa-layer-group", time: "2h 30m temu" },
    { name: "Caribbean Stud", money: "0 $", lp: "+1 LP", type: "draw", icon: "fa-crown", time: "3h temu" },
    { name: "Gambling Mystery", money: "+8,000 $", lp: "+16 LP", type: "win", icon: "fa-user-secret", time: "3h 15m temu" },
    { name: "Jackpot Progressive", money: "-15,000 $", lp: "-20 LP", type: "lose", icon: "fa-star", time: "4h temu" },
    { name: "Zeppelin", money: "+2,100 $", lp: "+7 LP", type: "win", icon: "fa-rocket", time: "4h 30m temu" },

    // Page 2 (Older)
    { name: "Logic Race Bet", money: "-100 $", lp: "-2 LP", type: "lose", icon: "fa-puzzle-piece", time: "5h temu" },
    { name: "Lightning", money: "-2,000 $", lp: "-9 LP", type: "lose", icon: "fa-bolt", time: "5h 15m temu" },
    { name: "Pot Limit Omaha", money: "+14,500 $", lp: "+19 LP", type: "win", icon: "fa-heart", time: "6h temu" },
    { name: "Bonus Buy", money: "-5,000 $", lp: "-12 LP", type: "lose", icon: "fa-star", time: "7h temu" },
    { name: "Degenerate Worms", money: "+500 $", lp: "+2 LP", type: "win", icon: "fa-skull-crossbones", time: "8h temu" },
    { name: "Dragon Tiger", money: "0 $", lp: "+1 LP", type: "draw", icon: "fa-dragon", time: "9h temu" },
    { name: "Single Deck", money: "-3,000 $", lp: "-10 LP", type: "lose", icon: "fa-layer-group", time: "10h temu" },
    { name: "BGaming Plinko", money: "-50 $", lp: "-1 LP", type: "lose", icon: "fa-bowling-ball", time: "11h temu" },
    { name: "Spaceman", money: "+9,000 $", lp: "+15 LP", type: "win", icon: "fa-chart-line", time: "12h temu" },
    { name: "Gambling Chess", money: "-5,000 $", lp: "-14 LP", type: "lose", icon: "fa-chess", time: "13h temu" },
    
    // Page 3+ (Fillers)
    { name: "Cash Games", money: "+1,000 $", lp: "+4 LP", type: "win", icon: "fa-heart", time: "1d temu" },
    { name: "Pontoon", money: "-200 $", lp: "-2 LP", type: "lose", icon: "fa-layer-group", time: "1d temu" },
    { name: "American", money: "+5,000 $", lp: "+12 LP", type: "win", icon: "fa-circle-notch", time: "1d temu" },
    { name: "Minesweeper", money: "0 $", lp: "+1 LP", type: "draw", icon: "fa-bomb", time: "1d temu" },
    { name: "Video Slots", money: "-10,000 $", lp: "-18 LP", type: "lose", icon: "fa-star", time: "1d temu" },
    { name: "Punto Banco", money: "+2,500 $", lp: "+8 LP", type: "win", icon: "fa-dragon", time: "1d temu" },
    { name: "JetX", money: "-1,000 $", lp: "-5 LP", type: "lose", icon: "fa-rocket", time: "1d temu" },
    { name: "Turnieje SIT&GO", money: "+30,000 $", lp: "+20 LP", type: "win", icon: "fa-heart", time: "2d temu" },
    { name: "Degenerate Worms", money: "-500 $", lp: "-3 LP", type: "lose", icon: "fa-skull-crossbones", time: "2d temu" },
    { name: "Gambling Chess", money: "+500 $", lp: "+3 LP", type: "win", icon: "fa-chess", time: "2d temu" },
    { name: "Higher vs Lower", money: "0 $", lp: "0 LP", type: "draw", icon: "fa-arrows-alt-v", time: "2d temu" },
    { name: "BGaming Plinko", money: "-2,000 $", lp: "-8 LP", type: "lose", icon: "fa-bowling-ball", time: "2d temu" },
    { name: "Immersive", money: "+7,000 $", lp: "+15 LP", type: "win", icon: "fa-circle-notch", time: "2d temu" },
    { name: "Classic", money: "-4,000 $", lp: "-11 LP", type: "lose", icon: "fa-layer-group", time: "3d temu" },
    { name: "Cluster Pays", money: "+100,000 $", lp: "+20 LP", type: "win", icon: "fa-star", time: "3d temu" },
    { name: "No Limit Hold'em", money: "-15,000 $", lp: "-20 LP", type: "lose", icon: "fa-heart", time: "3d temu" },
    { name: "Cash or Crash", money: "+5,000 $", lp: "+12 LP", type: "win", icon: "fa-chart-line", time: "3d temu" },
    { name: "Turbo Mines", money: "-1,000 $", lp: "-6 LP", type: "lose", icon: "fa-bomb", time: "4d temu" },
    { name: "No Commission", money: "+3,000 $", lp: "+9 LP", type: "win", icon: "fa-dragon", time: "4d temu" },
    { name: "Degenerate Worms", money: "+2,000 $", lp: "+6 LP", type: "win", icon: "fa-skull-crossbones", time: "5d temu" }
];

let allGames = staticGamesList;


const achievementsDB = [
    { id: 1, title: "Nowicjusz", desc: "Postaw swój pierwszy zakład.", rarity: "92.5%", hidden: false, acquired: true, date: "10 Dec 2025", icon: "fa-user-tag", rewardClaimed: true },
    { id: 2, title: "AI Buddy", desc: "Napisz 'Cześć' do Asystenta AI.", rarity: "68.3%", hidden: false, acquired: true, date: "14 Dec 2025", icon: "fa-robot", rewardClaimed: false },
    { id: 3, title: "Pierwsza Krew", desc: "Przegraj swój pierwszy zakład.", rarity: "48.0%", hidden: false, acquired: true, date: "11 Dec 2025", icon: "fa-tint", rewardClaimed: true },
    { id: 4, title: "Bankructwo", desc: "Zejdź do salda 0 kredytów.", rarity: "42.1%", hidden: true, acquired: true, date: "18 Dec 2025", icon: "fa-piggy-bank", rewardClaimed: false },
    { id: 5, title: "Blackjack!", desc: "Traf naturalne 21 w Blackjacku.", rarity: "35.8%", hidden: false, acquired: true, date: "12 Dec 2025", icon: "fa-dice", rewardClaimed: true },
    { id: 6, title: "Awans Społeczny", desc: "Osiągnij rangę Gold Tier.", rarity: "25.4%", hidden: false, acquired: true, date: "14 Dec 2025", icon: "fa-medal", rewardClaimed: true },
    { id: 7, title: "Wilk z Wall Street", desc: "Sprzedaj przedmiot na Rynku z zyskiem.", rarity: "22.0%", hidden: false, acquired: true, date: "13 Dec 2025", icon: "fa-chart-line", rewardClaimed: false },
    { id: 8, title: "Seria Niefortunnych Zdarzeń", desc: "Przegraj 10 zakładów z rzędu.", rarity: "18.7%", hidden: false, acquired: false, icon: "fa-heart-broken", rewardClaimed: true },
    { id: 9, title: "Nocny Marek", desc: "Zagraj w grę między 3:00 a 5:00 rano.", rarity: "15.6%", hidden: false, acquired: false, icon: "fa-moon", rewardClaimed: true },
    { id: 10, title: "Snajper", desc: "Traf konkretną liczbę w Ruletce.", rarity: "12.4%", hidden: false, acquired: false, icon: "fa-crosshairs", rewardClaimed: true },
    { id: 11, title: "Slot Machine Master", desc: "Wykonaj 1000 spinów na automatach.", rarity: "11.5%", hidden: false, acquired: false, icon: "fa-sync-alt", rewardClaimed: true },
    { id: 12, title: "Odbicie od Dna", desc: "Wygraj zakład, mając mniej niż 100 kredytów.", rarity: "9.8%", hidden: false, acquired: true, date: "15 Dec 2025", icon: "fa-chart-area", rewardClaimed: true },
    { id: 13, title: "Lootbox Junkie", desc: "Otwórz 50 skrzynek z przedmiotami.", rarity: "8.9%", hidden: false, acquired: false, icon: "fa-box-open", rewardClaimed: true },
    { id: 14, title: "Wierny Gracz", desc: "Zaloguj się codziennie przez 30 dni.", rarity: "7.2%", hidden: false, acquired: false, icon: "fa-calendar-check", rewardClaimed: true },
    { id: 15, title: "Kolekcjoner", desc: "Posiadaj w ekwipunku po jednym przedmiocie każdej rzadkości.", rarity: "6.2%", hidden: false, acquired: false, icon: "fa-gem", rewardClaimed: true },
    { id: 16, title: "Diamentowe Ręce", desc: "Nie sprzedaj żadnego przedmiotu przez 30 dni.", rarity: "5.1%", hidden: false, acquired: false, icon: "fa-hand-holding", rewardClaimed: true },
    { id: 17, title: "High Roller", desc: "Postaw jednorazowo ponad 100,000 kredytów.", rarity: "4.2%", hidden: false, acquired: false, icon: "fa-money-bill-wave", rewardClaimed: true },
    { id: 18, title: "Klub Milionerów", desc: "Osiągnij Net Worth na poziomie 1,000,000 $.", rarity: "3.9%", hidden: false, acquired: true, date: "16 Dec 2025", icon: "fa-sack-dollar", rewardClaimed: true },
    { id: 19, title: "Maratończyk", desc: "Bądź zalogowany przez 24 godziny bez przerwy.", rarity: "3.4%", hidden: false, acquired: false, icon: "fa-running", rewardClaimed: true },
    { id: 20, title: "Turing Test", desc: "Wymień 50 wiadomości z AI w jednej sesji.", rarity: "2.5%", hidden: true, acquired: false, icon: "fa-comments", rewardClaimed: true },
    { id: 21, title: "Elita", desc: "Osiągnij rangę Diamond Tier.", rarity: "1.8%", hidden: false, acquired: true, date: "17 Dec 2025", icon: "fa-trophy", rewardClaimed: true },
    { id: 22, title: "Legenda", desc: "Wydrop przedmiot o rzadkości Legendary.", rarity: "1.1%", hidden: false, acquired: true, date: "13 Dec 2025", icon: "fa-crown", rewardClaimed: true },
    { id: 23, title: "Va Banque", desc: "Postaw całe posiadane saldo w jednym zakładzie i wygraj.", rarity: "0.8%", hidden: true, acquired: false, icon: "fa-coins", rewardClaimed: true },
    { id: 24, title: "Szczęśliwa Siódemka", desc: "Wygraj dokładnie 777 kredytów w jednym zakładzie.", rarity: "0.5%", hidden: true, acquired: false, icon: "fa-star", rewardClaimed: true },
    { id: 25, title: "Glitch w Matrixie", desc: "Kliknij 10 razy szybko w logo Totally Not Scam.", rarity: "0.01%", hidden: true, acquired: true, date: "19 Dec 2025", icon: "fa-bug", rewardClaimed: true }
];




const ranksDB = [
    { 
        id: 8, 
        name: "Bankrupt", 
        desc: "Dno jest po to, żeby się od niego odbić... prawda?", 
        req: "< -100 LP • Saldo < 0", 
        icon: "fa-dizzy", 
        color: "#777", 
        cardClass: "card-degenerate", 
        align: "center", 
        margin: "" 
    },
    { 
        id: 7, 
        name: "Small Fry", 
        desc: "Wkrótce dowiesz się, czy popłyniesz dalej, czy zostaniesz zjedzony.", 
        req: "-100 - 100 LP", 
        icon: "fa-fish", 
        color: "#fff", 
        cardClass: "card-smallfry", 
        align: "center", 
        margin: "margin-top: -10px;" 
    },
    { 
        id: 6, 
        name: "Risk Taker", 
        desc: "Stawiasz wszystko na jedną kartę.", 
        req: "100 - 300 LP • ≥ 4h w grach<br><span style='color:#3b82f6; font-size:9px;'>Noszenie RARE przedmiotów</span>", 
        icon: "fa-fire", 
        color: "#f59e0b", 
        cardClass: "", 
        align: "left", 
        margin: "" 
    },
    { 
        id: 5, 
        name: "Table Shark", 
        desc: "Może i matematyka nie jest po twojej stronie, ale czujesz krew.", 
        req: "300 - 600 LP • Win Rate ≥ 55%<br><span style='color:#8b5cf6; font-size:9px;'>Noszenie EPIC przedmiotów</span>", 
        icon: "fa-skull-crossbones", 
        color: "#ef4444", 
        cardClass: "", 
        align: "right", 
        margin: "" 
    },
    { 
        id: 4, 
        name: "Casino Legend", 
        desc: "Krupierzy szepczą twoje imię, gdy wchodzisz na salę.", 
        req: "600 - 1000 LP • Net Worth ≥ 1M<br><span style='color:#ef4444; font-size:9px;'>Noszenie RELIC przedmiotów</span>", 
        icon: "fa-gem", 
        color: "#3b82f6", 
        cardClass: "", 
        align: "left", 
        margin: "margin-top: -60px;" 
    },
    { 
        id: 3, 
        name: "Alpha Whale", 
        desc: "Twój portfel jest tak ciężki, że zaginasz czasoprzestrzeń.", 
        req: "1000 - 2000 LP • Net Worth ≥ 5M", 
        icon: "fa-whale", 
        color: "#3b82f6", 
        emoji: "🐋", 
        cardClass: "card-active", 
        align: "right", 
        margin: "" 
    },
    { 
        id: 2, 
        name: "RNG God", 
        desc: "Nie grasz w kości. Ty mówisz kościom, jak mają upaść.", 
        req: "2000 - 5000 LP • Streak ≥ 5<br><span style='color:#ffd700; font-size:9px;'>Noszenie DIVINE przedmiotów</span>", 
        icon: "fa-bahai", 
        color: "#00e5ff", 
        cardClass: "card-god future-rank", 
        align: "center", 
        margin: "margin-top: 20px;" 
    },
    { 
        id: 1, 
        name: "King of The Gamblers", 
        desc: "Wealth, fame, power… The man who acquired everything this world has to offer. There can only be one king.", 
        req: "RNG God • #1 Net Worth • 100% Trofeów", 
        icon: "fa-crown", 
        color: "#FFD700", 
        cardClass: "card-king future-rank", 
        align: "center", 
        margin: "margin-top: -10px;" 
    }
];




const availableGamesDB = [
    { id: 1, name: "Neon Blackjack", type: "Karciane", players: 1240, imgColor: "#10b981", isHot: true, icon: "fa-dice" },
    { id: 2, name: "Cyber Roulette", type: "Live", players: 890, imgColor: "#ef4444", isHot: true, icon: "fa-circle-notch" },
    { id: 3, name: "Quantum Slots", type: "Sloty", players: 3400, imgColor: "#8b5cf6", isHot: true, icon: "fa-gem" }, 
    { id: 4, name: "Space Poker", type: "Karciane", players: 560, imgColor: "#3b82f6", isHot: false, icon: "fa-playing-card" }, 
    { id: 5, name: "Binary Baccarat", type: "Karciane", players: 230, imgColor: "#64748b", isHot: false, icon: "fa-hand-paper" },
    { id: 6, name: "Crash Protocol", type: "Live", players: 1500, imgColor: "#f59e0b", isHot: true, icon: "fa-chart-line" },
    { id: 7, name: "Dice Mines", type: "Sloty", players: 120, imgColor: "#64748b", isHot: false, icon: "fa-bomb" },
    { id: 8, name: "Crypto Plinko", type: "Sloty", players: 850, imgColor: "#ec4899", isHot: false, icon: "fa-coins" },
];

const globalLeaderboardDB = [
    { rankVal: 1, rankName: "King of The Gamblers", title: "King of The Gamblers", name: "Not_Elon", lp: 9500, netWorth: 154000000 },
    { rankVal: 2, rankName: "RNG God", title: "Dice Master", name: "LuckyLuke", lp: 4200, netWorth: 25000000 },
    { rankVal: 2, rankName: "RNG God", title: "Bot Network Admin", name: "Casino_AI", lp: 3800, netWorth: 18500000 },
    { rankVal: 3, rankName: "Alpha Whale", title: "Legendary Finder", name: "DiamondH", lp: 1950, netWorth: 8500000 },
    
    { rankVal: 3, rankName: "Alpha Whale", title: "The Collector", name: "MrGambler", lp: 1469, netWorth: 5240000, isMe: true }, 
    { rankVal: 3, rankName: "Alpha Whale", title: "Crypto Whale", name: "CryptoBro", lp: 1200, netWorth: 5200000 },
    { rankVal: 4, rankName: "Casino Legend", title: "Casino Legend", name: "ZeroCool", lp: 980, netWorth: 2100000 },
    { rankVal: 4, rankName: "Casino Legend", title: "Glitch Hunter", name: "MatrixNeo", lp: 850, netWorth: 1500000 },
    { rankVal: 5, rankName: "Table Shark", title: "Table Shark", name: "BluffMaster", lp: 550, netWorth: 800000 },
    { rankVal: 5, rankName: "Table Shark", title: "Blackjack Master", name: "CardCounter", lp: 420, netWorth: 450000 },
    { rankVal: 6, rankName: "Risk Taker", title: "YOLO King", name: "YOLO_Trader", lp: 250, netWorth: 150000 },
    { rankVal: 6, rankName: "Risk Taker", title: "Doge Fan", name: "DogeCoin_Fan", lp: 210, netWorth: 120000 },
    { rankVal: 6, rankName: "Risk Taker", title: "Risk Taker", name: "WallStreetBet", lp: 190, netWorth: 110000 },
    { rankVal: 7, rankName: "Small Fry", title: "The Novice", name: "NoobMaster69", lp: 90, netWorth: 80000 },
    { rankVal: 7, rankName: "Small Fry", title: "JustLooking", name: "JustLooking", lp: 50, netWorth: 50000 },
    { rankVal: 7, rankName: "Small Fry", title: "Anon", name: "Anon_User", lp: 45, netWorth: 45000 },
    { rankVal: 7, rankName: "Small Fry", title: "Bot_221", name: "Bot_221", lp: 30, netWorth: 30000 },
    { rankVal: 7, rankName: "Small Fry", title: "Guest", name: "Guest_99", lp: 10, netWorth: 15000 },
    { rankVal: 8, rankName: "Bankrupt", title: "Need Loan", name: "NeedLoanPls", lp: -50, netWorth: 5000 },
    { rankVal: 8, rankName: "Bankrupt", title: "Rekt", name: "Rekt_City", lp: -120, netWorth: 500 },
    { rankVal: 8, rankName: "Bankrupt", title: "Lost It All", name: "LostItAll", lp: -200, netWorth: 100 },
    { rankVal: 8, rankName: "Bankrupt", title: "Sad Pepe", name: "SadPepe", lp: -500, netWorth: 0 },
    { rankVal: 7, rankName: "Small Fry", title: "Newbie", name: "Newbie_01", lp: 88, netWorth: 75000 },
    { rankVal: 7, rankName: "Small Fry", title: "Glitch Hunter", name: "GlitchHunter", lp: 60, netWorth: 60000 },
    { rankVal: 6, rankName: "Risk Taker", title: "High Stake", name: "HighStakeJ", lp: 280, netWorth: 180000 },
    { rankVal: 5, rankName: "Table Shark", title: "Poker Face", name: "PokerFace", lp: 480, netWorth: 600000 },
    { rankVal: 4, rankName: "Casino Legend", title: "Slot Machine Go Brr", name: "SlotMachineGoBrr", lp: 700, netWorth: 1200000 },
    { rankVal: 8, rankName: "Bankrupt", title: "Help Me", name: "HelpMe", lp: -50, netWorth: 2000 },
    { rankVal: 7, rankName: "Small Fry", title: "Learning", name: "Learning", lp: 20, netWorth: 25000 },
    { rankVal: 6, rankName: "Risk Taker", title: "Crypto Dad", name: "CryptoDad", lp: 150, netWorth: 135000 }
];

const walletLogsDB = [
    { id: '#TX9925', type: 'Przelew (Przychodzący)', val: '+25,000 $', date: '26 Dec, 12:30', status: 'Completed', detail: 'Od: User_KillerWhale' },
    { id: '#TX9924', type: 'Zakup Rynkowy', val: '-120,000 $', date: '26 Dec, 10:15', status: 'Completed', detail: 'Przedmiot: Sygnet Prezesa' },
    { id: '#TX9923', type: 'Wymiana Punktów', val: '+1,250 $', date: '25 Dec, 22:00', status: 'Completed', detail: 'Wymiana 5000 pkt Loyalty' },
    { id: '#TX9922', type: 'Wypłata (Crypto)', val: '-5,000 USDT', date: '25 Dec, 20:45', status: 'Processing', detail: 'Sieć: TRC20' },
    { id: '#TX9921', type: 'Wpłata (BLIK)', val: '+50,000 $', date: '25 Dec, 11:20', status: 'Completed', detail: 'Instant Transfer' },
    { id: '#TX9920', type: 'Wypłata (Visa)', val: '-10,000 $', date: '24 Dec, 09:15', status: 'Pending', detail: 'Visa **** 4242' },
    { id: '#TX9919', type: 'Bonus Powitalny', val: '+5,000 $', date: '23 Dec, 18:30', status: 'Completed', detail: 'Wager x35 Active' },
    { id: '#TX9918', type: 'Korekta Gry', val: '+150 $', date: '22 Dec, 14:00', status: 'Completed', detail: 'Refund: Game ID #4421' },
    { id: '#TX9915', type: 'Wpłata (Crypto)', val: '+2,000 $', date: '20 Dec, 02:40', status: 'Rejected', detail: 'Timeout' },
    { id: '#TX9914', type: 'Wygrana (Blackjack)', val: '+12,000 $', date: '19 Dec, 23:10', status: 'Completed', detail: 'Session ID #8822' },
    { id: '#TX9913', type: 'Przegrana (Ruletka)', val: '-5,000 $', date: '19 Dec, 22:50', status: 'Completed', detail: 'Red 32' },
    { id: '#TX9912', type: 'Transfer (Wychodzący)', val: '-1,000 $', date: '18 Dec, 15:20', status: 'Completed', detail: 'Do: Biedny_Gracz_01' }
];