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
// const usernameDisplay = document.getElementById("usernameDisplay");

const moodPopup = document.getElementById("moodPopup");
const moodForm = document.getElementById("moodForm");
const closePopupBtn = document.getElementById("closePopup");

// let loggedIn = false;
let chart = null;
;

// ================== DROPDOWN ==================
if (profileBtn) {
    profileBtn.onclick = () => {
        dropdown.classList.toggle("show");
    };
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
        // if (!loggedIn) {
        //     alert("Please login first!");
        //     return;
        // }
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


// Function to update mood count badges below the chart
function updateMoodCount(moodCount) {
    const countContainer = document.getElementById("moodCountContainer");

    // Clear any existing content
    if (countContainer) {
        countContainer.innerHTML = "";  // Clear the container
    }

    // Create a flex container to hold emoji + count elements
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexWrap = "wrap";  // To allow multiple lines if there are many moods
    container.style.gap = "15px"; // Add some spacing between emoji + count pairs
    container.style.justifyContent = "center";  // Center the elements

    // Emojis mapping to moods
    const moodEmojis = {
        "Very Sad": "😢",
        "Sad": "😞",
        "Neutral": "😐",
        "Happy": "😊",
        "Very Happy": "😄"
    };

    // Emojis mapping to mood colors
    const moodColors = {
        "Very Sad": "#ff7a7a",  // Light Red
        "Sad": "#c1a0ff",  // Light Purple
        "Neutral": "#7db3ff",  // Light Blue
        "Happy": "#66ea86",  // Green
        "Very Happy": "#ffcf5b"  // Yellow
    };

    // Iterate through the moodCount and display the emoji + count
    Object.entries(moodCount).forEach(([mood, count]) => {
        if (count > 0) {
            // Create an individual element for each mood
            const moodElement = document.createElement("div");
            moodElement.style.display = "flex";
            moodElement.style.alignItems = "center";
            moodElement.style.fontSize = "18px";
            moodElement.style.fontWeight = "600";
            moodElement.style.flexDirection = "column";
            moodElement.style.textAlign = "center";

            // Create the emoji with an outline effect
            const emoji = document.createElement("span");
            emoji.textContent = moodEmojis[mood];
            emoji.style.fontSize = "40px";  // Make the emoji larger
            emoji.style.padding = "8px";  // Padding around the emoji for space
            emoji.style.borderRadius = "50%";  // Rounded corners for the emoji
            emoji.style.backgroundColor = "white";  // Background color of the emoji
            emoji.style.marginBottom = "5px";  // Space between emoji and count

            // Apply text-shadow to create an outline effect for the emoji
            const outlineColor = moodColors[mood] || "#000";  // Default to black if no color found
            emoji.style.textShadow = `0 0 5px ${outlineColor}, 0 0 10px ${outlineColor}, 0 0 15px ${outlineColor}`;

            // Create the count
            const countText = document.createElement("span");
            countText.textContent = count;
            countText.style.fontSize = "20px";  // Slightly smaller font for the count
            countText.style.fontWeight = "bold";

            // Append emoji and count to the mood element
            moodElement.appendChild(emoji);
            moodElement.appendChild(countText);

            // Add the mood element to the container
            container.appendChild(moodElement);
        }
    });

    // Append the container to the moodCountContainer
    countContainer.appendChild(container);
}


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

        console.log("Mood Count Data:", moodCount);

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
                        ticks: { autoSkip: false },
                        title: {
                        display: true,
                        text: 'Date'
                    }
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

        // pie chart
        const moodCountCtx = document.getElementById("moodCountChart");
        if (moodCountCtx) {
            new Chart(moodCountCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'],
                    datasets: [{
                        data: [
                            moodCount['Very Sad'],
                            moodCount['Sad'],
                            moodCount['Neutral'],
                            moodCount['Happy'],
                            moodCount['Very Happy']
                        ],
                        backgroundColor: [
                            "#ff7a7a", "#c1a0ff", "#7db3ff", "#66ea86", "#ffcf5b"
                        ],
                        borderWidth: 1,
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    cutout: '60%',  // This makes the doughnut larger (reduce the cutout)
                    rotation: -90, // Starts from the top to make it a half-pie chart
                    circumference: 180, // Limits the chart to 180 degrees (half-pie)
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return `${tooltipItem.label}: ${tooltipItem.raw}`;
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false, // Disable the legend
                        }
                    }
                }
            });

            // After initializing the chart, update the total mood count below the chart
            const totalMoodCount = Object.values(moodCount).reduce((acc, curr) => acc + curr, 0);
            const totalMoodElement = document.getElementById("totalMoodCount");
            if (totalMoodElement) {
                totalMoodElement.textContent = `${totalMoodCount}`;
            }
        }

        // Update mood count badges below the chart
        updateMoodCount(moodCount);  // Call this function to update badges below the chart

        });
}



//MONTHLY CHART
function loadMonthlyData(selectedDate = new Date()) {
    fetch("/api/monthly/")
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById("calendarContainer");
        const calendarHeader = document.getElementById("calendarMonthYear");
        const prevMonthBtn = document.getElementById("prevMonthBtn");
        const nextMonthBtn = document.getElementById("nextMonthBtn");

        if (!container) return;
        container.innerHTML = "";

        // Display the month and year
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();
        const monthName = selectedDate.toLocaleString('default', { month: 'long' });
        const year = selectedDate.getFullYear();
        calendarHeader.textContent = `${monthName} ${year}`;

        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Add the day headers (Sunday, Monday, etc.)
        daysOfWeek.forEach(day => {
            const header = document.createElement("div");
            header.className = "day-header";
            header.textContent = day;
            container.appendChild(header);
        });

        // Get the first day of the selected month (for positioning the dates correctly)
        const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate(); // Get total days in month

        // Create empty divs for the days of the previous month that fall before the first day of the current month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const div = document.createElement("div");
            div.className = "day empty"; // Empty div for previous month
            container.appendChild(div);
        }

        // Display the actual days for the current month
        const logsPerDay = {};
        data.forEach(entry => {
            const d = new Date(entry.date);
            if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
                const day = d.getDate();
                if (!logsPerDay[day]) logsPerDay[day] = [];
                logsPerDay[day].push(moodValues[entry.mood] ?? 0);
            }
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = i;

            if (logsPerDay[i] && logsPerDay[i].length > 0) {
                const avg = logsPerDay[i].reduce((a,b) => a + b, 0) / logsPerDay[i].length;
                div.style.background = getMoodColor(avg);
            } else {
                div.style.background = "#eee";
            }
            container.appendChild(div);
        }

        // Navigate to the previous month
        prevMonthBtn.onclick = () => {
            const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
            loadMonthlyData(prevMonthDate);
        };

        // Navigate to the next month
        nextMonthBtn.onclick = () => {
            const nextMonthDate = new Date(selectedYear, selectedMonth + 1, 1);
            loadMonthlyData(nextMonthDate);
        };
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
