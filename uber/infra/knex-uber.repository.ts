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

  async findRider(id: string): Promise<Rider | undefined> {
    const row = await this.database("riders").where({ id: id }).first();
    if (!row) return undefined;

    return {
      id: row.id,
      // PostgreSQL renvoie les decimaux en texte : Number les convertit.
      balance: Number(row.balance),
      birthDate: row.birthDate ?? undefined,
    };
  }
}
