// --- DOM Elements ---
const taskInput = document.getElementById('task-input');
const timeInput = document.getElementById('time-input');
const subjectSelect = document.getElementById('subject-select');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const tasksCount = document.getElementById('tasks-count');
const hoursCount = document.getElementById('hours-count');
const starsContainer = document.getElementById('stars-container');

// --- State Management ---
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// Graph Data Structure for 3 Subjects
let examData = JSON.parse(localStorage.getItem('examData')) || {
    labels: [],
    physics: [],
    chemistry: [],
    maths: []
};

// Drive Links Storage
let driveLinks = JSON.parse(localStorage.getItem('driveLinks')) || {
    physics: 'https://drive.google.com',
    chemistry: 'https://drive.google.com',
    maths: 'https://drive.google.com'
};

// --- 1. Time Update ---
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').innerText = now.toLocaleTimeString();
    document.getElementById('current-date').innerText = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

// --- 2. Google Calendar Integration Helper ---
function addToGoogleCalendar(taskText, hours) {
    // Create a calendar event link for Today
    const now = new Date();
    const startTime = now.toISOString().replace(/-|:|\.\d\d\d/g, ""); // Format YYYYMMDDTHHMMSSZ
    
    // End time (add hours)
    const endTimeObj = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    const endTime = endTimeObj.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(taskText)}&details=Added+from+A+Timetable+Dashboard&dates=${startTime}/${endTime}`;
    
    window.open(url, '_blank');
}

// --- 3. Task Management ---
addBtn.addEventListener('click', addTask);

function addTask() {
    const taskText = taskInput.value;
    const taskTime = parseFloat(timeInput.value);
    const subject = subjectSelect.value;

    if (taskText === '' || isNaN(taskTime)) {
        alert("Please enter details correctly!");
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        subject: subject,
        hours: taskTime,
        completed: false
    };

    tasks.push(newTask);
    saveAndRender();
    
    taskInput.value = '';
    timeInput.value = '';
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        // Dynamic Calendar Button inside the task
        const calendarBtn = !task.completed ? 
            `<button class="cal-btn" onclick="addToGoogleCalendar('${task.subject}: ${task.text}', ${task.hours})" title="Add to Google Calendar" style="margin-right:5px; background:#4285F4; border:none; padding:5px 8px; border-radius:5px; color:#fff; cursor:pointer;"><i class="fas fa-calendar-plus"></i></button>` 
            : '';

        li.innerHTML = `
            <div onclick="toggleTask(${task.id})" style="cursor:pointer; flex:1;">
                <small style="color: #2575fc; font-weight:bold;">[${task.subject}]</small> 
                ${task.text} 
                <span style="font-size:0.8em; color:#ccc;">(${task.hours} hrs)</span>
            </div>
            <div>
                ${calendarBtn}
                <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    renderTasks();
    updateStats();
}

// --- 4. Stats & Stars ---
function updateStats() {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const totalHours = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.hours, 0);

    tasksCount.innerText = `${completedTasks} / ${totalTasks}`;
    hoursCount.innerText = `${totalHours} hrs`;

    starsContainer.innerHTML = '';
    let stars = 0;
    if(totalTasks > 0) {
        const pct = completedTasks / totalTasks;
        if(pct >= 0.5) stars = 1;
        if(pct >= 0.8) stars = 2;
        if(pct === 1) stars = 3;
    }
    
    for(let i=0; i<3; i++) {
        starsContainer.innerHTML += i < stars ? 
            '<i class="fas fa-star" style="color:#ffd700"></i>' : 
            '<i class="far fa-star" style="color:#555"></i>';
    }
}

// --- 5. Multi-Subject Chart Logic ---
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: examData.labels,
        datasets: [
            {
                label: 'Physics',
                data: examData.physics,
                borderColor: '#ff416c', // Red/Pink
                backgroundColor: 'rgba(255, 65, 108, 0.1)',
                tension: 0.3
            },
            {
                label: 'Chemistry',
                data: examData.chemistry,
                borderColor: '#f9d423', // Yellow/Gold
                backgroundColor: 'rgba(249, 212, 35, 0.1)',
                tension: 0.3
            },
            {
                label: 'Comb. Maths',
                data: examData.maths,
                borderColor: '#2575fc', // Blue
                backgroundColor: 'rgba(37, 117, 252, 0.1)',
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
            y: { beginAtZero: true, max: 100, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    }
});

document.getElementById('add-mark-btn').addEventListener('click', () => {
    const examName = document.getElementById('exam-name').value;
    const subject = document.getElementById('mark-subject').value;
    const mark = parseFloat(document.getElementById('exam-mark').value);

    if (examName && !isNaN(mark)) {
        // If label doesn't exist, add it. If it exists, we just update the data for that index
        if (!examData.labels.includes(examName)) {
            examData.labels.push(examName);
            // Push null for other subjects to keep alignment if needed, 
            // or we assume user enters marks for all subjects for "Term 1" eventually.
            // For simplicity, we just push the value to the correct array and 
            // ensure arrays are same length or handle undefined in complex apps.
            // Here: Simple append.
        }
        
        // Push mark to specific subject array
        examData[subject].push(mark);
        
        // Keep arrays separate but try to align? 
        // Note: For a simple chart, ensure you add marks in order. 
        // Or cleaner: Reset logic to clear and re-enter. 
        // This simple logic assumes you enter marks sequentially.

        localStorage.setItem('examData', JSON.stringify(examData));
        progressChart.update();
        
        document.getElementById('exam-mark').value = '';
    } else {
        alert("Enter Exam Name and Marks!");
    }
});

// --- 6. Google Drive & Settings ---

function openCalendar() {
    window.open('https://calendar.google.com/', '_blank');
}

function openDrive(sub) {
    const link = driveLinks[sub];
    if(link) window.open(link, '_blank');
    else alert("No link set! Click 'Set Drive Links' first.");
}

function setDriveLinks() {
    const pLink = prompt("Paste Physics Google Drive Folder Link:", driveLinks.physics);
    const cLink = prompt("Paste Chemistry Google Drive Folder Link:", driveLinks.chemistry);
    const mLink = prompt("Paste Maths Google Drive Folder Link:", driveLinks.maths);

    if(pLink) driveLinks.physics = pLink;
    if(cLink) driveLinks.chemistry = cLink;
    if(mLink) driveLinks.maths = mLink;

    localStorage.setItem('driveLinks', JSON.stringify(driveLinks));
    alert("Links Saved Successfully!");
}

// Initial Render
renderTasks();