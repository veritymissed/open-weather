import { postgresConnection } from './database.js';
import axios from 'axios';
import { WeatherData } from './models/realtimedata.js';

export async function fetchAPI(route, token){
  let config = {
    method: 'get',
    url: `https://opendata.cwb.gov.tw/${route}?Authorization=${token}`,
    headers: {
      'Accept': 'application/json'
    }
  };
  let async = await new Promise(function(resolve, reject) {
    axios(config)
    .then(function (response) {
      resolve({
        statusCode: 200,
        ...response.data
      });
    })
    .catch(function (error) {
      resolve({
        statusCode: error.response.status,
        statusText: error.response.statusText
      })
    });
  });
  return async;
}

export function locationTrans(location){
  let newWeatherData = {};
  location.parameter.forEach((parameter) => {
    newWeatherData[parameter.parameterName] = parameter.parameterValue;
  })
  location.weatherElement.forEach((element) => {
    newWeatherData[element.elementName] = element.elementValue;
  })
  newWeatherData.obsTime = location.time.obsTime;
  return newWeatherData;
}

export function getInsertPromiseArray(locations, selectedCities){
  let newWeatherDataArray = locations.filter((location) => {
    const cityOfThisLocation = location.parameter[0].parameterValue;
    return selectedCities.includes(cityOfThisLocation);
  })
  .map((location) => {
    return locationTrans(location);
  });
  let insertPromiseArray = newWeatherDataArray.map((newWeatherData) => {
    return WeatherData.create(newWeatherData);;
  })
  // await Promises.all(insertPromiseArray);
  return insertPromiseArray;
}

// fetchAPI('/api/v1/rest/datastore/F-D0047-061', 'CWB-50A7E8D9-75EA-4350-9BAE-67C5974371C0');
