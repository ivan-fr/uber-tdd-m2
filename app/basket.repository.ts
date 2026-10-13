import { ProductsType } from "./reduction.gateway";

export interface BasketRepository {
  remove(id: string): Promise<void>;
  save(basket: Basket): Promise<void>;
}

export type Basket = {
  id: string;
  userEmail: string;
  products: {
    name: string;
    quantity: number;
    type: ProductsType;
    price: number;
  }[];
  totalPrice: number;
};
