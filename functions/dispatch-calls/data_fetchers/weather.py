import os
import requests

# Use the forecast endpoint to get current and daily forecast in one call
WEATHER_API_URL = "http://api.weatherapi.com/v1/forecast.json"
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")


def get_weather_for_cities(cities: set) -> dict[str, str]:
    """
    Fetches the current weather and today's forecast for a set of unique cities.

    Args:
        cities: A set of city names.

    Returns:
        A dictionary mapping each city to its formatted weather string.
        Returns a generic error message for cities where the lookup fails.
    """
    weather_data = {}
    for city in cities:
        try:
            params = {
                "key": WEATHER_API_KEY,
                "q": city,
                "days": 1,        # Get forecast for today
                "aqi": "no",      # Exclude air quality data
                "alerts": "no",   # Exclude alerts
            }
            response = requests.get(WEATHER_API_URL, params=params)
            response.raise_for_status()

            data = response.json()

            # Extract current weather
            current_weather = data["current"]
            current_temp_f = current_weather["temp_f"]
            current_condition = current_weather["condition"]["text"]

            # Extract today's forecast from the first item in the forecastday array
            forecast_day = data["forecast"]["forecastday"][0]["day"]
            max_temp_f = forecast_day["maxtemp_f"]
            min_temp_f = forecast_day["mintemp_f"]
            forecast_condition = forecast_day["condition"]["text"]

            weather_data[city] = (
                f"Currently in {city}, it's {current_temp_f}°F and {current_condition}. "
                f"Today's forecast is {forecast_condition} with a high of {max_temp_f}°F and a low of {min_temp_f}°F."
            )
        except requests.exceptions.RequestException as e:
            print(f"Could not fetch weather for {city}: {e}")
            weather_data[city] = "No data available."

    return weather_data
