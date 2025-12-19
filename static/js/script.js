// ================== UTIL ==================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = cookie.substring(name.length + 1);
                break;
            }
        }
    }
    return cookieValue;
}

const csrfToken = getCookie("csrftoken");

// ================== ELEMENTS ==================
const profileBtn = document.getElementById("profileMenuBtn");
const dropdown = document.getElementById("profileDropdown");
const usernameDisplay = document.getElementById("usernameDisplay");

const moodPopup = document.getElementById("moodPopup");
const moodForm = document.getElementById("moodForm");
const closePopupBtn = document.getElementById("closePopup");

let loggedIn = false;
let chart = null;

// ================== LOGIN STATE ==================
fetch("/admin/", { method: "GET" })
    .then(res => {
        if (!res.redirected) {
            loggedIn = true;
            if (usernameDisplay) {
                usernameDisplay.textContent = "User";
            }
        }
        updateDropdown();
    });

// ================== DROPDOWN ==================
if (profileBtn) {
    profileBtn.onclick = () => {
        dropdown.classList.toggle("show");
    };
}

function updateDropdown() {
    if (!dropdown) return;

    dropdown.innerHTML = "";

    if (!loggedIn) {
        dropdown.innerHTML = `
            <div onclick="handleDropdownAction('/admin/login/')">Login</div>
        `;
    } else {
        dropdown.innerHTML = `
            <div onclick="handleDropdownAction('/dashboard/')">Dashboard</div>
            <div onclick="handleDropdownAction('/admin/logout/')">Logout</div>
        `;
    }
}

function handleDropdownAction(action) {
    dropdown.classList.remove("show");
    setTimeout(() => {
        window.location.href = action;
    }, 200);
}

