export type BusinessLine = {
  id: string;
  name: string;
};

export const businessLines: BusinessLine[] = [
  { id: "BL-AUTOMOTIVE", name: "Automotive" },
  { id: "BL-INDUSTRIAL", name: "Industrial" },
  { id: "BL-AFTERMARKET", name: "Aftermarket" },
  { id: "BL-CORPORATE", name: "Corporate" },
];

export function businessLineName(id?: string) {
  return businessLines.find((line) => line.id === id)?.name ?? "Not assigned";
}
