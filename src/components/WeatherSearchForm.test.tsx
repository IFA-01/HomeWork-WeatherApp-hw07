/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WeatherSearchForm } from './WeatherSearchForm';

describe('WeatherSearchForm', () => {
  test('calls handlers for city and geolocation buttons', () => {
    const onCityInputChange = jest.fn();
    const onCitySubmit = jest.fn();
    const onGeoSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(
      <WeatherSearchForm
        cityInput=""
        onCityInputChange={onCityInputChange}
        onCitySubmit={onCitySubmit}
        onGeoSubmit={onGeoSubmit}
      />
    );

    fireEvent.change(getByPlaceholderText('Введите город'), {
      target: { value: 'Prague' },
    });
    fireEvent.click(getByText('По городу'));
    fireEvent.click(getByText('По геолокации'));

    expect(onCityInputChange).toHaveBeenCalledWith('Prague');
    expect(onCitySubmit).toHaveBeenCalled();
    expect(onGeoSubmit).toHaveBeenCalled();
  });

  test('submit is triggered by Enter key in input', () => {
    const onCitySubmit = jest.fn();

    const { getByPlaceholderText } = render(
      <WeatherSearchForm
        cityInput=""
        onCityInputChange={() => {}}
        onCitySubmit={onCitySubmit}
        onGeoSubmit={async () => null}
      />
    );

    fireEvent.keyDown(getByPlaceholderText('Введите город'), { key: 'Enter' });
    expect(onCitySubmit).toHaveBeenCalledTimes(1);
  });
});
