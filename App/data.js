// --- DATA SETS ---

// BUSINESS / GAMBLING THEMED ITEMS
// Types: head, neck, suit, watch, belt, pants, shoes, ring, vehicle, gadget

let allTreasures = [
    // --- SKRZYNKI (Wszystkie to walizki) ---
    { id: 1, name: "Peasant Case", type: "chest", price: "500 $", rawPrice: 500, color: "#9ca3af", icon: "💼", rarity: "Peasant", desc: "Stara, skórzana teczka.", bonus: "Może zawierać kanapki." },
    { id: 2, name: "Rare Case", type: "chest", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "💼", rarity: "Rare", desc: "Walizka z szyfrem.", bonus: "Gwarantowany gadżet." },
    { id: 3, name: "Epic Case", type: "chest", price: "25,000 $", rawPrice: 25000, color: "#8b5cf6", icon: "💼", rarity: "Epic", desc: "Wzmocniona tytanem.", bonus: "Pachnie drogimi perfumami." },
    { id: 4, name: "Relic Case", type: "chest", price: "100,000 $", rawPrice: 100000, color: "#ef4444", icon: "💼", rarity: "Relic", desc: "Używana przez mafię.", bonus: "Ryzykowna zawartość." },
    { id: 5, name: "Divine Case", type: "chest", price: "1,000,000 $", rawPrice: 1000000, color: "#ffd700", icon: "💼", rarity: "Divine", desc: "Wykonana ze złota i diamentów.", bonus: "Tylko dla 1%." },

    // --- ITEMY BIZNESOWE ---
    
    // HEAD (Okulary / Kapelusze)
    { id: 6, name: "Czapka z daszkiem", type: "head", price: "50 $", rawPrice: 50, color: "#9ca3af", icon: "🧢", rarity: "Peasant", desc: "Z logo stacji benzynowej.", bonus: "-5 do Stylu" },
    { id: 7, name: "RayBan Aviator", type: "head", price: "1,500 $", rawPrice: 1500, color: "#3b82f6", icon: "🕶️", rarity: "Rare", desc: "Ukrywają poker face.", bonus: "+10 do Blefowania" },
    { id: 8, name: "Gogle VR Pro", type: "head", price: "15,000 $", rawPrice: 15000, color: "#ef4444", icon: "🥽", rarity: "Relic", desc: "Widzisz algorytm kasyna.", bonus: "Przewidywanie Wygranej" },

    // NECK (Krawaty / Łańcuchy)
    { id: 9, name: "Krawat z Poliestru", type: "neck", price: "20 $", rawPrice: 20, color: "#9ca3af", icon: "👔", rarity: "Peasant", desc: "Drapie w szyję.", bonus: "Brak" },
    { id: 10, name: "Złoty Łańcuch", type: "neck", price: "25,000 $", rawPrice: 25000, color: "#8b5cf6", icon: "⛓️", rarity: "Epic", desc: "Waży 2kg.", bonus: "+20 do Respectu" },
    
    // SUIT (Garnitur)
    { id: 11, name: "Koszula Hawajska", type: "suit", price: "80 $", rawPrice: 80, color: "#9ca3af", icon: "👕", rarity: "Peasant", desc: "Idealna na wakacje, nie do kasyna.", bonus: "Luz +100" },
    { id: 12, name: "Garnitur Hugo Boss", type: "suit", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "🤵", rarity: "Rare", desc: "Klasyczna elegancja.", bonus: "+5 do Negocjacji" },
    { id: 13, name: "Smoking Bonda", type: "suit", price: "500,000 $", rawPrice: 500000, color: "#ffd700", icon: "🍸", rarity: "Divine", desc: "Wstrząśnięty, nie zmieszany.", bonus: "Kuloodporność finansowa" },

    // WATCH (Zegarek - Ważny!)
    { id: 14, name: "Zegarek z Komunii", type: "watch", price: "100 $", rawPrice: 100, color: "#9ca3af", icon: "⌚", rarity: "Peasant", desc: "Pamiątka rodzinna.", bonus: "Pokazuje czas" },
    { id: 15, name: "Rolex Submariner", type: "watch", price: "40,000 $", rawPrice: 40000, color: "#8b5cf6", icon: "⌚", rarity: "Epic", desc: "Znasz jego wartość.", bonus: "+15 do Prestiżu" },
    { id: 16, name: "Patek Philippe", type: "watch", price: "2,500,000 $", rawPrice: 2500000, color: "#ffd700", icon: "🕰️", rarity: "Divine", desc: "Nie ty go masz, ty go przechowujesz dla pokoleń.", bonus: "Zatrzymuje czas (długów)" },

    // BELT (Pasek)
    { id: 17, name: "Sznurek", type: "belt", price: "5 $", rawPrice: 5, color: "#9ca3af", icon: "🧶", rarity: "Peasant", desc: "Trzyma spodnie.", bonus: "Brak" },
    { id: 18, name: "Pasek Gucci", type: "belt", price: "800 $", rawPrice: 800, color: "#3b82f6", icon: "🐍", rarity: "Rare", desc: "Wielka klamra.", bonus: "+2 do Lansu" },

    // PANTS (Spodnie)
    { id: 19, name: "Dżinsy z Dziurami", type: "pants", price: "150 $", rawPrice: 150, color: "#9ca3af", icon: "👖", rarity: "Peasant", desc: "Modne, ale czy w kasynie?", bonus: "Wentylacja" },
    { id: 20, name: "Spodnie od Garnituru", type: "pants", price: "2,000 $", rawPrice: 2000, color: "#3b82f6", icon: "👖", rarity: "Rare", desc: "Dopasowane.", bonus: "Wygoda +5" },

    // SHOES (Buty)
    { id: 21, name: "Klapki Basenowe", type: "shoes", price: "20 $", rawPrice: 20, color: "#9ca3af", icon: "🩴", rarity: "Peasant", desc: "Szur szur.", bonus: "-50 do Poważania" },
    { id: 22, name: "Mokasyny", type: "shoes", price: "3,000 $", rawPrice: 3000, color: "#8b5cf6", icon: "👞", rarity: "Epic", desc: "Włoska skóra.", bonus: "Cichy chód" },

    // RINGS (Biżuteria)
    { id: 23, name: "Sygnet Rodowy", type: "ring", price: "15,000 $", rawPrice: 15000, color: "#8b5cf6", icon: "🧿", rarity: "Epic", desc: "Z herbem nieistniejącego rodu.", bonus: "+10 do Blefu" },
    { id: 24, name: "Obrączka", type: "ring", price: "500 $", rawPrice: 500, color: "#9ca3af", icon: "💍", rarity: "Peasant", desc: "Z grawerem.", bonus: "Wierność" },

    // VEHICLE (Kluczyki)
    { id: 25, name: "Bilet Autobusowy", type: "vehicle", price: "2 $", rawPrice: 2, color: "#9ca3af", icon: "🚌", rarity: "Peasant", desc: "Ważny 20 minut.", bonus: "Transport publiczny" },
    { id: 26, name: "Kluczyki BMW", type: "vehicle", price: "50,000 $", rawPrice: 50000, color: "#3b82f6", icon: "🔑", rarity: "Rare", desc: "M3 w leasingu.", bonus: "Szybki dojazd" },
    { id: 27, name: "Karta do Bugatti", type: "vehicle", price: "2,000,000 $", rawPrice: 2000000, color: "#ffd700", icon: "🏎️", rarity: "Divine", desc: "Top G.", bonus: "Prędkość światła" },

    // GADGET (Elektronika / Ręka)
    { id: 28, name: "Nokia 3310", type: "gadget", price: "50 $", rawPrice: 50, color: "#9ca3af", icon: "🧱", rarity: "Peasant", desc: "Niezniszczalna.", bonus: "Samoobrona" },
    { id: 29, name: "iPhone 16 Pro Max", type: "gadget", price: "5,000 $", rawPrice: 5000, color: "#3b82f6", icon: "📱", rarity: "Rare", desc: "Więcej aparatów niż sensu.", bonus: "+5 do Selfie" },
    { id: 30, name: "Szyfrowany Telefon", type: "gadget", price: "100,000 $", rawPrice: 100000, color: "#ef4444", icon: "📡", rarity: "Relic", desc: "Nikt nie podsłucha.", bonus: "Anonimowość" },
    { id: 31, name: "Czarne American Express", type: "gadget", price: "1,000,000 $", rawPrice: 1000000, color: "#ffd700", icon: "💳", rarity: "Divine", desc: "Bez limitu.", bonus: "Nieskończony debet" },
    
    // EXTRAS
    { id: 32, name: "Cygaro Kubańskie", type: "gadget", price: "500 $", rawPrice: 500, color: "#3b82f6", icon: "🚬", rarity: "Rare", desc: "Kopci jak smok.", bonus: "Relaks" },
    { id: 33, name: "Szklanka Whisky", type: "gadget", price: "100 $", rawPrice: 100, color: "#9ca3af", icon: "🥃", rarity: "Peasant", desc: "Z lodem.", bonus: "Odwaga +5" }
];

