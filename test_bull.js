import Bull from 'bull';
import getConfigurations from './configurations.js';
const configurations = getConfigurations();
// const myFirstQueue = new Bull('my-first-queue', {
//   redis: {
//     port: configurations.redis.port,
//     host: configurations.redis.host
//   }
// });

const fetchDataQueue = new Bull('fetchDataQueue', {
  redis: {
    port: configurations.redis.port,
    host: configurations.redis.host
  }
});
import {fetchAPI} from './fetchData.js';
// import { WeatherData } from './models/realtimedata.js';
import { getInsertPromiseArray } from './data/read_data.js'

// myFirstQueue.process(async (job) => {
//   try {
//     // console.log('job', job);
//     const { second } = job.data;
//     console.log(`job need ${second} s`);
//     await wait(second);
//     return Promise.resolve(`take ${second} times`);
//   } catch (e) {
//
//   }
// });

// myFirstQueue.on('completed', (job, result) => {
//   console.log(job)
//   console.log(`Job completed with result ${result}`);
// })

async function wait(second){
  await new Promise(function(resolve, reject) {
    setTimeout(function(){
      console.log(`wait ${second} s`);
      resolve();
    },second*1000);
  });
};

// myFirstQueue.add({second: 2});
// myFirstQueue.add({second: 5});


fetchDataQueue.add(
  {route: '/api/v1/rest/datastore/O-A0003-001', token: configurations.weatherDataAPIToken},
  {repeat: {cron: " 46 * * * * "}}
);
fetchDataQueue.process(async (job) => {
  try {
    const now = new Date();
    const { route, token } = job.data;
    let data = await fetchAPI(route, token);
    // console.log('data', data)
    const dataObsTime = data.records.location[0].time.obsTime;
    if(data.statusCode !== 200) throw new Error(`Fetch API ${route} error at ${now}`);
    // await Promise.all(getInsertPromiseArray(data.records.location));
    // return Promise.resolve({
    //   route,
    //   timestamp: now,
    //   dataObsTime
    // });
    return Promise.resolve({
      route: '/none',
      startFetchTime: now,
      dataObsTime
    });
  }
  catch (e) {
    return Promise.reject(e);
  }
});
fetchDataQueue.on('completed', (job, result) => {
  console.log(result)
  console.log(`Fetch ${result.route} at ${result.startFetchTime}, observed time of data from API - ${result.dataObsTime} finished !`);
});
fetchDataQueue.on('failed', (job, error) => {
  console.log(error);
  console.log(`Fetch failed with message: ${error.message} !`);
});
