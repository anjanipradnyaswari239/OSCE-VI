// OSCE Data Structure
const osceData = {
    categories: [
        {
            id: 'A',
            name: 'Cardiovaskular',
            items: [
                'Pemeriksaan Fisik Kardiovaskular I',
                'Pemeriksaan Fisik Kardiovaskuler II',
                'Resusitasi Jantung Paru (RJP)',
                'Pemasangan dan Interpretasi EKG Sederhana',
                'AED',
                'Defibrillator',
                'Cardioversion'
            ]
        },
        {
            id: 'B',
            name: 'Emergency',
            items: [
                'Heimlich Manuver',
                'Pemeriksaan Ekstraksi Benda Asing Hidung',
                'Pemasangan Tampon Hidung Anterior',
                'Penatalaksanaan Ekstraksi Kuku',
                'Pemasangan Infus (Kateter Intravena Perifer)',
                'Pengambilan Darah Vena',
                'Pediatric Assessment Triangle (PAT)',
                'Resusitasi Neonatus',
                'Penjahitan Luka (Hecting)',
                'Sirkumsisi',
                'Penatalaksanaan Hipertensi Emergency dan Urgency',
                'Pemasangan ETT dan Intubasi',
                'Penatalaksanaan Cricothyroidotomy dan Pneumothorax'
            ]
        },
        {
            id: 'C',
            name: 'Reproductive',
            items: [
                'Pemeriksaan Genetalia Eksterna Wanita',
                'Pemeriksaan Kehamilan (Leopold)',
                'Pemeriksaan Ginekologi',
                'Pap Smear',
                'Persalinan Normal dan Patograf',
                'Episiotomi dan Perawatan Luka Pascapersalinan',
                'Kuretase Abortus <10 Minggu',
                'Penilaian Pemasangan IUD',
                'Bimanual Kompresi pada Atonia Uteri',
                'Penilaian Pemeriksaan Payudara'
            ]
        },
        {
            id: 'D',
            name: 'Urinary',
            items: [
                'Pemeriksaan Luar Urogenital (Pria)',
                'Pemasangan Kateter Urin (Laki-laki)',
                'Pungsi (Aspirasi) Suprapubik'
            ]
        }
    ]
};

// Create flattened list with item numbers (1-33)
function createFlattenedList() {
    let itemNumber = 1;
    const flattened = [];
    
    osceData.categories.forEach(category => {
        category.items.forEach(item => {
            flattened.push({
                number: itemNumber,
                category: category.id,
                categoryName: category.name,
                name: item
            });
            itemNumber++;
        });
    });
    
    return flattened;
}

const allItems = createFlattenedList();

// State Management
let state = {
    isRunning: false,
    selectedStations: [],
    startTime: null,
    interval: null,
    timerSeconds: 0
};

// Elements
const generateBtn = document.getElementById('generateBtn');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerPhase = document.getElementById('timerPhase');
const stationsList = document.getElementById('stationsList');
const finishedMessage = document.getElementById('finishedMessage');

// Random station selector - picks ONE from each category (A, B, C, D)
function selectRandomStations() {
    const categories = ['A', 'B', 'C', 'D'];
    const selectedStations = [];
    
    categories.forEach(catId => {
        selectedStations.push(rerollCategory(catId, false));
    });
    
    return selectedStations;
}

// Reroll a single category station
function rerollCategory(categoryId, updateDisplay = true) {
    const itemsInCategory = allItems.filter(item => item.category === categoryId);
    const current = state.selectedStations.find(item => item.category === categoryId);
    let randomItem = itemsInCategory[Math.floor(Math.random() * itemsInCategory.length)];

    if (current) {
        while (randomItem.number === current.number) {
            randomItem = itemsInCategory[Math.floor(Math.random() * itemsInCategory.length)];
        }
        state.selectedStations = state.selectedStations.map(item =>
            item.category === categoryId ? randomItem : item
        );
    }

    if (updateDisplay) {
        displayStations();
    }

    return randomItem;
}

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Determine current phase and remaining time
function getPhaseInfo(seconds) {
    if (seconds < 120) {
        // First 2 minutes: Reading phase
        return {
            phase: 'Reading Phase (2 minutes)',
            remaining: 120 - seconds,
            isReadingPhase: true,
            isActionPhase: false
        };
    } else if (seconds < 540) {
        // After 2 minutes, up to 9 minutes: Action phase
        return {
            phase: 'Action Phase (7 minutes)',
            remaining: 540 - seconds,
            isReadingPhase: false,
            isActionPhase: true
        };
    } else {
        // 9 minutes reached: Done
        return {
            phase: 'Complete',
            remaining: 0,
            isReadingPhase: false,
            isActionPhase: false
        };
    }
}

