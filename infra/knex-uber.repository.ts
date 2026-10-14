import type { Knex } from "knex";
import type { Driver, Ride, RideEstimate, Rider } from "../app/models";
import type { UberRepository } from "../app/uber.repository";

export class KnexUberRepository implements UberRepository {
  constructor(private database: Knex) {}

  async saveRider(rider: Rider): Promise<void> {
    await this.database("riders")
      .insert({
        id: rider.id,
        balance: rider.balance,
        birthDate: rider.birthDate ?? null,
      })
      .onConflict("id")
      .merge();
  }

  async findRider(id: string): Promise<Rider | undefined> {
    const row = await this.database("riders").where({ id: id }).first();
    if (!row) return undefined;

    return {
      id: row.id,
      balance: Number(row.balance),
      birthDate: row.birthDate ?? undefined,
    };
  }

  async saveDriver(driver: Driver): Promise<void> {
    await this.database("drivers").insert(driver).onConflict("id").merge();
  }

  async findDriver(id: string): Promise<Driver | undefined> {
    return this.database("drivers").where({ id: id }).first();
  }

  async saveRide(ride: Ride): Promise<void> {
    await this.database("rides").insert(ride).onConflict("id").merge();
  }

  async findRide(id: string): Promise<Ride | undefined> {
    const row = await this.database("rides").where({ id: id }).first();
    if (!row) return undefined;

    return {
      ...row,
      distanceKm: Number(row.distanceKm),
      price: Number(row.price),
    };
  }

  async findRidesByRider(riderId: string): Promise<Ride[]> {
    const rows = await this.database("rides").where({ riderId: riderId }).orderBy("id");
    return rows.map((row) => ({
      ...row,
      distanceKm: Number(row.distanceKm),
      price: Number(row.price),
    }));
  }

  async saveRideEstimate(estimate: RideEstimate): Promise<void> {
    await this.database("ride_estimates")
      .insert({
        token: estimate.token,
        riderId: estimate.riderId,
        from: estimate.from,
        to: estimate.to,
        distanceKm: estimate.distanceKm,
        price: estimate.price,
        isUberX: estimate.isUberX,
        used: estimate.used ?? false,
        createdAt: estimate.createdAt,
        expiresAt: estimate.expiresAt,
      })
      .onConflict("token")
      .merge();
  }

  async findRideEstimate(token: string): Promise<RideEstimate | undefined> {
    const row = await this.database("ride_estimates").where({ token }).first();
    if (!row) return undefined;

    return {
      token: row.token,
      riderId: row.riderId,
      from: row.from,
      to: row.to,
      distanceKm: Number(row.distanceKm),
      price: Number(row.price),
      isUberX: Boolean(row.isUberX),
      createdAt: new Date(row.createdAt),
      expiresAt: new Date(row.expiresAt),
      used: Boolean(row.used),
    };
  }

  async deleteRideEstimate(token: string): Promise<void> {
    await this.database("ride_estimates").where({ token }).delete();
  }
}
