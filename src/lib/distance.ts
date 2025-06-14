export interface Coordinates {
  lat: number;
  lon: number;
}

const WGS84_A = 6378137;
const WGS84_B = 6356752.314245;
const WGS84_F = 1 / 298.257223563;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const L = toRad(b.lon - a.lon);
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(toRad(a.lat)));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(toRad(b.lat)));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP = 0;
  let iter = 0;
  let cosSqAlpha = 0;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let cos2SigmaM = 0;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );
    if (sinSigma === 0) return 0; // coincident
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha ** 2;
    cos2SigmaM =
      cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0;
    const C =
      (WGS84_F / 16) * cosSqAlpha * (4 + WGS84_F * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        WGS84_F *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && ++iter < 1000);

  const uSq = (cosSqAlpha * (WGS84_A ** 2 - WGS84_B ** 2)) / WGS84_B ** 2;
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma ** 2) *
            (-3 + 4 * cos2SigmaM ** 2)));
  return WGS84_B * A * (sigma - deltaSigma);
}
