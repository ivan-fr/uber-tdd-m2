/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
