export async function up(knex) {
  await knex.schema
    .createTable("baskets", (table) => {
      table.uuid("id").primary();
      table.integer("totalPrice");
    })
    .createTable("products", (table) => {
      table.uuid("basketId").references("id").inTable("baskets");
      table.string("name");
      table.integer("quantity");
      table.integer("price");
    });
}

export async function down(knex) {
  await knex.schema.dropTable("baskets");
  await knex.schema.dropTable("products");
}
