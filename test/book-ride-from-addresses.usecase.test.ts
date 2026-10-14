import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { FakeUberRepository } from "./fake-uber.repository";
import { StubRouteScanner } from "./stub-route.scanner";

describe("Reserver une course avec deux adresses", () => {
  const today = new Date(2026, 5, 14);
  const from = "10 rue de Rivoli, Paris";
  const to = "20 avenue des Champs-Elysees, Paris";
  let repository: FakeUberRepository;
  let scanner: StubRouteScanner;
  let usecase: BookRideUsecase;

  beforeEach(() => {
    repository = new FakeUberRepository();
    scanner = new StubRouteScanner();
    usecase = new BookRideUsecase(repository);
  });

  it("utilise les villes et les kilometres du scanner et conserve les adresses", async () => {
    const rider = { id: "alice", balance: 20 };

    const ride = await usecase.handleFromAddresses(rider, from, to, scanner, false, today);

    expect(scanner.lastAddresses).toEqual({ from: from, to: to });
    expect(ride.from).toBe(from);
    expect(ride.to).toBe(to);
    expect(ride.distanceKm).toBe(10);
    expect(ride.price).toBe(7);
    expect(repository.rides).toEqual([ride]);
  });
});
