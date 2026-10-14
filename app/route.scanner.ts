export interface ScannedRoute {
  fromCity: string;
  toCity: string;
  distanceKm: number;
}

export interface RouteScanner {
  scan(fromAddress: string, toAddress: string): Promise<ScannedRoute>;
}
