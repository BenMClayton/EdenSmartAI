const axios = require('axios');
const qs = require('qs'); // querystring library
const fs = require('fs');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

var finalData = [[],[]];

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

    let finalData;
    //LOOP THROUGH WEATHER DATA AS IS HOURLY. If prev index is less than 6000 away then stop adding to finalData
    $.each(weather, function(index, value){
        let previousWeatherFocus = weather[index-1];

        if(!weather[index-1]){ //To negate the first 1
            previousWeatherFocus = value;
        }

        if(value.datetimeEpoch - previousWeatherFocus.datetimeEpoch <= 100000){ //Makes sure data is 1 hour ahead not 1 day
            console.log("hour");
        }else{
            console.log("day");
            return;
        }
    })
}

async function main(){
    let users = ["clients2.zachary@yandiyatechnologies.com","clients2.torry@yandiyatechnologies.com"];

    const START_DATE = "2023-01-01";
    const END_DATE = "2023-07-01";

    for (const user of users) {
        await addUserDataToDataset(user, START_DATE, END_DATE)
    }

    fs.writeFileSync("on-time-prediction-dataset.txt", JSON.stringify(finalData));
}

main();