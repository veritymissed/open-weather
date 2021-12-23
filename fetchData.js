import  { postgresConnection } from './database.js';
import axios from 'axios';

async function fetchAPI(route, token){
  let config = {
    method: 'get',
    url: `https://opendata.cwb.gov.tw/${route}?Authorization=${token}`,
    headers: {
      'Accept': 'application/json'
    }
  };
  axios(config)
  .then(function (response) {
    console.log('response.data', response.data)
    // console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
}
// fetchAPI('/api/v1/rest/datastore/F-D0047-061', 'CWB-50A7E8D9-75EA-4350-9BAE-67C5974371C0');


// Taipei City
// /v1/rest/datastore/F-D0047-061
// /v1/rest/datastore/F-D0047-063

// New Taipei City
// ​/v1​/rest​/datastore​/F-D0047-069
// ​/v1​/rest​/datastore​/F-D0047-071

// https://opendata.cwb.gov.tw/user/authkey 取得授權碼
// CWB-50A7E8D9-75EA-4350-9BAE-67C5974371C0
