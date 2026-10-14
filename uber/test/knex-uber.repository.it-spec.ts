import { beforeEach, describe, expect, it } from "vitest";
import { database } from "./postgresql-test";
import { KnexUberRepository } from "../infra/knex-uber.repository";

describe("Stocker les donnees Uber dans PostgreSQL", () => {
  let repository: KnexUberRepository;

  beforeEach(async () => {
    // On vide seulement les tables du conteneur de test.
    await database("rides").delete();
    await database("drivers").delete();
    await database("riders").delete();
    repository = new KnexUberRepository(database);
  });

  it("la migration cree les tables riders, drivers et rides", async () => {
    expect(await database.schema.hasTable("riders")).toBe(true);
    expect(await database.schema.hasTable("drivers")).toBe(true);
    expect(await database.schema.hasTable("rides")).toBe(true);
  });

  it("saveRider enregistre le solde et la date de naissance", async () => {
    const rider = { id: "alice", balance: 20.5, birthDate: new Date(2000, 5, 14) };

    await repository.saveRider(rider);

    const savedRider = await database("riders").where({ id: "alice" }).first();
    expect(savedRider).toEqual({
      id: "alice",
      balance: "20.50",
      birthDate: new Date(2000, 5, 14),
    });
  });

  it("findRider retrouve un Rider avec un solde sous forme de nombre", async () => {
    const rider = { id: "alice", balance: 20.5, birthDate: new Date(2000, 5, 14) };
    await database("riders").insert(rider);

    const savedRider = await repository.findRider("alice");

    expect(savedRider).toEqual(rider);
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
