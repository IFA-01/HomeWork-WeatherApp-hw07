import EventBus from './eventBus.js';
import { WeatherData } from './model.js';

function getRouterContent(): HTMLElement | null {
  return document.getElementById('router-content');
}

function clearContent(): void {
  const routerContent = getRouterContent();
  if (routerContent) {
    routerContent.innerHTML = '';
  }
}

export function renderHome(): void {
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

export function renderCityWeather(city: string, weather: WeatherData): void {
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

    const backBtn = document.getElementById(
      'backBtn'
    ) as HTMLButtonElement | null;
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
}

export function renderAbout(): void {
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

    const backBtn = document.getElementById(
      'backBtn'
    ) as HTMLButtonElement | null;
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
}

export function showError(
  message: string | Error | { message?: string }
): void {
  const errorEl = document.getElementById('error');
  let errorMessage: string;
  if (message instanceof Error) {
    errorMessage = message.message;
  } else if (
    typeof message === 'object' &&
    message !== null &&
    'message' in message
  ) {
    errorMessage = message.message || String(message);
  } else {
    errorMessage = String(message);
  }

  if (errorEl) {
    errorEl.textContent = errorMessage;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  } else {
    alert(errorMessage);
  }
}

export function showLoading(isLoading: boolean): void {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'block' : 'none';
  }
}

export function renderHistory(history: string[] | null): void {
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

export function addToHistory(city: string): void {
  let history: string[] = JSON.parse(
    localStorage.getItem('weatherHistory') || '[]'
  );

  history = history.filter((item) => item !== city);
  history.unshift(city);
  history = history.slice(0, 10);

  localStorage.setItem('weatherHistory', JSON.stringify(history));
  renderHistory(history);
}

export function getHistory(): string[] {
  return JSON.parse(localStorage.getItem('weatherHistory') || '[]');
}

interface WeatherLoadedEvent {
  city: string;
  weather: WeatherData;
}

EventBus.on('weather:loaded', ({ city }: WeatherLoadedEvent) => {
  addToHistory(city);
});

EventBus.on('error', (error: string | Error | { message?: string }) => {
  showError(error);
});

EventBus.on('loading', (isLoading: boolean) => {
  showLoading(isLoading);
});
