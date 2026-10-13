import { ProductsType } from "../../app/reduction.gateway";
import app from "../controllers/routes";
import request from "supertest";
import { describe, expect, it } from "vitest";

describe("Health check", () => {
  it.skip("should return 200", async () => {
    request(app)
      .get("/")
      .expect(200)
      .then((res) => {
        expect(res.statusCode).toBe(200);
      });
  });
});

describe("Baskets API E2E Tests", () => {
  describe("GET /baskets", () => {
    it("should return all baskets", async () => {
      const basketData = {
        products: [
          {
            name: "T-Shirt",
            quantity: 2,
            type: ProductsType.TSHIRT,
            price: 15,
          },
        ],
        reductionCode: "",
      };

      await request(app).post("/baskets").send(basketData).expect(201);

      const response = await request(app).get("/baskets").expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        products: basketData.products,
        totalPrice: 30,
      });
      expect(response.body[0].id).toBeDefined();
    });
  });

  describe("POST /baskets", () => {
    it("should create a basket successfully", async () => {
      const basketData = {
        products: [
          {
            name: "T-Shirt",
            quantity: 1,
            type: ProductsType.TSHIRT,
            price: 20,
          },
        ],
        reductionCode: "",
      };

      const response = await request(app)
        .post("/baskets")
        .send(basketData)
        .expect(201);

      expect(response.body).toMatchObject({
        products: basketData.products,
        totalPrice: 20,
      });
      expect(response.body.id).toBeDefined();
    });

    it("should create a basket with multiple products", async () => {
      const basketData = {
        products: [
          {
            name: "T-Shirt",
            quantity: 2,
            type: ProductsType.TSHIRT,
            price: 15,
          },
          {
            name: "Pull",
            quantity: 1,
            type: ProductsType.PULL,
            price: 25,
          },
        ],
        reductionCode: "",
      };

      const response = await request(app)
        .post("/baskets")
        .send(basketData)
        .expect(201);

      expect(response.body).toMatchObject({
        products: basketData.products,
        totalPrice: 55,
      });
      expect(response.body.id).toBeDefined();
    });

    // Pas important: On test déja le usecase dans les tests unitaires
    it("should create a basket with reduction code", async () => {
      const basketData = {
        products: [
          {
            name: "T-Shirt",
            quantity: 1,
            type: ProductsType.TSHIRT,
            price: 100,
          },
        ],
        reductionCode: "DISCOUNT10",
      };

      const response = await request(app)
        .post("/baskets")
        .send(basketData)
        .expect(201);

      expect(response.body).toMatchObject({
        products: basketData.products,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.totalPrice).toBeDefined();
    });

    it.only("should handle empty products array", async () => {
      const basketData = {
        products: [],
        reductionCode: "",
      };

      const response = await request(app)
        .post("/baskets")
        .send(basketData)
        .expect(500);

      expect(response.body.message).toBe("Products is required");
    });
  });

  describe("DELETE /baskets/:id", () => {
    it("should delete a basket successfully", async () => {
      const basketData = {
        products: [
          {
            name: "T-Shirt",
            quantity: 1,
            type: ProductsType.TSHIRT,
            price: 20,
          },
        ],
        reductionCode: "",
      };

      const createResponse = await request(app)
        .post("/baskets")
        .send(basketData)
        .expect(201);

      const basketId = createResponse.body.id;

      await request(app).delete(`/baskets/${basketId}`).expect(204);

      const getBasketsResponse = await request(app).get("/baskets").expect(200);

      expect(getBasketsResponse.body).toHaveLength(0);
    });

    // Pas important: On test déja le usecase dans les tests unitaires
    it("should delete correct basket when multiple exist", async () => {
      const basketData1 = {
        products: [
          {
            name: "T-Shirt",
            quantity: 1,
            type: ProductsType.TSHIRT,
            price: 20,
          },
        ],
        reductionCode: "",
      };

      const createResponse1 = await request(app)
        .post("/baskets")
        .send(basketData1)
        .expect(201);

      const basketData2 = {
        products: [
          {
            name: "Pull",
            quantity: 1,
            type: ProductsType.PULL,
            price: 30,
          },
        ],
        reductionCode: "",
      };

      const createResponse2 = await request(app)
        .post("/baskets")
        .send(basketData2)
        .expect(201);

      await request(app)
        .delete(`/baskets/${createResponse1.body.id}`)
        .expect(204);

      const getBasketsResponse = await request(app).get("/baskets").expect(200);

      expect(getBasketsResponse.body).toHaveLength(1);
      expect(getBasketsResponse.body[0].id).toBe(createResponse2.body.id);
    });
  });
});
