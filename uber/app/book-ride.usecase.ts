import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";

// Ces interfaces decrivent simplement les informations de nos objets.
// Un Rider est un passager ; un Ride est une course.
export interface Rider {
  id: string;
  balance: number;
  // Le ? signifie que la date de naissance peut ne pas etre renseignee.
  birthDate?: Date;
}

export interface Ride {
  riderId: string;
  from: string;
  to: string;
  distanceKm: number;
  price: number;
  driverId: string | null;
  driverOnTheWay: boolean;
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
