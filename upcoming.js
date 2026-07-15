/* ==================================================================
   HOLIDAY EXPLORER - Upcoming Holidays Page Logic
   Uses the Calendarific Holiday API via Fetch + async/await.
   ================================================================== */

// Store the API key in a variable (as required by the brief)
const API_KEY = "c118c735-5223-467c-866a-48f8c0a0e911";

// Base endpoint for the Calendarific Holiday API
const API_BASE_URL = "https://calendarific.com/api/v2/holidays";

// Map of country codes to readable country names (used for display)
const COUNTRY_NAMES = {
  PH: "Philippines",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  CA: "Canada",
};

// Grab references to the DOM elements we need to update
const countrySelect = document.getElementById("countrySelect");
const showHolidaysBtn = document.getElementById("showHolidaysBtn");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const emptyBox = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

/**
 * Hides every status box (loading / error / empty) and clears the grid.
 * Called at the start of every fetch so states don't overlap.
 */
function resetStatusBoxes() {
  loadingBox.classList.remove("visible");
  errorBox.classList.remove("visible");
  emptyBox.classList.remove("visible");
  holidayGrid.innerHTML = "";
}

/**
 * Fetches holidays for a given country + year from the Calendarific API.
 * Returns the array of holiday objects, or throws on failure.
 */
async function fetchHolidays(countryCode, year) {
  const url = `${API_BASE_URL}?api_key=${API_KEY}&country=${countryCode}&year=${year}`;

  const response = await fetch(url);

  // Calendarific returns HTTP 200 even for some errors, so we also
  // check the response.ok flag as a first line of defense.
  if (!response.ok) {
    throw new Error(`Network error (status ${response.status})`);
  }

  const data = await response.json();

  // The API wraps errors inside meta.code instead of the HTTP status
  const metaCode = data && data.meta && data.meta.code;
  if (metaCode !== 200) {
    const apiMessage =
      (data.meta && data.meta.error_type) || "Unable to retrieve holidays.";
    throw new Error(apiMessage);
  }

  const holidays = data.response && data.response.holidays;
  if (!Array.isArray(holidays)) {
    throw new Error("Unexpected response format from the holiday API.");
  }

  return holidays;
}

/**
 * Converts a raw holiday object from the API into a simplified shape
 * that's easier to render: { name, date (Date object), country }.
 */
function normalizeHoliday(holiday, countryCode) {
  return {
    name: holiday.name,
    date: new Date(holiday.date.iso),
    country: COUNTRY_NAMES[countryCode] || countryCode,
  };
}

/**
 * Builds a single holiday card element (calendar-tile style).
 */
function createHolidayCard(holiday) {
  const card = document.createElement("article");
  card.className = "holiday-card";

  const day = holiday.date.getDate();
  const month = holiday.date.toLocaleString("en-US", { month: "short" });
  const year = holiday.date.getFullYear();
  const weekday = holiday.date.toLocaleString("en-US", { weekday: "long" });

  card.innerHTML = `
    <div class="holiday-card__date">
      <span class="holiday-card__day">${day}</span>
      <span class="holiday-card__month-year">${month} ${year}</span>
    </div>
    <div class="holiday-card__body">
      <h3 class="holiday-card__name">${holiday.name}</h3>
      <span class="holiday-card__weekday">${weekday}</span>
      <span class="holiday-card__country">${holiday.country}</span>
    </div>
  `;

  return card;
}

/**
 * Renders a list of normalized holidays into the grid.
 */
function renderHolidays(holidays) {
  holidayGrid.innerHTML = "";
  holidays.forEach((holiday) => {
    holidayGrid.appendChild(createHolidayCard(holiday));
  });
}

/**
 * Main handler: runs when the "Show Upcoming Holidays" button is clicked.
 */
async function handleShowHolidays() {
  const countryCode = countrySelect.value;
  const today = new Date();
  // Zero out the time portion so "today" itself still counts as upcoming
  today.setHours(0, 0, 0, 0);

  resetStatusBoxes();
  loadingBox.classList.add("visible");
  showHolidaysBtn.disabled = true;

  try {
    const currentYear = today.getFullYear();

    // Fetch the current year, and also next year in case there are
    // no more holidays left in the current year (e.g. asking in December).
    const [thisYearHolidays, nextYearHolidays] = await Promise.all([
      fetchHolidays(countryCode, currentYear),
      fetchHolidays(countryCode, currentYear + 1),
    ]);

    const combined = [...thisYearHolidays, ...nextYearHolidays].map((h) =>
      normalizeHoliday(h, countryCode)
    );

    // Keep only holidays that are today or in the future
    const upcoming = combined.filter((holiday) => holiday.date >= today);

    // Sort by nearest date first
    upcoming.sort((a, b) => a.date - b.date);

    loadingBox.classList.remove("visible");
    showHolidaysBtn.disabled = false;

    if (upcoming.length === 0) {
      emptyBox.classList.add("visible");
      return;
    }

    renderHolidays(upcoming);
  } catch (error) {
    // Error handling: show a friendly message in the error box
    loadingBox.classList.remove("visible");
    showHolidaysBtn.disabled = false;
    errorText.textContent =
      "We couldn't load holidays right now. " + error.message;
    errorBox.classList.add("visible");
  }
}

// Wire up the button click
showHolidaysBtn.addEventListener("click", handleShowHolidays);

// Automatically load holidays for the default selected country on page load
window.addEventListener("DOMContentLoaded", handleShowHolidays);