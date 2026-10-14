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

  it("convertit la distance Google de metres en kilometres", async () => {
    const fetchRoute = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      routes: [{ distanceMeters: 12345 }],
    })));
    vi.stubGlobal("fetch", fetchRoute);
    const scanner = new GoogleMapsScanner("test-key");

    const distanceKm = await scanner.getDistance("10 rue de Rivoli, Paris", "1 place d'Armes, Versailles");

    expect(distanceKm).toBe(12.345);
    expect(fetchRoute).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": "test-key",
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: "10 rue de Rivoli, Paris" },
          destination: { address: "1 place d'Armes, Versailles" },
          travelMode: "DRIVE",
        }),
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("retourne les deux villes et la distance du trajet", async () => {
    const scanner = new GoogleMapsScanner("test-key");
    const getCity = vi.spyOn(scanner, "getCity").mockResolvedValueOnce("Paris").mockResolvedValueOnce("Versailles");
    const getDistance = vi.spyOn(scanner, "getDistance").mockResolvedValue(12.345);

    const route = await scanner.scan("10 rue de Rivoli, Paris", "1 place d'Armes, Versailles");

    expect(route).toEqual({ fromCity: "Paris", toCity: "Versailles", distanceKm: 12.345 });
    expect(getCity).toHaveBeenNthCalledWith(1, "10 rue de Rivoli, Paris");
    expect(getCity).toHaveBeenNthCalledWith(2, "1 place d'Armes, Versailles");
    expect(getDistance).toHaveBeenCalledWith("10 rue de Rivoli, Paris", "1 place d'Armes, Versailles");
  });

  it("refuse une cle API vide", () => {
    expect(() => new GoogleMapsScanner(" ")).toThrow("Cle Google Maps manquante");
  });

  it.each([
    [" ", "Paris"],
    ["Paris", ""],
  ])("refuse une adresse vide avant d'appeler Google (%s, %s)", async (from, to) => {
    const scanner = new GoogleMapsScanner("test-key");
    const getCity = vi.spyOn(scanner, "getCity").mockResolvedValue("Paris");
    vi.spyOn(scanner, "getDistance").mockResolvedValue(10);

    await expect(scanner.scan(from, to)).rejects.toThrow("Deux adresses sont necessaires");
    expect(getCity).not.toHaveBeenCalled();
  });
});
