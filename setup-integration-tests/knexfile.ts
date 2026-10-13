const pg = require('pg');
if (process.env.NODE_ENV === 'production')
  pg.defaults.ssl = {
    rejectUnauthorized: false,
  };

const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      database: 'ubertop-30-oct-2023',
      port: 5434,
      user: 'wealcome',
      password: 'secret',
    },
    pool: {
      min: 2,
      max: 20,
      afterCreate: function (connection: any, callback: any) {
        connection.query('SET timezone = "Europe/Paris";', function (err: any) {
          callback(err, connection);
        });
      },
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: __dirname + '/seeds/dev',
    },
  },

  test: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      database: 'ubertop-30-oct-2023',
      user: 'postgres',
      password: 'secret',
      port: 5433,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: __dirname + '/migrations/',
    },
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 20,
      afterCreate: function (connection: any, callback: any) {
        connection.query('SET timezone = "Europe/Paris";', function (err: any) {
          callback(err, connection);
        });
      },
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: __dirname + '/seeds/dev',
    },
  },
};

export default config;
