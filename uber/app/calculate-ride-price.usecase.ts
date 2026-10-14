export class CalculateRidePriceUsecase {
  handle(from: string, to: string, distanceKm: number): number {
    return 2 + distanceKm * 0.5;
  }
}
