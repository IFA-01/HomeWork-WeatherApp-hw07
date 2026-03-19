/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { CityMapSelector } from './CityMapSelector';

const mockMapOn = jest.fn();
const mockMapOff = jest.fn();
const mockMapRemove = jest.fn();
const mockCircleSetLatLng = jest.fn();
const mockCircleAddTo = jest.fn();
let mockClickHandler:
  | ((event: { latlng: { lat: number; lng: number } }) => void)
  | null = null;

jest.mock('leaflet', () => ({
  __esModule: true,
  default: {
    map: () => ({
      attributionControl: {
        setPrefix: jest.fn(),
      },
      on: (eventName: string, handler: typeof mockClickHandler) => {
        if (eventName === 'click') mockClickHandler = handler;
        mockMapOn(eventName, handler);
      },
      off: mockMapOff,
      remove: mockMapRemove,
    }),
    tileLayer: () => ({
      addTo: jest.fn(),
    }),
    circleMarker: () => ({
      addTo: () => {
        mockCircleAddTo();
        return { setLatLng: mockCircleSetLatLng };
      },
      setLatLng: mockCircleSetLatLng,
    }),
  },
}));

describe('CityMapSelector', () => {
  beforeEach(() => {
    mockClickHandler = null;
    jest.clearAllMocks();
  });

  test('initializes leaflet map and passes click coordinates', () => {
    const onSelectPoint = jest.fn();
    render(<CityMapSelector onSelectPoint={onSelectPoint} />);

    expect(mockMapOn).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockClickHandler).toBeTruthy();
    mockClickHandler?.({ latlng: { lat: 51.5074, lng: -0.1278 } });

    expect(onSelectPoint).toHaveBeenCalledWith({ lat: 51.5074, lon: -0.1278 });
  });
});