// --- PLAYERS DATABASE ---
const playersDB = [
    {
        username: "MrGambler",
        rank: "Alpha Whale",
        pfp: "https://i.pravatar.cc/150?u=MrGambler",
        inventory: [
            // LOADOUT (IDs)
            7, 10, 12, 15, 18, 20, 22, 23, 26, 31,
            // STASH (Items to be listed on market)
            5, // Divine Case (Będziemy to sprzedawać)
            16, // Patek Philippe (Też na sprzedaż)
            28, 9, 33, 21, 1, 1, 2 // Junk
        ]
    },
    {
        username: "Whale_Killer",
        rank: "RNG God",
        pfp: "https://i.pravatar.cc/150?u=Whale_Killer",
        inventory: [27, 31, 13, 16, 5, 5, 4] // High End Stuff
    },
    {
        username: "LuckyLuke",
        rank: "Table Shark",
        pfp: "https://i.pravatar.cc/150?u=LuckyLuke",
        inventory: [7, 11, 21, 2, 3, 3] // Mid Tier
    },
    {
        username: "CryptoBro",
        rank: "Risk Taker",
        pfp: "https://i.pravatar.cc/150?u=CryptoBro",
        inventory: [30, 8, 26, 2, 2] // Tech stuff
    },
    {
        username: "Bot_Network_01",
        rank: "Small Fry",
        pfp: "https://i.pravatar.cc/150?u=Bot_Network_01",
        inventory: [1, 1, 1, 1, 1, 1, 1, 1, 25, 25] // Spam items
    }
];

