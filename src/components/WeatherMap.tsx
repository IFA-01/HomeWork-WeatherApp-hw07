import React from 'react';

type Coord = {
  lat: number;
  lon: number;
};

function getMapSrc({ lat, lon }: Coord): string {
  const delta = 0.12;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export function WeatherMap({
  city,
  coord,
}: {
  city: string;
  coord?: Coord;
}) {
  if (!coord) {
    return (
      <div className="map-block">
        <h3>Карта</h3>
        <p className="no-map-data">Координаты для города недоступны.</p>
      </div>
    );
  }

  return (
    <div className="map-block">
      <h3>Карта</h3>
      <iframe
        title={`Карта города ${city}`}
        className="map-frame"
        src={getMapSrc(coord)}
        loading="lazy"
      />
    </div>
  );
}
