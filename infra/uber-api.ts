import express from "express";
import type { ErrorRequestHandler } from "express";
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
		const { riderId, from, to, isUberX = false } = request.body ?? {};
		if (
			!isText(riderId) ||
			!isText(from) ||
			!isText(to) ||
			typeof isUberX !== "boolean"
		) {
			response
				.status(400)
				.json({
					error:
						"riderId, from et to sont obligatoires ; isUberX doit etre un booleen",
				});
			return;
		}

		const rider = await repository.findRider(riderId);
		if (!rider) {
			response.status(404).json({ error: "Rider introuvable" });
			return;
		}

		const ride = await new BookRideUsecase(repository).handleFromAddresses(
			rider,
			from,
			to,
			scanner,
			isUberX,
			today(),
		);
		response.status(201).json(ride);
	});

	api.post("/rides/:id/cancel", async (request, response) => {
		const { riderId } = request.body ?? {};
		const rideId = request.params.id;
		const isUuid =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				rideId,
			);
		if (!isText(riderId) || !isUuid) {
			response
				.status(400)
				.json({
					error: "riderId et un identifiant de course valide sont obligatoires",
				});
			return;
		}

		const rider = await repository.findRider(riderId);
		if (!rider) {
			response.status(404).json({ error: "Rider introuvable" });
			return;
		}

		const ride = await repository.findRide(rideId);
		if (!ride) {
			response.status(404).json({ error: "Course introuvable" });
			return;
		}

		const penalty = await new CancelRideUsecase(repository).handle(
			rider,
			ride,
			today(),
		);
		response.json({ penalty });
	});

	api.get("/riders/:id/rides", async (request, response) => {
		const rider = await repository.findRider(request.params.id);
		if (!rider) {
			response.status(404).json({ error: "Rider introuvable" });
			return;
		}

		const history = await new ListRiderRideHistoryUsecase(repository).handle(
			rider.id,
		);
		response.json(history);
	});

	api.use((_request, response) => {
		response.status(404).json({ error: "Route introuvable" });
	});

	const handleError: ErrorRequestHandler = (
		error,
		_request,
		response,
		_next,
	) => {
		if (error instanceof SyntaxError && "body" in error) {
			response.status(400).json({ error: "JSON invalide" });
			return;
		}

		const statuses: Record<string, number> = {
			"Fonds insuffisants": 409,
			"Une reservation attend deja un Driver": 409,
			"Cette course est deja annulee": 409,
			"Cette course appartient a un autre Rider": 403,
			"Tarif non defini pour ce trajet": 422,
			"Impossible de retrouver la ville de cette adresse": 502,
			"Impossible de calculer la distance du trajet": 502,
		};
		if (error instanceof Error) {
			const status = statuses[error.message];
			if (typeof status === "number") {
				response.status(status).json({ error: error.message });
				return;
			}
		}
		response.status(500).json({ error: "Erreur interne du serveur" });
	};
	api.use(handleError);

	return api;
}

function isText(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}
