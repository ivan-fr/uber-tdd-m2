import { once } from "node:events";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUberApi } from "../infra/uber-api";
import { KnexUberRepository } from "../infra/knex-uber.repository";
import { database } from "./postgresql-test";
import { StubRouteScanner } from "./stub-route.scanner";

describe("API Uber avec PostgreSQL", () => {
  let server: Server | undefined;
  let url: string;
  let repository: KnexUberRepository;
  let scanner: StubRouteScanner;
  let today: Date;

  const booking = {
    riderId: "alice",
    from: "10 rue de Rivoli, Paris",
    to: "20 avenue des Champs-Elysees, Paris",
  };

  beforeEach(async () => {
    await database("rides").delete();
    await database("drivers").delete();
    await database("riders").delete();
    repository = new KnexUberRepository(database);
    await repository.saveRider({ id: "alice", balance: 50 });
    scanner = new StubRouteScanner();
    today = new Date(2026, 5, 14);
    server = createUberApi(repository, scanner, () => today).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Port du serveur introuvable");
    url = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => error ? reject(error) : resolve());
      });
    }
  });

  async function post(path: string, body: unknown) {
    return fetch(`${url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("POST /rides reserve une course et la sauvegarde en base", async () => {
    const response = await post("/rides", booking);
    const ride = await response.json();

    expect(response.status).toBe(201);
    expect(ride).toMatchObject({ ...booking, distanceKm: 10, price: 7, cancelled: false });
    expect(scanner.lastAddresses).toEqual({ from: booking.from, to: booking.to });
    expect(await repository.findRide(ride.id)).toEqual(ride);
  });
});
