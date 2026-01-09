const rawUrls = [
    "https://digitalservices.carrier.com/",
    "www.doccentral.carrier.com",
    "https://e-catalogue.ciat.com/commercial/2021/en/index.html",
    "ehs.carrier.com.hk",
    "https://epicimg.hvacpartners.com/23007002.pdf",
    "https://epmsimg.hvacpartners.com/0f4af752-b465-4c57-bb6a-de53965cd548.jpg",
    "https://io.carrier.com/",
    "https://ebanking.carrier.com.mx/",
    "https://fss.carrier.com.mx/",
    "https://fss.utec.com.mx/",
    "https://sol-a.carrier.com.mx",
    "https://sol-b.carrier.com.mx",
    "https://sol-c.carrier.com.mx",
    "https://sol-d.carrier.com.mx",
    "https://sol-e.carrier.com.mx",
    "https://sol-g.carrier.com.mx",
    "https://sol.carrier.com.mx/",
    "http://solservices.carrier.com.mx/monitor.aspx",
    "https://supplierportal.carrier.com.mx/",
    "https://rcs-serialinfo.carrier.com.mx/",
    "https://mobiledocs.carrier.com/docs/FAST_MOBILE_APP.pdf"
];

// State management
let urlData = rawUrls.map(url => ({
    url: url,
    maintenance: false,
    status: 'pending', // pending, online, offline, maintenance
    lastCheck: null,
    latency: 0,
    statusCode: 0
}));

const grid = document.getElementById('status-grid');
const onlineCountEl = document.getElementById('online-count');
const offlineCountEl = document.getElementById('offline-count');
const totalCountEl = document.getElementById('total-count');
const refreshBtn = document.getElementById('refresh-btn');
const exportBtn = document.getElementById('export-btn');
const progressBar = document.getElementById('progress-bar');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';
let stats = {
    online: 0,
    offline: 0,
    total: urlData.length
};
let completedChecks = 0;

function init() {
    totalCountEl.innerText = stats.total;

    // Auth filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update logic
            currentFilter = btn.dataset.filter;
            filterGrid();
        });
    });

    renderGrid();
    runChecks();
}

