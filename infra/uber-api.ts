import express from "express";
import type { UberRepository } from "../app/uber.repository";
import type { RouteScanner } from "../app/route.scanner";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { ListRiderRideHistoryUsecase } from "../app/list-rides-history.usecase";

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

  api.post("/rides/:id/cancel", async (request, response) => {
    const rider = await repository.findRider(request.body.riderId);
    if (!rider) {
      response.status(404).json({ error: "Rider introuvable" });
      return;
    }

    const ride = await repository.findRide(request.params.id);
    if (!ride) {
      response.status(404).json({ error: "Course introuvable" });
      return;
    }

    const penalty = await new CancelRideUsecase(repository).handle(rider, ride, today());
    response.json({ penalty });
  });

  api.get("/riders/:id/rides", async (request, response) => {
    const rider = await repository.findRider(request.params.id);
    if (!rider) {
      response.status(404).json({ error: "Rider introuvable" });
      return;
    }

    const history = await new ListRiderRideHistoryUsecase(repository).handle(rider.id);
    response.json(history);
  });

  return api;
}
