import Bull from 'bull';
import getConfigurations from './configurations.js';
const configurations = getConfigurations();
import { fetchAPI } from './fetchData.js';
import { getInsertPromiseArray } from './data/read_data.js'

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
  );
});

// fetchDataQueue.add({route: '/api/v1/rest/datastore/O-A0003-001', token: configurations.weatherDataAPIToken});
fetchDataQueue.process(async (job) => {
  try {
    const now = new Date();
    const { route, token } = job.data;
    let data = await fetchAPI(route, token);
    // console.log('data', data)
    const dataObsTime = data.records.location[0].time.obsTime;
    if(data.statusCode !== 200) throw new Error(`Fetch API ${route} error at ${now}`);
    await Promise.all(getInsertPromiseArray(data.records.location));
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
