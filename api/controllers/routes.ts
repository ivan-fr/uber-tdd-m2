import { SaveBasketUsecase } from "../../app/save-basket.usecase";
import cors from "cors";
import express, { Request, Response } from "express";
import { FakeBasketRepository } from "../../test/fake-basket.repository";
import { v4 as uuidv4 } from "uuid";
import { CalculPriceUsecase } from "../../app/calcul-price.usecase";
import { Basket } from "../../app/basket.repository";
import { ReelReductionCodeGateway } from "../infra/reel-reduction.gateway";

const app = express();
app.use(express.json());
app.use(cors());

const basketRepository = new FakeBasketRepository();
const idGenerator = {
  generate: () => {
    return uuidv4();
  },
};

const reductionsGateway = new ReelReductionCodeGateway();

const clock = {
  getNow: () => new Date(),
};

const calculate = new CalculPriceUsecase(reductionsGateway, clock);
const saveBasketUsecase = new SaveBasketUsecase(
  basketRepository,
  calculate,
  idGenerator,
  {
    send: (email: { to: string; name: "BASKET_SAVED"; message: string }) =>
      console.log(email),
  }
);

app.get("/baskets", (request: Request, response: Response) => {
  return response.json(basketRepository.baskets);
});

app.post("/totalPrice", async (request: Request, response: Response) => {
  const totalPrice = await calculate.handle(
    request.body.products,
    request.body.reductionCode
  );

  return response.json(totalPrice);
});

app.post("/baskets", async (request: Request, response: Response) => {
  const products = request.body.products;

  if (!products || products.length <= 1)
    return response.status(500).json({ message: "Products is required" });

  await saveBasketUsecase.handle(products, request.body.reductionCode);

  const basket = basketRepository.baskets.find((basket: Basket) => {
    return basket.products === products;
  });

  if (!basket) throw new Error("Basket not found");

  return response.status(201).json(basket);
});

app.delete("/baskets/:id", async (request: Request, response: Response) => {
  const id = request.params.id;
  await basketRepository.remove(id);
  return response.status(204).send();
});

export default app;
