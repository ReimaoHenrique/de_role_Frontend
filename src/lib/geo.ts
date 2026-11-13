export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/** Coordenadas padrão (São Paulo - região central / Paulista) */
export const DEFAULT_USER_COORDS: GeoCoordinates = {
  lat: -23.55052,
  lng: -46.633308,
};

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos
 * utilizando a fórmula de Haversine.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formata a distância para exibição amigável:
 * - Menos de 1 km: "500 m de você"
 * - 1 km ou mais: "1,2 km de você", "3,5 km de você"
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) {
    return "";
  }

  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `${meters} m de você`;
  }

  const formatted = distanceKm.toFixed(1).replace(".", ",");
  return `${formatted} km de você`;
}
