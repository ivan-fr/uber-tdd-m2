import type { Ride, Rider } from "./models";
import type { UberRepository } from "./uber.repository";

export class CancelRideUsecase {
  constructor(private repository: UberRepository) {}

  // On donne la date du jour en parametre pour pouvoir la choisir dans les tests.
  // Le nombre retourne est la penalite : 0 ou 5 euros.
  async handle(rider: Rider, ride: Ride, today: Date): Promise<number> {
    // On verifie d'abord que l'annulation est autorisee.
    if (ride.riderId !== rider.id) {
      throw new Error("Cette course appartient a un autre Rider");
    }

    if (ride.cancelled === true) {
      throw new Error("Cette course est deja annulee");
    }

    // Un anniversaire depend du jour et du mois, pas de l'annee.
    let isBirthday = false;
    if (rider.birthDate !== undefined) {
      isBirthday =
        rider.birthDate.getDate() === today.getDate() &&
        rider.birthDate.getMonth() === today.getMonth();
    }

    let penalty = 0;

    // On paie seulement si le Driver est en chemin et que ce n'est pas l'anniversaire.
    if (ride.driverOnTheWay === true && isBirthday === false) {
      penalty = 5;
    }

    // On retire la penalite du compte et on annule la course.
    rider.balance = rider.balance - penalty;
    ride.cancelled = true;
    await this.repository.saveRider(rider);
    await this.repository.saveRide(ride);
    return penalty;
  }
}
