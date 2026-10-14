//story 11
// En tant que Rider,
// Je souhaite voir une estimation du prix avant de réserver
// Afin de décider si je prends la course ou non
// Retourne le prix estimé sans créer de Ride en base
// Inclut tous les modificateurs (surge, Noël, UberX)
// L'estimation expire après 5 minutes
// Génère un token unique pour réserver au prix garanti
// Réserver avec un token expiré → erreur
import { randomUUID } from "node:crypto";

import { CalculateRidePriceUsecase } from "./calculate-ride-price.usecase";
import type { Ride, RideEstimate, Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class EstimateRidePriceUsecase {
  constructor(
    private readonly repository: UberRepository,
    private readonly clock: () => Date = () => new Date(),
    private readonly tokenFactory: () => string = () => randomUUID(),
  ) {}

  async handle(
    rider: Rider,
    from: string,
    to: string,
    distanceKm: number,
    isUberX: boolean = false,
    today: Date = this.clock(),
    fromForPricing: string = from,
    toForPricing: string = to,
  ): Promise<RideEstimate> {
    const calculator = new CalculateRidePriceUsecase(this.clock);
    const price = calculator.handle(
      fromForPricing,
      toForPricing,
      distanceKm,
      today,
      isUberX,
      rider.birthDate,
    );

    const estimate: RideEstimate = {
      token: this.tokenFactory(),
      riderId: rider.id,
      from,
      to,
      distanceKm,
      price,
      isUberX,
      createdAt: new Date(today.getTime()),
      expiresAt: new Date(today.getTime() + 5 * 60 * 1000),
      used: false,
    };

    await this.repository.saveRideEstimate(estimate);
    return estimate;
  }

  async confirmReservation(token: string, rider: Rider, today: Date = this.clock()): Promise<Ride> {
    const estimate = await this.repository.findRideEstimate(token);

    if (!estimate) {
      throw new Error("Token invalide");
    }

    if (estimate.riderId !== rider.id) {
      throw new Error("Ce token ne correspond pas a ce Rider");
    }

    if (estimate.used === true) {
      throw new Error("Token deja utilise");
    }

    if (today.getTime() > estimate.expiresAt.getTime()) {
      estimate.used = true;
      await this.repository.saveRideEstimate(estimate);
      throw new Error("Token expire");
    }

    const ride: Ride = {
      id: randomUUID(),
      riderId: rider.id,
      from: estimate.from,
      to: estimate.to,
      distanceKm: estimate.distanceKm,
      price: estimate.price,
      driverId: null,
      driverOnTheWay: false,
      cancelled: false,
    };

    estimate.used = true;

    await this.repository.withTransaction(async (transactionalRepository) => {
      const updatedRider = {
        ...rider,
        loyaltyPoints: (rider.loyaltyPoints ?? 0) + 1,
      };
      await transactionalRepository.saveRider(updatedRider);
      await transactionalRepository.saveRide(ride);
      await transactionalRepository.saveRideEstimate(estimate);
    });

    return ride;
  }
}
