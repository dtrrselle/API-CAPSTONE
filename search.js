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