export interface WeatherData {
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
