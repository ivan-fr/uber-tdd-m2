import type { Driver, Ride, RideEstimate, Rider } from "./models";

export interface UberRepository {
  saveRider(rider: Rider): Promise<void>;
  findRider(id: string): Promise<Rider | undefined>;
  saveDriver(driver: Driver): Promise<void>;
  findDriver(id: string): Promise<Driver | undefined>;
  saveRide(ride: Ride): Promise<void>;
  findRide(id: string): Promise<Ride | undefined>;
  findRidesByRider(riderId: string): Promise<Ride[]>;
  saveRideEstimate(estimate: RideEstimate): Promise<void>;
  findRideEstimate(token: string): Promise<RideEstimate | undefined>;
  deleteRideEstimate(token: string): Promise<void>;
}
