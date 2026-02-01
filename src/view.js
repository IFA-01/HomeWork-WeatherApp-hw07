import EventBus from './eventBus.js';

function renderWeather(city, weather) {
  const weatherContentDOM = document.getElementById('weather-app');
  const divForWeather = document.createElement('div');
  divForWeather.className = 'weather-result';

  const weatherContentText = document.createElement('p');
  weatherContentText.textContent = `Погода в ${city}: ${weather.main.temp}°C, Влажность: ${weather.main.humidity}%`;

  divForWeather.appendChild(weatherContentText);
  weatherContentDOM.appendChild(divForWeather);
}

function showError(message) {
  alert(message);
}

function showLoading(isLoading) {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'block' : 'none';
  }
}

EventBus.on('weather:loaded', ({ city, weather }) => {
  renderWeather(city, weather);
});

EventBus.on('error', (error) => {
  showError(error.message || error);
});

EventBus.on('loading', (isLoading) => {
  showLoading(isLoading);
});

export { renderWeather, showError, showLoading };
