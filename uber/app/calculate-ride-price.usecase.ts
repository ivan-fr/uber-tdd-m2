export class CalculateRidePriceUsecase {
  handle(from: string, to: string, distanceKm: number): number {
    let basePrice: number;

    if (from === "Paris" && to === "Paris") {
      basePrice = 2;
    } else if (from !== "Paris" && to === "Paris") {
      basePrice = 0;
    } else if (from === "Paris" && to !== "Paris") {
      basePrice = 10;
    } else {
      throw new Error("Tarif non defini pour ce trajet");
    }

    return basePrice + distanceKm * 0.5;
  }
}
