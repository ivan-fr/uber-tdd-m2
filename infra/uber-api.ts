import express from "express";
import type { UberRepository } from "../app/uber.repository";
import type { RouteScanner } from "../app/route.scanner";
import { BookRideUsecase } from "../app/book-ride.usecase";

export function createUberApi(
  repository: UberRepository,
  scanner: RouteScanner,
  today: () => Date = () => new Date(),
) {
  const api = express();
  api.use(express.json());

  api.post("/rides", async (request, response) => {
    const { riderId, from, to, isUberX = false } = request.body;
    const rider = await repository.findRider(riderId);
    if (!rider) {
      response.status(404).json({ error: "Rider introuvable" });
      return;
    }

    const ride = await new BookRideUsecase(repository).handleFromAddresses(
      rider, from, to, scanner, isUberX, today(),
    );
    response.status(201).json(ride);
  });

  return api;
}
