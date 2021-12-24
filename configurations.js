export default () => ({
  app_host: process.env.APP_HOST || 'localhost',
  app_port: process.env.APP_PORT || 8000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user_name: process.env.DATABASE_USER_NAME || 'postgres',
    database_name: process.env.DATABASE_NAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgrespassword',
  },
  redis: {
    host: 'localhost',
    secret: 'there is no friends at the dusk',
  },
  jwt: {
    secret: 'we live in a twilight world',
    expiresIn: 3600 * 24 * 3
  }
});
