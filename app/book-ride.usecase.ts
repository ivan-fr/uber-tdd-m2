import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";
import { randomUUID } from "node:crypto";

import type { Ride, Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class BookRideUsecase {
  constructor(private repository: UberRepository) {}

  async handle(rider: Rider, from: string, to: string, distanceKm: number): Promise<Ride> {
    const calculator = new CalculateRidePriceUsecase();
    const price = calculator.handle(from, to, distanceKm, new Date());

    if (rider.balance < price) {
      throw new Error("Fonds insuffisants");
    }

    const existingRides = await this.repository.findRidesByRider(rider.id);
    for (const existingRide of existingRides) {
      if (
        existingRide.riderId === rider.id &&
        existingRide.cancelled === false &&
        existingRide.driverId === null
      ) {
        throw new Error("Une reservation attend deja un Driver");
      }
    }

    const ride: Ride = {
      id: randomUUID(),
      riderId: rider.id,
      from: from,
      to: to,
      distanceKm: distanceKm,
      price: price,
      driverId: null,
      driverOnTheWay: false,
      cancelled: false,
    };

    await this.repository.saveRider(rider);
    await this.repository.saveRide(ride);
    return ride;
  }
}
