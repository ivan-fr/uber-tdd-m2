import type { Driver, Ride, Rider } from "../app/models";
import type { UberRepository } from "../app/uber.repository";

// Dans les tests unitaires, des tableaux remplacent PostgreSQL.
export class FakeUberRepository implements UberRepository {
  public riders: Rider[] = [];
  public drivers: Driver[] = [];
  public rides: Ride[] = [];

  async saveRider(rider: Rider): Promise<void> {
    this.riders = this.riders.filter((savedRider) => savedRider.id !== rider.id);
    this.riders.push(rider);
  }

  async findRider(id: string): Promise<Rider | undefined> {
    return this.riders.find((rider) => rider.id === id);
  }

  async saveDriver(driver: Driver): Promise<void> {
    this.drivers = this.drivers.filter((savedDriver) => savedDriver.id !== driver.id);
    this.drivers.push(driver);
  }

  async findDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.find((driver) => driver.id === id);
  }

  async saveRide(ride: Ride): Promise<void> {
    this.rides = this.rides.filter((savedRide) => savedRide.id !== ride.id);
    this.rides.push(ride);
  }

  async findRide(id: string): Promise<Ride | undefined> {
    return this.rides.find((ride) => ride.id === id);
  }

  async findRidesByRider(riderId: string): Promise<Ride[]> {
    return this.rides.filter((ride) => ride.riderId === riderId);
  }
}
