import { describe, expect, it } from "vitest";
import { database } from "./postgresql-test";

describe("Stocker les donnees Uber dans PostgreSQL", () => {
  it("la migration cree les tables riders, drivers et rides", async () => {
    expect(await database.schema.hasTable("riders")).toBe(true);
    expect(await database.schema.hasTable("drivers")).toBe(true);
    expect(await database.schema.hasTable("rides")).toBe(true);
  });

  it("la migration peut etre annulee puis reappliquee", async () => {
    await database.migrate.rollback();

    expect(await database.schema.hasTable("rides")).toBe(false);
    expect(await database.schema.hasTable("drivers")).toBe(false);
    expect(await database.schema.hasTable("riders")).toBe(false);

    await database.migrate.latest();
    expect(await database.schema.hasTable("rides")).toBe(true);
  });
});
