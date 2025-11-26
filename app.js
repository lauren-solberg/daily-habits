// --------- Data storage helpers ---------
const STORAGE_KEY = "dailyHabitsAppData_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        habits: [],
        completions: {}, // { habitId: { 'YYYY-MM-DD': true } }
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load state", e);
    return {
      habits: [],
      completions: {},
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --------- Global state ---------
const state = loadState();
let currentDate = new Date(); // which month/year we are viewing

// --------- DOM elements ---------
const monthLabelEl = document.getElementById("monthLabel");
const calendarEl = document.getElementById("calendar");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const newHabitForm = document.getElementById("newHabitForm");
const newHabitInput = document.getElementById("newHabitInput");

// --------- Utility functions ---------
function getDaysInMonth(year, monthIndex) {
  // monthIndex: 0-11
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatMonthLabel(date) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  });
  return formatter.format(date);
}

function dateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${year}-${month}-${dayStr}`;
}

function isToday(year, monthIndex, day) {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === monthIndex &&
    today.getDate() === day
  );
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// --------- Render functions ---------
function renderCalendar() {
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);

  monthLabelEl.textContent = formatMonthLabel(currentDate);

  // Clear grid
  calendarEl.innerHTML = "";

  if (state.habits.length === 0) {
    const msg = createElement("div", "no-habits-message", "Add your first habit to get started.");
    calendarEl.appendChild(msg);
    return;
  }

  // --- Header row ---
  // First cell: "Habits"
  const habitsHeader = createElement("div", "calendar-header-cell", "Habits");
  calendarEl.appendChild(habitsHeader);

  // Day headers
  const weekdayFormatter = new Intl.DateTimeFormat("en", { weekday: "short" });

  for (let day = 1; day <= daysInMonth; day++) {
    const tempDate = new Date(year, monthIndex, day);
    const weekday = weekdayFormatter.format(tempDate);

    const cell = createElement("div", "calendar-header-cell");
    if (isToday(year, monthIndex, day)) {
      cell.classList.add("today-header");
    }

    const weekdaySpan = createElement("span", null, weekday);
    const dayNumberSpan = createElement("span", "day-number", String(day));

    cell.appendChild(weekdaySpan);
    cell.appendChild(dayNumberSpan);

    calendarEl.appendChild(cell);
  }

  // --- Habit rows ---
  state.habits.forEach((habit) => {
    // Habit name cell
    const habitCell = createElement("div", "calendar-habit-cell", habit.name);
    calendarEl.appendChild(habitCell);

    // Cells for each day
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = createElement("div", "calendar-day-cell");
      const key = dateKey(year, monthIndex, day);
      const completed =
        state.completions[habit.id] &&
        state.completions[habit.id][key] === true;

      if (completed) {
        cell.classList.add("checked");
        cell.innerHTML = '<span class="checkmark">✓</span>';
      } else {
        cell.innerHTML = "&nbsp;"; // keeps cell height
      }

      cell.addEventListener("click", () => {
        toggleCompletion(habit.id, key, cell);
      });

      calendarEl.appendChild(cell);
    }
  });
}

function toggleCompletion(habitId, key, cellEl) {
  if (!state.completions[habitId]) {
    state.completions[habitId] = {};
  }
  const already = state.completions[habitId][key] === true;
  if (already) {
    delete state.completions[habitId][key];
    cellEl.classList.remove("checked");
    cellEl.innerHTML = "&nbsp;";
  } else {
    state.completions[habitId][key] = true;
    cellEl.classList.add("checked");
    cellEl.innerHTML = '<span class="checkmark">✓</span>';
  }
  saveState();
}

// --------- Event handlers ---------
prevMonthBtn.addEventListener("click", () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  currentDate = new Date(year, month - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  currentDate = new Date(year, month + 1, 1);
  renderCalendar();
});

newHabitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = newHabitInput.value.trim();
  if (!name) return;

  const habit = {
    id: `habit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
  };

  state.habits.push(habit);
  if (!state.completions[habit.id]) {
    state.completions[habit.id] = {};
  }
  newHabitInput.value = "";
  saveState();
  renderCalendar();
});

// --------- Initial render ---------
renderCalendar();
