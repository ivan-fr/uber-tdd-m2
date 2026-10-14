import type { RouteScanner, ScannedRoute } from "../app/route.scanner";

export class StubRouteScanner implements RouteScanner {
  public result: ScannedRoute = { fromCity: "Paris", toCity: "Paris", distanceKm: 10 };
  public lastAddresses?: { from: string; to: string };
  public error?: Error;

  async scan(fromAddress: string, toAddress: string): Promise<ScannedRoute> {
    this.lastAddresses = { from: fromAddress, to: toAddress };
    if (this.error) throw this.error;
    return this.result;
  }
}
