import type { Ride, Rider } from "./book-ride.usecase";

export class CancelRideUsecase {
  handle(rider: Rider, ride: Ride, today: Date): number {
    let penalty = 0;

    if (ride.driverOnTheWay === true) {
      penalty = 5;
    }

    rider.balance = rider.balance - penalty;
    ride.cancelled = true;
    return penalty;
  }
}
