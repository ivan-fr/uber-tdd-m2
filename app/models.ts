export interface Rider {
  id: string;
  balance: number;
  birthDate?: Date;
  blacklistedDrivers?: string[];
}

export interface Driver {
  id: string;
  name: string;
}

export interface Ride {
  id: string;
  riderId: string;
  from: string;
  to: string;
  distanceKm: number;
  price: number;
  driverId: string | null;
  driverOnTheWay: boolean;
  cancelled: boolean;
}
