import { fetchWeather, fetchGeo } from './model.js';
import EventBus from './eventBus.js';
import router from './router.js';
import { renderHome, renderCityWeather, renderAbout } from './view.js';

function initHomeHandlers() {
  const cityInput = document.getElementById('cityInput');
  const cityBtn = document.getElementById('cityBtn');
  const geoBtn = document.getElementById('geoBtn');

  if (cityBtn && cityInput) {
    const newCityBtn = cityBtn.cloneNode(true);
    cityBtn.parentNode.replaceChild(newCityBtn, cityBtn);

    newCityBtn.addEventListener('click', async () => {
      const city = cityInput.value.trim();
      if (!city) {
        EventBus.emit('error', 'Введите название города');
        return;
      }

      EventBus.emit('loading', true);
      try {
        const weather = await fetchWeather(city);
        EventBus.emit('weather:loaded', { city, weather });
        router.go(`/city/${encodeURIComponent(city)}`);
      } catch (error) {
        EventBus.emit('error', error);
      } finally {
        EventBus.emit('loading', false);
      }
    });
  }

  if (geoBtn) {
    const newGeoBtn = geoBtn.cloneNode(true);
    geoBtn.parentNode.replaceChild(newGeoBtn, geoBtn);

    newGeoBtn.addEventListener('click', async () => {
      EventBus.emit('loading', true);
      try {
        const city = await fetchGeo();
        const weather = await fetchWeather(city);
        EventBus.emit('weather:loaded', { city, weather });
        router.go(`/city/${encodeURIComponent(city)}`);
      } catch (error) {
        EventBus.emit('error', error);
      } finally {
        EventBus.emit('loading', false);
      }
    });
  }
}

export function init() {
  router.addRoute('/', () => {
    renderHome();
    setTimeout(initHomeHandlers, 0);
  });

  router.addRoute('/city/:cityName', async (params) => {
    const cityName = decodeURIComponent(params.cityName);

    EventBus.emit('loading', true);
    try {
      const weather = await fetchWeather(cityName);
      renderCityWeather(cityName, weather);
      EventBus.emit('weather:loaded', { city: cityName, weather });
    } catch (error) {
      EventBus.emit('error', error);
      router.go('/');
    } finally {
      EventBus.emit('loading', false);
    }
  });

  router.addRoute('/about', () => {
    renderAbout();
  });

  router.init();
}
