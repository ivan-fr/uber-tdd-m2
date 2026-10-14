exports.seed = async function (knex) {
  await knex("riders")
    .insert({ id: "alice", balance: 50 })
    .onConflict("id")
    .ignore();
};
