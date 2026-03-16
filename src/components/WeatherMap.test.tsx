/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeatherMap } from './WeatherMap';

describe('WeatherMap', () => {
  test('renders fallback text when no coordinates provided', () => {
    render(<WeatherMap city="Berlin" />);
    expect(screen.getByText('Координаты для города недоступны.')).toBeInTheDocument();
  });

  test('renders iframe with map when coordinates are provided', () => {
    render(<WeatherMap city="Berlin" coord={{ lat: 52.52, lon: 13.4 }} />);
    const frame = screen.getByTitle('Карта города Berlin');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute('src');
  });
});
