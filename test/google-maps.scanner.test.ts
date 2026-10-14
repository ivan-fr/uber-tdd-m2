import { afterEach, describe, expect, it, vi } from "vitest";
import { AddressType, Client, Status } from "@googlemaps/google-maps-services-js";
import type { GeocodeResponse } from "@googlemaps/google-maps-services-js";
import { GoogleMapsScanner } from "../infra/google-maps.scanner";

describe("Scanner les adresses avec Google Maps", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retrouve la ville d'une adresse", async () => {
    const geocode = vi.spyOn(Client.prototype, "geocode");
    geocode.mockResolvedValue({
      data: {
        status: Status.OK,
        results: [{
          address_components: [{
            long_name: "Paris",
            short_name: "Paris",
            types: [AddressType.locality],
          }],
        }],
      },
    } as GeocodeResponse);
    const scanner = new GoogleMapsScanner("test-key");

    const city = await scanner.getCity("10 rue de Rivoli, Paris");

    expect(city).toBe("Paris");
    expect(geocode).toHaveBeenCalledWith({
      params: { address: "10 rue de Rivoli, Paris", key: "test-key", language: "fr", region: "fr" },
      timeout: 5000,
    });
  });
});
