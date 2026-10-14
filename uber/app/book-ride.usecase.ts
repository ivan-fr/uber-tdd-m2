import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";
import { randomUUID } from "node:crypto";

import type { Ride, Rider } from "./models";

export class BookRideUsecase {
  // Pour cette story, les reservations restent dans un simple tableau.
  public rides: Ride[] = [];

  handle(rider: Rider, from: string, to: string, distanceKm: number): Ride {
    const calculator = new CalculateRidePriceUsecase();
    const price = calculator.handle(from, to, distanceKm);

    if (rider.balance < price) {
      throw new Error("Fonds insuffisants");
    }

    // On regarde les anciennes reservations de ce Rider.
    for (const existingRide of this.rides) {
      // Les trois conditions doivent etre vraies pour bloquer la reservation.
      if (
        existingRide.riderId === rider.id &&
        existingRide.cancelled === false &&
        existingRide.driverId === null
      ) {
        throw new Error("Une reservation attend deja un Driver");
      }
    }

    // Tout est bon : on cree la course, puis on la garde dans le tableau.
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

    this.rides.push(ride);
    return ride;
  }
}
