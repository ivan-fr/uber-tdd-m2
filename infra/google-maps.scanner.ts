import { AddressType, Client, Status } from "@googlemaps/google-maps-services-js";

export class GoogleMapsScanner {
  private client = new Client({});

  constructor(private apiKey: string) {}

  async getCity(address: string): Promise<string> {
    try {
      const response = await this.client.geocode({
        params: { address: address, key: this.apiKey, language: "fr", region: "fr" },
        timeout: 5000,
      });
      if (response.data.status !== Status.OK) {
        throw new Error("Adresse introuvable");
      }

      const components = response.data.results[0]?.address_components ?? [];
      const city = components.find((component) => component.types.includes(AddressType.locality));
      if (!city) throw new Error("Ville introuvable");

      return city.long_name;
    } catch {
      throw new Error("Impossible de retrouver la ville de cette adresse");
    }
  }

  async getDistance(fromAddress: string, toAddress: string): Promise<number> {
    try {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: fromAddress },
          destination: { address: toAddress },
          travelMode: "DRIVE",
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("Google Routes indisponible");

      const data = await response.json();
      const distanceMeters = data.routes?.[0]?.distanceMeters;
      if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
        throw new Error("Distance introuvable");
      }

      return distanceMeters / 1000;
    } catch {
      throw new Error("Impossible de calculer la distance du trajet");
    }
  }
}
