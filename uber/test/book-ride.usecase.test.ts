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
});
