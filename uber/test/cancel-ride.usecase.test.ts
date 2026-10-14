import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import type { Ride, Rider } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";

describe("Annuler une course", () => {
  let usecase: CancelRideUsecase;
  let rider: Rider;
  let ride: Ride;
  let today: Date;

  beforeEach(() => {
    usecase = new CancelRideUsecase();
    rider = { id: "alice", balance: 20 };
    ride = new BookRideUsecase().handle(rider, "Paris", "Paris", 10);
    // Les mois commencent a 0 : 5 correspond a juin.
    today = new Date(2026, 5, 14);
  });

  it("annule gratuitement quand aucun Driver n'est en chemin", () => {
    // GIVEN : Alice a une reservation qui attend un Driver.

    // WHEN : elle annule cette reservation.
    const penalty = usecase.handle(rider, ride, today);

    // THEN : la course est annulee et Alice garde son argent.
    expect(ride.cancelled).toBe(true);
    expect(penalty).toBe(0);
    expect(rider.balance).toBe(20);
  });

  it("retire 5 euros quand le Driver est deja en chemin", () => {
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = usecase.handle(rider, ride, today);

    expect(penalty).toBe(5);
    expect(rider.balance).toBe(15);
    expect(ride.cancelled).toBe(true);
  });

  it("offre l'annulation le jour de l'anniversaire meme si le Driver est en chemin", () => {
    rider.birthDate = new Date(2000, 5, 14);
    ride.driverId = "bob";
    ride.driverOnTheWay = true;

    const penalty = usecase.handle(rider, ride, today);

    expect(penalty).toBe(0);
    expect(rider.balance).toBe(20);
    expect(ride.cancelled).toBe(true);
  });

  it("refuse une deuxieme annulation sans retirer encore de l'argent", () => {
    ride.driverId = "bob";
    ride.driverOnTheWay = true;
    usecase.handle(rider, ride, today);

    expect(() => usecase.handle(rider, ride, today)).toThrow(
      "Cette course est deja annulee",
    );
    expect(rider.balance).toBe(15);
    expect(ride.cancelled).toBe(true);
  });
});
