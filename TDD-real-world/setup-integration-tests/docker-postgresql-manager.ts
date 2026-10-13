import * as path from "path";
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from "testcontainers";
import { knex, Knex } from "knex";
import * as BlueBirdPromise from "bluebird";
import knexConfig from "./knexfile";

const composeFilePath = path.resolve(process.cwd(), "setup-integration-tests");
const composeFile = "docker-compose-postgresql-test.yaml";

export let dockerDBInstance: StartedDockerComposeEnvironment | null = null;

export const startDockerPostgresql = async (): Promise<void> => {
  let sqlConnection: Knex | null = null;
  try {
    console.log("start DB migration");
    dockerDBInstance = await new DockerComposeEnvironment(
      composeFilePath,
      composeFile
    ).up();

    sqlConnection = knex(knexConfig.test);
    await sqlConnection.migrate.latest();
    console.log("end DB migration");
  } catch (e) {
    console.error("❌ Failed to start DB:", e);
    throw e;
  } finally {
    if (sqlConnection) {
      await sqlConnection.destroy();
    }
  }
};

const tables = ["baskets", "products"];

export function resetDB(sqlConnection: Knex) {
  return BlueBirdPromise.each(tables, (table) =>
    sqlConnection.raw(`TRUNCATE TABLE ${table} CASCADE`)
  );
}

export async function stopDockerPostgresql(): Promise<void> {
  if (dockerDBInstance) {
    await dockerDBInstance.down();
    dockerDBInstance = null;
  }
}
