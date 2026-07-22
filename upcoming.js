/* ==================================================================
   HOLIDAY EXPLORER - Upcoming Holidays Page Logic
   Uses the Calendarific Holiday API via Fetch + async/await.
   ================================================================== */

// Store the API key in a variable
const API_KEY = "XbTBRS861tYOs5Cze6VraZI62wfbo2zD";

// Base endpoint for the Calendarific API
const API_BASE_URL = "https://calendarific.com/api/v2/holidays";

// Map ng Bansa, Pangalan, Lenggwahe (Language Code), at Bati sa Sariling Lenggwahe
const COUNTRY_CONFIG = {
  PH: { name: "Philippines", lang: "tl-PH", greeting: "Magandang araw, Mabuhay!" },
  US: { name: "United States", lang: "en-US", greeting: "Good day, Welcome!" },
  JP: { name: "Japan", lang: "ja-JP", greeting: "Konnichiwa, Yokoso!" },
  AU: { name: "Australia", lang: "en-AU", greeting: "G'day, Welcome!" },
  CA: { name: "Canada", lang: "en-CA", greeting: "Hello, Welcome!" },
  GB: { name: "United Kingdom", lang: "en-GB", greeting: "Good day, Welcome!" },
  SG: { name: "Singapore", lang: "en-SG", greeting: "Welcome!" },
  MY: { name: "Malaysia", lang: "ms-MY", greeting: "Selamat datang!" },
  ID: { name: "Indonesia", lang: "id-ID", greeting: "Selamat siang, Selamat datang!" },
  TH: { name: "Thailand", lang: "th-TH", greeting: "Sawatdee, Yindee tonrab!" },
  VN: { name: "Vietnam", lang: "vi-VN", greeting: "Xin chao, Chao mung!" },
  KR: { name: "South Korea", lang: "ko-KR", greeting: "Annyeonghaseyo, Hwan-yeong-hamnida!" },
  CN: { name: "China", lang: "zh-CN", greeting: "Nǐ hǎo, Huānyíng!" },
  IN: { name: "India", lang: "hi-IN", greeting: "Namaste, Aapka swagat hai!" },
  DE: { name: "Germany", lang: "de-DE", greeting: "Guten Tag, Willkommen!" },
  FR: { name: "France", lang: "fr-FR", greeting: "Bonjour, Bienvenue!" },
  IT: { name: "Italy", lang: "it-IT", greeting: "Buongiorno, Benvenuto!" },
  ES: { name: "Spain", lang: "es-ES", greeting: "¡Buenos días, Bienvenido!" },
  MX: { name: "Mexico", lang: "es-MX", greeting: "¡Buenos días, Bienvenido!" },
  BR: { name: "Brazil", lang: "pt-BR", greeting: "Bom dia, Seja bem-vindo!" },
  NZ: { name: "New Zealand", lang: "en-NZ", greeting: "Kia Ora, Welcome!" },
  AE: { name: "United Arab Emirates", lang: "ar-AE", greeting: "Marhaban, Ahlan wa sahlan!" },
};

// Grab references to the DOM elements
const countrySelect = document.getElementById("countrySelect");
const yearInput = document.getElementById("yearInput");
const showHolidaysBtn = document.getElementById("showHolidaysBtn");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const emptyBox = document.getElementById("emptyBox");
const holidayGrid = document.getElementById("holidayGrid");

/* ==================================================================
   TEXT-TO-SPEECH (Magsasalita sa Sariling Lenggwahe ng Bansa)
   ================================================================== */
function speakGreeting(countryCode) {
  if ('speechSynthesis' in window) {
    // Siguraduhing hihinto ang nakaraang boses bago magsimula ang bago
    window.speechSynthesis.cancel();

    // Kunin ang detalye ng bansa (default sa PH kung wala sa listahan)
    const config = COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG["PH"];

    const utterance = new SpeechSynthesisUtterance(config.greeting);
    utterance.lang = config.lang; // I-set sa mismong lenggwahe ng bansa (hal. ja-JP, es-ES)
    utterance.rate = 0.9;         // katamtamang bilis
    utterance.pitch = 1;

    // Subukang piliin ang tamang boses mula sa browser kung available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(voice => voice.lang.startsWith(config.lang.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

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
  const countryName = COUNTRY_CONFIG[countryCode] ? COUNTRY_CONFIG[countryCode].name : countryCode;
  return {
    name: holiday.name,
    date: new Date(holiday.date.iso),
    country: countryName,
  };
}

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

function renderHolidays(holidays) {
  holidayGrid.innerHTML = "";

  holidays.forEach((holiday) => {
    holidayGrid.appendChild(createHolidayCard(holiday));
  });
}

async function handleShowHolidays(isUserAction = false) {
  const countryCode = countrySelect ? countrySelect.value : "PH";
  const selectedYear = yearInput ? parseInt(yearInput.value, 10) : new Date().getFullYear();

  // Magsasalita lamang sa sariling lenggwahe kapag nag-click o nagpalit ng bansa ang user
  if (isUserAction) {
    speakGreeting(countryCode);
  }

  resetStatusBoxes();

  if (loadingBox) loadingBox.classList.add("visible");
  if (showHolidaysBtn) showHolidaysBtn.disabled = true;

  try {
    const rawHolidays = await fetchHolidays(countryCode, selectedYear);

    const formattedHolidays = rawHolidays.map((holiday) =>
      normalizeHoliday(holiday, countryCode)
    );

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
      errorText.textContent = "We couldn't load holidays right now. " + error.message;
    }

    if (errorBox) errorBox.classList.add("visible");

    console.error(error);
  }
}

// Ensure voices are pre-loaded by browser
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Event Listeners
if (countrySelect) {
  countrySelect.addEventListener("change", () => {
    speakGreeting(countrySelect.value);
  });
}

if (showHolidaysBtn) {
  showHolidaysBtn.addEventListener("click", () => {
    handleShowHolidays(true);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  handleShowHolidays(false); // Normal load nang walang audio restriction issue
});