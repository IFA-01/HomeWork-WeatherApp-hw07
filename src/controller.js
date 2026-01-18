const { fetchWeather, fetchGeo } = require('./model.js');
const { renderWeather, showError, showLoading } = require('./view.js');

function init() {
  const cityInput = document.getElementById('cityInput');
  const cityBtn = document.getElementById('cityBtn');
  const geoBtn = document.getElementById('geoBtn');

  if (cityBtn && cityInput) {
    cityBtn.addEventListener('click', async () => {
      const city = cityInput.value.trim();
      if (!city) {
        showError('enter a city name');
        return;
      }

      showLoading(true);
      try {
        const weather = await fetchWeather(city);
        renderWeather(city, weather);
      } catch (error) {
        showError(`Error: ${error.message}`);
      } finally {
        showLoading(false);
      }
    });
  }

  if (geoBtn) {
    geoBtn.addEventListener('click', async () => {
      showLoading(true);
      try {
        const city = await fetchGeo();
        const weather = await fetchWeather(city);
        renderWeather(city, weather);
      } catch (error) {
        showError(error.message);
      } finally {
        showLoading(false);
      }
    });
  }
}

module.exports = { init };
