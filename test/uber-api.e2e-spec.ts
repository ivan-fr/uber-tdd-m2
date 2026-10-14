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

  it("refuse une reservation sans fonds avec 409 et sans creer de course", async () => {
    await repository.saveRider({ id: "alice", balance: 6 });

    const response = await post("/rides", booking);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Fonds insuffisants" });
    expect(await repository.findRidesByRider("alice")).toEqual([]);
    expect((await repository.findRider("alice"))?.balance).toBe(6);
  });

  it("refuse une deuxieme reservation en attente avec 409", async () => {
    await post("/rides", booking);

    const response = await post("/rides", booking);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Une reservation attend deja un Driver" });
    expect(await repository.findRidesByRider("alice")).toHaveLength(1);
  });

  it("refuse une deuxieme annulation avec 409 sans debiter deux fois", async () => {
    const bookingResponse = await post("/rides", booking);
    const ride = await bookingResponse.json();
    await repository.saveDriver({ id: "bob", name: "Bob" });
    await repository.saveRide({ ...ride, driverId: "bob", driverOnTheWay: true });
    await post(`/rides/${ride.id}/cancel`, { riderId: "alice" });

    const response = await post(`/rides/${ride.id}/cancel`, { riderId: "alice" });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Cette course est deja annulee" });
    expect((await repository.findRider("alice"))?.balance).toBe(45);
  });

  it("refuse l'annulation de la course d'un autre Rider avec 403", async () => {
    const bookingResponse = await post("/rides", booking);
    const ride = await bookingResponse.json();
    await repository.saveRider({ id: "chloe", balance: 50 });

    const response = await post(`/rides/${ride.id}/cancel`, { riderId: "chloe" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Cette course appartient a un autre Rider" });
    expect((await repository.findRide(ride.id))?.cancelled).toBe(false);
    expect((await repository.findRider("chloe"))?.balance).toBe(50);
  });

  it.each([
    "Impossible de retrouver la ville de cette adresse",
    "Impossible de calculer la distance du trajet",
  ])("retourne 502 sans creer de course si Google echoue : %s", async (message) => {
    scanner.error = new Error(message);

    const response = await post("/rides", booking);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: message });
    expect(await repository.findRidesByRider("alice")).toEqual([]);
  });

  it("refuse un trajet sans tarif avec 422", async () => {
    scanner.result = { fromCity: "Lyon", toCity: "Lille", distanceKm: 10 };

    const response = await post("/rides", booking);

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Tarif non defini pour ce trajet" });
    expect(await repository.findRidesByRider("alice")).toEqual([]);
  });

  it("permet de reserver, annuler puis reserver a nouveau via l'API", async () => {
    const firstResponse = await post("/rides", booking);
    expect(firstResponse.status).toBe(201);
    const firstRide = await firstResponse.json();

    const cancelResponse = await post(`/rides/${firstRide.id}/cancel`, { riderId: "alice" });
    expect(cancelResponse.status).toBe(200);
    expect(await cancelResponse.json()).toEqual({ penalty: 0 });

    const secondResponse = await post("/rides", booking);
    expect(secondResponse.status).toBe(201);
    const secondRide = await secondResponse.json();
    expect(secondRide.id).not.toBe(firstRide.id);

    const historyResponse = await fetch(`${url}/riders/alice/rides`);
    expect(historyResponse.status).toBe(200);
    expect(await historyResponse.json()).toEqual(expect.arrayContaining([
      { ride: { ...firstRide, cancelled: true }, driver: null },
      { ride: secondRide, driver: null },
    ]));
    expect((await repository.findRider("alice"))?.balance).toBe(50);
  });

  it("retourne un historique vide si le Rider n'a aucune course", async () => {
    const response = await fetch(`${url}/riders/alice/rides`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("retourne 404 si le Rider de la reservation n'existe pas", async () => {
    const response = await post("/rides", { ...booking, riderId: "inconnu" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Rider introuvable" });
    expect(scanner.lastAddresses).toBeUndefined();
    expect(await database("rides").select()).toEqual([]);
  });

  it("retourne 404 si le Rider de l'annulation n'existe pas", async () => {
    const response = await post("/rides/00000000-0000-4000-8000-000000000001/cancel", { riderId: "inconnu" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Rider introuvable" });
  });

  it("retourne 404 si la course a annuler n'existe pas", async () => {
    const response = await post("/rides/00000000-0000-4000-8000-000000000001/cancel", { riderId: "alice" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Course introuvable" });
  });

  it("retourne 404 pour l'historique d'un Rider inconnu", async () => {
    const response = await fetch(`${url}/riders/inconnu/rides`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Rider introuvable" });
  });

  it.each([
    { date: new Date(2026, 5, 14), isUberX: true, birthDate: undefined, price: 12 },
    { date: new Date(2026, 11, 24), isUberX: true, birthDate: undefined, price: 24 },
    { date: new Date(2026, 5, 14), isUberX: true, birthDate: new Date(2000, 5, 14), price: 7 },
  ])("applique les tarifs UberX, Noel et anniversaire : %j", async (example) => {
    today = example.date;
    await repository.saveRider({ id: "alice", balance: 50, birthDate: example.birthDate });

    const response = await post("/rides", { ...booking, isUberX: example.isUberX });
    const ride = await response.json();

    expect(response.status).toBe(201);
    expect(ride.price).toBe(example.price);
    expect((await repository.findRide(ride.id))?.price).toBe(example.price);
  });

  it("offre l'annulation le jour de l'anniversaire", async () => {
    await repository.saveRider({ id: "alice", balance: 50, birthDate: new Date(2000, 5, 14) });
    const bookingResponse = await post("/rides", booking);
    const ride = await bookingResponse.json();
    await repository.saveDriver({ id: "bob", name: "Bob" });
    await repository.saveRide({ ...ride, driverId: "bob", driverOnTheWay: true });

    const response = await post(`/rides/${ride.id}/cancel`, { riderId: "alice" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ penalty: 0 });
    expect((await repository.findRider("alice"))?.balance).toBe(50);
    expect((await repository.findRide(ride.id))?.cancelled).toBe(true);
  });

  it("retourne 500 sans exposer les details d'une erreur inattendue", async () => {
    scanner.error = new Error("Detail interne confidentiel");

    const response = await post("/rides", booking);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Erreur interne du serveur" });
    expect(await repository.findRidesByRider("alice")).toEqual([]);
  });
});
