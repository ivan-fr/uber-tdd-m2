import { Knex } from "knex";
import { Basket, BasketRepository } from "../../app/basket.repository";

export class KnexBasketRepository implements BasketRepository {
  constructor(private sqlConnection: Knex) {}

  async remove(id: string): Promise<void> {
    await this.sqlConnection.transaction(async (trx) => {
      await trx("products").where({ basketId: id }).del();
      await trx("baskets").where({ id }).del();
    });
  }

  async remove1(id: string): Promise<void> {
    await this.sqlConnection("products").where({ basketId: id }).del();
    await this.sqlConnection("baskets").where({ id }).del();
  }

  async save(basket: Basket): Promise<void> {
    const product = await this.sqlConnection("baskets").insert({
      id: basket.id,
      totalPrice: basket.totalPrice,
    });
    await this.sqlConnection("products").insert(
      basket.products.map((product) => ({
        basketId: basket.id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
      }))
    );
  }
}
