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

  async saveRideEstimate(_estimate: RideEstimate): Promise<void> {
    return undefined;
  }

  async findRideEstimate(_token: string): Promise<RideEstimate | undefined> {
    return undefined;
  }

  async deleteRideEstimate(_token: string): Promise<void> {
    return undefined;
  }
}
