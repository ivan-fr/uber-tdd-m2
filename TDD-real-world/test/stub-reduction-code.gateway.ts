import { ReductionGateway, ReductionType } from "../app/reduction.gateway";

export class StubReductionCodeGateway implements ReductionGateway {
  reduction: ReductionType | undefined;
  getReductionByCode(code: string): Promise<ReductionType> {
    return new Promise((resolve) => resolve(this.reduction!));
  }
}
