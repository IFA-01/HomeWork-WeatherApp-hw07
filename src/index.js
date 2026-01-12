require('./style.css');

const { fetchWeather, fetchGeo } = require('./model.js');

const cityInput =
  typeof document !== 'undefined' ? document.getElementById('cityInput') : null;
const cityBtn =
  typeof document !== 'undefined' ? document.getElementById('cityBtn') : null;
const geoBtn =
  typeof document !== 'undefined' ? document.getElementById('geoBtn') : null;
const weatherContentDOM =
  typeof document !== 'undefined'
    ? document.getElementById('weather-app')
    : null;

if (cityBtn && cityInput) {
  cityBtn.addEventListener('click', async () => {
    const city = cityInput.value;
    if (!city) {
      alert('enter a city name');
      return;
    }
    try {
      const weather = await fetchWeather(city);
      const divForWeather = document.createElement('div');
      const weatherContentText = document.createElement('p');
      weatherContentText.textContent = `Weather in ${city}: ${weather.main.temp}°C, Humidity: ${weather.main.humidity}%`;
      divForWeather.appendChild(weatherContentText);
      if (weatherContentDOM) {
        weatherContentDOM.appendChild(divForWeather);
      }
    } catch (error) {
      alert('Error fetching weather:', error.message);
    }
  });
}

if (geoBtn) {
  geoBtn.addEventListener('click', async () => {
    try {
      const city = await fetchGeo();
      const weather = await fetchWeather(city);
      const divForWeather = document.createElement('div');
      const weatherContentText = document.createElement('p');
      weatherContentText.textContent = `Weather in ${city}: ${weather.main.temp}°C, Humidity: ${weather.main.humidity}%`;
      divForWeather.appendChild(weatherContentText);
      if (weatherContentDOM) {
        weatherContentDOM.appendChild(divForWeather);
      }
    } catch (error) {
      alert(error.message);
    }
  });
}
