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
  MX: "Mexico",
  BR: "Brazil",
  NZ: "New Zealand",
  AE: "United Arab Emirates",
};

// Grab references to the DOM elements
const countrySelect = document.getElementById("countrySelect");
const yearInput = document.getElementById("yearInput"); // Dynamic Dropdown Reference (2020 - 2065)
const showHolidaysBtn = document.getElementById("showHolidaysBtn");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const emptyBox = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

function resetStatusBoxes() {
  if (loadingBox) loadingBox.classList.remove("visible");
  if (errorBox) errorBox.classList.remove("visible");
  if (emptyBox) emptyBox.classList.remove("visible");
  if (holidayGrid) holidayGrid.innerHTML = "";
}

async function fetchHolidays(countryCode, year) {
  const url = `${API_BASE_URL}?api_key=${API_KEY}&country=${countryCode}&year=${year}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Unable to retrieve holidays (${response.status})`);
  }

  if (!data.response || !Array.isArray(data.response.holidays)) {
    throw new Error("Unexpected response format from Calendarific.");
  }

  return data.response.holidays;
}

function normalizeHoliday(holiday, countryCode) {
  return {
    name: holiday.name,

    // Calendarific format: holiday.date.iso
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
  const countryCode = countrySelect ? countrySelect.value : "PH";
  
  // Kung may Year Selector sa HTML, gagamitin ito (2020 - 2065).
  // Kung wala, gagamitin ang kasalukuyang taon.
  const selectedYear = yearInput ? parseInt(yearInput.value, 10) : new Date().getFullYear();

  resetStatusBoxes();

  if (loadingBox) loadingBox.classList.add("visible");
  if (showHolidaysBtn) showHolidaysBtn.disabled = true;

  try {
    // Kunin ang mga bakasyon batay sa napiling taon
    const rawHolidays = await fetchHolidays(countryCode, selectedYear);

    const formattedHolidays = rawHolidays.map((holiday) =>
      normalizeHoliday(holiday, countryCode)
    );

    // I-sort batay sa petsa (mula sa pinakamaaga hanggang sa pinakahuli)
    formattedHolidays.sort((a, b) => a.date - b.date);

    if (loadingBox) loadingBox.classList.remove("visible");
    if (showHolidaysBtn) showHolidaysBtn.disabled = false;

    if (formattedHolidays.length === 0) {
      if (emptyBox) emptyBox.classList.add("visible");
      return;
    }

    renderHolidays(formattedHolidays);

  } catch (error) {
    if (loadingBox) loadingBox.classList.remove("visible");
    if (showHolidaysBtn) showHolidaysBtn.disabled = false;

    if (errorText) {
      errorText.textContent =
        "We couldn't load holidays right now. " + error.message;
    }

    if (errorBox) errorBox.classList.add("visible");

    console.error(error);
  }
}

// Event Listeners
if (showHolidaysBtn) {
  showHolidaysBtn.addEventListener("click", handleShowHolidays);
}

window.addEventListener("DOMContentLoaded", handleShowHolidays);