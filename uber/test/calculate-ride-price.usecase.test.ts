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

  it("Lyon vers Paris sur 10 km coute 5 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Lyon", "Paris", 10);

    expect(price).toBe(5);
  });

  it("Paris vers Lyon sur 10 km coute 15 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Lyon", 10);

    expect(price).toBe(15);
  });

  it("refuse un trajet exterieur vers exterieur car le sujet ne donne pas son tarif", () => {
    const usecase = new CalculateRidePriceUsecase();

    expect(() => usecase.handle("Lyon", "Lille", 10)).toThrow(
      "Tarif non defini pour ce trajet",
    );
  });
});
