// src/Types/Profile.ts
export interface PublicProfile {
  alias?: string;
  bio?: string;
  avatar_url?: string;
  nivel?: number;
  puntos?: number;
  racha_dias?: number;
}

export interface Profile {
  user?: any;
  public_profile?: PublicProfile;
  wallet?: any;
  logros?: any[];
}
