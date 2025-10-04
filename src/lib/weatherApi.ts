// Weather API Integration for Health Predictions
// Using Open-Meteo (free, no API key required)

export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  pressure: number; // hPa
  windSpeed: number; // km/h
  precipitation: number; // mm
  weatherCode: number; // WMO code
  uvIndex: number;
  date: string;
}

export interface WeatherForecast extends WeatherData {
  daysAhead: number;
}

const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";

// Get user's location (with permission)
export const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // Default to a major city if permission denied
        console.warn("Location permission denied, using default");
        resolve({ lat: 40.7128, lon: -74.0060 }); // New York as fallback
      },
      { timeout: 5000 }
    );
  });
};

// Get coordinates from city name
export const getCityCoordinates = async (cityName: string): Promise<{ lat: number; lon: number }> => {
  try {
    const response = await fetch(
      `${GEO_API_BASE}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
      };
    }
    throw new Error("City not found");
  } catch (error) {
    console.error("Error fetching city coordinates:", error);
    throw error;
  }
};

// Fetch current weather
export const getCurrentWeather = async (lat?: number, lon?: number): Promise<WeatherData> => {
  try {
    let location = { lat, lon };
    
    if (!lat || !lon) {
      location = await getUserLocation();
    }

    const response = await fetch(
      `${WEATHER_API_BASE}?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,precipitation,weather_code,uv_index&timezone=auto`
    );

    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      pressure: current.pressure_msl,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      uvIndex: current.uv_index || 0,
      date: current.time.split('T')[0],
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw new Error("Failed to fetch weather data");
  }
};

// Fetch weather forecast (next 7 days)
export const getWeatherForecast = async (lat?: number, lon?: number): Promise<WeatherForecast[]> => {
  try {
    let location = { lat, lon };
    
    if (!lat || !lon) {
      location = await getUserLocation();
    }

    const response = await fetch(
      `${WEATHER_API_BASE}?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,pressure_msl_mean,wind_speed_10m_max,precipitation_sum,weather_code,uv_index_max&timezone=auto&forecast_days=7`
    );

    const data = await response.json();
    const daily = data.daily;

    return daily.time.map((date: string, index: number) => ({
      temperature: (daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2,
      humidity: daily.relative_humidity_2m_mean[index],
      pressure: daily.pressure_msl_mean[index],
      windSpeed: daily.wind_speed_10m_max[index],
      precipitation: daily.precipitation_sum[index],
      weatherCode: daily.weather_code[index],
      uvIndex: daily.uv_index_max[index] || 0,
      date: date,
      daysAhead: index,
    }));
  } catch (error) {
    console.error("Error fetching forecast:", error);
    throw new Error("Failed to fetch weather forecast");
  }
};

// Calculate weather change metrics (for trigger detection)
export const getWeatherChanges = (current: WeatherData, forecast: WeatherForecast[]): {
  pressureDrop: number;
  temperatureChange: number;
  humidityChange: number;
} => {
  const tomorrow = forecast.find(f => f.daysAhead === 1);
  
  if (!tomorrow) {
    return { pressureDrop: 0, temperatureChange: 0, humidityChange: 0 };
  }

  return {
    pressureDrop: current.pressure - tomorrow.pressure,
    temperatureChange: tomorrow.temperature - current.temperature,
    humidityChange: tomorrow.humidity - current.humidity,
  };
};

// Weather condition descriptions
export const getWeatherDescription = (code: number): string => {
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodes[code] || "Unknown";
};

// Store weather data with journal entry
export const saveWeatherWithEntry = (entryDate: string, weather: WeatherData): void => {
  const key = `weather_${entryDate}`;
  localStorage.setItem(key, JSON.stringify(weather));
};

// Get historical weather for an entry
export const getWeatherForEntry = (entryDate: string): WeatherData | null => {
  const key = `weather_${entryDate}`;
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  return null;
};
