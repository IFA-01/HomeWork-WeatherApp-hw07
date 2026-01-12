async function fetchWeather(city) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const APP_ID = '97d93f1704dcb8e35dd2045c8e75710d';
  let response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&appid=${APP_ID}`
  );
  const weather = JSON.parse(await response.text());
  return weather;
}

async function fetchGeo() {
  if (!navigator.geolocation) {
    throw new Error('couldnt get geolocation');
  }

  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const APP_ID = '97d93f1704dcb8e35dd2045c8e75710d';
        try {
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${APP_ID}`
          );
          const cityInfo = await response.json();
          if (cityInfo && cityInfo.length > 0) {
            const city = cityInfo[0].name;
            localStorage.setItem('geoPermission', 'granted');
            resolve(city);
          } else {
            reject(new Error('City no found for this location'));
          }
        } catch (error) {
          reject(new Error('Failed to get a City name', error));
        }
      },
      (error) => {
        switch (error.code) {
          case 1:
            reject(new Error('User denied the request for Geolocation.'));
            break;
          case 2:
            reject(new Error('Location information is unavailable.'));
            break;
          case 3:
            reject(new Error('The request to get user location timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred'));
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

module.exports = { fetchWeather, fetchGeo };
