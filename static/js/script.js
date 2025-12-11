// ------------------ UTIL ------------------
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

let csrfToken = getCookie("csrftoken");


// ------------------ ELEMENTS ------------------
const profileBtn = document.getElementById("profileMenuBtn");
const dropdown = document.getElementById("profileDropdown");
const usernameDisplay = document.getElementById("usernameDisplay");
const dashboardSection = document.getElementById("dashboardSection");
const homeSection = document.getElementById("homeSection");

const logMoodBtn = document.getElementById("logMoodBtn");
const moodPopup = document.getElementById("moodPopup");
const moodForm = document.getElementById("moodForm");


// ------------------ LOGIN STATE ------------------
let loggedIn = false; 
let weeklyData = [];

// Simulate login if user has a Django session
fetch("/admin/", { method: "GET" })
    .then(res => {
        if (res.redirected === false) {
            loggedIn = true;
            usernameDisplay.textContent = "User";
        }
        updateDropdown();
    });


// ------------------ DROPDOWN ------------------
profileBtn.onclick = () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
};

function updateDropdown() {
    dropdown.innerHTML = "";

    if (!loggedIn) {
        dropdown.innerHTML = `
            <div onclick="window.location.href='/admin/login/'">Login</div>
        `;
    } else {
        dropdown.innerHTML = `
            <div onclick="showDashboard()">Dashboard</div>
            <div onclick="window.location.href='/admin/logout/'">Logout</div>
        `;
    }
}


// ------------------ POPUP ------------------
logMoodBtn.onclick = () => {
    if (!loggedIn) {
        alert("Please login first!");
        return;
    }
    moodPopup.classList.remove("hidden");
};


// ------------------ SEND MOOD ------------------
moodForm.onsubmit = function (e) {
    e.preventDefault();

    const mood = document.querySelector("input[name='mood']:checked").value;

    fetch("/api/log-mood/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ mood })
    })
    .then(res => res.json())
    .then(() => {
        moodPopup.classList.add("hidden");
        loadWeeklyData();
        loadMonthlyData();
    });
};


// ------------------ CHART ------------------
let chart;

function loadWeeklyData() {
    fetch("/api/weekly/")
        .then(res => res.json())
        .then(data => {
            let moodColors = {
                "Very Happy": "#ffcf5b",
                "Happy": "#66ea86",
                "Neutral": "#7db3ff",
                "Sad": "#c1a0ff",
                "Very Sad": "#ff7a7a"
            };

            weeklyData = data.map(m => moodColors[m.mood]);

            let ctx = document.getElementById("weeklyChart");

            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                    datasets: [{
                        backgroundColor: weeklyData,
                        data: new Array(weeklyData.length).fill(1)
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { display: false } }
                }
            });
        });
}


// ------------------ MONTHLY CALENDAR ------------------
function loadMonthlyData() {
    fetch("/api/monthly/")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("calendarContainer");
            container.innerHTML = "";

            let moodColors = {
                "Very Happy": "#ffcf5b",
                "Happy": "#66ea86",
                "Neutral": "#7db3ff",
                "Sad": "#c1a0ff",
                "Very Sad": "#ff7a7a"
            };

            let moodByDay = {};
            data.forEach(entry => {
                let day = parseInt(entry.date.split("-")[2]);
                moodByDay[day] = moodColors[entry.mood];
            });

            let daysInMonth = 30;  

            for (let i = 1; i <= daysInMonth; i++) {
                let div = document.createElement("div");
                div.className = "day";
                div.textContent = i;

                if (moodByDay[i]) {
                    div.style.background = moodByDay[i];
                }

                container.appendChild(div);
            }
        });
}


// ------------------ SHOW DASHBOARD ------------------
function showDashboard() {
    homeSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    loadWeeklyData();
    loadMonthlyData();
}
