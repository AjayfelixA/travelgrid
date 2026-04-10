// ============================================================
// TravelGrid — Fully Frontend localStorage Application
// No backend or MongoDB required. All data persists in browser.
// ============================================================

let currentUser = null;
let itineraryData = [];
let bookingData = [];

// --- Page Load: Initialize everything from localStorage ---
document.addEventListener("DOMContentLoaded", () => {
    // Load persisted data safely
    itineraryData = JSON.parse(localStorage.getItem("itineraryData")) || [];
    bookingData = JSON.parse(localStorage.getItem("bookingData")) || [];

    // Render saved data immediately
    renderItineraries();
    renderMyBookings();

    // Dates Calendar Initialization
    flatpickr("#dates", {
        mode: "range",
        dateFormat: "M j",
    });

    // Tagify Initialization for multiple activities
    const tagsInput = document.getElementById('activities');
    new Tagify(tagsInput, {
        whitelist: ["Sightseeing", "Trekking", "Beach Visit", "Shopping", "Temple Visit"],
        maxTags: 5,
        dropdown: {
            maxItems: 10,
            classname: "tags-look",
            enabled: 0,
            closeOnSelect: false
        }
    });

    // Transport intelligent rewriting
    document.getElementById('transport').addEventListener('input', function(e) {
        if(this.value === 'Flight') this.value = 'Flight #';
        if(this.value === 'Train') this.value = 'Train #';
    });
});

// --- Reusable Toast Notification ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.className = `toast ${type} fadeOut`;
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

// --- Login (purely cosmetic, no backend) ---
function performLogin() {
    const username = document.getElementById('loginUsername').value;
    if (!username) {
        alert("Please enter a username!");
        return;
    }

    currentUser = username;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'none';

    // Render any existing data
    renderItineraries();
    renderMyBookings();
}

// --- User Registration (cosmetic) ---
function registerUser() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const msgEl = document.getElementById('userMsg');

    if(!username || !email) {
        msgEl.textContent = 'Please fill all fields.';
        msgEl.style.color = '#ef4444';
        return;
    }

    currentUser = username;
    document.getElementById('loginBtn').style.display = 'none';
    msgEl.textContent = 'Registered successfully! You can now add itineraries.';
    msgEl.style.color = '#34d399';
}

// ============================================================
// ITINERARY — localStorage ("itineraryData")
// ============================================================

function createItinerary() {
    const destination = document.getElementById('destination').value;
    const dates = document.getElementById('dates').value;
    const hotel = document.getElementById('hotel').value;
    const transport = document.getElementById('transport').value;
    const activitiesRaw = document.getElementById('activities').value;
    let parsedActivities = activitiesRaw;

    // Tagify stores as JSON. Serialize to comma separated string cleanly!
    if (activitiesRaw) {
        try {
            const parsed = JSON.parse(activitiesRaw);
            parsedActivities = parsed.map(item => item.value).join(', ');
        } catch(e) {}
    }

    const msgEl = document.getElementById('itineraryMsg');

    if(!destination) {
        msgEl.textContent = 'Please enter a destination!';
        msgEl.style.color = '#ef4444';
        return;
    }

    // Create new itinerary object
    const newItem = {
        id: Date.now(),
        destination,
        dates: dates || 'Not selected',
        hotel: hotel || 'None',
        transport: transport || 'None',
        activities: parsedActivities || 'None'
    };

    // Save to localStorage
    itineraryData.push(newItem);
    localStorage.setItem("itineraryData", JSON.stringify(itineraryData));

    showToast('Trip added successfully!');
    msgEl.textContent = '';

    // Clear inputs
    document.getElementById('destination').value = '';
    document.getElementById('hotel').value = '';
    document.getElementById('transport').value = '';
    document.getElementById('activities').value = '';

    // Render immediately
    renderItineraries();
}

