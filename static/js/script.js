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
// Simple session check (same behavior you had)
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

            // Reload charts if on dashboard page
            if (document.getElementById("weeklyChart")) {
                loadWeeklyData();
                loadMonthlyData();
            }
        });
    };
}


// ================== WEEKLY CHART ==================
function loadWeeklyData() {
    fetch("/api/weekly/")
        .then(res => res.json())
        .then(data => {
            const ctx = document.getElementById("weeklyChart");
            if (!ctx) return;

            const moodColors = {
                "Very Happy": "#ffcf5b",
                "Happy": "#66ea86",
                "Neutral": "#7db3ff",
                "Sad": "#c1a0ff",
                "Very Sad": "#ff7a7a"
            };

            const colors = data.map(m => moodColors[m.mood]);

            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    datasets: [{
                        data: new Array(colors.length).fill(1),
                        backgroundColor: colors
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { display: false } }
                }
            });
        });
}


// ================== MONTHLY CALENDAR ==================
function loadMonthlyData() {
    fetch("/api/monthly/")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("calendarContainer");
            if (!container) return;

            container.innerHTML = "";

            const moodColors = {
                "Very Happy": "#ffcf5b",
                "Happy": "#66ea86",
                "Neutral": "#7db3ff",
                "Sad": "#c1a0ff",
                "Very Sad": "#ff7a7a"
            };

            const moodByDay = {};
            data.forEach(entry => {
                const day = parseInt(entry.date.split("-")[2]);
                moodByDay[day] = moodColors[entry.mood];
            });

            const daysInMonth = 30;

            for (let i = 1; i <= daysInMonth; i++) {
                const div = document.createElement("div");
                div.className = "day";
                div.textContent = i;

                if (moodByDay[i]) {
                    div.style.background = moodByDay[i];
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
});
