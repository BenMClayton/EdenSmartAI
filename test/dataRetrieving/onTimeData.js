const axios = require('axios');
const qs = require('qs'); // querystring library
const fs = require('fs');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );
const { StreamArray } = require('stream-json/streamers/StreamArray');
const stream = require('stream');

var finalData = {
    "features": [],
    "values": []
};

async function getRelayHistory(timespan, datetime, user, scope, searchItem) {
    const data = {
        rtype: 'admin.scraper.salus',
        act: 'getRelayHistory',
        timespan: timespan,
        datetime: datetime.getTime() / 1000,
        user: user,
        scope: scope,
        searchItem: searchItem,
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    
    const response = await axios.post(
        'https://partners-v2-1.edensprite.com/API.php', 
        qs.stringify(data),
        config
    );

    return response.data;
}

async function getGroupProperties(timespan, datetime, user, scope, searchItem) {
    const data = {
        rtype: 'admin.scraper.salus',
        act: 'getGroupProperties',
        timespan: timespan,
        datetime: datetime.getTime() / 1000,
        user: user,
        scope: scope,
        searchItem: searchItem,
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    
    const response = await axios.post(
        'https://partners-v2-1.edensprite.com/API.php', 
        qs.stringify(data),
        config
    );

    return response.data;
}

async function getDevices(timespan, datetime, user, scope, searchItem) {
    const data = {
        rtype: 'admin.scraper.salus',
        act: 'getDevices',
        timespan: timespan,
        datetime: datetime.getTime() / 1000,
        user: user,
        scope: scope,
        searchItem: searchItem,
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    
    const response = await axios.post(
        'https://partners-v2-1.edensprite.com/API.php', 
        qs.stringify(data),
        config
    );

    return response.data;
}

async function getProductAssignments(timespan, datetime, user, scope, searchItem) {
    const data = {
        rtype: 'admin.scraper.salus',
        act: 'getProductAssignments',
        timespan: timespan,
        datetime: datetime.getTime() / 1000,
        user: user,
        scope: scope,
        searchItem: searchItem,
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    
    const response = await axios.post(
        'https://partners-v2-1.edensprite.com/API.php', 
        qs.stringify(data),
        config
    );

    return response.data;
}

async function getWeather(userEmail, startDate, endDate) {
    const data = {
        rtype: 'admin.scraper.salus',
        act: 'getWeather',
        userEmail: userEmail,
        startDate: startDate,
        endDate: endDate
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    
    const response = await axios.post(
        'https://partners-v2-1.edensprite.com/API.php', 
        qs.stringify(data),
        config
    );

    return response.data;
}

function formatTotalOnTimes(history) {
    const totalOnTimes = {};
    const allGroups = new Set();

    history.forEach(device => {
        const onTime = new Date(device.onTime);
        const offTime = new Date(device.offTime);
        const day = onTime.toISOString().split('T')[0];

        const timeDiffInSeconds = (offTime - onTime) / 1000;
        const timeDiffInHours = timeDiffInSeconds / 3600;

        // Initialize day object if not exists
        if (!totalOnTimes[day]) {
            totalOnTimes[day] = {};
        }

        // Initialize total for this group if not exists
        if (!totalOnTimes[day][device.groupName]) {
            totalOnTimes[day][device.groupName] = 0;
        }

        // Add time to the group total for this day
        totalOnTimes[day][device.groupName] += timeDiffInHours;

        // Keep track of all groups
        allGroups.add(device.groupName);
    });

    // Fill in missing groups with 0 for each day
    Object.keys(totalOnTimes).forEach(day => {
        allGroups.forEach(group => {
            if (totalOnTimes[day][group] === undefined) {
                totalOnTimes[day][group] = 0;
            }
        });
    });

    return totalOnTimes;
}

function getTotalPanelWattage(groupName, devices, assignments){
    let totalWattage = 0;

    for(let a = 0; a < assignments.length; a++) {
        let assignment = assignments[a];

        let assignedMacAddress = assignment.deviceMacAddress;

        for(let d = 0; d < devices.length; d++){
            if(devices[d].deviceMacAddress == assignedMacAddress && devices[d].groupName == groupName){
                totalWattage += parseInt(assignment.realWattage);
            }
        }
    }
    return totalWattage;
}

function getRoomSize(groupName, groupProperties){
    let roomSize = 0;
    $.each(groupProperties, function(index, value){
        if(value.groupName == groupName){
            roomSize = value.propertyValue;

        }
    })
    return roomSize;
}

function formatWeatherData(weather, focusDate){
    const HOURS_IN_DAY = 24;
    let weatherDataForDay = [];

    let focusDateFormatted = new Date(focusDate).toISOString().split("T")[0];

    for(let h = 0; h <= HOURS_IN_DAY; h++){
        const foundWeather = weather.find(function(value){
            return parseInt(value.datetimeEpoch) > focusDate / 1000 && parseInt(value.datetimeEpoch) <= ((focusDate / 1000) + 86400000);
        });
        
        if (foundWeather) {
            weatherDataForDay.push(parseInt(foundWeather.datetimeEpoch * 1000));
            weatherDataForDay.push(parseInt(foundWeather.precip ? foundWeather.precip : 0));
            weatherDataForDay.push(parseInt(foundWeather.precipprob ? foundWeather.precipprob : 0));
            weatherDataForDay.push(parseInt(foundWeather.precipcover ? foundWeather.precipcover : 0));
            weatherDataForDay.push(parseInt(foundWeather.preciptype ? 1 : 0));
            weatherDataForDay.push(parseInt(foundWeather.tempmin ? foundWeather.tempmin : 0));
            weatherDataForDay.push(parseInt(foundWeather.temp ? foundWeather.temp : 0));
            weatherDataForDay.push(parseInt(foundWeather.tempmax ? foundWeather.tempmax : 0));
            weatherDataForDay.push(parseInt(foundWeather.feelslikemin ? foundWeather.feelslikemin : 0));
            weatherDataForDay.push(parseInt(foundWeather.feelslike ? foundWeather.feelslike : 0));
            weatherDataForDay.push(parseInt(foundWeather.feelslikemax ? foundWeather.feelslikemax : 0));
            weatherDataForDay.push(parseInt(foundWeather.cloudcover ? foundWeather.cloudcover : 0));
            weatherDataForDay.push(parseInt(foundWeather.solarradiation ? foundWeather.solarradiation : 0));
            weatherDataForDay.push(parseInt(foundWeather.solarenergy ? foundWeather.solarenergy : 0));
            weatherDataForDay.push(parseInt(foundWeather.UVIndex ? foundWeather.UVIndex : 0));
            weatherDataForDay.push(new Date(focusDateFormatted + "T" + foundWeather.sunrise).getTime());
            weatherDataForDay.push(new Date(focusDateFormatted + "T" + foundWeather.sunset).getTime());
        }
    }
    console.log(weatherDataForDay.length)
    return weatherDataForDay;
}

async function addUserDataToDataset(user, startDate, endDate){
    const timespan = 'year';
    const datetime = new Date(startDate);
    const scope = 'user';
    const searchItem = '';

    //GETTNG DATA
    let historyData = await getRelayHistory(timespan, datetime, user, scope, searchItem);
    let groupProperties = await getGroupProperties(timespan, datetime, user, scope, searchItem);
    let deviceData = await getDevices(timespan, datetime, user, scope, searchItem);
    let weather = await getWeather(user, startDate, endDate);  //IMPORTANT: MAKE SURE DATA IS PRESENT WITHIN THESE RANGES
    let productAssignments = await getProductAssignments(timespan, datetime, user, scope, searchItem);

    //FORMATTING
    historyData = formatTotalOnTimes(historyData);

    startDate = new Date(startDate);
    endDate = new Date(endDate);
    let dayDifference = (endDate.getTime() - startDate.getTime()) / 24 / 60 / 60 / 1000; //turn milliseconds -> days


    let firstHistoryInfo = Object.values(historyData)[0]; //History info always contains all the group names
    let groupNames = Object.keys(firstHistoryInfo);
    console.log("GROUPS", groupNames.length);

    $.each(groupNames, function(key, groupName){
        for(let d = 0; d < dayDifference; d++){ //TODO: loop through each day of the range
            let focusDate = startDate.getTime() + (86400000 * d);
            let feature = [];
            feature.push(parseInt(getRoomSize(groupName, groupProperties)));
            feature.push(parseInt(getTotalPanelWattage(groupName, deviceData, productAssignments)));
            feature.push(...formatWeatherData(weather, focusDate));

            const focusDateFormatted = new Date(focusDate).toISOString().split("T")[0]; //converts to YYYY-MM-DD format
            onTime = historyData[focusDateFormatted] ?  historyData[focusDateFormatted] : 0;
            finalData.features.push(feature);
            finalData.values.push(onTime[groupName] ? onTime[groupName]:0);
        }
    })

    return finalData;
}

async function main() {
    const writableStream = fs.createWriteStream("on-time-prediction-dataset.json");

    let users = ["clients2.torry@yandiyatechnologies.com"];
    const START_DATE = "2023-01-01";
    const END_DATE = "2023-01-02";

    for (const user of users) {
        const finalData = await addUserDataToDataset(user, START_DATE, END_DATE);
        
        // Write the opening brace for the JSON object
        writableStream.write('{');

        // Write the 'features' array
        writableStream.write('"features": [');
        for (let i = 0; i < finalData.features.length; i++) {
            writableStream.write(JSON.stringify(finalData.features[i]));
            if (i < finalData.features.length - 1) {
                writableStream.write(',');
            }
        }
        writableStream.write('],');

        // Write the 'values' array
        writableStream.write('"values": [');
        for (let i = 0; i < finalData.values.length; i++) {
            writableStream.write(JSON.stringify(finalData.values[i]));
            if (i < finalData.values.length - 1) {
                writableStream.write(',');
            }
        }
        writableStream.write(']');

        // Write the closing brace for the JSON object
        writableStream.write('}');

        console.log(`Done for user: ${user}`);
    }

    writableStream.end(() => {
        console.log('All data written.');
        let learningDataString = fs.readFileSync("on-time-prediction-dataset.json", 'utf8');
        let learningData = JSON.parse(learningDataString);

        //console.log(learningData.features);
    });

    
}


main();