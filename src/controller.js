import { fetchWeather, fetchGeo } from './model.js';
import EventBus from './eventBus.js';

export function init() {
  const cityInput = document.getElementById('cityInput');
  const cityBtn = document.getElementById('cityBtn');
  const geoBtn = document.getElementById('geoBtn');

  if (cityBtn && cityInput) {
    cityBtn.addEventListener('click', async () => {
      const city = cityInput.value.trim();
      if (!city) {
        EventBus.emit('error', 'Введите название города');
        return;
      }

      EventBus.emit('loading', true);
      try {
        const weather = await fetchWeather(city);
        EventBus.emit('weather:loaded', { city, weather });
      } catch (error) {
        EventBus.emit('error', error);
      } finally {
        EventBus.emit('loading', false);
      }
    });
  }

  if (geoBtn) {
    geoBtn.addEventListener('click', async () => {
      EventBus.emit('loading', true);
      try {
        const city = await fetchGeo();
        const weather = await fetchWeather(city);
        EventBus.emit('weather:loaded', { city, weather });
      } catch (error) {
        EventBus.emit('error', error);
      } finally {
        EventBus.emit('loading', false);
      }
    });
  }
}
