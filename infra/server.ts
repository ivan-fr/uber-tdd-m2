import { knex } from "knex";
import { KnexUberRepository } from "./knex-uber.repository";
import { GoogleMapsScanner } from "./google-maps.scanner";
import { createUberController } from "./uber.controller";

const config = require("./knexfile.cjs");
const database = knex(config.development);
const repository = new KnexUberRepository(database);
const scanner = new GoogleMapsScanner(process.env.GOOGLE_MAPS_API_KEY ?? "");
const api = createUberController(repository, scanner);
const port = Number(process.env.PORT ?? 3000);

const server = api.listen(port, "127.0.0.1", () => {
	console.log(`API Uber disponible sur http://127.0.0.1:${port}`);
});

server.on("error", async () => {
	console.error("Impossible de demarrer le serveur HTTP");
	await database.destroy();
	process.exitCode = 1;
});

function stop() {
	server.close(async () => {
		await database.destroy();
	});
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
