import React, { useRef } from 'react';
import { useHistoryState } from './hooks/useHistory';
import { useWeather } from './hooks/useWeather';
import type { WeatherState } from './types/weather';

function WeatherResult({
  weather,
  onBack,
}: {
  weather: WeatherState;
  onBack: () => void;
}) {
  if (!weather) return null;
  const { city, data } = weather;
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const wind = data.wind?.speed ?? 0;
  const desc = data.weather[0]?.description ?? '';

  return (
    <div className="weather-info show">
      <div className="location" id="location">
        {city}
      </div>
      <div className="temp" id="temperature">
        {temp}°C
      </div>
      <div className="description" id="description">
        {desc}
      </div>
      <div className="details">
        <div className="detail">
          <i className="fas fa-wind"></i>
          <div id="wind">{wind} м/с</div>
        </div>
        <div className="detail">
          <i className="fas fa-tint"></i>
          <div id="humidity">{data.main.humidity}%</div>
        </div>
        <div className="detail">
          <i className="fas fa-temperature-high"></i>
          <div id="feelsLike">{feelsLike}°C</div>
        </div>
      </div>
      <div className="back-button-container">
        <button
          type="button"
          className="back-btn"
          id="backBtn"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    </div>
  );
}

function HistoryList({
  history,
  onSelectCity,
}: {
  history: string[];
  onSelectCity: (city: string) => void;
}) {
  if (!history || history.length === 0) {
    return <p className="no-history">История пуста</p>;
  }
  return (
    <>
      {history.map((city) => (
        <div key={city} className="history-item">
          <button
            type="button"
            className="history-link"
            onClick={() => onSelectCity(city)}
          >
            <i className="fas fa-map-marker-alt"></i> {city}
          </button>
        </div>
      ))}
    </>
  );
}

export default function App() {
  const [history, addToHistory] = useHistoryState();
  const cityInputRef = useRef<HTMLInputElement>(null);

  const {
    weather,
    loading,
    error,
    fetchByCity,
    fetchByGeo,
    clearError,
    clearWeather,
  } = useWeather(addToHistory);

  const handleCitySubmit = () => {
    const value = cityInputRef.current?.value ?? '';
    fetchByCity(value);
  };

  const handleSelectFromHistory = (city: string) => {
    fetchByCity(city);
  };

  return (
    <>
      <div className="input-group">
        <input
          ref={cityInputRef}
          type="text"
          id="cityInput"
          placeholder="Введите город"
          onKeyDown={(e) => e.key === 'Enter' && handleCitySubmit()}
        />
      </div>

      <div className="buttons">
        <button
          type="button"
          className="city-btn"
          id="cityBtn"
          onClick={handleCitySubmit}
        >
          <i className="fas fa-city"></i> По городу
        </button>
        <button
          type="button"
          className="geo-btn"
          id="geoBtn"
          onClick={() => fetchByGeo()}
        >
          <i className="fas fa-location-arrow"></i> По геолокации
        </button>
      </div>

      <div
        className="loading"
        id="loading"
        style={{ display: loading ? 'block' : 'none' }}
      >
        <i className="fas fa-spinner fa-spin"></i> Загрузка...
      </div>

      {error && (
        <div className="error" id="error" style={{ display: 'block' }}>
          {error}
          <button
            type="button"
            aria-label="Закрыть"
            onClick={clearError}
            style={{
              marginLeft: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="history-section" id="historySection">
        <h3>История поиска</h3>
        <div className="history-list" id="historyList">
          <HistoryList
            history={history}
            onSelectCity={handleSelectFromHistory}
          />
        </div>
      </div>

      {weather && <WeatherResult weather={weather} onBack={clearWeather} />}
    </>
  );
}
