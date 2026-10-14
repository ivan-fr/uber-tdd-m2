//Story 10: En tant que Rider, Je souhaite bloquer un Driver Afin de ne plus être assigné à lui
// Un Rider peut bloquer jusqu'à 3 Drivers
// Un Driver blacklisté ne peut pas être assigné à ce Rider
// Le Rider peut débloquer un Driver
import type { Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export function canAssignDriverToRider(rider: Rider, driverId: string): boolean {
  return !(rider.blacklistedDrivers ?? []).includes(driverId);
}

export class BlockDriverUsecase {
  constructor(private readonly repository: UberRepository) {}

  async handle(rider: Rider, driverId: string): Promise<void> {
    const blacklistedDrivers = rider.blacklistedDrivers ?? [];

    if (blacklistedDrivers.includes(driverId)) {
      throw new Error("Ce Driver est deja bloque pour ce Rider");
    }

    if (blacklistedDrivers.length >= 3) {
      throw new Error("Un Rider peut bloquer jusqu'a 3 Drivers");
    }

    rider.blacklistedDrivers = [...blacklistedDrivers, driverId];
    await this.repository.saveRider(rider);
  }
}
