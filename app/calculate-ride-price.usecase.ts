export class CalculateRidePriceUsecase {
  handle(
    from: string,
    to: string,
    distanceKm: number,
    today: Date = new Date(),
    isUberX: boolean = false,
    riderBirthDate?: Date,
  ): number {
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

    let price = basePrice + distanceKm * 0.5;

    const isChristmasEve = today.getMonth() === 11 && today.getDate() === 24;
    const isChristmasDay = today.getMonth() === 11 && today.getDate() === 25;
    const isBirthday =
      riderBirthDate !== undefined &&
      riderBirthDate.getDate() === today.getDate() &&
      riderBirthDate.getMonth() === today.getMonth();

    if (isChristmasEve || isChristmasDay) {
      price = price * 2;
    }

    if (isUberX && !isBirthday) {
      price = price + 5;
    }

    return price;
  }
}
