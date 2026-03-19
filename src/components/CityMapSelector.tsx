import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Coordinates = { lat: number; lon: number };

export function CityMapSelector({
  onSelectPoint,
}: {
  onSelectPoint: (coords: Coordinates) => void;
}) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.CircleMarker | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        worldCopyJump: true,
      });
      mapRef.current = map;
      map.attributionControl.setPrefix(false);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const handleMapClick = (event: L.LeafletMouseEvent) => {
        const lat = Number(event.latlng.lat.toFixed(4));
        const lon = Number(event.latlng.lng.toFixed(4));

        if (!markerRef.current) {
          markerRef.current = L.circleMarker(event.latlng, {
            radius: 7,
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map);
        } else {
          markerRef.current.setLatLng(event.latlng);
        }

        onSelectPoint({ lat, lon });
      };

      map.on('click', handleMapClick);

      return () => {
        map.off('click', handleMapClick);
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [onSelectPoint]);

  return (
    <section className="city-map-selector" aria-label="Карта выбора города">
      <h3>Выбор города по карте</h3>
      <p className="city-map-hint">
        Нажмите на любую точку карты, чтобы получить погоду по координатам.
      </p>
      <div
        ref={mapContainerRef}
        className="city-map-canvas"
        aria-label="Интерактивная карта мира"
      />
    </section>
  );
}
