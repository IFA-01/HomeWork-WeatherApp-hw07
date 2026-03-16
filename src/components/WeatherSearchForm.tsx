import React from 'react';

export function WeatherSearchForm({
  cityInput,
  onCityInputChange,
  onCitySubmit,
  onGeoSubmit,
}: {
  cityInput: string;
  onCityInputChange: (value: string) => void;
  onCitySubmit: () => void;
  onGeoSubmit: () => Promise<string | null>;
}) {
  return (
    <>
      <div className="input-group">
        <input
          type="text"
          id="cityInput"
          placeholder="Введите город"
          value={cityInput}
          onChange={(event) => onCityInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onCitySubmit();
            }
          }}
        />
      </div>

      <div className="buttons">
        <button
          type="button"
          className="city-btn"
          id="cityBtn"
          onClick={onCitySubmit}
        >
          <i className="fas fa-city"></i> По городу
        </button>
        <button
          type="button"
          className="geo-btn"
          id="geoBtn"
          onClick={() => void onGeoSubmit()}
        >
          <i className="fas fa-location-arrow"></i> По геолокации
        </button>
      </div>
    </>
  );
}
