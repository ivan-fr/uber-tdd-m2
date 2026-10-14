import type { Ride, Rider } from "./book-ride.usecase";

export class CancelRideUsecase {
  handle(rider: Rider, ride: Ride, today: Date): number {
    ride.cancelled = true;
    return 0;
  }
}