// Display selected stations and per-category reroll buttons
function displayStations() {
    if (state.selectedStations.length === 0) {
        stationsList.innerHTML = '<p>Click "Start Simulation" to generate stations</p>';
        return;
    }

    const canReroll = !state.isRunning;

    stationsList.innerHTML = state.selectedStations
        .map((station, index) => {
            return `
                <div class="station-item">
                    <div class="station-category">
                        ${station.categoryName}
                    </div>
                    <div class="station-name">
                        <span class="station-number">${station.number}</span>
                        ${station.name}
                    </div>
                    <button class="reroll-btn" data-category="${station.category}" ${canReroll ? '' : 'disabled'}>
                        Reroll ${station.categoryName}
                    </button>
                </div>
            `;
        })
        .join('');

    document.querySelectorAll('.reroll-btn').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category');
            rerollCategory(categoryId);
        });
    });
}

// Update timer display and handle color changes
function updateTimer() {
    const phaseInfo = getPhaseInfo(state.timerSeconds);
    
    timerDisplay.textContent = formatTime(phaseInfo.remaining);
    timerPhase.textContent = phaseInfo.phase;

    // Remove all timer classes
    timerDisplay.classList.remove('warning', 'alert');

    // Check for alert state (1 minute left in action phase, i.e., at 8 minutes total)
    if (state.timerSeconds >= 480 && state.timerSeconds < 540 && phaseInfo.isActionPhase) {
        timerDisplay.classList.add('alert');
        document.body.classList.add('alert-red');
    } else {
        document.body.classList.remove('alert-red');
    }

    // Check for completion (9 minutes = 540 seconds)
    if (state.timerSeconds >= 540) {
        handleSimulationComplete();
    }
}

// Start the timer
function startTimer() {
    if (state.isRunning || state.selectedStations.length === 0) return;

    state.isRunning = true;
    state.timerSeconds = 0;
    finishedMessage.classList.add('hidden');
    document.body.classList.remove('alert-red');

    startBtn.disabled = true;
    generateBtn.disabled = true;
    resetBtn.disabled = false;

    displayStations();
    updateTimer();

    // Update timer every second
    state.interval = setInterval(() => {
        state.timerSeconds++;
        updateTimer();
    }, 1000);
}

// Handle simulation completion
function handleSimulationComplete() {
    clearInterval(state.interval);
    state.isRunning = false;
    
    timerDisplay.classList.remove('alert');
    document.body.classList.remove('alert-red');
    finishedMessage.classList.remove('hidden');

    startBtn.disabled = true;
    generateBtn.disabled = false;
    startBtn.textContent = 'Start Timer';
    displayStations();
}

// Reset timer only
function resetTimer() {
    clearInterval(state.interval);
    state.isRunning = false;
    state.timerSeconds = 0;

    finishedMessage.classList.add('hidden');
    timerDisplay.classList.remove('warning', 'alert');
    document.body.classList.remove('alert-red');

    startBtn.disabled = false;
    generateBtn.disabled = false;
    resetBtn.disabled = true;

    timerDisplay.textContent = '00:00';
    timerPhase.textContent = 'Ready to Start';
    displayStations();
}

// Event listeners
generateBtn.addEventListener('click', () => {
    if (state.isRunning) return;
    state.selectedStations = selectRandomStations();
    finishedMessage.classList.add('hidden');
    displayStations();
    startBtn.disabled = false;
});

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize
resetTimer();
