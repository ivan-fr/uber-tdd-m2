export interface ReductionGateway {
  getReductionByCode(code: CodesTypes): Promise<ReductionType | undefined>;
}

export type ReductionType = {
  type: Reductions;
  amount: number;
  eligibleProduct?: ProductsType;
};

export type Reductions =
  | "DISCOUNT_EURO"
  | "DISCOUNT_PERCENT"
  | "ONE_FREE"
  | "BLACK_FRIDAY";

export enum ProductsType {
  TSHIRT = "TSHIRT",
  PULL = "PULL",
}

export type CodesTypes =
  | "BLACKFRIDAY"
  | "ONEFREEPULL"
  | "DISCOUNTEURO30"
  | "DISCOUNTEURO10"
  | "DISCOUNTPERCENT10";
