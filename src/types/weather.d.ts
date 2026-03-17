export interface WeatherData {
  coord?: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{ description: string }>;
  wind?: { speed: number };
}

export type WeatherState = {
  city: string;
  data: WeatherData;
} | null;