// ================== CLOSE DROPDOWN ON OUTSIDE CLICK ==================
document.addEventListener("click", (e) => {
    if (profileBtn && dropdown &&
        !profileBtn.contains(e.target) &&
        !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

// ================== POPUP ==================
document.addEventListener("click", (e) => {
    if (e.target.id === "logMoodBtn") {
        if (!loggedIn) {
            alert("Please login first!");
            return;
        }
        moodPopup.classList.remove("hidden");
    }
});

if (closePopupBtn) {
    closePopupBtn.onclick = () => {
        moodPopup.classList.add("hidden");
    };
}

// ================== SEND MOOD ==================
if (moodForm) {
    moodForm.onsubmit = function (e) {
        e.preventDefault();

        const selected = document.querySelector("input[name='mood']:checked");
        if (!selected) return;

        fetch("/api/log-mood/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({ mood: selected.value })
        })
        .then(res => res.json())
        .then(() => {
            moodPopup.classList.add("hidden");

            if (document.getElementById("weeklyChart")) {
                loadWeeklyData();
                loadMonthlyData();
            }
        });
    };
}

// ================== MOOD VALUES & COLOR ==================
const moodValues = {
    "Very Sad": 15,
    "Sad": 35,
    "Neutral": 55,
    "Happy": 75,
    "Very Happy": 95
};

function getMoodColor(value) {
    if (value >= 0 && value <= 19) return "#ff7a7a";   // Very Sad
    if (value >= 20 && value <= 39) return "#c1a0ff";  // Sad
    if (value >= 40 && value <= 59) return "#7db3ff";  // Neutral
    if (value >= 60 && value <= 79) return "#66ea86";  // Happy
    if (value >= 80 && value <= 100) return "#ffcf5b"; // Very Happy
    return "#000"; // fallback
}

// ================== DATE DIVIDER PLUGIN ==================
const dateDividerPlugin = {
    id: 'dateDivider',
    afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const xScale = scales.x;
        const labels = chart.data.labels;

        if (!labels?.length) return;

        ctx.save();
        ctx.strokeStyle = '#bbb';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;

        for (let i = 1; i < labels.length; i++) {
            if (labels[i] !== labels[i - 1]) {
                const x = xScale.getPixelForValue(i);
                ctx.beginPath();
                ctx.moveTo(x, chartArea.top);
                ctx.lineTo(x, chartArea.bottom);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
};

// WEEKLY CHART
function loadWeeklyData(selectedDate = new Date()) {
    fetch("/api/weekly/")
    .then(res => res.json())
    .then(data => {
        const ctx = document.getElementById("weeklyChart");
        if (!ctx) return;

        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate the start and end of the week based on the selected date
        const dayOfWeek = selectedDate.getDay();
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        // Filter data for the selected week
        const weeklyData = data.filter(log => {
            const d = new Date(log.date);
            return d >= monday && d <= sunday;
        });

        const labels = weeklyData.map(log =>
            new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        );
        const values = weeklyData.map(log => moodValues[log.mood]);
        const colors = weeklyData.map(log => getMoodColor(moodValues[log.mood]));

        // Mood count for the week
        const moodCount = {
            "Very Sad": 0,
            "Sad": 0,
            "Neutral": 0,
            "Happy": 0,
            "Very Happy": 0
        };
        weeklyData.forEach(log => {
            if (moodCount.hasOwnProperty(log.mood)) moodCount[log.mood]++;
        });

        // If there's already an existing chart, destroy it before creating a new one
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    data: values,
                    pointBackgroundColor: colors,
                    pointRadius: 4,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.3,
                    spanGaps: true,
                    segment: {
                        borderColor: ctx => colors[ctx.p1DataIndex] || "#666"
                    }
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { autoSkip: false }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            font: { size: 18 },
                            callback: v => {
                                switch(v) {
                                    case 100: return "😄";
                                    case 80: return "😊";
                                    case 60: return "😐";
                                    case 40: return "😞";
                                    case 20: return "😢";
                                    default: return "";
                                }
                            }
                        }
                    }
                }
            },
            plugins: [dateDividerPlugin]
        });

        // Update mood count badges
        const countContainer = document.getElementById("moodCountContainer");
        if (countContainer) {
            countContainer.innerHTML = "";
            Object.entries(moodCount).forEach(([mood, count]) => {
                if (count > 0) {
                    const badge = document.createElement("span");
                    badge.textContent = `${mood}: ${count}`;
                    badge.style.backgroundColor = getMoodColor(moodValues[mood] ?? -1);
                    badge.style.color = "#222";
                    badge.style.marginRight = "10px";
                    badge.style.padding = "6px 14px";
                    badge.style.borderRadius = "20px";
                    badge.style.fontWeight = "600";
                    badge.style.fontSize = "14px";
                    badge.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";
                    countContainer.appendChild(badge);
                }
            });
        }
    });
}


//MONTHLY CHART
function loadMonthlyData(selectedDate = new Date()) {
    fetch("/api/monthly/")
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById("calendarContainer");
        if (!container) return;
        container.innerHTML = "";

        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        // Display the month and year
        const monthName = selectedDate.toLocaleString('default', { month: 'long' });
        const year = selectedDate.getFullYear();
        const monthTitle = document.createElement("h4");
        monthTitle.textContent = `${monthName} ${year}`;
        container.insertBefore(monthTitle, container.firstChild);

        const logsPerDay = {};
        data.forEach(entry => {
            const d = new Date(entry.date);
            if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
                const day = d.getDate();
                if (!logsPerDay[day]) logsPerDay[day] = [];
                logsPerDay[day].push(moodValues[entry.mood] ?? 0);
            }
        });

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = i;

            if (logsPerDay[i] && logsPerDay[i].length > 0) {
                const avg = logsPerDay[i].reduce((a,b)=>a+b,0)/logsPerDay[i].length;
                div.style.background = getMoodColor(avg);
            } else {
                div.style.background = "#eee";
            }
            container.appendChild(div);
        }
    });
}


// ================== AUTO LOAD DASHBOARD DATA ==================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("weeklyChart")) {
        loadWeeklyData();
        loadMonthlyData();
    }

    const loadChartBtn = document.getElementById("loadChartBtn");
    if (loadChartBtn) {
        loadChartBtn.onclick = () => {
            const input = document.getElementById("chartDate").value;
            const selectedDate = input ? new Date(input) : new Date();
            loadWeeklyData(selectedDate);
            loadMonthlyData(selectedDate);
        };
    }

});