// Generator Templates for Static List
const tW = { name: "Blackjack", val: "+400", type: "win", icon: "fa-dice", iColor: "#10b981" };
const tL = { name: "Ruletka EU", val: "-500", type: "lose", icon: "fa-circle-notch", iColor: "#ef4444" };
const tD = { name: "Bakarat", val: "0", type: "draw", icon: "fa-hand-paper", iColor: "#8b92a5" };
const tW2 = { name: "Poker Holdem", val: "+1200", type: "win", icon: "fa-playing-card", iColor: "#10b981" };
const tL2 = { name: "Slot Fortune", val: "-100", type: "lose", icon: "fa-gem", iColor: "#8b5cf6" };

// Point 7: STATIC GAME LIST
const staticGamesList = [
    // Recent (Mix of Wins)
    {...tW, time: "2 min temu"}, {...tW2, time: "5 min temu"}, {...tL, time: "12 min temu"}, {...tW, time: "15 min temu"},
    {...tW, time: "18 min temu"}, {...tD, time: "22 min temu"}, {...tW2, time: "30 min temu"}, {...tL, time: "45 min temu"},
    {...tW, time: "1h temu"}, {...tW, time: "1h 10m temu"}, {...tD, time: "1h 15m temu"}, {...tL2, time: "1h 20m temu"},
    {...tW, time: "1h 30m temu"}, {...tW2, time: "1h 45m temu"}, {...tL, time: "2h temu"}, {...tW, time: "2h 10m temu"},
    {...tW, time: "2h 30m temu"}, {...tD, time: "3h temu"}, {...tW2, time: "3h 15m temu"}, {...tL, time: "4h temu"},

    // Next Batch (More Losses - Streak change)
    {...tL, time: "5h temu"}, {...tL, time: "5h 10m temu"}, {...tL2, time: "5h 30m temu"}, {...tL, time: "6h temu"},
    {...tL, time: "6h 15m temu"}, {...tD, time: "7h temu"}, {...tL, time: "8h temu"}, {...tL2, time: "8h 30m temu"},
    {...tW, time: "9h temu"}, {...tL, time: "10h temu"}, {...tL, time: "11h temu"}, {...tL, time: "12h temu"},
    {...tL, time: "13h temu"}, {...tL, time: "14h temu"}, {...tL2, time: "15h temu"}, {...tL, time: "16h temu"},
    {...tD, time: "17h temu"}, {...tL, time: "18h temu"}, {...tW, time: "19h temu"}, {...tL, time: "20h temu"},

    // Batch 3 (Balanced / Draws)
    {...tD, time: "1d temu"}, {...tD, time: "1d temu"}, {...tW, time: "1d temu"}, {...tL, time: "1d temu"},
    {...tD, time: "1d temu"}, {...tW, time: "1d temu"}, {...tL, time: "1d temu"}, {...tD, time: "1d temu"},
    {...tW, time: "1d temu"}, {...tL, time: "1d temu"}, {...tW2, time: "1d temu"}, {...tL2, time: "1d temu"},
    {...tD, time: "1d temu"}, {...tW, time: "1d temu"}, {...tL, time: "1d temu"}, {...tD, time: "1d temu"},
    {...tW, time: "1d temu"}, {...tL, time: "1d temu"}, {...tW2, time: "1d temu"}, {...tL2, time: "1d temu"},

     // Batch 4 (High Wins)
     {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW2, time: "2d temu"},
     {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW2, time: "2d temu"},
     {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW2, time: "2d temu"},
     {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW2, time: "2d temu"},
     {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW, time: "2d temu"}, {...tW2, time: "2d temu"}
];

