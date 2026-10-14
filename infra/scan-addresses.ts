import { GoogleMapsScanner } from "./google-maps.scanner";

async function main() {
  const [fromAddress, toAddress] = process.argv.slice(2);
  if (!fromAddress || !toAddress) {
    throw new Error('Utilisation : npm run scan -- "adresse de depart" "adresse darrivee"');
  }

  const scanner = new GoogleMapsScanner(process.env.GOOGLE_MAPS_API_KEY ?? "");
  const route = await scanner.scan(fromAddress, toAddress);
  console.log(JSON.stringify(route, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Impossible de scanner le trajet");
  process.exitCode = 1;
});
