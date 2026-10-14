//Story 10: En tant que Rider, Je souhaite bloquer un Driver Afin de ne plus être assigné à lui
// Un Rider peut bloquer jusqu'à 3 Drivers
// Un Driver blacklisté ne peut pas être assigné à ce Rider
// Le Rider peut débloquer un Driver
import { describe, expect, it } from "vitest";

import { BlockDriverUsecase, canAssignDriverToRider } from "../app/block-driver.usecase";
import { UnblockDriverUsecase } from "../app/unblock-driver.usecase";
import type { Rider } from "../app/models";
import { FakeUberRepository } from "./fake-uber.repository";

describe("Bloquer un Driver", () => {
  const rider: Rider = { id: "r1", balance: 100, blacklistedDrivers: [] };

  it("bloque un driver pour ce Rider", async () => {
    const repository = new FakeUberRepository();
    await repository.saveRider(rider);

    await new BlockDriverUsecase(repository).handle(rider, "d1");

    expect(rider.blacklistedDrivers).toEqual(["d1"]);
  });

  it("bloque jusqu'a 3 drivers maximum", async () => {
    const repository = new FakeUberRepository();
    rider.blacklistedDrivers = ["d1", "d2", "d3"];
    await repository.saveRider(rider);

    await expect(new BlockDriverUsecase(repository).handle(rider, "d4")).rejects.toThrow(
      "Un Rider peut bloquer jusqu'a 3 Drivers",
    );
  });

  it("empeche l'assignation d'un Driver blackliste a ce Rider", () => {
    const riderWithBlacklist: Rider = {
      id: "r2",
      balance: 50,
      blacklistedDrivers: ["driver-blacklisted"],
    };

    expect(canAssignDriverToRider(riderWithBlacklist, "driver-blacklisted")).toBe(false);
    expect(canAssignDriverToRider(riderWithBlacklist, "driver-allowed")).toBe(true);
  });

  it("debloque un driver precedemment bloque", async () => {
    const repository = new FakeUberRepository();
    rider.blacklistedDrivers = ["d1", "d2"];
    await repository.saveRider(rider);

    await new UnblockDriverUsecase(repository).handle(rider, "d1");

    expect(rider.blacklistedDrivers).toEqual(["d2"]);
  });
});
