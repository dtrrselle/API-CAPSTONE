/* =============================================================
   HOLIDAY EXPLORER — search.js
   Handles: mobile nav toggle, form submission, holiday API
   fetch (async/await), loading state, error handling,
   "no results" state, recent-search history, and rendering
   result cards.
============================================================= */

// -------------------------------------------------------------
// API CONFIGURATION
// -------------------------------------------------------------
// Free public holidays API — no API key required.
const API_BASE_URL = "https://date.nager.at/api/v3/PublicHolidays";

// -------------------------------------------------------------
// DOM ELEMENT REFERENCES
// -------------------------------------------------------------
const searchForm    = document.getElementById("searchForm");
const countrySelect = document.getElementById("countrySelect");
const yearInput     = document.getElementById("yearInput");
const searchBtn     = document.getElementById("searchBtn");

const loadingBox  = document.getElementById("loadingBox");
const errorBox    = document.getElementById("errorBox");
const emptyBox    = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

const searchHistoryList = document.getElementById("searchHistoryList");
const clearHistoryBtn   = document.getElementById("clearHistoryBtn");

const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");

// A small lookup so we can show a full country name on each card
// even though the API/select only work with 2-letter codes.
const COUNTRY_NAMES = {
  PH: "Philippines",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  CA: "Canada",
  GB: "United Kingdom",
  SG: "Singapore",
  MY: "Malaysia",
  ID: "Indonesia",
  TH: "Thailand",
  VN: "Vietnam",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  NZ: "New Zealand",
  BR: "Brazil",
  MX: "Mexico",
  ZA: "South Africa",
  AE: "United Arab Emirates"
};

// Short month names used for the little calendar-style date badge
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const SEARCH_HISTORY_KEY = "holidayExplorerSearchHistory";
const MAX_SEARCH_HISTORY_ITEMS = 5;

// Small inline SVG icon used on each card next to the country name.
const COUNTRY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <circle cx="12" cy="10" r="3"></circle>
</svg>`;

// -------------------------------------------------------------
// MOBILE NAVBAR TOGGLE
// -------------------------------------------------------------
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// -------------------------------------------------------------
// SEARCH HISTORY HELPERS (persisted in localStorage)
// -------------------------------------------------------------

function getSearchHistory() {
  try {
    const storedValue = localStorage.getItem(SEARCH_HISTORY_KEY);
    return storedValue ? JSON.parse(storedValue) : [];
  } catch (error) {
    console.warn("Unable to read search history:", error);
    return [];
  }
}

function saveSearchHistory(history) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Unable to save search history:", error);
  }
}

function formatHistoryLabel(entry) {
  const countryLabel = COUNTRY_NAMES[entry.country] || entry.country;
  return `${countryLabel} (${entry.year})`;
}

function renderSearchHistory() {
  if (!searchHistoryList) return;

  const history = getSearchHistory();

  if (history.length === 0) {
    searchHistoryList.innerHTML = '<p class="search-history__empty">No recent searches yet.</p>';
    return;
  }

  searchHistoryList.innerHTML = history.map((entry) => {
    return `
      <button type="button" class="search-history__item" data-country="${entry.country}" data-year="${entry.year}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${escapeHtml(formatHistoryLabel(entry))}
      </button>
    `;
  }).join("");
}

function addSearchHistoryItem(country, year) {
  const normalizedYear = String(year).trim();
  const history = getSearchHistory().filter((entry) => {
    return entry.country !== country || entry.year !== normalizedYear;
  });

  history.unshift({ country, year: normalizedYear });
  saveSearchHistory(history.slice(0, MAX_SEARCH_HISTORY_ITEMS));
  renderSearchHistory();
}

function clearSearchHistory() {
  saveSearchHistory([]);
  renderSearchHistory();
}

// -------------------------------------------------------------
// UI STATE HELPERS
// -------------------------------------------------------------

/** Resets all result-area states (loading / error / empty / cards). */
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
 * Basic HTML-escaping so holiday names from the API can never
 * break out of the markup they're inserted into.
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Builds and inserts a holiday card for each holiday returned
 * by the API.
 * @param {Array} holidays - array of holiday objects from the API
 * @param {string} countryCode - 2-letter country code searched for
 */
function renderHolidays(holidays, countryCode) {
  const countryLabel = COUNTRY_NAMES[countryCode] || countryCode;

  const cardsHtml = holidays.map((holiday) => {
    const [yearStr, monthStr, dayStr] = holiday.date.split("-");
    const monthIndex = Number(monthStr) - 1;

    return `
      <article class="holiday-card">
        <div class="holiday-card__date">
          <span class="month">${MONTHS[monthIndex]}</span>
          <span class="day">${Number(dayStr)}</span>
        </div>
        <div class="holiday-card__body">
          <span class="holiday-card__name">${escapeHtml(holiday.name)}</span>
          <span class="holiday-card__country">${COUNTRY_ICON_SVG} ${escapeHtml(countryLabel)}</span>
        </div>
      </article>
    `;
  }).join("");

  holidayGrid.innerHTML = cardsHtml;
}

// -------------------------------------------------------------
// API CALL
// -------------------------------------------------------------

/**
 * Fetches holidays for a given country/year from the Nager.Date
 * public holidays API. Uses async/await + try/catch for clean
 * error handling.
 * @param {string} country - 2-letter country code, e.g. "PH"
 * @param {string|number} year - 4-digit year, e.g. 2026
 */
async function fetchHolidays(country, year) {
  showLoading();

  const url = `${API_BASE_URL}/${year}/${country}`;

  try {
    const response = await fetch(url);

    // Nager.Date returns 204 No Content when there is no data
    // for that country/year combination.
    if (response.status === 204) {
      hideLoading();
      showEmptyState();
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch data (Status: ${response.status})`);
    }

    const holidays = await response.json();

    if (holidays && holidays.length > 0) {
      renderHolidays(holidays, country);
    } else {
      showEmptyState();
    }
  } catch (err) {
    showError(err.message || "An error occurred while fetching holidays.");
  } finally {
    hideLoading();
  }
}

/** Runs a search and records it in the recent-search history. */
function searchHolidays(country, year) {
  addSearchHistoryItem(country, year);
  fetchHolidays(country, year);
}

// -------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const country = countrySelect.value;
  const year = yearInput.value;

  if (country && year) {
    searchHolidays(country, year);
  }
});

if (searchHistoryList) {
  searchHistoryList.addEventListener("click", (event) => {
    const historyButton = event.target.closest(".search-history__item");
    if (!historyButton) return;

    const country = historyButton.dataset.country;
    const year = historyButton.dataset.year;

    countrySelect.value = country;
    yearInput.value = year;
    searchHolidays(country, year);
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    clearSearchHistory();
  });
}

// -------------------------------------------------------------
// INITIAL RENDER
// -------------------------------------------------------------
renderSearchHistory();