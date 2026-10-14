import type { Ride, Rider } from "./book-ride.usecase";

export class CancelRideUsecase {
  handle(rider: Rider, ride: Ride, today: Date): number {
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
    return penalty;
  }
}
