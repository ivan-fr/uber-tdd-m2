import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";
import { randomUUID } from "node:crypto";

import type { Ride, Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class BookRideUsecase {
  constructor(private repository: UberRepository) {}

  async handle(rider: Rider, from: string, to: string, distanceKm: number): Promise<Ride> {
    const calculator = new CalculateRidePriceUsecase();
    const price = calculator.handle(from, to, distanceKm);

    if (rider.balance < price) {
      throw new Error("Fonds insuffisants");
    }

    // On regarde les anciennes reservations de ce Rider.
    const existingRides = await this.repository.findRidesByRider(rider.id);
    for (const existingRide of existingRides) {
      // Les trois conditions doivent etre vraies pour bloquer la reservation.
      if (
        existingRide.riderId === rider.id &&
        existingRide.cancelled === false &&
        existingRide.driverId === null
      ) {
        throw new Error("Une reservation attend deja un Driver");
      }
    }

    // Tout est bon : on cree la course, puis on la sauvegarde.
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
