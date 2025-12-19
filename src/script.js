// Получаем элементы DOM только если они существуют (для поддержки тестирования)
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

async function fetchWeather(city) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // const mockData = {
  //   moscow: {
  //     city: "Moscow",
  //     humidity: 75,
  //     temp: Math.floor(Math.random() * (0 - 25 + 1)) + 0,
  //   },
  //   london: {
  //     city: "London",
  //     humidity: 50,
  //     temp: Math.floor(Math.random() * (0 - 20 + 1)) + 0,
  //   },
  //   berlin: {
  //     city: "berlin",
  //     humidity: 70,
  //     temp: Math.floor(Math.random() * (0 - 25 + 1)) + 0,
  //   },
  // };

  // const cityKey = city.trim().toLowerCase();

  // if (mockData[cityKey]) {
  //   return mockData[cityKey];
  // } else {
  //   throw new Error("no such city. try again");
  // }
  const APP_ID = '97d93f1704dcb8e35dd2045c8e75710d';
  let response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&appid=${APP_ID}`
  );
  const weather = JSON.parse(await response.text());
  return weather;
}
// async function fetchGeo() {
//   let latitude = "";
//   let longitude = "";
//   navigator.Get;
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         latitude = position.coords.latitude;
//         longitude = position.coords.longitude;
//       },
//       (error) => {
//         switch (error.code) {
//           case error.PERMISSION_DENIED:
//             console.error("User denied the request for Geolocation.");
//             break;
//           case error.POSITION_UNAVAILABLE:
//             console.error("Location information is unavailable.");
//             break;
//           case error.TIMEOUT:
//             console.error("The request to get user location timed out.");
//             break;
//           case error.UNKNOWN_ERROR:
//             console.error("An unknown error occurred.");
//             break;
//         }
//       },
//       { enableHighAccuracy: true, timeout: 5000 }
//     );
//   } else {
//     alert("Error getting geo data");
//   }
//   console.log(latitude, longitude);
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const APP_ID = "97d93f1704dcb8e35dd2045c8e75710d";
//   let response = await fetch(
//     `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${APP_ID}`
//   );
//   const cityInfo = JSON.parse(await response.text());
//   const city = cityInfo[0].name;
//   localStorage.setItem("geoPermission", "granted");
//   return city;
// }

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
          case 1: // PERMISSION_DENIED
            reject(new Error('User denied the request for Geolocation.'));
            break;
          case 2: // POSITION_UNAVAILABLE
            reject(new Error('Location information is unavailable.'));
            break;
          case 3: // TIMEOUT
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

// Добавляем обработчики событий только если элементы существуют
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

// Экспортируем функции для тестирования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchWeather, fetchGeo };
}
