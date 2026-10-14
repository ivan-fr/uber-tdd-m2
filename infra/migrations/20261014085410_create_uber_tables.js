exports.up = async function(knex) {
  await knex.schema.createTable("riders", (table) => {
    table.string("id").primary();
    table.decimal("balance", 10, 2).notNullable();
    table.date("birthDate").nullable();
  });

  await knex.schema.createTable("drivers", (table) => {
    table.string("id").primary();
    table.string("name").notNullable();
  });

  await knex.schema.createTable("rides", (table) => {
    table.uuid("id").primary();
    table.string("riderId").notNullable().references("id").inTable("riders").index();
    table.string("from").notNullable();
    table.string("to").notNullable();
    table.decimal("distanceKm", 10, 3).notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.string("driverId").nullable().references("id").inTable("drivers");
    table.boolean("driverOnTheWay").notNullable().defaultTo(false);
    table.boolean("cancelled").notNullable().defaultTo(false);
  });
//<---story 12--->
  await knex.schema.createTable("ride_estimates", (table) => {
    table.string("token").primary();
    table.string("riderId").notNullable().references("id").inTable("riders").index();
    table.string("from").notNullable();
    table.string("to").notNullable();
    table.decimal("distanceKm", 10, 3).notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.boolean("isUberX").notNullable().defaultTo(false);
    table.boolean("used").notNullable().defaultTo(false);
    table.timestamp("createdAt").notNullable();
    table.timestamp("expiresAt").notNullable();
  });
  //</---story 12--->
};

exports.down = async function(knex) {
  await knex.schema.dropTable("ride_estimates");
  await knex.schema.dropTable("rides");
  await knex.schema.dropTable("drivers");
  await knex.schema.dropTable("riders");
};
