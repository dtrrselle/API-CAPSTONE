// upcoming.js
// Powers upcoming.html: fetches public holidays for a selected country/year
// from the free Nager.Date API and renders them as cards.

(function () {
  const countrySelect = document.getElementById('countrySelect');
  const yearInput = document.getElementById('yearInput');
  const showHolidaysBtn = document.getElementById('showHolidaysBtn');

  const loadingBox = document.getElementById('loadingBox');
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  const emptyBox = document.getElementById('emptyBox');
  const holidayGrid = document.getElementById('holidayGrid');

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  const API_BASE = 'https://date.nager.at/api/v3/PublicHolidays';

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Mobile nav toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  function hideAllStatusBoxes() {
    loadingBox.classList.remove('visible');
    errorBox.classList.remove('visible');
    emptyBox.classList.remove('visible');
  }

  function showLoading() {
    hideAllStatusBoxes();
    holidayGrid.innerHTML = '';
    loadingBox.classList.add('visible');
  }

  function showError(message) {
    hideAllStatusBoxes();
    errorText.textContent = message;
    errorBox.classList.add('visible');
  }

  function showEmpty() {
    hideAllStatusBoxes();
    emptyBox.classList.add('visible');
  }

  function setButtonLoading(isLoading) {
    showHolidaysBtn.disabled = isLoading;
    showHolidaysBtn.textContent = isLoading ? 'Loading...' : 'Show Holidays';
  }

  function buildCard(holiday, countryName) {
    // holiday.date is "YYYY-MM-DD"
    const [yearStr, monthStr, dayStr] = holiday.date.split('-');
    const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    const card = document.createElement('div');
    card.className = 'holiday-card';

    const dateEl = document.createElement('div');
    dateEl.className = 'holiday-card__date';
    dateEl.innerHTML = `
      <span class="holiday-card__day">${dayStr}</span>
      <span class="holiday-card__month-year">${MONTHS[dateObj.getMonth()]} ${yearStr}</span>
    `;

    const bodyEl = document.createElement('div');
    bodyEl.className = 'holiday-card__body';

    const nameEl = document.createElement('div');
    nameEl.className = 'holiday-card__name';
    nameEl.textContent = holiday.localName && holiday.localName !== holiday.name
      ? `${holiday.name} (${holiday.localName})`
      : holiday.name;

    const weekdayEl = document.createElement('div');
    weekdayEl.className = 'holiday-card__weekday';
    weekdayEl.textContent = WEEKDAYS[dateObj.getDay()];

    const countryEl = document.createElement('div');
    countryEl.className = 'holiday-card__country';
    countryEl.textContent = countryName;

    bodyEl.appendChild(nameEl);
    bodyEl.appendChild(weekdayEl);
    bodyEl.appendChild(countryEl);

    card.appendChild(dateEl);
    card.appendChild(bodyEl);

    return card;
  }

  async function fetchHolidays(year, countryCode) {
    const response = await fetch(`${API_BASE}/${year}/${countryCode}`);

    if (response.status === 204) {
      // API returns 204 No Content when there is no data for that combo
      return [];
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async function handleShowHolidays() {
    const countryCode = countrySelect.value;
    const countryName = countrySelect.options[countrySelect.selectedIndex].text;
    const year = yearInput.value;

    setButtonLoading(true);
    showLoading();

    try {
      const holidays = await fetchHolidays(year, countryCode);

      // Only keep holidays today or later when browsing the current year,
      // so the page genuinely shows "upcoming" holidays.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();

      let filtered = holidays;
      if (Number(year) === currentYear) {
        filtered = holidays.filter((h) => {
          const [y, m, d] = h.date.split('-').map(Number);
          const hDate = new Date(y, m - 1, d);
          return hDate >= today;
        });
      }

      // Sort chronologically
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

      hideAllStatusBoxes();

      if (!filtered.length) {
        showEmpty();
        return;
      }

      holidayGrid.innerHTML = '';
      filtered.forEach((holiday) => {
        holidayGrid.appendChild(buildCard(holiday, countryName));
      });
    } catch (err) {
      console.error('Failed to load holidays:', err);
      showError('Unable to load holidays right now. Please check your connection and try again.');
    } finally {
      setButtonLoading(false);
    }
  }

  showHolidaysBtn.addEventListener('click', handleShowHolidays);

  // Load holidays automatically on first page load using the default selections
  document.addEventListener('DOMContentLoaded', handleShowHolidays);
})();