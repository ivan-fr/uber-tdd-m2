import {
  ReductionGateway,
  ReductionType,
  ProductsType,
  CodesTypes,
} from "../../app/reduction.gateway";

export class ReelReductionCodeGateway implements ReductionGateway {
  async getReductionByCode(
    code: CodesTypes
  ): Promise<ReductionType | undefined> {
    if (code === "ONEFREEPULL")
      return {
        type: "ONE_FREE",
        amount: 0,
        eligibleProduct: ProductsType.PULL,
      };

    if (code === "DISCOUNTEURO30")
      return {
        type: "DISCOUNT_EURO",
        amount: 30,
      };
    if (code === "DISCOUNTEURO10")
      return {
        type: "DISCOUNT_EURO",
        amount: 10,
      };
    if (code === "DISCOUNTPERCENT10")
      return {
        type: "DISCOUNT_PERCENT",
        amount: 10,
      };
    if (code === "BLACKFRIDAY")
      return {
        type: "BLACK_FRIDAY",
        amount: 0,
      };
  }
}
