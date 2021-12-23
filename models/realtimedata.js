// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const { DataTypes } = require('sequelize');
// const { postgresConnection } = require('../database')
import { DataTypes } from 'sequelize';
import { postgresConnection } from '../database.js';

const WeatherData = postgresConnection.define('weather_data', {
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  CITY:{
    type: DataTypes.STRING,
    allowNull: false
  },
  CITY_SN: {
    type: DataTypes.STRING,
    allowNull: false
  },
  TOWN:{
    type: DataTypes.STRING,
    allowNull: false
  },
  TOWN_SN:{
    type: DataTypes.STRING,
    allowNull: false
  },
  ELEV: {
    type: DataTypes.STRING,
  },
  WDIR: {
    type: DataTypes.STRING,
  },
  WDSD: {
    type: DataTypes.STRING,
  },
  TEMP: {
    type: DataTypes.STRING,
  },
  HUMD: {
    type: DataTypes.STRING,
  },
  PRES: {
    type: DataTypes.STRING,
  },
  '24R': {
    type: DataTypes.STRING,
  },
  H_FX: {
    type: DataTypes.STRING,
  },
  H_XD: {
    type: DataTypes.STRING,
  },
  H_FXT: {
    type: DataTypes.STRING,
  },
  H_F10: {
    type: DataTypes.STRING,
  },
  H_10D: {
    type: DataTypes.STRING,
  },
  H_F10T: {
    type: DataTypes.STRING,
  },
  H_UVI: {
    type: DataTypes.STRING,
  },
  D_TX: {
    type: DataTypes.STRING,
  },
  D_TXT: {
    type: DataTypes.STRING,
  },
  D_TN: {
    type: DataTypes.STRING,
  },
  D_TNT: {
    type: DataTypes.STRING,
  },
  D_TS: {
    type: DataTypes.STRING,
  },
  VIS: {
    type: DataTypes.STRING,
  },
  Weather: {
    type: DataTypes.STRING,
    allowNull: false
  },

}, {
  freezeTableName: true,
});

// `sequelize.define` also returns the model
console.log(WeatherData === postgresConnection.models.User); // true

// module.exports = User;
export { WeatherData };
