import { BasketRepository } from "../app/basket.repository";

export class RemoveBasketUsecase {
  constructor(private basketRepository: BasketRepository) {}

  async handle(id: string): Promise<void> {
    await this.basketRepository.remove(id);
  }
}
