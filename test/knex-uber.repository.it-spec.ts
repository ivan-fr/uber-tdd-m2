import { beforeEach, describe, expect, it } from "vitest";
import { database } from "./postgresql-test";
import { KnexUberRepository } from "../infra/knex-uber.repository";
import type { Ride } from "../app/models";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";

describe("Stocker les donnees Uber dans PostgreSQL", () => {
  let repository: KnexUberRepository;
  let ride: Ride;

  beforeEach(async () => {
    await database("rides").delete();
    await database("drivers").delete();
    await database("riders").delete();
    repository = new KnexUberRepository(database);
    ride = {
      id: "00000000-0000-4000-8000-000000000001",
      riderId: "alice",
      from: "Paris",
      to: "Paris",
      distanceKm: 1.5,
      price: 2.75,
      driverId: null,
      driverOnTheWay: false,
      cancelled: false,
    };
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

  it("saveRider met a jour un Rider sans creer de doublon", async () => {
    await repository.saveRider({ id: "alice", balance: 20 });

    await repository.saveRider({ id: "alice", balance: 15 });

    expect(await repository.findRider("alice")).toEqual({ id: "alice", balance: 15 });
    expect(await database("riders").select()).toHaveLength(1);
  });

  it("la migration peut etre annulee puis reappliquee", async () => {
    await database.migrate.rollback();

    expect(await database.schema.hasTable("rides")).toBe(false);
    expect(await database.schema.hasTable("drivers")).toBe(false);
    expect(await database.schema.hasTable("riders")).toBe(false);

    await database.migrate.latest();
    expect(await database.schema.hasTable("rides")).toBe(true);
  });

  it("saveDriver enregistre un chauffeur", async () => {
    const driver = { id: "bob", name: "Bob" };

    await repository.saveDriver(driver);

    expect(await database("drivers").where({ id: "bob" }).first()).toEqual(driver);
  });

  it("findDriver retrouve un chauffeur", async () => {
    const driver = { id: "bob", name: "Bob" };
    await database("drivers").insert(driver);

    expect(await repository.findDriver("bob")).toEqual(driver);
  });

  it("findRide retrouve la course avec des nombres utilisables", async () => {
    await database("riders").insert({ id: "alice", balance: 20 });
    await database("rides").insert(ride);

    expect(await repository.findRide(ride.id)).toEqual(ride);
  });

  it("findRidesByRider retourne seulement les courses du Rider demande", async () => {
    await database("riders").insert([
      { id: "alice", balance: 20 },
      { id: "chloe", balance: 20 },
    ]);
    await database("rides").insert([
      ride,
      { ...ride, id: "00000000-0000-4000-8000-000000000002", riderId: "chloe" },
    ]);

    expect(await repository.findRidesByRider("alice")).toEqual([ride]);
  });

  it("reserver une course enregistre le Rider et la course en base", async () => {
    const rider = { id: "alice", balance: 20 };
    const usecase = new BookRideUsecase(repository);

    const bookedRide = await usecase.handle(rider, "Paris", "Paris", 10);

    expect(await repository.findRider("alice")).toEqual(rider);
    expect(await repository.findRide(bookedRide.id)).toEqual(bookedRide);
  });

  it("annuler une course conserve l'annulation et le nouveau solde en base", async () => {
    const rider = { id: "alice", balance: 20 };
    const bookedRide = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);
    await repository.saveDriver({ id: "bob", name: "Bob" });
    bookedRide.driverId = "bob";
    bookedRide.driverOnTheWay = true;
    await repository.saveRide(bookedRide);

    const penalty = await new CancelRideUsecase(repository).handle(rider, bookedRide, new Date(2026, 5, 14));

    const savedRide = await repository.findRide(bookedRide.id);
    const savedRider = await repository.findRider("alice");
    expect(penalty).toBe(5);
    expect(savedRide?.cancelled).toBe(true);
    expect(savedRider?.balance).toBe(15);
    expect(await database("rides").select()).toHaveLength(1);
  });

  it("les recherches retournent undefined ou un tableau vide si rien n'existe", async () => {
    expect(await repository.findRider("inconnu")).toBeUndefined();
    expect(await repository.findDriver("inconnu")).toBeUndefined();
    expect(await repository.findRide("00000000-0000-4000-8000-000000000099")).toBeUndefined();
    expect(await repository.findRidesByRider("inconnu")).toEqual([]);
  });

  it("saveDriver peut modifier un chauffeur sans doublon", async () => {
    await repository.saveDriver({ id: "bob", name: "Bob" });

    await repository.saveDriver({ id: "bob", name: "Robert" });

    expect(await repository.findDriver("bob")).toEqual({ id: "bob", name: "Robert" });
    expect(await database("drivers").select()).toHaveLength(1);
  });

  it("une nouvelle instance retrouve la reservation en attente et bloque la suivante", async () => {
    const rider = { id: "alice", balance: 20 };
    await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);

    const newRepository = new KnexUberRepository(database);
    const newUsecase = new BookRideUsecase(newRepository);

    await expect(newUsecase.handle(rider, "Paris", "Paris", 10)).rejects.toThrow(
      "Une reservation attend deja un Driver",
    );
    expect(await newRepository.findRidesByRider("alice")).toHaveLength(1);
  });

  it("une nouvelle instance peut reserver apres une annulation sauvegardee", async () => {
    const rider = { id: "alice", balance: 20 };
    const firstRide = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);
    await new CancelRideUsecase(repository).handle(rider, firstRide, new Date(2026, 5, 14));

    const newRepository = new KnexUberRepository(database);
    const secondRide = await new BookRideUsecase(newRepository).handle(rider, "Paris", "Paris", 10);

    expect(secondRide.id).not.toBe(firstRide.id);
    expect(await newRepository.findRide(firstRide.id)).toEqual(firstRide);
    expect(await newRepository.findRide(secondRide.id)).toEqual(secondRide);
    expect(await newRepository.findRidesByRider("alice")).toHaveLength(2);
  });

  it("la date de naissance relue en base permet l'annulation offerte", async () => {
    const rider = { id: "alice", balance: 20, birthDate: new Date(2000, 5, 14) };
    const bookedRide = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);
    await repository.saveDriver({ id: "bob", name: "Bob" });
    bookedRide.driverId = "bob";
    bookedRide.driverOnTheWay = true;
    await repository.saveRide(bookedRide);
    const savedRider = await repository.findRider("alice");
    const savedRide = await repository.findRide(bookedRide.id);
    if (!savedRider || !savedRide) throw new Error("Donnees de test introuvables");

    const penalty = await new CancelRideUsecase(repository).handle(savedRider, savedRide, new Date(2026, 5, 14));

    expect(penalty).toBe(0);
    expect((await repository.findRider("alice"))?.balance).toBe(20);
    expect((await repository.findRide(bookedRide.id))?.cancelled).toBe(true);
  });

  it("le service UberX est offert le jour de l'anniversaire du Rider", async () => {
    const rider = { id: "alice", balance: 20, birthDate: new Date(2000, 5, 14) };

    const bookedRide = await new BookRideUsecase(repository).handle(
      rider,
      "Paris",
      "Lyon",
      10,
      true,
    );

    expect(bookedRide.price).toBe(15);
    expect((await repository.findRide(bookedRide.id))?.price).toBe(15);
  });

  it("une reservation refusee ne laisse pas de donnees en base", async () => {
    const rider = { id: "alice", balance: 6 };

    await expect(new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10)).rejects.toThrow(
      "Fonds insuffisants",
    );

    expect(await repository.findRider("alice")).toBeUndefined();
    expect(await repository.findRidesByRider("alice")).toEqual([]);
  });
});
