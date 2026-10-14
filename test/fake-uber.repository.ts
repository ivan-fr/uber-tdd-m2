import type { Driver, Ride, RideEstimate, Rider } from "../app/models";
import type { UberRepository } from "../app/uber.repository";

export class FakeUberRepository implements UberRepository {
  public riders: Rider[] = [];
  public drivers: Driver[] = [];
  public rides: Ride[] = [];
  public rideEstimates: RideEstimate[] = [];

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

  async saveRideWithLoyaltyPoints(rider: Rider, ride: Ride): Promise<void> {
    const updatedRider = {
      ...rider,
      loyaltyPoints: (rider.loyaltyPoints ?? 0) + 1,
    };
    await this.saveRider(updatedRider);
    await this.saveRide(ride);
  }

  async withTransaction<T>(callback: (repository: UberRepository) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async findRide(id: string): Promise<Ride | undefined> {
    return this.rides.find((ride) => ride.id === id);
  }

  async findRidesByRider(riderId: string): Promise<Ride[]> {
    return this.rides.filter((ride) => ride.riderId === riderId);
  }

  async saveRideEstimate(estimate: RideEstimate): Promise<void> {
    this.rideEstimates = this.rideEstimates.filter((savedEstimate) => savedEstimate.token !== estimate.token);
    this.rideEstimates.push(estimate);
  }

  async findRideEstimate(token: string): Promise<RideEstimate | undefined> {
    return this.rideEstimates.find((estimate) => estimate.token === token);
  }

  async deleteRideEstimate(token: string): Promise<void> {
    this.rideEstimates = this.rideEstimates.filter((estimate) => estimate.token !== token);
  }
}
