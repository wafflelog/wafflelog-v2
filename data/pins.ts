import { Pin, PinCategory } from "@/types/pin";
import { USERS } from "./users";

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
    location: {
      id: "location-1",
      name: "Sagrada Família",
      address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
      latitude: 41.3850639,
      longitude: 2.1734035,
    },
    time: new Date("2024-03-11 09:00:00").toISOString(),
    referenceLinks: [
      {
        id: "reference-link-1",
        title: "Official Website",
        url: "https://sagradafamilia.org",
        caption: "Book tickets and learn about visiting hours",
      },
      {
        id: "reference-link-2",
        title: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Sagrada_Família",
        caption: "Detailed history and architectural information",
      },
    ],
    documents: [
      {
        id: "document-1",
        fileName: "Tickets.pdf",
        mimeType: "application/pdf",
        url: "https://sagradafamilia.org/tickets",
        caption: "Book tickets and learn about visiting hours",
      },
      {
        id: "document-2",
        fileName: "Map.pdf",
        mimeType: "application/pdf",
        url: "https://sagradafamilia.org/map",
        caption: "Map of the Sagrada Família",
      },
    ],
    expenses: [
      {
        id: "expense-1",
        description: "Entrance Ticket",
        amount: 26,
        currency: "EUR",
        paidBy: USERS[0],
      },
      {
        id: "expense-2",
        description: "Audio Guide",
        amount: 7,
        currency: "EUR",
        paidBy: USERS[1],
      },
    ],
    images: [
      {
        id: "image-1",
        url: "https://picsum.photos/seed/695/3000/2000",
        width: 200,
        height: 200,
        caption: "Sagrada Família",
      },
      {
        id: "image-2",
        url: "https://picsum.photos/seed/697/3000/2000",
        width: 200,
        height: 200,
        caption: "Sagrada Família",
      },
      {
        id: "image-3",
        url: "https://picsum.photos/seed/699/3000/2000",
        width: 200,
        height: 200,
        caption: "Sagrada Família",
      },
    ],
  },
  {
    id: "pin-2",
    name: "Good Eats",
    category: CATEGORIES[1],
    location: {
      id: "location-2",
      name: "Good Eats",
      address: "08024 Barcelona",
      latitude: 41.3850639,
      longitude: 2.1734035,
    },
    time: new Date("2024-03-11 09:00:00").toISOString(),
    referenceLinks: [],
    documents: [],
    expenses: [],
    images: [],
  },
  {
    id: "pin-3",
    name: "Hotel & Spa",
    category: CATEGORIES[2],
    location: {
      id: "location-3",
      name: "Hotel & Spa",
      address: "La Rambla, 91",
      latitude: 41.3850639,
      longitude: 2.1734035,
    },
    time: new Date("2024-03-12 09:00:00").toISOString(),
    referenceLinks: [],
    documents: [],
    expenses: [],
    images: [],
  },
  {
    id: "pin-4",
    name: "K11 Shopping Mall",
    category: CATEGORIES[3],
    location: {
      id: "location-4",
      name: "K11 Shopping Mall",
      address: "La Rambla, 91",
      latitude: 41.3850639,
      longitude: 2.1734035,
    },
    time: new Date("2024-03-12 09:00:00").toISOString(),
    referenceLinks: [],
    documents: [],
    expenses: [],
    images: [],
  },
  {
    id: "pin-5",
    name: "The Peak",
    category: CATEGORIES[4],
    location: {
      id: "location-5",
      name: "The Peak",
      address: "La Rambla, 91",
      latitude: 41.3850639,
      longitude: 2.1734035,
    },
    time: new Date("2024-03-13 09:00:00").toISOString(),
    referenceLinks: [],
    documents: [],
    expenses: [],
    images: [],
  },
] as const satisfies Pin[];
