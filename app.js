// ---------- Storage ----------
const STORAGE_KEY = "habitHeatmapState_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        habits: [],                 // [{ id, name, colorIndex }]
        completions: {}             // { habitId: { 'YYYY-MM-DD': true } }
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load state", e);
    return { habits: [], completions: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let currentMonthDate = new Date(); // controls which month we’re viewing

// ---------- DOM ----------
const monthLabelEl = document.getElementById("monthLabel");
const calendarEl   = document.getElementById("calendar");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const newHabitForm = document.getElementById("newHabitForm");
const newHabitInput = document.getElementById("newHabitInput");
const habitListEl = document.getElementById("habitList");

// ---------- Utilities ----------
function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function dateKey(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function isToday(year, monthIndex, day) {
  const t = new Date();
  return (
    t.getFullYear() === year &&
    t.getMonth() === monthIndex &&
    t.getDate() === day
  );
}

// ---------- Rendering ----------
function renderHabitList() {
  habitListEl.innerHTML = "";
  if (state.habits.length === 0) {
    const li = document.createElement("li");
    li.className = "habit-item";
    li.textContent = "Add your first habit →";
    habitListEl.appendChild(li);
    return;
  }

  state.habits.forEach(habit => {
    const li = document.createElement("li");
    li.className = "habit-item";
    li.textContent = habit.name;
    habitListEl.appendChild(li);
  });
}

function renderCalendar() {
  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);

  monthLabelEl.textContent = formatMonthLabel(currentMonthDate);

  calendarEl.innerHTML = "";

  if (state.habits.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-empty";
    emptyDiv.textContent = "No habits yet. Add one on the left to get started.";
    calendarEl.appendChild(emptyDiv);
    return;
  }

  // Build a grid with CSS grid: first col = labels, then one col per day.
  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  // Define columns dynamically
  grid.style.gridTemplateColumns = `180px repeat(${daysInMonth}, 28px)`;

  // --- Header row ---
  // First cell: spacer labeled "Habits"
  const labelHeader = document.createElement("div");
  labelHeader.className = "calendar-header-cell header-label-cell";
  labelHeader.textContent = " ";
  grid.appendChild(labelHeader);

  const weekdayFormatter = new Intl.DateTimeFormat("en", { weekday: "short" });

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const weekday = weekdayFormatter.format(d);

    const cell = document.createElement("div");
    cell.className = "calendar-header-cell";

    if (isToday(year, monthIndex, day)) {
      cell.classList.add("header-today");
    }

    const wrapper = document.createElement("div");
    wrapper.className = "calendar-header-day";

    const wSpan = document.createElement("span");
    wSpan.className = "header-weekday";
    wSpan.textContent = weekday;

    const nSpan = document.createElement("span");
    nSpan.className = "header-daynum";
    nSpan.textContent = String(day);

    wrapper.appendChild(wSpan);
    wrapper.appendChild(nSpan);
    cell.appendChild(wrapper);
    grid.appendChild(cell);
  }

  // --- Habit rows ---
  state.habits.forEach((habit, idx) => {
    // Label cell
    const labelCell = document.createElement("div");
    labelCell.className = "calendar-habit-label";
    labelCell.textContent = habit.name;
    grid.appendChild(labelCell);

    // Day cells for this habit
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell";

      // colour variation per habit (0–4 cycle)
      const colorIndex = habit.colorIndex ?? 0;
      cell.classList.add(`color-${colorIndex}`);

      const key = dateKey(year, monthIndex, day);
      const done =
        state.completions[habit.id] &&
        state.completions[habit.id][key] === true;

      if (done) {
        cell.classList.add("completed");
      }

      cell.addEventListener("click", () => {
        toggleCompletion(habit.id, key, cell);
      });

      grid.appendChild(cell);
    }
  });

  calendarEl.appendChild(grid);
}

function toggleCompletion(habitId, key, cellEl) {
  if (!state.completions[habitId]) {
    state.completions[habitId] = {};
  }

  const already = state.completions[habitId][key] === true;

  if (already) {
    delete state.completions[habitId][key];
    cellEl.classList.remove("completed");
  } else {
    state.completions[habitId][key] = true;
    cellEl.classList.add("completed");
  }

  saveState();
}

// ---------- Events ----------
prevMonthBtn.addEventListener("click", () => {
  const y = currentMonthDate.getFullYear();
  const m = currentMonthDate.getMonth();
  currentMonthDate = new Date(y, m - 1, 1); // JS Date happily goes back forever
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  const y = currentMonthDate.getFullYear();
  const m = currentMonthDate.getMonth();
  currentMonthDate = new Date(y, m + 1, 1); // and forward forever
  renderCalendar();
});

newHabitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = newHabitInput.value.trim();
  if (!name) return;

  const colorIndex = state.habits.length % 5; // cycle through 5 color schemes

  const habit = {
    id: `habit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
    colorIndex
  };

  state.habits.push(habit);
  if (!state.completions[habit.id]) {
    state.completions[habit.id] = {};
  }
  newHabitInput.value = "";
  saveState();
  renderHabitList();
  renderCalendar();
});

// ---------- Initial render ----------
renderHabitList();
renderCalendar();
