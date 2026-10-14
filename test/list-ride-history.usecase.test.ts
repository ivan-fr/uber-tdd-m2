import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { ListRiderRideHistoryUsecase } from "../app/list-rides-history.usecase";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Historique des courses d'un Rider", () => {
  const today = new Date(2026, 5, 14);
  let repository: FakeUberRepository;

  beforeEach(() => {
    repository = new FakeUberRepository();
  });

  it("retourne un historique vide quand le Rider n'a aucune course", async () => {
    const history = await new ListRiderRideHistoryUsecase(repository).handle("alice");

    expect(history).toEqual([]);
  });

  it("liste aussi une course sans Driver assigne", async () => {
    const rider = { id: "alice", balance: 20 };
    const ride = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10, false, today);

    const history = await new ListRiderRideHistoryUsecase(repository).handle("alice");

    expect(history).toEqual([{ ride: ride, driver: null }]);
  });

  it("ne montre pas les courses d'un autre Rider", async () => {
    const alice = { id: "alice", balance: 20 };
    const chloe = { id: "chloe", balance: 20 };
    const aliceRide = await new BookRideUsecase(repository).handle(alice, "Paris", "Paris", 10, false, today);
    await new BookRideUsecase(repository).handle(chloe, "Paris", "Paris", 10, false, today);

    const history = await new ListRiderRideHistoryUsecase(repository).handle("alice");

    expect(history).toEqual([{ ride: aliceRide, driver: null }]);
  });

  it("liste toutes les courses avec le Driver associe", async () => {
    const rider = { id: "alice", balance: 40 };
    const bob = { id: "bob", name: "Bob" };
    const charlie = { id: "charlie", name: "Charlie" };

    await repository.saveDriver(bob);
    await repository.saveDriver(charlie);

    const firstRide = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10, false, today);
    firstRide.driverId = bob.id;

    const secondRide = await new BookRideUsecase(repository).handle(rider, "Lyon", "Paris", 10, false, today);
    secondRide.driverId = charlie.id;

    const history = await new ListRiderRideHistoryUsecase(repository).handle(rider.id);

    expect(history).toEqual([
      { ride: firstRide, driver: bob },
      { ride: secondRide, driver: charlie },
    ]);
  });
});
