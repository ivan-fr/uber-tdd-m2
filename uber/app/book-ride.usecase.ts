import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";

export interface Rider {
  id: string;
  balance: number;
}

export interface Ride {
  riderId: string;
  from: string;
  to: string;
  distanceKm: number;
  price: number;
  driverId: string | null;
  cancelled: boolean;
}

export class BookRideUsecase {
  // Pour cette story, les reservations restent dans un simple tableau.
  public rides: Ride[] = [];

  handle(rider: Rider, from: string, to: string, distanceKm: number): Ride {
    const calculator = new CalculateRidePriceUsecase();
    const price = calculator.handle(from, to, distanceKm);

    if (rider.balance < price) {
      throw new Error("Fonds insuffisants");
    }

    const ride: Ride = {
      riderId: rider.id,
      from: from,
      to: to,
      distanceKm: distanceKm,
      price: price,
      driverId: null,
      cancelled: false,
    };

    this.rides.push(ride);
    return ride;
  }
}
