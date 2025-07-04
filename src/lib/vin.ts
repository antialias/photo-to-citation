export function getModelYearFromVin(
  vin: string | null | undefined,
): string | null {
  if (!vin || vin.length < 10) return null;
  const code = vin[9].toUpperCase();
  const codes = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "R",
    "S",
    "T",
    "V",
    "W",
    "X",
    "Y",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];
  const index = codes.indexOf(code);
  if (index === -1) return null;
  let year = 1980 + index;
  const current = new Date().getFullYear() + 1;
  if (year + 30 <= current) year += 30;
  return String(year);
}
