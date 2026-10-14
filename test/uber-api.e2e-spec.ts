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

  it("POST /rides/:id/cancel annule la course et sauvegarde la penalite", async () => {
    const bookingResponse = await post("/rides", booking);
    const ride = await bookingResponse.json();
    await repository.saveDriver({ id: "bob", name: "Bob" });
    await repository.saveRide({ ...ride, driverId: "bob", driverOnTheWay: true });

    const response = await post(`/rides/${ride.id}/cancel`, { riderId: "alice" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ penalty: 5 });
    expect((await repository.findRide(ride.id))?.cancelled).toBe(true);
    expect((await repository.findRider("alice"))?.balance).toBe(45);
  });

  it("GET /riders/:id/rides liste les courses avec leurs chauffeurs", async () => {
    const firstResponse = await post("/rides", booking);
    const firstRide = await firstResponse.json();
    const driver = { id: "bob", name: "Bob" };
    await repository.saveDriver(driver);
    await repository.saveRide({ ...firstRide, driverId: "bob" });
    const secondResponse = await post("/rides", booking);
    const secondRide = await secondResponse.json();
    await repository.saveRider({ id: "chloe", balance: 50 });
    await post("/rides", { ...booking, riderId: "chloe" });

    const response = await fetch(`${url}/riders/alice/rides`);
    const history = await response.json();

    expect(response.status).toBe(200);
    expect(history).toHaveLength(2);
    expect(history).toEqual(expect.arrayContaining([
      { ride: { ...firstRide, driverId: "bob" }, driver },
      { ride: secondRide, driver: null },
    ]));
  });

  it.each([
    {},
    { ...booking, riderId: " " },
    { ...booking, from: " " },
    { ...booking, to: 123 },
    { ...booking, isUberX: "true" },
    null,
  ])("refuse une reservation invalide avec 400 : %j", async (body) => {
    const response = await post("/rides", body);

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
    expect(scanner.lastAddresses).toBeUndefined();
    expect(await repository.findRidesByRider("alice")).toEqual([]);
  });

  it("refuse une annulation sans riderId avec 400", async () => {
    const response = await post("/rides/00000000-0000-4000-8000-000000000001/cancel", {});

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });

  it("refuse un identifiant de course invalide avec 400", async () => {
    const response = await post("/rides/pas-un-uuid/cancel", { riderId: "alice" });

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });

  it("retourne une erreur JSON pour un document JSON mal forme", async () => {
    const response = await fetch(`${url}/rides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "JSON invalide" });
  });

  it("retourne une erreur JSON pour une route inconnue", async () => {
    const response = await fetch(`${url}/inconnue`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Route introuvable" });
  });
});
