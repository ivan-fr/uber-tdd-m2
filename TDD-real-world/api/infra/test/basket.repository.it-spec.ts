// import { KnexBasketRepository } from './knexRideRepository';
import { knex, Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { describe, beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import { BasketPm, ProductBasketPm } from "../persistent-model/basketPm";
import {
  resetDB,
  stopDockerPostgresql,
  startDockerPostgresql,
} from "setup-integration-tests/docker-postgresql-manager";
import knexConfig from "setup-integration-tests/knexfile";
import { KnexBasketRepository } from "../knex-basket.repository";
import { Basket } from "../../../app/basket.repository";
import { ProductsType } from "../../../app/reduction.gateway";

describe("Knex basket repository", () => {
  let sqlConnection: Knex;
  let knexBasketRepo: KnexBasketRepository;

  beforeAll(async () => {
    await startDockerPostgresql();
    sqlConnection = knex(knexConfig.test);
  });

  afterAll(async () => {
    await stopDockerPostgresql();
  });

  beforeEach(async () => {
    await resetDB(sqlConnection);
    knexBasketRepo = new KnexBasketRepository(sqlConnection);
  });

  it("can save a basket", async () => {
    const basket: Basket = {
      id: "afae746c-b49e-4b92-babf-fa3f9fa3c5ed",
      products: [
        {
          name: "10 rue de Courcelles Paris",
          quantity: 1,
          price: 100,
          type: ProductsType.TSHIRT,
        },
      ],
      totalPrice: 100,
    };

    await knexBasketRepo.save(basket);
    expect(await findExistingBaskets()).toEqual<BasketPm[]>([
      {
        id: "afae746c-b49e-4b92-babf-fa3f9fa3c5ed",
        totalPrice: 100,
      },
    ]);
    expect(await findExistingProducts()).toEqual<ProductBasketPm[]>([
      {
        basketId: "afae746c-b49e-4b92-babf-fa3f9fa3c5ed",
        name: "10 rue de Courcelles Paris",
        quantity: 1,
        price: 100,
      },
    ]);
  });

  it("can remove a basket", async () => {
    const basketId1 = uuidv4();
    const basketId2 = uuidv4();

    await sqlConnection("baskets").insert([
      { id: basketId1, totalPrice: 100 },
      { id: basketId2, totalPrice: 200 },
    ]);
    await sqlConnection("products").insert([
      {
        basketId: basketId1,
        name: "10 rue de Courcelles Paris",
        quantity: 1,
        price: 100,
      },
      {
        basketId: basketId2,
        name: "20 avenue de Wagram Paris",
        quantity: 2,
        price: 100,
      },
    ]);

    await knexBasketRepo.remove(basketId1);
    expect(await findExistingBaskets()).toEqual<BasketPm[]>([
      {
        id: basketId2,
        totalPrice: 200,
      },
    ]);
    expect(await findExistingProducts()).toEqual<ProductBasketPm[]>([
      {
        basketId: basketId2,
        name: "20 avenue de Wagram Paris",
        quantity: 2,
        price: 100,
      },
    ]);
  });

  const findExistingBaskets = async (): Promise<BasketPm[]> => {
    return sqlConnection("baskets").select<BasketPm[]>("id", "totalPrice");
  };

  const findExistingProducts = async (): Promise<ProductBasketPm[]> => {
    return sqlConnection("products").select<ProductBasketPm[]>(
      "basketId",
      "name",
      "quantity",
      "price"
    );
  };
});
