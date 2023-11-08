import numpy as np
import requests
import json
from datetime import datetime, timedelta
import time

API_URL = 'https://partners-v2-1.edensprite.com/API.php'
users = ["clients2.torry@yandiyatechnologies.com"]
START_DATE = "2023-01-01"
END_DATE = "2023-01-02"

def get_data(action, timespan, datetime_val, user, scope, search_item):
    data = {
        "rtype": "admin.scraper.salus",
        "act": action,
        "timespan": timespan,
        "datetime": float(datetime_val.timestamp()),
        "user": user,
        "scope": scope,
        "searchItem": search_item
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(API_URL, data=data, headers=headers)
    return response.json()

def format_total_on_times(history):
    total_on_times = {}
    all_groups = set()

    for device in history:
        on_time = datetime.fromisoformat(device['onTime'])
        off_time = datetime.fromisoformat(device['offTime'])
        day = on_time.date()

        time_diff_in_seconds = (off_time - on_time).total_seconds()
        time_diff_in_hours = time_diff_in_seconds / 3600

        if day not in total_on_times:
            total_on_times[day] = {}

        if device['groupName'] not in total_on_times[day]:
            total_on_times[day][device['groupName']] = 0

        total_on_times[day][device['groupName']] += time_diff_in_hours
        all_groups.add(device['groupName'])

    for day in total_on_times:
        for group in all_groups:
            if group not in total_on_times[day]:
                total_on_times[day][group] = 0

    return total_on_times

def get_room_size(group_name, group_properties):
    for value in group_properties:
        if value['groupName'] == group_name:
            return float(value['propertyValue'])
    return 0

def format_weather_data(weather, focus_date):
    HOURS_IN_DAY = 24
    weather_data_for_day = []

    focus_date_formatted = focus_date.strftime('%Y-%m-%d')

    for h in range(HOURS_IN_DAY + 1):
        found_weather = next(
            (value for value in weather if
             float(value['datetimeEpoch']) > focus_date.timestamp() and
             float(value['datetimeEpoch']) <= (focus_date.timestamp() + 86400)),
            None
        )

        if found_weather:
            weather_data_for_day.extend([
                float(found_weather['datetimeEpoch'] * 1000),
                float(found_weather.get('precip', 0)),
                float(found_weather.get('precipprob', 0)),
                float(found_weather.get('precipcover', 0)),
                float(1 if found_weather.get('preciptype') else 0),
                float(found_weather.get('tempmin', 0)),
                float(found_weather.get('temp', 0)),
                float(found_weather.get('tempmax', 0)),
                float(found_weather.get('feelslikemin', 0)),
                float(found_weather.get('feelslike', 0)),
                float(found_weather.get('feelslikemax', 0)),
                float(found_weather.get('cloudcover', 0)),
                float(found_weather.get('solarradiation', 0)),
                float(found_weather.get('solarenergy', 0)),
                float(found_weather.get('UVIndex', 0)),
                float(datetime.fromisoformat(focus_date_formatted + "T" + found_weather['sunrise']).timestamp() * 1000),
                float(datetime.fromisoformat(focus_date_formatted + "T" + found_weather['sunset']).timestamp() * 1000)
            ])
    return weather_data_for_day

def add_user_data_to_dataset(user, start_date, end_date):
    timespan = 'year'
    datetime_val = datetime.fromisoformat(start_date)
    scope = 'user'
    search_item = ''

    # Getting data
    history_data = get_data('getRelayHistory', timespan, datetime_val, user, scope, search_item)
    group_properties = get_data('getGroupProperties', timespan, datetime_val, user, scope, search_item)
    device_data = get_data('getDevices', timespan, datetime_val, user, scope, search_item)
    weather = get_data('getWeather', timespan, datetime_val, user, start_date, end_date)
    product_assignments = get_data('getProductAssignments', timespan, datetime_val, user, scope, search_item)

    # Formatting
    history_data = format_total_on_times(history_data)

    start_date = datetime.fromisoformat(start_date)
    end_date = datetime.fromisoformat(end_date)
    day_difference = (end_date - start_date).days

    first_history_info = list(history_data.values())[0]
    group_names = list(first_history_info.keys())

    final_features = []
    final_values = []

    for group_name in group_names:
        for d in range(day_difference):
            focus_date = start_date + timedelta(days=d)
            feature = [
                get_room_size(group_name, group_properties),
                0,  # Placeholder for total panel wattage, to be calculated later
                *format_weather_data(weather, focus_date)
            ]

            focus_date_formatted = focus_date.strftime('%Y-%m-%d')
            on_time = history_data.get(focus_date_formatted, {}).get(group_name, 0)

            final_features.append(feature)
            final_values.append(on_time)

    return final_features, final_values

def main():
    dataset = {"features": [], "values": []}

    for user in users:
        features, values = add_user_data_to_dataset(user, START_DATE, END_DATE)
        dataset['features'].extend(features)
        dataset['values'].extend(values)
        print(f'Done for user: {user}')

    with open("on-time-prediction-dataset.json", "w") as f:
        json.dump(dataset, f)

if __name__ == "__main__":
    main()
