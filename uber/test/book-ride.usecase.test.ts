import { describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";

describe("Reserver une course", () => {
  it("cree une reservation quand le Rider a assez d'argent", () => {
    // GIVEN : Alice a 20 euros sur son compte.
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 20 };

    // WHEN : elle reserve une course de 10 km dans Paris.
    const ride = usecase.handle(rider, "Paris", "Paris", 10);

    // THEN : la reservation coute 7 euros et attend un Driver.
    expect(ride).toEqual({
      id: ride.id,
      riderId: "alice",
      from: "Paris",
      to: "Paris",
      distanceKm: 10,
      price: 7,
      driverId: null,
      driverOnTheWay: false,
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

  it("autorise une nouvelle reservation apres l'annulation de la precedente", () => {
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 20 };
    const firstRide = usecase.handle(rider, "Paris", "Paris", 10);
    new CancelRideUsecase().handle(rider, firstRide, new Date(2026, 5, 14));

    const secondRide = usecase.handle(rider, "Paris", "Lyon", 10);

    expect(secondRide.price).toBe(15);
    expect(secondRide.cancelled).toBe(false);
    expect(usecase.rides).toEqual([firstRide, secondRide]);
  });

  it("autorise une nouvelle reservation quand un Driver est deja assigne", () => {
    const usecase = new BookRideUsecase();
    const rider = { id: "alice", balance: 20 };
    const firstRide = usecase.handle(rider, "Paris", "Paris", 10);
    firstRide.driverId = "bob";

    const secondRide = usecase.handle(rider, "Lyon", "Paris", 10);

    expect(secondRide.price).toBe(5);
    expect(secondRide.driverId).toBeNull();
    expect(usecase.rides).toEqual([firstRide, secondRide]);
  });

  it("la reservation d'Alice n'empeche pas celle de Chloe", () => {
    const usecase = new BookRideUsecase();
    const alice = { id: "alice", balance: 20 };
    const chloe = { id: "chloe", balance: 20 };
    const aliceRide = usecase.handle(alice, "Paris", "Paris", 10);

    const chloeRide = usecase.handle(chloe, "Paris", "Paris", 10);

    expect(chloeRide.riderId).toBe("chloe");
    expect(usecase.rides).toEqual([aliceRide, chloeRide]);
  });

  it("chaque course a un identifiant unique", () => {
    const usecase = new BookRideUsecase();
    const alice = { id: "alice", balance: 20 };
    const chloe = { id: "chloe", balance: 20 };

    const firstRide = usecase.handle(alice, "Paris", "Paris", 10);
    const secondRide = usecase.handle(chloe, "Paris", "Paris", 10);

    expect(firstRide.id).toEqual(expect.any(String));
    expect(firstRide.id).not.toBe("");
    expect(secondRide.id).not.toBe(firstRide.id);
  });
});
