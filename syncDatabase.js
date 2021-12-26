import { WeatherData } from './models/realtimedata.js';
async function main(){
  await WeatherData.sync();
}
main();
