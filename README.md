# Weather Open Data API

## Related dependencies

- `jsonwebtoken`
- `express-jst`
- `BullMQ`
- `Redis`
- `Postgres`
- `SequelizeORM`
- `NodeJS v16.11.1`

## Structure

- PostgresDB
- ExpressServer
- BullMQ using Redis

## Related file
- `server.js`
- `fetchApiQueue.js`
- `fetchData.js`
- `database.js`
- `./models/realtimedata.js`
- `syncDatabase.js`
- `configurations.js`
- `Dockerfile`
- `docker-compose.yml`
- `./env/.env.prod`

## Docker compose files

- In `./docker-compose-files/`

- 兩個檔案`docker-compose.dev.yml`(dev), `docker-compose.prod.yml`(production)
- Dev的只有PostgresDB/Redis
- Production的除了PostgresDB/Redis，還有將Server與Task Queue封裝成兩個container執行

## Building

#### Production
```sh
cp ./docker-compose-files/docker-compose.prod.yml ./docker-compose.yml
docker-compose up # Would load ./env/.env.prod configs
```

#### Dev
```sh
cp ./docker-compose-files/docker-compose.dev.yml ./docker-compose.yml
docker-compose up -d

# Install dependencies
yarn
# or use npm
npm i

# Two terminals
node server.js
node fetchApiQueue.js

```


## Steps
- 預設的API host為 `localhost:8000`
- 先拿著Open Weather API的會員token透過 `/get_token` 驗證，附帶token的方式為在url後面加上`?Authorization=<token>`

- 取得此Server的jwt
- 使用jwt存取此Server的API

## 1. Get JWT access token

`GET /get_token`

```sh
curl --location --request GET 'http://localhost:8000/get_token?Authorization={WeatherOpenAPIToken}
```

For example:

``` sh
curl --location --request GET  http://localhost:8000/get_token?Authorization=CWB-50A7E8D9-75EA-4350-9BAE-67C5974371C0
```

使用 [Open Weather Data平台](https://opendata.cwb.gov.tw/user/authkey) 註冊會員取得授權碼：

將授權碼附帶上query parmas，向 `/get_token` 送出，驗證成功可以取得使用我們server的JWT token。

### Response:

Success:

```js
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkX2J5X09XQiI6IkNXQi01MEE3RThEOS03NUVBLTQzNTAtOUJBRS02N0M1OTc0MzcxQzAiLCJpYXQiOjE2NDA0ODc0OTQsImV4cCI6MTY0MDc0NjY5NH0.G1map_pWsojKNvEYkUF8XIf80jFWMnb1zf6lS8yqRoI"
}
```

Failed:

```js
{
    "statusCode": 401,
    "statusText": "Unauthorized"
}
```

## 2. Use API fetching data

`GET /api`

透過/api可以查詢存放在server端資料庫的database

### Authorization: Bearer token

附上標頭
`Authorization: Bearer <JWT_token>`

Ex.

```sh
curl --location --request GET 'http://localhost:8000/api' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkX2J5X09XQiI6IkNXQi01MEE3RThEOS03NUVBLTQzNTAtOUJBRS02N0M1OTc0MzcxQzAiLCJpYXQiOjE2NDAzMzAyNTAsImV4cCI6MTY0MDU4OTQ1MH0.Y9vT2DfzDgS_w6CZNMZ24ji2Bar-yhaJhiT5Ps3GyPI' \
--header 'Content-Type: application/json' \
--data-raw '{"CITY": "臺北市", "TOWN": "大安區", "from": "1640391393000", "to": "1640506593000"}'
```


### Parameters

|Paramter|use|
|:-|:-|
|CITY|The city name, only one city. Ex. "臺北市"|
|CITY_SN|The city sn, only one city. Ex. "01"|
|TOWN|The town name, only one town. Ex. "南港區"|
|TOWN_SN|The town sn, only one town. Ex. "035"|
|from|Time range begin. Unix Timestamp (milliseconds) |
|to|Time range end. Unix Timestamp (milliseconds) Ex. 1640502993000(2021-12-26T15:16:33+08:00)  |


Query paramter examples:

```js
{} //return all data

{"CITY": "臺北市"} // return data only CITY is "臺北市"

{"CITY_SN": "01"} // return data only CITY_SN is "01" (same as CITY is "臺北市")

{"CITY": "臺北市", "TOWN": "大安區"}

{"CITY": "臺北市", "TOWN": "大安區", "from": "1640391393000", "to": "1640506593000"}
// 2021-12-25T08:16:33+08:00 - 2021-12-26T16:16:33+08:00

```


### Response:

Success:

```js
{
    "status": "success",
    "data": [
        {
            "id": "1e98c9f0-8260-4cf8-9934-44e2a6db4cbe",
            "CITY": "臺北市",
            "CITY_SN": "01",
            "TOWN": "大安區",
            "TOWN_SN": "039",
            "ELEV": "18",
            ...
            "D_TNT": "0014",
            "D_TS": "-99",
            "VIS": "-99",
            "Weather": "陰",
            "obsTime": "2021-12-23T07:50:00.000Z",
            ...
        },
    ]
}
```

Failed:

```js
{
    "error": "invalid token"
}
```


## Task Queue

In `fetchApiQueue.js`

### Scheduling task configs

`45 * * * *` 每小時的45分fetch API，不想慢慢等可以自行調整。

```js

nodeCron.schedule('45 * * * *', () => {
  console.log('Running a task every hour at 45');
  fetchDataQueue.add(
    {route: '/api/v1/rest/datastore/O-A0003-001', token: configurations.weatherDataAPIToken},
  );
});

```

Success:
```js
{
  route: '/api/v1/rest/datastore/O-A0003-001',
  startFetchTime: 2021-12-26T07:45:00.981Z,
  dataObsTime: '2021-12-26 15:30:00'
}
Fetch /api/v1/rest/datastore/O-A0003-001 at Sun Dec 26 2021 15:45:00 GMT+0800 (台北標準時間) finished, observed time of data from API: 2021-12-26 15:30:00 !
```


## Configurations

`./configurations.js`

```js
export default () => ({
  app_host: process.env.APP_HOST || 'localhost', //API host
  app_port: process.env.APP_PORT || 8000, //API port
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user_name: process.env.DATABASE_USER_NAME || 'postgres',
    database_name: process.env.DATABASE_NAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgrespassword',
  }, //Postgres configs
  redis: {
    host: 'localhost',
    secret: 'there is no friends at the dusk',
  }, // Redis configs
  jwt: {
    secret: 'we live in a twilight world',
    expiresIn: 3600 * 24 * 3 // default 3 days
  }, // jwt configs
  weatherDataAPIToken: ${Token_from_Open_Weather_Data}
});

```
