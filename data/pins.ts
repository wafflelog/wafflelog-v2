import { Pin, PinCategory } from "@/types/pin";

const CATEGORIES: PinCategory[] = [
  {
    id: "category-1",
    name: "attraction",
    color: "turquoise",
  },
  {
    id: "category-2",
    name: "restaurant",
    color: "orange",
  },
  {
    id: "category-3",
    name: "hotel",
    color: "purple",
  },
  {
    id: "category-4",
    name: "shopping",
    color: "red",
  },
  {
    id: "category-5",
    name: "nature",
    color: "pineGreen",
  },
];

export const PINS = [
  {
    id: "pin-1",
    name: "Sagrada Família",
    category: CATEGORIES[0],
    address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
    time: new Date("2024-03-11 09:00:00").toISOString(),
  },
  {
    id: "pin-2",
    name: "Good Eats",
    category: CATEGORIES[1],
    address: "08024 Barcelona",
    time: new Date("2024-03-11 09:00:00").toISOString(),
  },
  {
    id: "pin-3",
    name: "Hotel & Spa",
    category: CATEGORIES[2],
    address: "La Rambla, 91",
    time: new Date("2024-03-12 09:00:00").toISOString(),
  },
  {
    id: "pin-4",
    name: "K11 Shopping Mall",
    category: CATEGORIES[3],
    address: "La Rambla, 91",
    time: new Date("2024-03-12 09:00:00").toISOString(),
  },
  {
    id: "pin-5",
    name: "The Peak",
    category: CATEGORIES[4],
    address: "La Rambla, 91",
    time: new Date("2024-03-13 09:00:00").toISOString(),
  },
] as const satisfies Pin[];
