import { CalculPriceUsecase } from "@/calcul-price.usecase";
import { beforeEach, describe, expect, it } from "vitest";
import { productBuilder } from "./product.builder";
import { ProductsType, ReductionType } from "../app/reduction.gateway";
import { StubReductionCodeGateway } from "./stub-reduction-code.gateway";

export interface Clock {
  getNow(): Date;
}

export class StubClock implements Clock {
  constructor(public date: Date) {}

  getNow(): Date {
    return this.date;
  }
}

describe("Feature calcul basket", () => {
  let calculPriceUsecase: CalculPriceUsecase;
  let reductionsGateway: StubReductionCodeGateway;
  let clock: StubClock;
  let now = new Date("2025-11-27");
  beforeEach(() => {
    reductionsGateway = new StubReductionCodeGateway();
    clock = new StubClock(now);
    calculPriceUsecase = new CalculPriceUsecase(reductionsGateway, clock);
  });

  describe("Calcul price for product", () => {
    it("I have one product", async () => {
      const expectPrice = await calculPriceUsecase.handle([
        new productBuilder().withQuantity(1).withPrice(1).build(),
      ]);

      const price = 1;
      expect(expectPrice).toEqual(price);
    });

    it("There is two products", async () => {
      const expectPrice = await calculPriceUsecase.handle([
        new productBuilder().withQuantity(1).withPrice(1).build(),
        new productBuilder().withQuantity(1).withPrice(1).build(),
      ]);

      const price = 2;
      expect(expectPrice).toEqual(price);
    });

    it("There is two same products", async () => {
      const expectPrice = await calculPriceUsecase.handle([
        new productBuilder()
          .withName("product2")
          .withQuantity(2)
          .withPrice(1)
          .build(),
      ]);

      const price = 2;
      expect(expectPrice).toBe(price);
    });
  });

  describe("Apply promotion code", () => {
    it("Apply promotion of 10%", async () => {
      givenReductionCodeExist({
        type: "DISCOUNT_PERCENT",
        amount: 10,
      });

      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder().withName("product2").withPrice(10).build(),
          new productBuilder().withName("product2").withPrice(10).build(),
        ],
        "DISCOUNTPERCENT10",
      );
      const price = 18;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of 10€", async () => {
      givenReductionCodeExist({
        type: "DISCOUNT_EURO",
        amount: 10,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder().withName("product1").withPrice(10).build(),
          new productBuilder().withName("product2").withPrice(10).build(),
        ],
        "DISCOUNTEURO10",
      );
      const price = 10;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of 30€ and price is 20€", async () => {
      givenReductionCodeExist({
        type: "DISCOUNT_EURO",
        amount: 30,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder()
            .withName("product1")
            .withPrice(10)
            .withQuantity(2)
            .build(),
        ],
        "DISCOUNTEURO30",
      );
      const price = 1;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of one buy one free product ", async () => {
      givenReductionCodeExist({
        type: "ONE_FREE",
        amount: 0,
        eligibleProduct: ProductsType.PULL,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder()
            .withName("product1")
            .withType(ProductsType.PULL)
            .withPrice(10)
            .withQuantity(2)
            .build(),
        ],
        "ONEFREEPULL",
      );
      const price = 10;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of one buy one free product with no eligible products ", async () => {
      givenReductionCodeExist({
        type: "ONE_FREE",
        amount: 0,
        eligibleProduct: ProductsType.PULL,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder()
            .withName("product1")
            .withType(ProductsType.TSHIRT)
            .withPrice(10)
            .withQuantity(2)
            .build(),
        ],
        "ONEFREEPULL",
      );
      const price = 20;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of one buy one free product with only one eligible product ", async () => {
      givenReductionCodeExist({
        type: "ONE_FREE",
        amount: 0,
        eligibleProduct: ProductsType.PULL,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder()
            .withName("product1")
            .withType(ProductsType.PULL)
            .withPrice(10)
            .withQuantity(1)
            .build(),

          new productBuilder()
            .withName("product1")
            .withType(ProductsType.TSHIRT)
            .withPrice(10)
            .withQuantity(2)
            .build(),
        ],
        "ONEFREEPULL",
      );
      const price = 30;
      expect(price).toBe(expectPrice);
    });

    it("Promotion of one buy one free product with only one eligible product ", async () => {
      givenReductionCodeExist({
        type: "ONE_FREE",
        amount: 0,
        eligibleProduct: ProductsType.PULL,
      });
      const expectPrice = await calculPriceUsecase.handle(
        [
          new productBuilder()
            .withName("product1")
            .withType(ProductsType.TSHIRT)
            .withPrice(20)
            .withQuantity(1)
            .build(),
          new productBuilder()
            .withName("product1")
            .withType(ProductsType.PULL)
            .withPrice(10)
            .withQuantity(2)
            .build(),
        ],
        "ONEFREEPULL",
      );
      const price = 30;
      expect(price).toBe(expectPrice);
    });

    describe("Black Friday reduction", () => {
      it("Apply black friday reduction", async () => {
        givenReductionCodeExist({
          type: "BLACK_FRIDAY",
          amount: 0,
        });

        givenNowIs(new Date("2025-11-28T00:00:00Z"));

        const expectPrice = await calculPriceUsecase.handle(
          [
            new productBuilder()
              .withName("product1")
              .withType(ProductsType.TSHIRT)
              .withPrice(20)
              .withQuantity(1)
              .build(),
          ],
          "BLACKFRIDAY",
        );
        const price = 10;
        expect(price).toBe(expectPrice);
      });

      it("Apply black friday reduction only between friday and saturday 2025-11", async () => {
        givenReductionCodeExist({
          type: "BLACK_FRIDAY",
          amount: 0,
        });

        givenNowIs(new Date("2025-12-01T00:00:00Z"));

        const expectPrice = await calculPriceUsecase.handle(
          [
            new productBuilder()
              .withName("product1")
              .withType(ProductsType.TSHIRT)
              .withPrice(20)
              .withQuantity(1)
              .build(),
          ],
          "BLACKFRIDAY",
        );
        const price = 20;
        expect(expectPrice).toBe(price);
      });
    });
  });

  function givenReductionCodeExist(reductionCode: ReductionType) {
    reductionsGateway.reduction = reductionCode;
  }

  function givenNowIs(now: Date) {
    clock.date = now;
  }
});
