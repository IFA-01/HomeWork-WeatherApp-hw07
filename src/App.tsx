import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useHistoryState } from './hooks/useHistory';
import { useWeather } from './hooks/useWeather';
import { WeatherMap, WeatherSearchForm } from './components';
import type { WeatherState } from './types/weather';

const GITHUB_BASE_PATH = '/HomeWork-WeatherApp-hw07';

function getBrowserBasePath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname;
  const isGithubPages =
    host === 'ifa-01.github.io' || host.endsWith('.github.io');
  return isGithubPages ? GITHUB_BASE_PATH : undefined;
}

function normalizeCityFromRoute(cityName: string | undefined): string {
  if (!cityName) return '';
  return decodeURIComponent(cityName).trim();
}

function AboutScreen() {
  const navigate = useNavigate();

  return (
    <div className="about-content">
      <h2>О приложении</h2>
      <p>
        Приложение «Погода» позволяет узнать текущую погоду в любом городе мира.
      </p>
      <p>
        Вы можете найти погоду по названию города или использовать геолокацию
        для определения погоды в вашем текущем местоположении.
      </p>
      <p>
        Приложение использует API OpenWeatherMap для получения актуальных данных
        о погоде.
      </p>
      <div className="back-button-container">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    </div>
  );
}

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
  const description = data.weather[0]?.description ?? '';

  return (
    <div className="weather-info show">
      <div className="location" id="location">
        {city}
      </div>
      <div className="temp" id="temperature">
        {temp}°C
      </div>
      <div className="description" id="description">
        {description}
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
      <WeatherMap city={city} coord={data.coord} />
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

function HistoryList({ history }: { history: string[] }) {
  if (history.length === 0) {
    return <p className="no-history">История пуста</p>;
  }

  return (
    <>
      {history.map((city) => (
        <div key={city} className="history-item">
          <NavLink
            data-router
            className="history-link"
            to={`/weather/${encodeURIComponent(city)}`}
          >
            <i className="fas fa-map-marker-alt"></i> {city}
          </NavLink>
        </div>
      ))}
    </>
  );
}

function HomeScreen({
  cityInput,
  onCityInputChange,
  onCitySubmit,
  onGeoSubmit,
  history,
  loading,
  error,
  onClearError,
}: {
  cityInput: string;
  onCityInputChange: (value: string) => void;
  onCitySubmit: () => void;
  onGeoSubmit: () => Promise<string | null>;
  history: string[];
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}) {
  return (
    <>
      <WeatherSearchForm
        cityInput={cityInput}
        onCityInputChange={onCityInputChange}
        onCitySubmit={onCitySubmit}
        onGeoSubmit={onGeoSubmit}
      />

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
            onClick={onClearError}
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
          <HistoryList history={history} />
        </div>
      </div>
    </>
  );
}

function WeatherRoute({
  weather,
  loading,
  error,
  fetchByCity,
  clearError,
  onBack,
}: {
  weather: WeatherState;
  loading: boolean;
  error: string | null;
  fetchByCity: (city: string) => Promise<string | null>;
  clearError: () => void;
  onBack: () => void;
}) {
  const { cityName } = useParams();
  const routeCity = useMemo(() => normalizeCityFromRoute(cityName), [cityName]);

  useEffect(() => {
    if (!routeCity) return;
    if (weather?.city.toLowerCase() === routeCity.toLowerCase()) return;
    void fetchByCity(routeCity);
  }, [fetchByCity, routeCity, weather?.city]);

  if (!routeCity) {
    return <Navigate replace to="/" />;
  }

  return (
    <>
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

      <WeatherResult weather={weather} onBack={onBack} />
    </>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [cityInput, setCityInput] = useState('');
  const [history, addToHistory] = useHistoryState();
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
    const trimmed = cityInput.trim();
    if (!trimmed) {
      void fetchByCity(cityInput);
      return;
    }
    clearError();
    navigate(`/weather/${encodeURIComponent(trimmed)}`);
  };

  const handleGeoSubmit = async (): Promise<string | null> => {
    const city = await fetchByGeo();
    if (city) {
      navigate(`/weather/${encodeURIComponent(city)}`);
      return city;
    }
    return null;
  };

  const handleBackToHome = () => {
    clearWeather();
    navigate('/');
  };

  return (
    <>
      <nav className="navigation">
        <NavLink
          to="/"
          data-router
          id="navHome"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          end
        >
          <i className="fas fa-home"></i> Главная
        </NavLink>
        <NavLink
          to="/about"
          data-router
          id="navAbout"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <i className="fas fa-info-circle"></i> О приложении
        </NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <HomeScreen
              cityInput={cityInput}
              onCityInputChange={setCityInput}
              onCitySubmit={handleCitySubmit}
              onGeoSubmit={handleGeoSubmit}
              history={history}
              loading={loading}
              error={error}
              onClearError={clearError}
            />
          }
        />
        <Route path="/about" element={<AboutScreen />} />
        <Route
          path="/weather/:cityName"
          element={
            <WeatherRoute
              weather={weather}
              loading={loading}
              error={error}
              fetchByCity={fetchByCity}
              clearError={clearError}
              onBack={handleBackToHome}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={getBrowserBasePath()}>
      <AppContent />
    </BrowserRouter>
  );
}
