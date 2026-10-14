//story 11
// En tant que Rider,
// Je souhaite voir une estimation du prix avant de réserver
// Afin de décider si je prends la course ou non
// Retourne le prix estimé sans créer de Ride en base
// Inclut tous les modificateurs (surge, Noël, UberX)
// L'estimation expire après 5 minutes
// Génère un token unique pour réserver au prix garanti
// Réserver avec un token expiré → erreur
import { describe, expect, it } from "vitest";

import { EstimateRidePriceUsecase } from "../app/estimate-ride-price.usecase";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Estimer une course avant reservation", () => {
  it("retourne le prix estime sans creer de Ride en base", async () => {
    const repository = new FakeUberRepository();
    const rider = { id: "alice", balance: 100 };
    const usecase = new EstimateRidePriceUsecase(repository);

    const estimate = await usecase.handle(
      rider,
      "Paris",
      "Lyon",
      10,
      true,
      new Date(2026, 11, 24, 18, 30),
    );

    expect(estimate.price).toBe(60);
    expect(estimate.token).toEqual(expect.any(String));
    expect(estimate.expiresAt.getTime()).toBeGreaterThan(new Date(2026, 11, 24, 18, 30).getTime());
    expect(repository.rides).toEqual([]);
  });

  it("genere un token unique pour reserver au prix garanti", async () => {
    const repository = new FakeUberRepository();
    const usecase = new EstimateRidePriceUsecase(repository);

    const firstEstimate = await usecase.handle(
      { id: "alice", balance: 100 },
      "Paris",
      "Lyon",
      10,
      false,
      new Date(2026, 5, 14, 8, 30),
    );
    const secondEstimate = await usecase.handle(
      { id: "alice", balance: 100 },
      "Paris",
      "Lyon",
      10,
      false,
      new Date(2026, 5, 14, 8, 31),
    );

    expect(firstEstimate.token).not.toBe(secondEstimate.token);
  });

  it("refuse une reservation avec un token expire", async () => {
    const repository = new FakeUberRepository();
    const rider = { id: "alice", balance: 100 };
    const usecase = new EstimateRidePriceUsecase(repository, () => new Date(2026, 5, 14, 8, 0));

    const estimate = await usecase.handle(rider, "Paris", "Lyon", 10, false, new Date(2026, 5, 14, 8, 0));

    await expect(
      usecase.confirmReservation(estimate.token, rider, new Date(2026, 5, 14, 8, 6)),
    ).rejects.toThrow("Token expire");
  });

  it("confirme une reservation avec un token valide", async () => {
    const repository = new FakeUberRepository();
    const rider = { id: "alice", balance: 100 };
    const usecase = new EstimateRidePriceUsecase(repository, () => new Date(2026, 5, 14, 9, 0));

    const estimate = await usecase.handle(rider, "Paris", "Lyon", 10, false, new Date(2026, 5, 14, 9, 0));
    const ride = await usecase.confirmReservation(estimate.token, rider, new Date(2026, 5, 14, 9, 1));

    expect(ride.price).toBe(15);
    expect(ride.driverId).toBeNull();
    expect(repository.rides).toHaveLength(1);
  });
});
