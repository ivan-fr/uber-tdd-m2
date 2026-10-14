export class CalculateRidePriceUsecase {
  handle(from: string, to: string, distanceKm: number): number {
    let basePrice: number;

    // On choisit le prix de depart selon les deux villes.
    if (from === "Paris" && to === "Paris") {
      basePrice = 2;
    } else if (from !== "Paris" && to === "Paris") {
      basePrice = 0;
    } else if (from === "Paris" && to !== "Paris") {
      basePrice = 10;
    } else {
      // La story 1 ne donne pas de tarif exterieur vers exterieur.
      throw new Error("Tarif non defini pour ce trajet");
    }

    // Chaque kilometre ajoute 50 centimes au prix de depart.
    return basePrice + distanceKm * 0.5;
  }
}
