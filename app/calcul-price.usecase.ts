import { Clock } from "test/calcul-basket.usecase.test";
import {
  CodesTypes,
  ProductsType,
  ReductionGateway,
} from "./reduction.gateway";
import { isWithinInterval } from "date-fns";

export type Product = {
  name: string;
  quantity: number;
  type: ProductsType;
  price: number;
};

export class CalculPriceUsecase {
  constructor(
    private readonly reductionGateway: ReductionGateway,
    private readonly clock: Clock
  ) {}
  async handle(products: Product[], code?: CodesTypes): Promise<number> {
    let totalPrice = products.reduce((prev, next) => {
      return prev + next.price * next.quantity;
    }, 0);

    if (!code) return totalPrice;

    const reduction = await this.reductionGateway.getReductionByCode(code);
    if (!reduction) return totalPrice;

    return applyReduction(reduction.type)({
      totalPrice,
      now: this.clock.getNow(),
      reductionAmount: reduction.amount,
      products,
      eligibleProduct: reduction.eligibleProduct,
    });
  }
}

function applyReduction(
  type: "DISCOUNT_EURO" | "DISCOUNT_PERCENT" | "ONE_FREE" | "BLACK_FRIDAY"
): (params: {
  totalPrice: number;
  now: Date;
  reductionAmount?: number;
  products?: Product[];
  eligibleProduct?: ProductsType;
}) => number {
  switch (type) {
    case "BLACK_FRIDAY":
      return ({ totalPrice, now }) => {
        if (
          isWithinInterval(now, {
            start: new Date("2025-11-28T00:00:00Z"),
            end: new Date("2025-11-30T23:59:59Z"),
          })
        )
          return totalPrice / 2;
        return totalPrice;
      };

    case "ONE_FREE":
      return ({ products, eligibleProduct, totalPrice }) => {
        const eligibleProductFind = products?.find(
          (p) => p.type === eligibleProduct
        );
        if (eligibleProductFind && eligibleProductFind.quantity > 1)
          return totalPrice - eligibleProductFind.price;
        return totalPrice;
      };

    case "DISCOUNT_EURO":
      return (params) => {
        const reducePrice = params.totalPrice - (params.reductionAmount || 0);
        return Math.max(reducePrice, 1);
      };

    case "DISCOUNT_PERCENT":
      return ({ totalPrice, reductionAmount }) =>
        totalPrice - totalPrice * ((reductionAmount ?? 0) / 100);

    default:
      return (params) => params.totalPrice;
  }
}
