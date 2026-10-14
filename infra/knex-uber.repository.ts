import type { Knex } from "knex";
import type { Driver, Ride, RideEstimate, Rider } from "../app/models";
import type { UberRepository } from "../app/uber.repository";

export class KnexUberRepository implements UberRepository {
  constructor(private database: Knex) {}

  async saveRider(rider: Rider): Promise<void> {
    const payload: Record<string, unknown> = {
      id: rider.id,
      balance: rider.balance,
      birthDate: rider.birthDate ?? null,
    };
    if (rider.loyaltyPoints !== undefined) {
      payload.loyaltyPoints = rider.loyaltyPoints;
    }

    await this.database("riders")
      .insert(payload)
      .onConflict("id")
      .merge();
  }

  async findRider(id: string): Promise<Rider | undefined> {
    const row = await this.database("riders").where({ id: id }).first();
    if (!row) return undefined;

    const rider: Rider = {
      id: row.id,
      balance: Number(row.balance),
    };

    if (row.birthDate) {
      rider.birthDate = new Date(row.birthDate);
    }

    const loyaltyPoints = Number(row.loyaltyPoints ?? 0);
    if (loyaltyPoints !== 0) {
      rider.loyaltyPoints = loyaltyPoints;
    }

    return rider;
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

  async saveRideWithLoyaltyPoints(rider: Rider, ride: Ride): Promise<void> {
    await this.database.transaction(async (trx) => {
      const updatedRider = {
        ...rider,
        loyaltyPoints: (rider.loyaltyPoints ?? 0) + 1,
      };
      await trx("riders")
        .where({ id: rider.id })
        .update({ loyaltyPoints: updatedRider.loyaltyPoints });
      await trx("rides").insert(ride).onConflict("id").merge();
    });
  }

  async withTransaction<T>(callback: (repository: UberRepository) => Promise<T>): Promise<T> {
    return this.database.transaction(async (trx) => callback(new KnexUberRepository(trx)));
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
