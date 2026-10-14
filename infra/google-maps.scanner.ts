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
}
