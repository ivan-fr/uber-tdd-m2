export class CalculateRidePriceUsecase {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  private isPeakHour(date: Date): boolean {
    const hour = date.getHours();

    return (hour >= 8 && hour < 9) || (hour >= 18 && hour < 20);
  }

  handle(
    from: string,
    to: string,
    distanceKm: number,
    today?: Date,
    isUberX: boolean = false,
    riderBirthDate?: Date,
  ): number {
    const currentDate = today ?? this.clock();
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

    const isChristmasEve = currentDate.getMonth() === 11 && currentDate.getDate() === 24;
    const isChristmasDay = currentDate.getMonth() === 11 && currentDate.getDate() === 25;
    const isBirthday =
      riderBirthDate !== undefined &&
      riderBirthDate.getDate() === currentDate.getDate() &&
      riderBirthDate.getMonth() === currentDate.getMonth();

    if (isUberX && !isBirthday) {
      price = price + 5;
    }

    if (isChristmasEve || isChristmasDay) {
      price = price * 2;
    }

    if (this.isPeakHour(currentDate)) {
      price = price * 1.5;
    }

    return Math.round(price * 100) / 100;
  }
}
