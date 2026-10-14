import { beforeEach, describe, expect, it } from "vitest";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { ListRiderRideHistoryUsecase } from "../app/list-rides-history.usecase";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Historique des courses d'un Rider", () => {
  let repository: FakeUberRepository;

  beforeEach(() => {
    repository = new FakeUberRepository();
  });

  it("liste toutes les courses avec le Driver associe", async () => {
    const rider = { id: "alice", balance: 40 };
    const bob = { id: "bob", name: "Bob" };
    const charlie = { id: "charlie", name: "Charlie" };

    await repository.saveDriver(bob);
    await repository.saveDriver(charlie);

    const firstRide = await new BookRideUsecase(repository).handle(rider, "Paris", "Paris", 10);
    firstRide.driverId = bob.id;

    const secondRide = await new BookRideUsecase(repository).handle(rider, "Lyon", "Paris", 10);
    secondRide.driverId = charlie.id;

    const history = await new ListRiderRideHistoryUsecase(repository).handle(rider.id);

    expect(history).toEqual([
      { ride: firstRide, driver: bob },
      { ride: secondRide, driver: charlie },
    ]);
  });
});
