/* ==================================================================
   HOLIDAY EXPLORER - Upcoming Holidays Page Logic
   Uses the Calendarific Holiday API via Fetch + async/await.
   ================================================================== */

// Store the API key in a variable
const API_KEY = "XbTBRS861tYOs5Cze6VraZI62wfbo2zD";

// Base endpoint for the Calendarific API
const API_BASE_URL = "https://calendarific.com/api/v2/holidays";

// Map of country codes to readable country names
const COUNTRY_NAMES = {
  PH: "Philippines",
  US: "United States",
  JP: "Japan",
  AU: "Australia",
  CA: "Canada",
};

// Grab references to the DOM elements
const countrySelect = document.getElementById("countrySelect");
const showHolidaysBtn = document.getElementById("showHolidaysBtn");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const emptyBox = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

function resetStatusBoxes() {
  loadingBox.classList.remove("visible");
  errorBox.classList.remove("visible");
  emptyBox.classList.remove("visible");
  holidayGrid.innerHTML = "";
}

async function fetchHolidays(countryCode, year) {
  const url =
    `${API_BASE_URL}?api_key=${API_KEY}&country=${countryCode}&year=${year}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve holidays (${response.status})`
    );
  }

  if (
    !data.response ||
    !Array.isArray(data.response.holidays)
  ) {
    throw new Error(
      "Unexpected response format from Calendarific."
    );
  }

  return data.response.holidays;
}

function normalizeHoliday(holiday, countryCode) {
  return {
    name: holiday.name,

    // Calendarific format:
    // holiday.date.iso
    date: new Date(holiday.date.iso),

    country: COUNTRY_NAMES[countryCode] || countryCode,
  };
}

function createHolidayCard(holiday) {
  const card = document.createElement("article");
  card.className = "holiday-card";

  const day = holiday.date.getDate();
  const month = holiday.date.toLocaleString("en-US", {
    month: "short",
  });
  const year = holiday.date.getFullYear();
  const weekday = holiday.date.toLocaleString("en-US", {
    weekday: "long",
  });

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

function renderHolidays(holidays) {
  holidayGrid.innerHTML = "";

  holidays.forEach((holiday) => {
    holidayGrid.appendChild(createHolidayCard(holiday));
  });
}

async function handleShowHolidays() {
  const countryCode = countrySelect.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  resetStatusBoxes();

  loadingBox.classList.add("visible");
  showHolidaysBtn.disabled = true;

  try {
    const currentYear = today.getFullYear();

    const [thisYearHolidays, nextYearHolidays] =
      await Promise.all([
        fetchHolidays(countryCode, currentYear),
        fetchHolidays(countryCode, currentYear + 1),
      ]);

    const combined = [
      ...thisYearHolidays,
      ...nextYearHolidays,
    ].map((holiday) =>
      normalizeHoliday(holiday, countryCode)
    );

    const upcoming = combined.filter(
      (holiday) => holiday.date >= today
    );

    upcoming.sort((a, b) => a.date - b.date);

    loadingBox.classList.remove("visible");
    showHolidaysBtn.disabled = false;

    if (upcoming.length === 0) {
      emptyBox.classList.add("visible");
      return;
    }

    renderHolidays(upcoming);

  } catch (error) {
    loadingBox.classList.remove("visible");
    showHolidaysBtn.disabled = false;

    errorText.textContent =
      "We couldn't load holidays right now. " +
      error.message;

    errorBox.classList.add("visible");

    console.error(error);
  }
}

showHolidaysBtn.addEventListener(
  "click",
  handleShowHolidays
);

window.addEventListener(
  "DOMContentLoaded",
  handleShowHolidays
);