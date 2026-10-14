export class CalculateRidePriceUsecase {
  handle(from: string, to: string, distanceKm: number, today: Date = new Date()): number {
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

    const price = basePrice + distanceKm * 0.5;
    const isChristmasEve = today.getMonth() === 11 && today.getDate() === 24;
    const isChristmasDay = today.getMonth() === 11 && today.getDate() === 25;

    if (isChristmasEve || isChristmasDay) {
      return price * 2;
    }

    return price;
  }
}
