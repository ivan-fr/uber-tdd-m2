import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import type { Ride, Rider } from "../app/models";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Annuler une course", () => {
  let repository: FakeUberRepository;
  let usecase: CancelRideUsecase;
  let rider: Rider;
  let ride: Ride;
  let today: Date;

  beforeEach(async () => {
    repository = new FakeUberRepository();
    usecase = new CancelRideUsecase(repository);
    rider = { id: "alice", balance: 20 };
    ride = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);
    // Les mois commencent a 0 : 5 correspond a juin.
    today = new Date(2026, 5, 14);
  });

  it("annule gratuitement quand aucun Driver n'est en chemin", async () => {
    // GIVEN : Alice a une reservation qui attend un Driver.

    // WHEN : elle annule cette reservation.
    const penalty = await usecase.handle(rider, ride, today);

    // THEN : la course est annulee et Alice garde son argent.
    expect(ride.cancelled).toBe(true);
    expect(penalty).toBe(0);
    expect(rider.balance).toBe(20);
  });

  it("retire 5 euros quand le Driver est deja en chemin", async () => {
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = await usecase.handle(rider, ride, today);

    expect(penalty).toBe(5);
    expect(rider.balance).toBe(15);
    expect(ride.cancelled).toBe(true);
  });

  it("offre l'annulation le jour de l'anniversaire meme si le Driver est en chemin", async () => {
    rider.birthDate = new Date(2000, 5, 14);
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = await usecase.handle(rider, ride, today);

    expect(penalty).toBe(0);
    expect(rider.balance).toBe(20);
    expect(ride.cancelled).toBe(true);
  });

  it("refuse une deuxieme annulation sans retirer encore de l'argent", async () => {
    ride.driverId = "bob";
    ride.driverOnTheWay = true;
    await usecase.handle(rider, ride, today);

    await expect(usecase.handle(rider, ride, today)).rejects.toThrow(
      "Cette course est deja annulee",
    );
    expect(rider.balance).toBe(15);
    expect(ride.cancelled).toBe(true);
  });

  it("reste gratuite si le Driver est assigne mais pas encore en chemin", async () => {
    ride.driverId = "bob";

    const penalty = await usecase.handle(rider, ride, today);

    expect(penalty).toBe(0);
    expect(rider.balance).toBe(20);
    expect(ride.cancelled).toBe(true);
  });

  it("facture 5 euros si le jour de naissance correspond mais pas le mois", async () => {
    rider.birthDate = new Date(2000, 4, 14);
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = await usecase.handle(rider, ride, today);

    expect(penalty).toBe(5);
    expect(rider.balance).toBe(15);
  });

  it("facture 5 euros si le mois de naissance correspond mais pas le jour", async () => {
    rider.birthDate = new Date(2000, 5, 15);
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = await usecase.handle(rider, ride, today);

    expect(penalty).toBe(5);
    expect(rider.balance).toBe(15);
  });

  it("refuse aussi une deuxieme annulation le jour de l'anniversaire", async () => {
    rider.birthDate = new Date(2000, 5, 14);
    ride.driverId = "bob";
    ride.driverOnTheWay = true;
    await usecase.handle(rider, ride, today);

    await expect(usecase.handle(rider, ride, today)).rejects.toThrow(
      "Cette course est deja annulee",
    );
    expect(rider.balance).toBe(20);
  });

  it("un autre Rider ne peut pas annuler la course d'Alice", async () => {
    const chloe = { id: "chloe", balance: 20 };
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    await expect(usecase.handle(chloe, ride, today)).rejects.toThrow(
      "Cette course appartient a un autre Rider",
    );
    expect(ride.cancelled).toBe(false);
    expect(rider.balance).toBe(20);
    expect(chloe.balance).toBe(20);
  });
});
