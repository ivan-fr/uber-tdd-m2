import { beforeEach, describe, expect, it } from "vitest";
import { productBuilder } from "./product.builder";
import { FakeBasketRepository } from "./fake-basket.repository";
import { Basket } from "@/basket.repository";
import { RemoveBasketUsecase } from "@/remove-basket.usecase";
import { mock } from "node:test";

describe("Feature remove basket", () => {
  let removeBasketUsecase: RemoveBasketUsecase;
  let basketRepository: FakeBasketRepository;
  beforeEach(() => {
    basketRepository = new FakeBasketRepository();
    removeBasketUsecase = new RemoveBasketUsecase(basketRepository);
  });

  describe("Remove saved basket", () => {
    it("I have one product to remove", async () => {
      givenBasketExists([
        {
          userEmail: "bob@bob.fr",
          id: "1",
          products: [new productBuilder().withQuantity(1).withPrice(1).build()],
          totalPrice: 1,
        },
      ]);

      await removeBasketUsecase.handle(basketRepository.baskets[0].id);

      thenBasketIsSavedWithId([]);
    });
  });

  function givenBasketExists(baskets: Basket[]) {
    basketRepository.baskets = baskets;
  }

  function thenBasketIsSavedWithId(basket: Basket[]) {
    expect(basketRepository.baskets).toEqual(basket);
  }
});

// Mock -> expect dans l'implem directement
