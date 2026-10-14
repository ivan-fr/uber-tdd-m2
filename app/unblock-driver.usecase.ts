import type { Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class UnblockDriverUsecase {
  constructor(private readonly repository: UberRepository) {}

  async handle(rider: Rider, driverId: string): Promise<void> {
    const blacklistedDrivers = rider.blacklistedDrivers ?? [];
    rider.blacklistedDrivers = blacklistedDrivers.filter((id) => id !== driverId);

    await this.repository.saveRider(rider);
  }
}
