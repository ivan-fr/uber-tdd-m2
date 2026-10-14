import type { Ride, Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class CancelRideUsecase {
  constructor(private repository: UberRepository) {}

  async handle(rider: Rider, ride: Ride, today: Date): Promise<number> {
    if (ride.riderId !== rider.id) {
      throw new Error("Cette course appartient a un autre Rider");
    }

    if (ride.cancelled === true) {
      throw new Error("Cette course est deja annulee");
    }

    let isBirthday = false;
    if (rider.birthDate !== undefined) {
      isBirthday =
        rider.birthDate.getDate() === today.getDate() &&
        rider.birthDate.getMonth() === today.getMonth();
    }

    let penalty = 0;

    if (ride.driverOnTheWay === true && isBirthday === false) {
      penalty = 5;
    }

    rider.balance = rider.balance - penalty;
    ride.cancelled = true;
    await this.repository.saveRider(rider);
    await this.repository.saveRide(ride);
    return penalty;
  }
}
