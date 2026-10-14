import { describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";

describe("Reserver une course", () => {
  it("cree une reservation quand le Rider a assez d'argent", () => {
    // GIVEN : Alice a 20 euros sur son compte.
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 20 };

    // WHEN : elle reserve une course de 10 km dans Paris.
    const ride = usecase.handle(rider, "Paris", "Paris", 10);

    // THEN : la reservation coute 7 euros et attend un Driver.
    expect(ride).toEqual({
      riderId: "alice",
      from: "Paris",
      to: "Paris",
      distanceKm: 10,
      price: 7,
      driverId: null,
      cancelled: false,
    });
    expect(usecase.rides).toEqual([ride]);
  });

  it("refuse la reservation quand le Rider n'a pas assez d'argent", () => {
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 6 };

    // La course coute 7 euros, mais Alice n'a que 6 euros.
    expect(() => usecase.handle(rider, "Paris", "Paris", 10)).toThrow(
      "Fonds insuffisants",
    );
    expect(usecase.rides).toEqual([]);
  });

  it("accepte la reservation avec exactement le montant necessaire", () => {
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 7 };

    const ride = usecase.handle(rider, "Paris", "Paris", 10);

    expect(ride.price).toBe(7);
    expect(usecase.rides).toEqual([ride]);
  });

  it("refuse une deuxieme reservation tant que le Driver n'est pas assigne", () => {
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 20 };
    const firstRide = usecase.handle(rider, "Paris", "Paris", 10);

    expect(() => usecase.handle(rider, "Paris", "Lyon", 10)).toThrow(
      "Une reservation attend deja un Driver",
    );
    expect(usecase.rides).toEqual([firstRide]);
  });
});
