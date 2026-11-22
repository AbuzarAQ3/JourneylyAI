from datetime import date
import requests


class WeatherServiceError(Exception):
    """Base exception for weather service failures."""


class ForecastUnavailableError(WeatherServiceError):
    """Raised when the requested date has no available forecast."""


class OpenMeteoWeatherService:

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    HOURLY_FIELDS = (
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation_probability",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
    )

    DAILY_FIELDS = (
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "sunrise",
        "sunset",
    )

    def fetch_forecast(self, latitude: float, longitude: float) -> dict:

        if not -90 <= latitude <= 90:
            raise ValueError("Invalid latitude.")

        if not -180 <= longitude <= 180:
            raise ValueError("Invalid longitude.")

        params = {
            "latitude": latitude,
            "longitude": longitude,

            "hourly": ",".join(self.HOURLY_FIELDS),
            "daily": ",".join(self.DAILY_FIELDS),

            "timezone": "auto",
            "forecast_days": 16,

            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
        }

        try:
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=10,
            )

            response.raise_for_status()
            return response.json()

        except requests.RequestException as exc:
            raise WeatherServiceError(
                "Unable to retrieve weather forecast."
            ) from exc

    def get_day_forecast(
        self,
        latitude: float,
        longitude: float,
        target_date: date,
    ) -> dict:

        data = self.fetch_forecast(latitude, longitude)

        date_string = target_date.isoformat()

        # Find the requested date in the daily forecast.
        daily_data = data.get("daily", {})
        available_dates = daily_data.get("time", [])

        try:
            day_index = available_dates.index(date_string)

        except ValueError:
            raise ForecastUnavailableError(
                f"No forecast available for {date_string}."
            )

        # Extract the daily summary using its index.
        daily_summary = {
            field: daily_data[field][day_index]
            for field in self.DAILY_FIELDS
        }

        # Extract only the hourly entries belonging to this date.
        hourly_data = data.get("hourly", {})
        hourly_records = []

        for index, timestamp in enumerate(hourly_data.get("time", [])):

            if timestamp[:10] != date_string:
                continue

            record = {
                "time": timestamp,
            }

            for field in self.HOURLY_FIELDS:
                record[field] = hourly_data[field][index]

            hourly_records.append(record)

        return {
            "date": date_string,
            "timezone": data.get("timezone"),
            "daily": daily_summary,
            "hourly": hourly_records,
        }

WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    80: "Rain showers",
    95: "Thunderstorm",
}

def debug_print_forecast(data: dict) -> None:
    """Pretty-prints a single day's forecast dictionary for terminal debugging."""
    daily = data["daily"]
    condition = WMO_CODES.get(daily["weather_code"], f"Code {daily['weather_code']}")

    print("\n" + "=" * 62)
    print(f"📅 DATE: {data['date']} ({data['timezone']})")
    print(f"🌤️  SUMMARY: {condition} | High: {daily['temperature_2m_max']}°C | Low: {daily['temperature_2m_min']}°C")
    print(f"💧 RAIN: {daily['precipitation_sum']}mm ({daily['precipitation_probability_max']}% max) | 💨 WIND: {daily['wind_speed_10m_max']} km/h")
    print(f"🌅 SUNRISE: {daily['sunrise'][-5:]} | 🌇 SUNSET: {daily['sunset'][-5:]}")
    print("=" * 62)
    print(f"{'TIME':<7} | {'TEMP':<7} | {'FEELS':<7} | {'RAIN %':<7} | {'WIND':<9} | {'CONDITION'}")
    print("-" * 62)

    for h in data["hourly"]:
        hour_str = h["time"][-5:]  # Extracts "14:00" from "2026-11-21T14:00"
        h_cond = WMO_CODES.get(h["weather_code"], f"Code {h['weather_code']}")
        print(
            f"{hour_str:<7} | "
            f"{h['temperature_2m']:>5.1f}°C | "
            f"{h['apparent_temperature']:>5.1f}°C | "
            f"{h['precipitation_probability']:>5}% | "
            f"{h['wind_speed_10m']:>4.1f} km/h | "
            f"{h_cond}"
        )
    print("=" * 62 + "\n")
