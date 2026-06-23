// OSCE Data Structure
const osceData = {
    categories: [
        {
            id: 'A',
            name: 'Cardiovascular',
            items: [
                'Pemeriksaan Fisik Kardiovaskular I',
                'Pemeriksaan Fisik Kardiovaskular II',
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

const STATION_DURATION = 420; // 7 minutes total in seconds

let state = {
    stations: []
};

let generateBtn = null;
let stationsList = null;
let selectionPanel = null;
let selectionError = null;

function init() {
    generateBtn = document.getElementById('generateBtn');
    stationsList = document.getElementById('stationsList');
    selectionPanel = document.getElementById('selectionPanel');
    selectionError = document.getElementById('selectionError');

    if (!generateBtn || !stationsList || !selectionPanel || !selectionError) {
        console.error('Missing required UI elements:', {
            generateBtn,
            stationsList,
            selectionPanel,
            selectionError
        });
        return;
    }

    generateBtn.addEventListener('click', generateStations);
    renderSelectionPanel();
    renderStations();
}

function getRandomStationItem(categoryId, excludeNumber = null) {
    const category = osceData.categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    let index = Math.floor(Math.random() * category.items.length);
    let number = getCategoryStartNumber(categoryId) + index;

    if (excludeNumber !== null && category.items.length > 1) {
        while (number === excludeNumber) {
            index = Math.floor(Math.random() * category.items.length);
            number = getCategoryStartNumber(categoryId) + index;
        }
    }

    return {
        number,
        category: categoryId,
        categoryName: category.name,
        name: category.items[index]
    };
}

function getCategoryStartNumber(categoryId) {
    let number = 1;
    for (const category of osceData.categories) {
        if (category.id === categoryId) break;
        number += category.items.length;
    }
    return number;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderSelectionPanel() {
    selectionPanel.innerHTML = osceData.categories.map(category => {
        return `
            <div class="filter-category">
                <h3>${escapeHtml(category.name)}</h3>
                ${category.items.map(item => `
                    <label class="filter-option">
                        <input type="checkbox" name="filter-${category.id}" value="${escapeHtml(item)}" checked>
                        ${escapeHtml(item)}
                    </label>
                `).join('')}
            </div>
        `;
    }).join('');
}

function createStation(categoryId) {
    const item = getRandomStationItem(categoryId);
    return {
        ...item,
        timerSeconds: 0,
        isRunning: false,
        finished: false,
        intervalId: null,
        announcedStart: false,
        announcedOneMinute: false,
        announcedFinish: false
    };
}

function getSelectedItems(categoryId) {
    const checkboxes = document.querySelectorAll(`input[name="filter-${categoryId}"]:checked`);
    return Array.from(checkboxes).map(input => input.value);
}

function showSelectionError(message) {
    selectionError.textContent = message;
    selectionError.classList.remove('hidden');
}

function clearSelectionError() {
    selectionError.textContent = '';
    selectionError.classList.add('hidden');
}

function generateStations() {
    clearSelectionError();

    const selectedCategories = osceData.categories.map(category => {
        const selected = getSelectedItems(category.id);
        if (selected.length === 0) {
            showSelectionError(`Please select at least one checklist for ${category.name}.`);
        }
        return { category, selected };
    });

    if (selectedCategories.some(c => c.selected.length === 0)) {
        return;
    }

    clearAllIntervals();
    state.stations = selectedCategories.map(({ category, selected }) => {
        const itemName = selected[Math.floor(Math.random() * selected.length)];
        const itemIndex = category.items.indexOf(itemName);
        const number = getCategoryStartNumber(category.id) + itemIndex;
        return {
            number,
            category: category.id,
            categoryName: category.name,
            name: itemName,
            timerSeconds: 0,
            isRunning: false,
            finished: false,
            intervalId: null,
            announcedStart: false,
            announcedOneMinute: false,
            announcedFinish: false
        };
    });

    renderStations();
}

function clearAllIntervals() {
    state.stations.forEach(station => {
        if (station.intervalId) {
            clearInterval(station.intervalId);
            station.intervalId = null;
        }
    });
}

function anyTimerRunning() {
    return state.stations.some(station => station.isRunning);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getRemainingSeconds(seconds) {
    return Math.max(0, STATION_DURATION - seconds);
}

function getPhaseText(seconds) {
    if (seconds >= STATION_DURATION) return 'Finished';
    return 'In Progress';
}

function renderStations() {
    console.log('renderStations called, station count=', state.stations.length);
    if (state.stations.length === 0) {
        stationsList.innerHTML = '<p>Click "Generate Stations" to generate 4 station cards.</p>';
        return;
    }

    const lockReroll = anyTimerRunning();

    stationsList.innerHTML = state.stations.map(station => {
        const remaining = getRemainingSeconds(station.timerSeconds);
        return `
            <div class="station-card" data-category="${station.category}">
                <div class="station-header">
                    <div class="station-category">${station.categoryName}</div>
                    <div class="station-number">${station.number}</div>
                </div>
                <div class="station-details">${station.name}</div>
                <div class="station-actions">
                    <button class="btn btn-secondary reroll-btn" data-category="${station.category}" ${lockReroll ? 'disabled' : ''}>
                        Reroll
                    </button>
                    <button class="btn btn-primary start-btn" data-category="${station.category}" ${station.isRunning || station.finished ? 'disabled' : ''}>
                        ${station.isRunning ? 'Running...' : 'Start Timer'}
                    </button>
                    <button class="btn btn-secondary reset-btn" data-category="${station.category}" ${station.timerSeconds === 0 && !station.finished ? 'disabled' : ''}>
                        Reset Timer
                    </button>
                </div>
                <div class="station-timer">${formatTime(remaining)}</div>
                <div class="station-phase">${getPhaseText(station.timerSeconds)}</div>
            </div>
        `;
    }).join('');

    attachCardListeners();
}

function attachCardListeners() {
    document.querySelectorAll('.reroll-btn').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category');
            rerollStation(categoryId);
        });
    });

    document.querySelectorAll('.start-btn').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category');
            startStationTimer(categoryId);
        });
    });

    document.querySelectorAll('.reset-btn').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category');
            resetStationTimer(categoryId);
        });
    });
}

