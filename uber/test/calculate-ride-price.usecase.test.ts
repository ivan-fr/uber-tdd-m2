import { describe, expect, it } from "vitest";
import { CalculateRidePriceUsecase } from "../app/calculate-ride-price.usecase";

describe("Calculer le prix d'une course", () => {
  it("Paris vers Paris sans kilometre coute 2 euros", () => {
    // GIVEN : on prepare le calculateur.
    const usecase = new CalculateRidePriceUsecase();

    // WHEN : on calcule le prix de la course.
    const price = usecase.handle("Paris", "Paris", 0);

    // THEN : on verifie le resultat attendu.
    expect(price).toBe(2);
  });

  it("Paris vers Paris sur 10 km coute 7 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Paris", 10);

    expect(price).toBe(7);
  });
});
