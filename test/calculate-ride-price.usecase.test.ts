import { describe, expect, it } from "vitest";
import { CalculateRidePriceUsecase } from "../app/calculate-ride-price.usecase";

describe("Calculer le prix d'une course", () => {
  const today = new Date(2026, 5, 14);
  it("Paris vers Paris sans kilometre coute 2 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Paris", 0, today);

    expect(price).toBe(2);
  });

  it("Paris vers Paris sur 10 km coute 7 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Paris", 10, today);

    expect(price).toBe(7);
  });

  it("arrondit au centime le prix calcule avec une distance en metres", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Paris", 1.235, today);

    expect(price).toBe(2.62);
  });

  it("Lyon vers Paris sur 10 km coute 5 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Lyon", "Paris", 10, today);

    expect(price).toBe(5);
  });

  it("Paris vers Lyon sur 10 km coute 15 euros", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Lyon", 10, today);

    expect(price).toBe(15);
  });

  it.each([
    [new Date(2026, 11, 24), 30],
    [new Date(2026, 11, 25), 30],
  ])("double le montant total pendant la soirée ou le jour de Noel (%s)", (date, expected) => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Lyon", 10, date);

    expect(price).toBe(expected);
  });

  it("ajoute 5 euros pour un service UberX standard", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Lyon", 10, new Date(2026, 5, 14), true);

    expect(price).toBe(20);
  });

  it.each([
    new Date(2026, 11, 24),
    new Date(2026, 11, 25),
  ])("double aussi le supplement UberX a Noel (%s)", (date) => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle("Paris", "Lyon", 10, date, true);

    expect(price).toBe(40);
  });

  it("offre le supplement UberX le jour de l'anniversaire du Rider", () => {
    const usecase = new CalculateRidePriceUsecase();
    const riderBirthDate = new Date(2000, 5, 14);

    const price = usecase.handle(
      "Paris",
      "Lyon",
      10,
      new Date(2026, 5, 14),
      true,
      riderBirthDate,
    );

    expect(price).toBe(15);
  });

  it("offre UberX a l'anniversaire meme quand Noel double la course", () => {
    const usecase = new CalculateRidePriceUsecase();

    const price = usecase.handle(
      "Paris",
      "Lyon",
      10,
      new Date(2026, 11, 25),
      true,
      new Date(2000, 11, 25),
    );

    expect(price).toBe(30);
  });

  it("refuse un trajet exterieur vers exterieur car le sujet ne donne pas son tarif", () => {
    const usecase = new CalculateRidePriceUsecase();

    expect(() => usecase.handle("Lyon", "Lille", 10, today)).toThrow(
      "Tarif non defini pour ce trajet",
    );
  });
});
