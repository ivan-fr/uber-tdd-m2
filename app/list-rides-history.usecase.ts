import type { Driver, Ride } from "./models";
import type { UberRepository } from "./uber.repository";

export class ListRiderRideHistoryUsecase {
  constructor(private repository: UberRepository) {}

  async handle(riderId: string): Promise<Array<{ ride: Ride; driver: Driver | null }>> {
    const rides = await this.repository.findRidesByRider(riderId);

    const history: Array<{ ride: Ride; driver: Driver | null }> = [];

    for (const ride of rides) {

      const driver = await this.repository.findDriver(ride.driverId!);
      history.push({ ride, driver: driver ?? null });
    }

    return history;
  }
}
