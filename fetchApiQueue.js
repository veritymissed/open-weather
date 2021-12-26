import Bull from 'bull';
import getConfigurations from './configurations.js';
const configurations = getConfigurations();
import { WeatherData } from './models/realtimedata.js';
import { fetchAPI, getInsertPromiseArray } from './fetchData.js';

const fetchDataQueue = new Bull('fetchDataAPIQueue', {
  redis: {
    port: configurations.redis.port,
    host: configurations.redis.host
  }
});

import nodeCron from 'node-cron';

nodeCron.schedule('45 * * * *', () => {
  console.log('Running a task every hour at 45');
  fetchDataQueue.add(
    {route: '/api/v1/rest/datastore/O-A0003-001', token: configurations.weatherDataAPIToken},
    {attemps: 3}
  );
});

const SELECTED_CITY = ['臺北市', '新北市', '桃園市'];

fetchDataQueue.process(async (job) => {
  try {
    console.log(`start processing`)
    const now = new Date();
    const { route, token } = job.data;
    let data = await fetchAPI(route, token);
    const dataObsTime = data.records.location[0].time.obsTime;
    if(data.statusCode !== 200) throw new Error(`Fetch API ${route} error at ${now}`);
    await WeatherData.sync();
    await Promise.all(getInsertPromiseArray(data.records.location, SELECTED_CITY));
    return Promise.resolve({
      route,
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
  console.log(`Fetch ${result.route} at ${result.startFetchTime} finished, observed time of data from API: ${result.dataObsTime} !`);
});
fetchDataQueue.on('failed', (job, error) => {
  console.log(error);
  console.log(`Fetch failed with message: ${error.message} !`);
});
