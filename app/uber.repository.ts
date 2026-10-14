import type { Driver, Ride, RideEstimate, Rider } from "./models";

export interface UberRepository {
  saveRider(rider: Rider): Promise<void>;
  findRider(id: string): Promise<Rider | undefined>;
  saveDriver(driver: Driver): Promise<void>;
  findDriver(id: string): Promise<Driver | undefined>;
  saveRide(ride: Ride): Promise<void>;
  saveRideWithLoyaltyPoints(rider: Rider, ride: Ride): Promise<void>;
  withTransaction<T>(callback: (repository: UberRepository) => Promise<T>): Promise<T>;
  findRide(id: string): Promise<Ride | undefined>;
  findRidesByRider(riderId: string): Promise<Ride[]>;
  saveRideEstimate(estimate: RideEstimate): Promise<void>;
  findRideEstimate(token: string): Promise<RideEstimate | undefined>;
  deleteRideEstimate(token: string): Promise<void>;
}
