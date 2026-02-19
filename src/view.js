import EventBus from './eventBus.js';

function getRouterContent() {
  return document.getElementById('router-content');
}

function clearContent() {
  const routerContent = getRouterContent();
  if (routerContent) {
    routerContent.innerHTML = '';
  }
}

export function renderHome() {
  clearContent();

  const homeHTML = `
    <div class="input-group">
      <input type="text" id="cityInput" placeholder="Введите город" />
    </div>

    <div class="buttons">
      <button class="city-btn" id="cityBtn">
        <i class="fas fa-city"></i> По городу
      </button>
      <button class="geo-btn" id="geoBtn">
        <i class="fas fa-location-arrow"></i> По геолокации
      </button>
    </div>

    <div class="loading" id="loading" style="display: none;">
      <i class="fas fa-spinner fa-spin"></i> Загрузка...
    </div>

    <div class="error" id="error" style="display: none;">
      Город не найден. Проверьте правильность написания.
    </div>

    <div class="history-section" id="historySection">
      <h3>История поиска</h3>
      <div class="history-list" id="historyList"></div>
    </div>
  `;

  const routerContent = getRouterContent();
  if (routerContent) {
    routerContent.innerHTML = homeHTML;
    const history = getHistory();
    renderHistory(history);
  }
}

export function renderCityWeather(city, weather) {
  clearContent();

  const weatherHTML = `
    <div class="weather-info show">
      <div class="location" id="location">${city}</div>
      <div class="temp" id="temperature">${Math.round(weather.main.temp)}°C</div>
      <div class="description" id="description">${weather.weather[0].description}</div>

      <div class="details">
        <div class="detail">
          <i class="fas fa-wind"></i>
          <div id="wind">${weather.wind?.speed || 0} м/с</div>
        </div>
        <div class="detail">
          <i class="fas fa-tint"></i>
          <div id="humidity">${weather.main.humidity}%</div>
        </div>
        <div class="detail">
          <i class="fas fa-temperature-high"></i>
          <div id="feelsLike">${Math.round(weather.main.feels_like)}°C</div>
        </div>
      </div>
    </div>

    <div class="back-button-container">
      <button class="back-btn" id="backBtn">
        <i class="fas fa-arrow-left"></i> Назад
      </button>
    </div>
  `;

  const routerContent = getRouterContent();
  if (routerContent) {
    routerContent.innerHTML = weatherHTML;

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
}

export function renderAbout() {
  clearContent();

  const aboutHTML = `
    <div class="about-content">
      <h2>О приложении</h2>
      <p>
        Приложение "Погода" позволяет узнать текущую погоду в любом городе мира.
      </p>
      <p>
        Вы можете найти погоду по названию города или использовать геолокацию
        для определения погоды в вашем текущем местоположении.
      </p>
      <p>
        Приложение использует API OpenWeatherMap для получения актуальных
        данных о погоде.
      </p>
      <div class="back-button-container">
        <button class="back-btn" id="backBtn">
          <i class="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    </div>
  `;

  const routerContent = getRouterContent();
  if (routerContent) {
    routerContent.innerHTML = aboutHTML;

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
}

export function showError(message) {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

export function showLoading(isLoading) {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'block' : 'none';
  }
}

export function renderHistory(history) {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  if (!history || history.length === 0) {
    historyList.innerHTML = '<p class="no-history">История пуста</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (city) => `
      <div class="history-item">
        <a href="/city/${encodeURIComponent(city)}" data-router class="history-link">
          <i class="fas fa-map-marker-alt"></i> ${city}
        </a>
      </div>
    `
    )
    .join('');
}

export function addToHistory(city) {
  let history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');

  history = history.filter((item) => item !== city);
  history.unshift(city);
  history = history.slice(0, 10);

  localStorage.setItem('weatherHistory', JSON.stringify(history));
  renderHistory(history);
}

export function getHistory() {
  return JSON.parse(localStorage.getItem('weatherHistory') || '[]');
}

EventBus.on('weather:loaded', ({ city }) => {
  addToHistory(city);
});

EventBus.on('error', (error) => {
  showError(error.message || error);
});

EventBus.on('loading', (isLoading) => {
  showLoading(isLoading);
});
