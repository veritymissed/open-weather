import { createRequire } from "module";
const require = createRequire(import.meta.url);
const createError = require('http-errors')
// https://www.npmjs.com/package/http-errors
const express = require('express')
const path = require('path')
const logger = require('morgan')
import getConfigurations from './configurations.js';
const configurations = getConfigurations();
const app = express();

import expressJWT from 'express-jwt';
import jwt from 'jsonwebtoken';
const jwtPrivateKey = configurations.jwt.secret;
const jwtExpiresIn = configurations.jwt.expiresIn;

import { WeatherData } from './models/realtimedata.js';
import { fetchAPI } from './fetchData.js';

import { Op } from 'sequelize';
import moment from 'moment';
import crypto from 'crypto';
import util from 'util';
const apiDataSecret = configurations.jwt.secret;

import RateLimit from 'express-rate-limit';
import RateLimitRedisStore from 'rate-limit-redis';
import redis from 'redis';
const redisClient = redis.createClient({
	host: configurations.redis.host,
	port: configurations.redis.port
});

redisClient.on("error", function(error) {
  console.error(error);
});

const limiter = new RateLimit({
	store: new RateLimitRedisStore({
		client: redisClient
	}),
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use(limiter);

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(
  '/api',
  expressJWT({ secret: jwtPrivateKey, algorithms: ['HS256'] }),
  async function(req, res, next) {
    if (!req.user.authorized_by_OWB) return res.sendStatus(401);
    else next();
  }
);

app.get('/api', async function(req ,res){
  try {
    const body = req.body;
    console.log('body', body);
    let queryObj = {};
    if(body.CITY && body.CITY.length > 0)  queryObj.CITY = body.CITY;
    if(body.TOWN && body.TOWN.length > 0)  queryObj.TOWN = body.TOWN;
    if(body.CITY_SN && body.CITY_SN.length > 0)  queryObj.CITY_SN = body.CITY_SN;
    if(body.TOWN_SN && body.TOWN_SN.length > 0)  queryObj.TOWN_SN = body.TOWN_SN;
    const from = body.from || null;
    const to = body.to || null;
		queryObj.obsTime = {};
		if(from && from.length > 0) {
			const fromTime = moment(parseFloat(from));
			queryObj.obsTime[Op.gt] = fromTime;
			console.log('fromTime', fromTime);
		}
		else{
			queryObj.obsTime[Op.gt] = moment(1609430399000);//20201231 23:59
		}
		if(to && to.length > 0){
			const toTime = moment(parseFloat(to));
			queryObj.obsTime[Op.lt] = toTime;
			console.log('toTime', toTime);
		}
		else{
			queryObj.obsTime[Op.lt] = moment();
		}

    console.log(queryObj);
		let queryObjHashValue = crypto
		.createHash('sha256', apiDataSecret)
		.update(JSON.stringify(queryObj))
		.digest('hex');
		console.log('queryObjHashValue', queryObjHashValue);

		let data;
		let cacheDataGetByKey = await new Promise((resolve, reject) => {
			redisClient.get(queryObjHashValue, (err, res) => {
				if(err) reject(err);
				else resolve(res)
			})
		})
		if (!cacheDataGetByKey) {
			console.log(`data of this queryObj key ${queryObjHashValue} not exists in the redis cache!`);
			console.log('query the postgres database!');
			let dataFromDatabase = await WeatherData.findAll({
				where: queryObj
			});
      // console.log('dataFromDatabase', dataFromDatabase);

			await new Promise(function(resolve, reject) {
        let expireTimeSecond;
        if(dataFromDatabase.length === 0){
          expireTimeSecond = 60*60;
        }
        else{
          let randomHour = Math.floor(Math.random()*10); //0-9
          expireTimeSecond = 60*60* (24+randomHour);
        }

        redisClient.set(
          queryObjHashValue, JSON.stringify(dataFromDatabase),
          'EX', expireTimeSecond,
          (err, res) => {
            if(err) reject(err);
            else resolve(res);
          }
        );

			});
			data = dataFromDatabase;
		}
		else {
      // console.log('cacheDataGetByKey', cacheDataGetByKey);
			console.log(`data of this queryObj key ${queryObjHashValue} exists in the redis cache!`);
			data = JSON.parse(cacheDataGetByKey);
		}
    res.json({
      status: 'success',
      data
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
});

app.get('/get_token', async function(req, res){
  try {
    console.log('req.query.Authorization', req.query.Authorization);
    let auth_token_response = await fetchAPI('/api/v1/rest/datastore/F-D0047-061', req.query.Authorization);

    if(auth_token_response.statusCode !== 200) {
      res.status(auth_token_response.statusCode).json(auth_token_response);
    }
    else {
      const token = jwt.sign({ authorized_by_OWB: req.query.Authorization }, jwtPrivateKey, {
        algorithm: 'HS256',
        expiresIn: jwtExpiresIn
      });
      res.json({token});
    }
  } catch (e) {
    throw e;
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  var status = err.status || 500
  res.status(status).send({ error: err.message })
})

var http = require('http')
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(configurations.app_port)
app.set('port', port)

/**
 * Create HTTP server.
 */

var server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)


function normalizePort (val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}

async function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  console.log('Listening on ' + bind)
}
