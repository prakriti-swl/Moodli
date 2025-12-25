// ================== UTIL ==================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
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

const moodPopup = document.getElementById("moodPopup");
const moodForm = document.getElementById("moodForm");
const closePopupBtn = document.getElementById("closePopup");

const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const emojiInput = document.getElementById("emojiInput");
const toast = document.getElementById("toast");

// ================== DROPDOWN ==================
if (profileBtn) {
    profileBtn.onclick = () => dropdown.classList.toggle("show");
}

// CLOSE DROPDOWN ON OUTSIDE CLICK
document.addEventListener("click", (e) => {
    if (profileBtn && dropdown &&
        !profileBtn.contains(e.target) &&
        !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

// ================== POPUP ==================
document.addEventListener("click", (e) => {
    if (e.target.id === "logMoodBtn") moodPopup.classList.remove("hidden");
});

if (closePopupBtn) closePopupBtn.onclick = () => moodPopup.classList.add("hidden");

// ================== EMOJI PICKER ==================
emojiBtn.addEventListener("click", () => emojiPicker.classList.toggle("hidden"));

emojiPicker.querySelectorAll("span").forEach(emoji => {
    emoji.addEventListener("click", () => {
        emojiInput.value = emoji.textContent;
        emojiBtn.textContent = emoji.textContent;
        emojiPicker.classList.add("hidden");
    });
});

// ================== TOAST ==================
function showToast(message, bgColor) {
    toast.textContent = message;
    toast.style.background = bgColor;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ================== MOOD SUBMISSION (ONE HANDLER) ==================
let isSubmitting = false;

if (moodForm) {
    moodForm.onsubmit = async function(e) {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;

        const selectedMood = document.querySelector("input[name='mood']:checked");
        if (!selectedMood) {
            showToast("Please select a mood", "#ffcccc");
            isSubmitting = false;
            return;
        }

        const tag = document.getElementById("tagInput").value;
        const tagEmoji = document.getElementById("emojiInput").value;

        const saveBtn = document.getElementById("saveMoodBtn");
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            const response = await fetch("/api/log-mood/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken
                },
                body: JSON.stringify({
                    mood: selectedMood.value,
                    tag: tag,
                    tag_emoji: tagEmoji
                })
            });

            if (response.ok) {
                showToast("Mood Saved!", "#d4f8d4");
                moodForm.reset();
                emojiBtn.textContent = "😊";
                moodPopup.classList.add("hidden");

                if (document.getElementById("weeklyChart")) {
                    loadWeeklyData();
                    loadMonthlyData();
                }
            } else {
                showToast("Error saving mood", "#ffcccc");
            }
        } catch {
            showToast("Network error", "#ffcccc");
        }

        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
        isSubmitting = false;
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
//SAFE GLOBAL CHART REFERENCES
var weeklyLineChart = null;
var weeklyMoodCountChart = null;

// LOAD WEEKLY DATA
function loadWeeklyData(selectedDate = new Date()) {

    const formattedDate = selectedDate.toISOString().split("T")[0];

    fetch(`/api/weekly/?date=${formattedDate}`)
        .then(res => res.json())
        .then(data => {

            const ctx = document.getElementById("weeklyChart");
            if (!ctx) return;

            // Sort data by date
            data.sort((a, b) => new Date(a.date) - new Date(b.date));

            //LABELS & VALUES
            const labels = data.map(log =>
                new Date(log.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                })
            );

            const values = data.map(log => moodValues[log.mood]);
            const colors = data.map(log =>
                getMoodColor(moodValues[log.mood])
            );

            // MOOD COUNT
            const moodCount = {
                "Very Sad": 0,
                "Sad": 0,
                "Neutral": 0,
                "Happy": 0,
                "Very Happy": 0
            };

            data.forEach(log => {
                if (moodCount.hasOwnProperty(log.mood)) {
                    moodCount[log.mood]++;
                }
            });

            // DESTROY OLD CHARTS
            if (weeklyLineChart) weeklyLineChart.destroy();
            if (weeklyMoodCountChart) weeklyMoodCountChart.destroy();

            // WEEKLY LINE CHART
            weeklyLineChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        pointBackgroundColor: colors,
                        pointRadius: 5,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        spanGaps: true,
                        segment: {
                            borderColor: ctx =>
                                colors[ctx.p1DataIndex] || "#666"
                        }
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: { autoSkip: false },
                            title: {
                                display: true,
                                text: "Date",
                                font: {
                                    size: 19,       // 👈 increase this
                                    weight: "bold"  
                                },
                                padding: {
                                    top: 20
                                }
                            }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                font: { size: 18 },
                                callback: value => {
                                    switch (value) {
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

            // MOOD COUNT DOUGHNUT CHART
            const moodCtx = document.getElementById("moodCountChart");
            if (moodCtx) {
                weeklyMoodCountChart = new Chart(moodCtx, {
                    type: "doughnut",
                    data: {
                        labels: [
                            "Very Sad",
                            "Sad",
                            "Neutral",
                            "Happy",
                            "Very Happy"
                        ],
                        datasets: [{
                            data: [
                                moodCount["Very Sad"],
                                moodCount["Sad"],
                                moodCount["Neutral"],
                                moodCount["Happy"],
                                moodCount["Very Happy"]
                            ],
                            backgroundColor: [
                                "#ff7a7a",
                                "#c1a0ff",
                                "#7db3ff",
                                "#66ea86",
                                "#ffcf5b"
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        cutout: "60%",
                        rotation: -90,
                        circumference: 180,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx =>
                                        `${ctx.label}: ${ctx.raw}`
                                }
                            }
                        }
                    }
                });

                // TOTAL MOOD COUNT
                const totalMood = Object.values(moodCount)
                    .reduce((a, b) => a + b, 0);

                const totalEl = document.getElementById("totalMoodCount");
                if (totalEl) {
                    totalEl.textContent = totalMood;
                }
            }

            // BADGES UPDATE
            updateMoodCount(moodCount);
        });
}

//DATE PICKER BUTTON
document.getElementById("loadChartBtn")
    .addEventListener("click", () => {

        const input = document.getElementById("chartDate").value;
        if (!input) return;

        loadWeeklyData(new Date(input));
    });

// LOAD CURRENT WEEK ON PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
    loadWeeklyData(new Date());
});


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
