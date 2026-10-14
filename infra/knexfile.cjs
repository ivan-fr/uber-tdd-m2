const path = require("node:path");

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL || {
      host: "127.0.0.1",
      port: 5445,
      user: "uber",
      password: "uber",
      database: "uber",
    },
    migrations: {
      directory: path.join(__dirname, "migrations"),
      extension: "js",
    },
  },
};