let allGames = staticGamesList;

// --- ACHIEVEMENTS DATABASE ---
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

// --- RANKS DATABASE (NEW) ---
// --- RANKS DATABASE (NEW) ---
// Order: From visual top (#8) to visual bottom (#1)
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
        req: "100 - 300 LP • ≥ 4h w grach", 
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
        req: "300 - 600 LP • Win Rate ≥ 55% (20 gier)", 
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
        req: "600 - 1000 LP • Net Worth ≥ 1M", 
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
        req: "2000 - 5000 LP • Win streak ≥ 5 gier", 
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

// --- NEW DATA: GAMES HUB ---

// data.js - Podmień tablicę availableGamesDB
const availableGamesDB = [
    { id: 1, name: "Neon Blackjack", type: "Karciane", players: 1240, imgColor: "#10b981", isHot: true, icon: "fa-dice" },
    { id: 2, name: "Cyber Roulette", type: "Live", players: 890, imgColor: "#ef4444", isHot: true, icon: "fa-circle-notch" },
    { id: 3, name: "Quantum Slots", type: "Sloty", players: 3400, imgColor: "#8b5cf6", isHot: true, icon: "fa-gem" }, // Użyta w Dashboard
    { id: 4, name: "Space Poker", type: "Karciane", players: 560, imgColor: "#3b82f6", isHot: false, icon: "fa-playing-card" }, // Pasuje do Poker Holdem
    { id: 5, name: "Binary Baccarat", type: "Karciane", players: 230, imgColor: "#64748b", isHot: false, icon: "fa-hand-paper" },
    { id: 6, name: "Crash Protocol", type: "Live", players: 1500, imgColor: "#f59e0b", isHot: true, icon: "fa-chart-line" },
    { id: 7, name: "Dice Mines", type: "Sloty", players: 120, imgColor: "#64748b", isHot: false, icon: "fa-bomb" },
    { id: 8, name: "Crypto Plinko", type: "Sloty", players: 850, imgColor: "#ec4899", isHot: false, icon: "fa-coins" },
];

const globalLeaderboardDB = [
    { rankVal: 8, rankName: "King of The Gamblers", name: "Not_Elon", lp: 9500, netWorth: 154000000 },
    { rankVal: 7, rankName: "RNG God", name: "LuckyLuke", lp: 4200, netWorth: 25000000 },
    { rankVal: 7, rankName: "RNG God", name: "Casino_AI", lp: 3800, netWorth: 18500000 },
    { rankVal: 6, rankName: "Alpha Whale", name: "DiamondH", lp: 1950, netWorth: 8500000 },
    { rankVal: 6, rankName: "Alpha Whale", name: "CryptoBro", lp: 1200, netWorth: 5200000 },
    { rankVal: 5, rankName: "Casino Legend", name: "ZeroCool", lp: 980, netWorth: 2100000 },
    { rankVal: 5, rankName: "Casino Legend", name: "MatrixNeo", lp: 850, netWorth: 1500000 },
    { rankVal: 4, rankName: "Table Shark", name: "BluffMaster", lp: 550, netWorth: 800000 },
    { rankVal: 4, rankName: "Table Shark", name: "CardCounter", lp: 420, netWorth: 450000 },
    { rankVal: 3, rankName: "Risk Taker", name: "YOLO_Trader", lp: 250, netWorth: 150000 },
];
// --- FINANCIAL LOGS DATABASE (NEW) ---
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