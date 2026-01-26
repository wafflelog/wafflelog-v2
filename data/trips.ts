import { type Trip } from "@/types/trip";
import { PINS } from "./pins";
import { USERS } from "./users";

export const TRIPS = [
  {
    id: "1",
    title: "Barcelona Getaway",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-17").toISOString(),
    location: "Barcelona, Spain",
    companions: [USERS[0], USERS[1], USERS[2], USERS[3], USERS[4]],
    pins: PINS,
    checklistItems: [
      {
        id: "checklist-item-1",
        title: "Book hotel rooms",
        completed: false,
        createdBy: USERS[0],
      },
      {
        id: "checklist-item-2",
        title: "Buy flight tickets",
        completed: true,
        createdBy: USERS[1],
      },
    ],
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
        caption: "A super long caption that should wrap to the next line",
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
        caption: "A super long caption that should wrap to the next line",
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
        currency: "USD",
        paidBy: USERS[1],
      },
    ],
  },
  {
    id: "2",
    title: "London Adventure",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-18").toISOString(),
    location: "London, UK",
    companions: [USERS[2], USERS[3], USERS[4]],
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
  {
    id: "3",
    title: "東京之旅",
    startDate: new Date("2024-03-11").toISOString(),
    endDate: new Date("2024-03-17").toISOString(),
    location: "Tokyo, Japan",
    companions: [USERS[0], USERS[1]],
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
] as const satisfies Trip[];
