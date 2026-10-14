// Ces interfaces decrivent simplement les informations de nos objets.
export interface Rider {
  id: string;
  balance: number;
  // Le ? signifie que la date de naissance peut ne pas etre renseignee.
  birthDate?: Date;
}

export interface Driver {
  id: string;
  name: string;
}

export interface Ride {
  riderId: string;
  from: string;
  to: string;
  distanceKm: number;
  price: number;
  driverId: string | null;
  driverOnTheWay: boolean;
  cancelled: boolean;
}
