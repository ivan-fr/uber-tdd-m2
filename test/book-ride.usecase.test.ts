import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Reserver une course", () => {
  const today = new Date(2026, 5, 14);
  let repository: FakeUberRepository;
  let usecase: BookRideUsecase;

  beforeEach(() => {
    repository = new FakeUberRepository();
    usecase = new BookRideUsecase(repository);
  });

  it("cree une reservation quand le Rider a assez d'argent", async () => {
    const rider = { id: "alice", balance: 20 };

    const ride = await usecase.handle(rider, "Paris", "Paris", 10, false, today);

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
    expect(repository.rides).toEqual([ride]);
  });

  it("refuse la reservation quand le Rider n'a pas assez d'argent", async () => {
    const rider = { id: "alice", balance: 6 };

    await expect(usecase.handle(rider, "Paris", "Paris", 10, false, today)).rejects.toThrow(
      "Fonds insuffisants",
    );
    expect(repository.rides).toEqual([]);
  });

  it("accepte la reservation avec exactement le montant necessaire", async () => {
    const rider = { id: "alice", balance: 7 };

    const ride = await usecase.handle(rider, "Paris", "Paris", 10, false, today);

    expect(ride.price).toBe(7);
    expect(repository.rides).toEqual([ride]);
  });

  it("refuse une deuxieme reservation tant que le Driver n'est pas assigne", async () => {
    const rider = { id: "alice", balance: 20 };
    const firstRide = await usecase.handle(rider, "Paris", "Paris", 10, false, today);

    await expect(usecase.handle(rider, "Paris", "Lyon", 10, false, today)).rejects.toThrow(
      "Une reservation attend deja un Driver",
    );
    expect(repository.rides).toEqual([firstRide]);
  });

  it("autorise une nouvelle reservation apres l'annulation de la precedente", async () => {
    const rider = { id: "alice", balance: 20 };
    const firstRide = await usecase.handle(rider, "Paris", "Paris", 10, false, today);
    await new CancelRideUsecase(repository).handle(rider, firstRide, new Date(2026, 5, 14));

    const secondRide = await usecase.handle(rider, "Paris", "Lyon", 10, false, today);

    expect(secondRide.price).toBe(15);
    expect(secondRide.cancelled).toBe(false);
    expect(repository.rides).toEqual([firstRide, secondRide]);
  });

  it("autorise une nouvelle reservation quand un Driver est deja assigne", async () => {
    const rider = { id: "alice", balance: 20 };
    const firstRide = await usecase.handle(rider, "Paris", "Paris", 10, false, today);
    firstRide.driverId = "bob";

    const secondRide = await usecase.handle(rider, "Lyon", "Paris", 10, false, today);

    expect(secondRide.price).toBe(5);
    expect(secondRide.driverId).toBeNull();
    expect(repository.rides).toEqual([firstRide, secondRide]);
  });

  it("la reservation d'Alice n'empeche pas celle de Chloe", async () => {
    const alice = { id: "alice", balance: 20 };
    const chloe = { id: "chloe", balance: 20 };
    const aliceRide = await usecase.handle(alice, "Paris", "Paris", 10, false, today);

    const chloeRide = await usecase.handle(chloe, "Paris", "Paris", 10, false, today);

    expect(chloeRide.riderId).toBe("chloe");
    expect(repository.rides).toEqual([aliceRide, chloeRide]);
  });

  it("chaque course a un identifiant unique", async () => {
    const alice = { id: "alice", balance: 20 };
    const chloe = { id: "chloe", balance: 20 };

    const firstRide = await usecase.handle(alice, "Paris", "Paris", 10, false, today);
    const secondRide = await usecase.handle(chloe, "Paris", "Paris", 10, false, today);

    expect(firstRide.id).toEqual(expect.any(String));
    expect(firstRide.id).not.toBe("");
    expect(secondRide.id).not.toBe(firstRide.id);
  });

  it("utilise la date fournie pour offrir UberX a l'anniversaire", async () => {
    const rider = { id: "alice", balance: 20, birthDate: new Date(2000, 5, 14) };

    const ride = await usecase.handle(rider, "Paris", "Lyon", 10, true, new Date(2026, 5, 14));

    expect(ride.price).toBe(15);
    expect(repository.rides).toEqual([ride]);
  });
});
