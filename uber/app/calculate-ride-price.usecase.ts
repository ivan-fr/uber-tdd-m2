export class CalculateRidePriceUsecase {
  handle(from: string, to: string, distanceKm: number): number {
    if (from !== "Paris" && to === "Paris") {
      return distanceKm * 0.5;
    }

    return 2 + distanceKm * 0.5;
  }
}
