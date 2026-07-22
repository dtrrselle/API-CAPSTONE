main
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
const searchHistoryList = document.getElementById("searchHistoryList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

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

// -------------------------------------------------------------
// MOBILE NAVBAR TOGGLE
// -------------------------------------------------------------
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// -------------------------------------------------------------
// SEARCH HISTORY HELPERS
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
  return `${countryLabel} · ${entry.year}`;
}

function renderSearchHistory() {
  const history = getSearchHistory();

  if (history.length === 0) {
    searchHistoryList.innerHTML = '<p class="search-history__empty" id="searchHistoryEmpty">No recent searches yet.</p>';
    return;
  }

  searchHistoryList.innerHTML = history.map((entry) => {
    return `
      <button type="button" class="search-history__item" data-country="${entry.country}" data-year="${entry.year}">
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

function searchHolidays(country, year) {
  addSearchHistoryItem(country, year);
  fetchHolidays(country, year);
}

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

// Small inline SVG icon used on each card next to the country name.
// Kept as a plain string so it can be reused inside the template
// literal below without emoji characters.
const COUNTRY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <circle cx="12" cy="10" r="3"></circle>
</svg>`;

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
          <span class="holiday-card__country">${COUNTRY_ICON_SVG} ${escapeHtml(countryLabel)}</span>
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

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navbar Toggle
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Form Elements
  const searchForm = document.getElementById("searchForm");
  const countrySelect = document.getElementById("countrySelect");
  const yearInput = document.getElementById("yearInput");
  const searchBtn = document.getElementById("searchBtn");

  // Output Elements
  const loadingBox = document.getElementById("loadingBox");
  const errorBox = document.getElementById("errorBox");
  const emptyBox = document.getElementById("emptyBox");
  const holidayGrid = document.getElementById("holidayGrid");

  // History Elements
  const historySection = document.getElementById("historySection");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const STORAGE_KEY = "holiday_search_history";
  const API_KEY = "YOUR_HOLIDAY_API_KEY"; // Palitan ng iyong totoong API key

  // --- HISTORY LOGIC ---
  function getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(countryCode, countryName, year) {
    let history = getHistory();

    // Alisin ang kaparehong search para walang duplicate
    history = history.filter(
      item => !(item.countryCode === countryCode && item.year === year)
    );

    // Ilagay ang bagong search sa simula
    history.unshift({ countryCode, countryName, year });

    // I-limit sa pinakahuling 5 searches
    if (history.length > 5) {
      history = history.slice(0, 5);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();

    if (!historySection || !historyList) return;

    if (history.length === 0) {
      historySection.style.display = "none";
     main
      return;
    }

    historySection.style.display = "block";
    historyList.innerHTML = "";

    history.forEach(item => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "history-chip";
      chip.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${item.countryName} (${item.year})
      `;

      chip.addEventListener("click", () => {
        countrySelect.value = item.countryCode;
        yearInput.value = item.year;
        fetchHolidays(item.countryCode, item.year);
      });

      historyList.appendChild(chip);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
    });
  }

  // --- API FETCH LOGIC ---
  async function fetchHolidays(country, year) {
    // Hide previous state messages
    errorBox.style.display = "none";
    emptyBox.style.display = "none";
    holidayGrid.innerHTML = "";
    loadingBox.style.display = "flex";
    searchBtn.disabled = true;

    // Kunin ang display text ng napiling bansa para sa history
    const countryName = countrySelect.options[countrySelect.selectedIndex].text.split(" (")[0];
    saveToHistory(country, countryName, year);

    try {
      const response = await fetch(
        `https://holidayapi.com/v1/holidays?key=${API_KEY}&country=${country}&year=${year}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.holidays && data.holidays.length > 0) {
        renderHolidays(data.holidays, country);
      } else {
        emptyBox.style.display = "block";
      }
    } catch (err) {
      errorBox.textContent = err.message || "An error occurred while fetching holidays.";
      errorBox.style.display = "block";
    } finally {
      loadingBox.style.display = "none";
      searchBtn.disabled = false;
    }
  }

  function renderHolidays(holidays, countryCode) {
    holidayGrid.innerHTML = "";

    holidays.forEach(holiday => {
      const dateObj = new Date(holiday.date);
      const monthStr = dateObj.toLocaleString("en-US", { month: "short" });
      const dayStr = dateObj.getDate();

      const card = document.createElement("div");
      card.className = "holiday-card";

      card.innerHTML = `
        <div class="holiday-card__date">
          <span class="month">${monthStr}</span>
          <span class="day">${dayStr}</span>
        </div>
        <div class="holiday-card__body">
          <div class="holiday-card__name">${holiday.name}</div>
          <span class="holiday-card__country">${countryCode}</span>
        </div>
      `;

      holidayGrid.appendChild(card);
    });
  }

  main
  searchHolidays(country, year);
});

searchHistoryList.addEventListener("click", (event) => {
  const historyButton = event.target.closest(".search-history__item");

  if (!historyButton) {
    return;
  }

  const country = historyButton.dataset.country;
  const year = historyButton.dataset.year;

  countrySelect.value = country;
  yearInput.value = year;
  searchHolidays(country, year);
});

clearHistoryBtn.addEventListener("click", () => {
  clearSearchHistory();
});

renderSearchHistory();

  // Submit Event
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const country = countrySelect.value;
    const year = yearInput.value;

    if (country && year) {
      fetchHolidays(country, year);
    }
  });

  // Render initial search history on page load
  renderHistory();
});
 main
