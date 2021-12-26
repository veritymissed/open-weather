import Bull from 'bull';
import getConfigurations from '../configurations.js';
const configurations = getConfigurations();
// const myFirstQueue = new Bull('my-first-queue', {
//   redis: {
//     port: configurations.redis.port,
//     host: configurations.redis.host
//   }
// });

// import { WeatherData } from './models/realtimedata.js';
// import { getInsertPromiseArray } from './data/read_data.js'

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
