import type { Driver, Ride, Rider } from "./models";

// Le code metier utilise ces methodes sans avoir besoin de connaitre PostgreSQL.
// Promise signifie que le resultat arrive apres une operation asynchrone.
export interface UberRepository {
  saveRider(rider: Rider): Promise<void>;
  findRider(id: string): Promise<Rider | undefined>;
  saveDriver(driver: Driver): Promise<void>;
  findDriver(id: string): Promise<Driver | undefined>;
  saveRide(ride: Ride): Promise<void>;
  findRide(id: string): Promise<Ride | undefined>;
  findRidesByRider(riderId: string): Promise<Ride[]>;
}
