import type { Knex } from "knex";
import type { Rider } from "../app/book-ride.usecase";

// Un repository est une classe qui range et retrouve les donnees.
export class KnexUberRepository {
  constructor(private database: Knex) {}

  async saveRider(rider: Rider): Promise<void> {
    await this.database("riders").insert({
      id: rider.id,
      balance: rider.balance,
      birthDate: rider.birthDate ?? null,
    });
  }
}
