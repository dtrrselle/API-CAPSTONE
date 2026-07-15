/* =============================================================
   HOLIDAY EXPLORER — search.js
   Handles: mobile nav toggle, form submission, Holiday API
   fetch (async/await), loading state, error handling,
   "no results" state, and rendering result cards.
============================================================= */

// -------------------------------------------------------------
// API CONFIGURATION
// -------------------------------------------------------------
// Store the API key in a single variable so it's easy to swap out.
const API_KEY = "c118c735-5223-467c-866a-48f8c0a0e911";
const API_BASE_URL = "https://holidayapi.com/v1/holidays";

// -------------------------------------------------------------
// DOM ELEMENT REFERENCES
// -------------------------------------------------------------
const searchForm   = document.getElementById("searchForm");
const countrySelect = document.getElementById("countrySelect");
const yearInput     = document.getElementById("yearInput");
const searchBtn     = document.getElementById("searchBtn");

const loadingBox = document.getElementById("loadingBox");
const errorBox   = document.getElementById("errorBox");
const emptyBox   = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");

// A small lookup so we can show a full country name on each card
// even though the API/select only work with 2-letter codes.
const COUNTRY_NAMES = {
  PH: "Philippines",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  CA: "Canada"
};

// Short month names used for the little calendar-style date badge
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// -------------------------------------------------------------
// MOBILE NAVBAR TOGGLE
// -------------------------------------------------------------
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// -------------------------------------------------------------
// UI STATE HELPERS
// -------------------------------------------------------------

/**
 * Resets all result-area states (loading / error / empty / cards)
 * back to hidden before a new search starts.
 */
function resetResultStates() {
  loadingBox.style.display = "none";
  errorBox.style.display = "none";
  emptyBox.style.display = "none";
  holidayGrid.innerHTML = "";
}

/** Shows the loading spinner and disables the search button. */
function showLoading() {
  resetResultStates();
  loadingBox.style.display = "flex";
  searchBtn.disabled = true;
  searchBtn.textContent = "Searching...";
}

/** Hides the loading spinner and re-enables the search button. */
function hideLoading() {
  loadingBox.style.display = "none";
  searchBtn.disabled = false;
  searchBtn.textContent = "Find Holidays";
}

/** Displays an error message inside the error box. */
function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

/** Displays the "no results" empty state. */
function showEmptyState() {
  emptyBox.style.display = "block";
}

// -------------------------------------------------------------
// RENDERING
// -------------------------------------------------------------

/**
 * Builds and inserts a holiday card for each holiday returned
 * by the API.
 * @param {Array} holidays - array of holiday objects from the API
 */
function renderHolidays(holidays) {
  // Build all cards, then insert them once (fewer reflows than
  // appending one at a time).
  const cardsHtml = holidays.map((holiday) => {
    const dateObj = new Date(holiday.date);
    const month = MONTHS[dateObj.getMonth()];
    const day = dateObj.getDate();
    const countryLabel = COUNTRY_NAMES[holiday.country] || holiday.country;

    return `
      <article class="holiday-card">
        <div class="holiday-card__date">
          <span class="month">${month}</span>
          <span class="day">${day}</span>
        </div>
        <div class="holiday-card__body">
          <span class="holiday-card__name">${escapeHtml(holiday.name)}</span>
          <span class="holiday-card__country">🌐 ${escapeHtml(countryLabel)}</span>
        </div>
      </article>
    `;
  }).join("");

  holidayGrid.innerHTML = cardsHtml;
}

/**
 * Basic HTML-escaping so holiday names from the API can never
 * break out of the markup they're inserted into.
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// -------------------------------------------------------------
// API CALL
// -------------------------------------------------------------

/**
 * Fetches holidays for a given country/year from the Holiday API.
 * Uses async/await + try/catch for clean error handling.
 * @param {string} country - 2-letter country code, e.g. "PH"
 * @param {string|number} year - 4-digit year, e.g. 2025
 */
async function fetchHolidays(country, year) {
  showLoading();

  // Build the request URL, e.g.:
  // https://holidayapi.com/v1/holidays?key=API_KEY&country=PH&year=2025
  const url = `${API_BASE_URL}?key=${API_KEY}&country=${country}&year=${year}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // The Holiday API returns a non-200 status (and a "status"/"error"
    // field in the body) when something goes wrong, e.g. bad key,
    // invalid year, or a plan limitation.
    if (!response.ok || data.status !== 200) {
      const apiMessage = data.error || "Something went wrong while fetching holidays.";
      showError(`Error: ${apiMessage}`);
      return;
    }

    const holidays = data.holidays || [];

    if (holidays.length === 0) {
      showEmptyState();
    } else {
      renderHolidays(holidays);
    }
  } catch (err) {
    // Network failure, CORS issue, invalid JSON, etc.
    showError("Error: Unable to reach the Holiday API. Please check your connection and try again.");
    console.error("Holiday API fetch failed:", err);
  } finally {
    hideLoading();
  }
}

// -------------------------------------------------------------
// FORM SUBMISSION
// -------------------------------------------------------------
searchForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  const country = countrySelect.value;
  const year = yearInput.value.trim();

  // Simple client-side validation before calling the API
  if (!year || Number(year) < 1900 || Number(year) > 2100) {
    resetResultStates();
    showError("Please enter a valid year between 1900 and 2100.");
    return;
  }

  fetchHolidays(country, year);
});