function renderItineraries() {
    const listEl = document.getElementById('itineraryList');
    if(!listEl) return;
    listEl.innerHTML = '';

    // Reload from localStorage to survive refreshes
    itineraryData = JSON.parse(localStorage.getItem("itineraryData")) || [];

    if(itineraryData.length === 0) {
        listEl.innerHTML = '<div style="grid-column: 1 / -1; color:#64748b; font-style:italic; padding: 1rem 0;">No itinerary added</div>';
        return;
    }

    itineraryData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'itinerary-card';
        card.setAttribute('data-id', item.id);
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItinerary(${item.id})">X</button>
            <div style="cursor: move; display: flex; align-items: center; margin-bottom: 0.5rem">
              <span style="color:#cbd5e1; margin-right: 8px;">⠿</span>
              <h3 style="color:#0f172a; flex:1">📍 ${item.destination}</h3>
            </div>
            <p style="color:#64748b; margin-top:0.25rem; font-size: 0.85rem; font-weight: 600">📅 ${item.dates}</p>
            <hr style="border: 0; border-top: 1px dashed #e2e8f0; margin: 0.75rem 0;">
            <p style="font-size:0.9rem; margin-bottom: 0.25rem"><strong>🏨 Hotel:</strong> ${item.hotel || 'None'}</p>
            <p style="font-size:0.9rem; margin-bottom: 0.25rem"><strong>✈️ Transport:</strong> ${item.transport || 'None'}</p>
            <p style="font-size:0.9rem; margin-bottom: 0.25rem"><strong>🎟️ Activity:</strong> ${item.activities || 'None'}</p>
        `;
        listEl.appendChild(card);
    });

    // Drag and drop reordering (persists to localStorage)
    new Sortable(listEl, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function () {
            const cards = listEl.querySelectorAll('.itinerary-card');
            const newOrder = Array.from(cards).map(c => parseInt(c.getAttribute('data-id')));
            itineraryData.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
            localStorage.setItem("itineraryData", JSON.stringify(itineraryData));
        }
    });
}

function deleteItinerary(id) {
    if(!confirm('Delete this itinerary?')) return;
    itineraryData = itineraryData.filter(item => item.id !== id);
    localStorage.setItem("itineraryData", JSON.stringify(itineraryData));
    renderItineraries();
    showToast('Itinerary removed');
}

// --- System Health (cosmetic, always show online) ---
function checkHealth() {
    const userEl = document.getElementById('userStatus');
    const itinEl = document.getElementById('itinStatus');
    if(userEl) { userEl.textContent = 'ONLINE'; userEl.className = 'badge online'; }
    if(itinEl) { itinEl.textContent = 'ONLINE'; itinEl.className = 'badge online'; }
}
checkHealth();

// ============================================================
// TRAVEL PACKAGES — Static Data
// ============================================================

const staticPackages = [
    { dest: "Delhi", title: "Delhi Budget Trip", price: "₹8000", days: "3 Days", type: "Budget", emoji: "🛕", desc: "A pocket-friendly tour of India's capital covering all major monuments." },
    { dest: "Delhi", title: "Delhi Premium Trip", price: "₹15000", days: "3 Days", type: "Premium", emoji: "🏰", desc: "Luxury 5-star stay with guided premium vehicle tours of Delhi." },
    { dest: "Goa", title: "Goa Beach Package", price: "₹12000", days: "4 Days", type: "Standard", emoji: "🏖️", desc: "Vibrant beach parties, sunset cruises, and a relaxing coastal stay." },
    { dest: "Ooty", title: "Ooty Hill Package", price: "₹9000", days: "2 Days", type: "Standard", emoji: "⛰️", desc: "Escape to the Queen of Hill Stations with lush tea gardens and perfect weather." }
];

function showPackages(destinationFilter) {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('packagesApp').style.display = 'block';

    document.getElementById('packageSubtitle').textContent = `Top Deals available for your trips!`;

    const container = document.getElementById('packagesList');
    container.innerHTML = '';

    let filtered = staticPackages.filter(p => p.dest.toLowerCase() === destinationFilter.toLowerCase());
    if (filtered.length === 0) {
        filtered = staticPackages;
        document.getElementById('packageSubtitle').textContent = `Explore all our curated global escapes`;
    }

    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'package-card';
        div.innerHTML = `
            <div class="package-img">${p.emoji}</div>
            <div class="package-content">
                <span class="package-type">${p.type}</span>
                <div class="package-title">${p.title}</div>
                <div class="package-price">${p.price} <span style="font-size:0.8rem; color:#94a3b8">/ ${p.days}</span></div>
                <div class="package-desc">${p.desc}</div>
                <button class="btn primary" style="margin-top:auto; background:#10b981; color:white; padding:0.85rem; border-radius:8px;" onclick="initiateBooking('${p.title}', '${p.price}', '${p.dest}')">Book Now</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function goBackToHome() {
    document.getElementById('packagesApp').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

// ============================================================
// BUDGET PLANNER — Static Logic
// ============================================================

function findBudgetTrips() {
    const budgetRaw = document.getElementById('budgetInput').value;
    const msgEl = document.getElementById('budgetMsg');

    if (!budgetRaw) {
        msgEl.textContent = 'Please enter a valid budget';
        msgEl.style.color = '#ef4444';
        return;
    }

    msgEl.textContent = '';
    const budget = parseFloat(budgetRaw);
    let recommendations = [];

    if (budget <= 5000) {
        recommendations = [
            { dest: "Local City Exploring", hotel: "OYO, Budget Inn", cost: "₹3,000 - ₹5,000", emoji: "🏙️", desc: "Discover historic neighborhood architecture, street food and simple stays." }
        ];
    } else if (budget <= 10000) {
        recommendations = [
            { dest: "Ooty", hotel: "Treebo, 3-Star Hotels", cost: "₹7,500 - ₹10,000", emoji: "⛰️", desc: "Cozy scenic weather, botanical gardens and tea estates." },
            { dest: "Kerala", hotel: "3-Star Houseboats", cost: "₹9,000", emoji: "🌴", desc: "Tranquil backwaters and simple nature living." },
            { dest: "Chennai", hotel: "Business 3-Stars", cost: "₹6,000", emoji: "🌊", desc: "Marina beach horizons and incredible South Indian cuisine." }
        ];
    } else if (budget <= 20000) {
        recommendations = [
            { dest: "Goa", hotel: "4-Star Hotels, Resorts", cost: "₹15,000+", emoji: "🏖️", desc: "Beach parties, high-end shacks and luxury pools." },
            { dest: "Manali", hotel: "Premium Cottages", cost: "₹18,000+", emoji: "🏔️", desc: "Snow treks, paragliding and premium warm stays." },
            { dest: "Delhi", hotel: "4-Star Central Hubs", cost: "₹14,000+", emoji: "🛕", desc: "Curated monumental tours and excellent culinary walks." }
        ];
    } else {
        recommendations = [
            { dest: "Maldives / Dubai", hotel: "Luxury (Taj, ITC)", cost: "₹50,000+", emoji: "🥂", desc: "World-class spas, private ocean villas, and grand suites." },
            { dest: "Global Europe", hotel: "5-Star Suites", cost: "₹80,000+", emoji: "🏰", desc: "The ultimate premium global getaway with unmatched amenities." }
        ];
    }

    const container = document.getElementById('budgetResultsList');
    container.innerHTML = '';

    recommendations.forEach(r => {
        const div = document.createElement('div');
        div.className = 'package-card';
        div.innerHTML = `
            <div class="package-img" style="background: linear-gradient(135deg, #8b5cf6, #ec4899)">${r.emoji}</div>
            <div class="package-content">
                <span class="package-type" style="background:#f3e8ff; color:#a855f7;">Analyzed Match</span>
                <div class="package-title">${r.dest}</div>
                <div class="package-price">${r.cost}</div>
                <div style="font-size:0.85rem; color:#1080aa; font-weight:800; margin-bottom:0.5rem">🏨 ${r.hotel}</div>
                <div class="package-desc">${r.desc}</div>
                <button class="btn primary" style="margin-top:auto; background:linear-gradient(90deg, #8b5cf6, #ec4899); color:white; padding:0.85rem; border-radius:8px; border:none;" onclick="initiateBooking('${r.dest} Premium Curated', '${r.cost}', '${r.dest}')">Book Now</button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('budgetResultsSection').style.display = 'block';
    showToast('Budget analyzed successfully!');
}

// ============================================================
// BOOKING SYSTEM — localStorage ("bookingData")
// ============================================================

let currentActiveBooking = null;

function initiateBooking(pkgTitle, pkgPriceStr, pkgDest) {
    // Try to find matching itinerary for this destination
    let lastItin = null;
    if(itineraryData.length > 0) {
        lastItin = itineraryData.find(i => i.destination.toLowerCase() === pkgDest.toLowerCase()) || itineraryData[itineraryData.length - 1];
    }

    const basePrice = parseInt(pkgPriceStr.replace(/[^0-9]/g, '')) || 0;

    const hotelCost = (lastItin && lastItin.hotel && lastItin.hotel !== 'None') ? 2000 : 0;
    const transportCost = (lastItin && lastItin.transport && lastItin.transport !== 'None') ? 1500 : 0;
    const activitiesCost = (lastItin && lastItin.activities && lastItin.activities !== 'None') ? 500 : 0;
    const totalCost = basePrice + hotelCost + transportCost + activitiesCost;

    currentActiveBooking = {
        id: Date.now(),
        package: pkgTitle,
        destination: pkgDest,
        dates: lastItin && lastItin.dates ? lastItin.dates : 'Not selected',
        hotel: lastItin && lastItin.hotel ? lastItin.hotel : 'None',
        transport: lastItin && lastItin.transport ? lastItin.transport : 'None',
        activities: lastItin && lastItin.activities ? lastItin.activities : 'None',
        price: basePrice,
        totalCost: totalCost
    };

    // Navigate to booking view
    document.getElementById('packagesApp').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('bookingApp').style.display = 'block';

    renderBookingPage();
}

function renderBookingPage() {
    const bd = document.getElementById('bookingDetailsCard');
    if(!currentActiveBooking) {
        bd.innerHTML = "<p style='color:#64748b; font-style:italic'>No active booking pending.</p>";
        return;
    }

    let b = currentActiveBooking;
    const hotelCost = (b.hotel !== 'None') ? 2000 : 0;
    const transportCost = (b.transport !== 'None') ? 1500 : 0;
    const activitiesCost = (b.activities !== 'None') ? 500 : 0;

    bd.innerHTML = `
        <h2 style="margin-bottom: 1rem; border-bottom:1px solid #e2e8f0; padding-bottom: 0.5rem">Booking Summary</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <p><strong>📍 Destination:</strong> ${b.destination}</p>
            <p><strong>📅 Dates:</strong> ${b.dates}</p>
            <p><strong>🏨 Hotel:</strong> ${b.hotel} (+₹${hotelCost})</p>
            <p><strong>✈️ Transport:</strong> ${b.transport} (+₹${transportCost})</p>
            <p><strong>🎟️ Activities:</strong> ${b.activities} (+₹${activitiesCost})</p>
            <p><strong>📦 Base Price:</strong> ₹${b.price}</p>
        </div>
        <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px dashed #cbd5e1;">
            <h2 style="color:#059669; font-size:1.8rem; margin-top:0.5rem">Total Cost: ₹${b.totalCost}</h2>
        </div>
    `;
}

function cancelBooking() {
    currentActiveBooking = null;
    document.getElementById('bookingApp').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function confirmBooking() {
    if(!currentActiveBooking) return;

    // Save booking to localStorage under "bookingData"
    bookingData = JSON.parse(localStorage.getItem("bookingData")) || [];
    bookingData.push(currentActiveBooking);
    localStorage.setItem("bookingData", JSON.stringify(bookingData));

    showToast('Booking Confirmed', 'success');
    cancelBooking();
    renderMyBookings();
}

function renderMyBookings() {
    const listEl = document.getElementById('myBookingsList');
    if(!listEl) return;
    listEl.innerHTML = '';

    // Always reload from localStorage
    bookingData = JSON.parse(localStorage.getItem("bookingData")) || [];

    if(bookingData.length === 0) {
        listEl.innerHTML = '<div style="grid-column: 1 / -1; color:#64748b; font-style:italic">No bookings yet. Book a package to see your history here!</div>';
        return;
    }

    bookingData.forEach(b => {
        const card = document.createElement('div');
        card.className = 'package-card';
        card.innerHTML = `
            <div class="package-content" style="border-top:4px solid #10b981; padding-top:1rem;">
                <span class="package-type" style="background:#d1fae5; color:#059669; border: 1px solid #34d399">Confirmed Booking</span>
                <div class="package-title" style="margin-top:0.5rem">${b.destination} Getaway</div>
                <div class="package-price" style="margin-bottom:0.8rem">Total Cost: ₹${b.totalCost}</div>
                <p style="font-size:0.85rem; color:#475569; margin-top:0.2rem;"><strong>📍 Destination:</strong> ${b.destination}</p>
                <p style="font-size:0.85rem; color:#475569; margin-top:0.2rem;"><strong>📅 Dates:</strong> ${b.dates}</p>
                <p style="font-size:0.85rem; color:#475569; margin-top:0.2rem;"><strong>🏨 Hotel:</strong> ${b.hotel}</p>
                <p style="font-size:0.85rem; color:#475569; margin-top:0.2rem;"><strong>✈️ Transport:</strong> ${b.transport}</p>
                <p style="font-size:0.85rem; color:#475569; margin-top:0.2rem;"><strong>🎟️ Activities:</strong> ${b.activities}</p>
            </div>
        `;
        listEl.appendChild(card);
    });
}
