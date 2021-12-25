import { createRequire } from "module";
const require = createRequire(import.meta.url);
const three_day = require("./taipei_3_days.json");
const now = require('./now');
import { WeatherData } from '../models/realtimedata.js';

// console.log('three_day', three_day)
// console.log('three_day.result', three_day.result)
// console.log('three_day.records', three_day.records)
// console.log('three_day.records.locations[0]', three_day.records.locations[0])
// console.log('three_day.records.locations[0].location[0]', three_day.records.locations[0].location[0])

// console.log('now', now)
// console.log('now.result', now.result)
// console.log('now.records.location', now.records.location)
// console.log('now.records.location[7]', now.records.location[7])

async function main(){
  try {
    await WeatherData.drop();
    await WeatherData.sync({force: true});
    let rawData = now.records.location[8];
    console.log('rawData', rawData)

    // let newWeatherData = {};
    // rawData.parameter.forEach((parameter) => {
    //   newWeatherData[parameter.parameterName] = parameter.parameterValue;
    // })
    // rawData.weatherElement.forEach((element) => {
    //   newWeatherData[element.elementName] = element.elementValue;
    // })
    // console.log('newWeatherData', newWeatherData);
    let newWeatherData = locationTrans(rawData);
    let newWeatherDataArray = now.records.location.map((location) => {
      return locationTrans(location);
    });
    // let insertPromiseArray = newWeatherDataArray.map((newWeatherData) => {
    //   return WeatherData.create(newWeatherData);;
    // })
    // await Promises.all(insertPromiseArray);
    // console.log('newWeatherDataArray', newWeatherDataArray)
    // await WeatherData.create(newWeatherData);

  } catch (e) {
    console.log(e)
  }
};
// main();

export function locationTrans(location){
  let newWeatherData = {};
  location.parameter.forEach((parameter) => {
    newWeatherData[parameter.parameterName] = parameter.parameterValue;
  })
  location.weatherElement.forEach((element) => {
    newWeatherData[element.elementName] = element.elementValue;
  })
  return newWeatherData;
}

export function getInsertPromiseArray(locations){
  let newWeatherDataArray = locations.map((location) => {
    return locationTrans(location);
  });
  let insertPromiseArray = newWeatherDataArray.map((newWeatherData) => {
    return WeatherData.create(newWeatherData);;
  })
  // await Promises.all(insertPromiseArray);
  return insertPromiseArray;
}
