const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  baseURL: process.env.BASE_URL,
  port: process.env.PORT || 3000,
  database: {
    client: process.env.DB_CLIENT,
    connection: {
      type: 'postgres',
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || "3306",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8",
      ssl: {
        rejectUnauthorized: false
      },
      extra: {
        ssl: {
          rejectUnauthorized: false
        }
      }
    },
    migrations: {
      tableName: "migrations",
      directory: `${process.cwd()}/migrations`,
    },
    seeds: {
      tableName: "seeds",
      directory: `${process.cwd()}/seeds`,
    },
    debug: false,
  },
  pusher: {
    appID: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
  },
};