function filterGrid() {
    urlData.forEach((item, index) => {
        const card = document.getElementById(`card-${index}`);
        if (!card) return;

        let shouldShow = false;
        if (currentFilter === 'all') shouldShow = true;
        if (currentFilter === 'online' && item.status === 'online') shouldShow = true;

        // Group offline and network errors together for "offline" filter
        // Also show maintenance items only in ALL (or if we add a maintenance filter)
        // User asked: "All, Online, Offline"
        // If status is 'pending', show only in 'all' (usually)
        if (currentFilter === 'offline' && (item.status === 'offline' || item.statusCode >= 400 || item.statusCode === 0)) shouldShow = true;
        if (currentFilter === 'offline' && item.status === 'online') shouldShow = false; // Safety

        // Maintenance items generally shouldn't show in "Online" or "Offline" unless they ARE that status?
        // But maintenance mode overrides "Offline" in our previous logic.
        // Let's decide: If maintenance, it's not "active offline" for me to worry about.
        if (item.maintenance && currentFilter !== 'all') shouldShow = false;

        if (shouldShow) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}


function renderGrid() {
    grid.innerHTML = '';
    urlData.forEach((item, index) => {
        const card = document.createElement('div');
        // If maintenance is on, force the visual state, otherwise rely on the check result
        const statusClass = item.maintenance ? 'status-maintenance' : 'status-pending';

        card.className = `status-card ${statusClass}`;
        card.id = `card-${index}`;

        // Link handling: Only the left part acts as a "link" conceptually, 
        // but to keep the layout simple, we can wrap content or just use window.open on click
        // To support the tool buttons, we should avoid the whole card being an <a> tag
        // or preventDefault on the buttons.

        // Let's make the card title clickable
        const displayUrl = item.url;
        const linkUrl = displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`;

        card.innerHTML = `
            <a href="${linkUrl}" target="_blank" class="url-col" style="text-decoration:none; color:inherit; flex-grow:1">
                <div class="icon">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </div>
                <div class="text" title="${displayUrl}">${displayUrl}</div>
            </a>
            <div class="status-col">
                <div class="status-dot"></div>
                <span class="status-text">${item.maintenance ? 'Maintenance' : 'Checking...'}</span>
            </div>
            <div class="time-col">-</div>
            <div class="last-check-col">-</div>
            
            <div class="card-actions">
                <button class="icon-btn ${item.maintenance ? 'active' : ''}" onclick="toggleMaintenance(${index})" title="Toggle Maintenance Mode">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.toggleMaintenance = function (index) {
    urlData[index].maintenance = !urlData[index].maintenance;

    // If we toggle ON maintenance, we should immediately update UI to 'Maintenance' state
    // If we toggle OFF, we should re-run the check for this item or set to pending
    const card = document.getElementById(`card-${index}`);
    const btn = card.querySelector('.icon-btn');

    if (urlData[index].maintenance) {
        // Set to maintenance visual state
        card.classList.remove('status-pending', 'status-online', 'status-offline');
        card.classList.add('status-maintenance');
        card.querySelector('.status-text').innerText = 'Maintenance';
        btn.classList.add('active');
        urlData[index].status = 'maintenance';
    } else {
        // Remove maintenance visual state
        btn.classList.remove('active');
        // Rerun check for this single item
        card.classList.remove('status-maintenance');
        card.classList.add('status-pending');
        card.querySelector('.status-text').innerText = 'Checking...';
        checkUrl(urlData[index].url, index);
    }

    // Recalculate stats
    recalcStats();
    // Update filters immediately
    filterGrid();
};

function updateProgress() {
    completedChecks++;
    const percentage = (completedChecks / urlData.length) * 100;
    progressBar.style.width = `${percentage}%`;

    if (percentage >= 100) {
        setTimeout(() => {
            progressBar.style.opacity = '0';
        }, 500);
    } else {
        progressBar.style.opacity = '1';
    }
}

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

async function checkUrl(url, index) {
    // If in maintenance mode, skip the network check
    if (urlData[index].maintenance) {
        updateProgress();
        return;
    }

    const card = document.getElementById(`card-${index}`);
    const statusText = card.querySelector('.status-text');
    const timeCol = card.querySelector('.time-col');
    const lastCheckCol = card.querySelector('.last-check-col');

    // Visual reset
    card.classList.remove('status-pending', 'status-online', 'status-offline');

    const startTime = Date.now();

    try {
        let result = {};

        if (isLocalhost) {
            // LOCAL MODE: Use the smart Node.js proxy (Full features: Status codes, heavy lifting)
            const res = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            result = await res.json();
        } else {
            // GITHUB PAGES / STATIC MODE: Direct Browser Fetch (Limited features)
            // We use 'no-cors' to avoid CORS errors. 
            // Limitation: We can't see the specific status code (it returns 0/opaque).
            // Logic: If the promise resolves, the server is "Up" (DNS/Connection successful).
            // If it rejects, it's a network error (Down).

            // Note: Mixed Content (HTTP from HTTPS) will still fail on GitHub Pages.

            await fetch(url, {
                mode: 'no-cors',
                cache: 'no-store',
                method: 'GET'
            });

            // If we get here, it succeeded enough to connect
            result = {
                ok: true,
                status: 200, // Fake 200 since we can't read the real one in no-cors
                duration: Date.now() - startTime,
                statusText: 'Reachable'
            };
        }

        // Double check maintenance race condition
        if (urlData[index].maintenance) {
            updateProgress();
            return;
        }

        urlData[index].lastCheck = new Date();
        urlData[index].latency = result.duration;
        urlData[index].statusCode = result.status;

        if (result.ok) {
            card.classList.add('status-online');
            statusText.innerText = isLocalhost ? 'Operational' : 'Reachable'; // Distinction for static mode
            urlData[index].status = 'online';
        } else {
            throw new Error(result.error || 'Check failed');
        }

    } catch (err) {
        if (!urlData[index].maintenance) {
            card.classList.add('status-offline');
            // If static mode, errors are usually network/cors related, but effectively "Down" or "Blocked"
            statusText.innerText = isLocalhost ? (err.message || 'Unreachable') : 'Unreachable / Blocked';

            urlData[index].status = 'offline';
            urlData[index].latency = Date.now() - startTime;
            urlData[index].statusCode = 0;
            urlData[index].lastCheck = new Date();
        }
    }

    // Update visuals
    timeCol.innerText = `${urlData[index].latency}ms`;
    lastCheckCol.innerText = urlData[index].lastCheck.toLocaleTimeString();

    recalcStats();
    updateProgress();
    filterGrid();
}

function recalcStats() {
    stats.online = 0;
    stats.offline = 0;

    urlData.forEach(item => {
        if (item.maintenance) {
            // Maintenance doesn't count as offline, usually counts as "acknowledged" or just ignored.
            // Let's count it distinct or treat as online for the sake of "Green Board"
            // For now, let's just NOT increment offline.
            // Maybe add a maintenance counter?
        } else {
            if (item.status === 'online') stats.online++;
            if (item.status === 'offline') stats.offline++;
        }
    });

    updateStatsUI();
}

function updateStatsUI() {
    onlineCountEl.innerText = stats.online;
    offlineCountEl.innerText = stats.offline;
}

function runChecks() {
    completedChecks = 0;
    progressBar.style.width = '0%';
    progressBar.style.opacity = '1';

    stats.online = 0;
    stats.offline = 0;
    updateStatsUI();

    // Reset UI to pending only for non-maintenance items
    urlData.forEach((item, index) => {
        if (!item.maintenance) {
            const card = document.getElementById(`card-${index}`);
            // Safe reset
            card.classList.remove('status-online', 'status-offline', 'status-maintenance');
            card.classList.add('status-pending');

            card.querySelector('.status-text').innerText = 'Checking...';
            // Optional: reset time/latency or keep previous known
            // card.querySelector('.time-col').innerText = '-';
        }
    });

    // Apply filters (pending items might hide here if filter is not ALL)
    filterGrid();

    refreshBtn.classList.add('loading');

    // Run checks in parallel
    const promises = urlData.map((item, index) => checkUrl(item.url, index));

    Promise.allSettled(promises).then(() => {
        refreshBtn.classList.remove('loading');
    });
}

function downloadCSV() {
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "URL,Status,Latency (ms),Last Check,Details\n";

    urlData.forEach(item => {
        const timeStr = item.lastCheck ? item.lastCheck.toISOString() : 'N/A';
        const latency = item.latency || 0;
        let statusStr = item.status;
        if (item.maintenance) statusStr = "Maintenance";

        const row = [
            `"${item.url}"`,
            statusStr,
            latency,
            timeStr,
            item.statusCode
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `monitor_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

refreshBtn.addEventListener('click', runChecks);
exportBtn.addEventListener('click', downloadCSV);

// Start
init();
