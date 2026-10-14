import path from "node:path";
import { knex } from "knex";
import type { Knex } from "knex";
import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll } from "vitest";

export let database: Knex;
let container: StartedTestContainer;

beforeAll(async () => {
  // Docker cree une base vide, reservee a cette execution des tests.
  container = await new GenericContainer("postgres:16")
    .withEnvironment({
      POSTGRES_USER: "uber",
      POSTGRES_PASSWORD: "uber",
      POSTGRES_DB: "uber_test",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start();

  database = knex({
    client: "pg",
    connection: {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      user: "uber",
      password: "uber",
      database: "uber_test",
    },
    migrations: {
      directory: path.join(__dirname, "../infra/migrations"),
    },
  });

  await database.migrate.latest();
});

afterAll(async () => {
  // On ferme la connexion, puis on supprime seulement le conteneur de test.
  if (database) await database.destroy();
  if (container) await container.stop();
});
