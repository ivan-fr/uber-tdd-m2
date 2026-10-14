export interface Rider {
  id: string;
  balance: number;
  birthDate?: Date;
  blacklistedDrivers?: string[];
  loyaltyPoints?: number;
}

export interface Driver {
  id: string;
  name: string;
}

export interface RideEstimate {
  token: string;
  riderId: string;
  from: string;
  to: string;
  distanceKm: number;
  price: number;
  isUberX: boolean;
  createdAt: Date;
  expiresAt: Date;
  used?: boolean;
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
