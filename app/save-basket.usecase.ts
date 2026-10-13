import { Basket, BasketRepository } from "./basket.repository";
import { CalculPriceUsecase } from "./calcul-price.usecase";
import { CodesTypes, ProductsType } from "./reduction.gateway";
import { IDGenerator } from "./id-generator.provider";
import { EmailNotifier } from "test/save-backet.usecase.test";

export class SaveBasketUsecase {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly calculPriceUsecase: CalculPriceUsecase,
    private readonly idGenerator: IDGenerator,
    private readonly emailNotifier: EmailNotifier
  ) {}
  async handle(
    userEmail: string,
    products: {
      name: string;
      quantity: number;
      type: ProductsType;
      price: number;
    }[],
    reductionCode?: CodesTypes
  ): Promise<void> {
    const totalPrice = await this.calculPriceUsecase.handle(
      products,
      reductionCode
    );
    const basket: Basket = {
      userEmail,
      id: this.idGenerator.generate(),
      products,
      totalPrice,
    };
    await this.basketRepository.save(basket);

    await this.emailNotifier.send({
      name: "BASKET_SAVED",
      message: "Profitez de 10% de réduction avec le code DISCOUNT10",
      to: userEmail,
    });
  }
}