function playBell(duration = 200, frequency = 880, volume = 0.5) {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
    }, duration);
}

function speakText(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
}

function playBellAndSpeak(text) {
    if (!window.AudioContext && !window.webkitAudioContext) {
        speakText(text);
        return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.6;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
        speakText(text);
    }, 200);
}

function rerollStation(categoryId) {
    if (anyTimerRunning()) return;

    const station = state.stations.find(s => s.category === categoryId);
    if (!station) return;

    const newStation = getRandomStationItem(categoryId, station.number);
    station.number = newStation.number;
    station.name = newStation.name;
    station.categoryName = newStation.categoryName;
    station.timerSeconds = 0;
    station.isRunning = false;
    station.finished = false;
    station.intervalId = null;
    station.announcedStart = false;
    station.announcedOneMinute = false;
    station.announcedFinish = false;

    renderStations();
}

function startStationTimer(categoryId) {
    const station = state.stations.find(s => s.category === categoryId);
    if (!station || station.isRunning || station.finished) return;

    station.isRunning = true;
    station.announcedStart = false;
    station.announcedOneMinute = false;
    station.announcedFinish = false;

    playBellAndSpeak('Please enter the room.');
    station.announcedStart = true;

    station.intervalId = setInterval(() => {
        station.timerSeconds += 1;
        const remaining = getRemainingSeconds(station.timerSeconds);

        if (remaining === 60 && !station.announcedOneMinute) {
            speakText('One minute left.');
            station.announcedOneMinute = true;
        }

        if (station.timerSeconds >= STATION_DURATION) {
            completeStationTimer(categoryId);
        } else {
            renderStations();
        }
    }, 1000);

    renderStations();
}

function completeStationTimer(categoryId) {
    const station = state.stations.find(s => s.category === categoryId);
    if (!station) return;

    station.isRunning = false;
    station.finished = true;
    station.timerSeconds = STATION_DURATION;
    if (station.intervalId) {
        clearInterval(station.intervalId);
        station.intervalId = null;
    }

    if (!station.announcedFinish) {
        playBellAndSpeak('You can leave the room.');
        station.announcedFinish = true;
    }

    renderStations();
}

function resetStationTimer(categoryId) {
    const station = state.stations.find(s => s.category === categoryId);
    if (!station) return;

    if (station.intervalId) {
        clearInterval(station.intervalId);
        station.intervalId = null;
    }

    station.timerSeconds = 0;
    station.isRunning = false;
    station.finished = false;
    station.announcedStart = false;
    station.announcedOneMinute = false;
    station.announcedFinish = false;

    renderStations();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
