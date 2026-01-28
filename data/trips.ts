import { type Companion, type Trip } from "@/types/trip";
import { PINS } from "./pins";
import { USERS } from "./users";

const COMPANIONS: Companion[] = [
  {
    id: "companion-1",
    fullname: "John Doe",
    state: "INVITED",
  },
  {
    id: "companion-2",
    fullname: "Mike Johnson",
    state: "REJECTED",
  },
  {
    id: "companion-3",
    fullname: "Jessica Chen",
    state: "ACCEPTED",
  },
];
export const TRIPS = [
  // Ongoing Trip (started Jan 25, ends Feb 2, 2026)
  {
    id: "1",
    title: "Barcelona Getaway",
    startDate: new Date("2026-03-11").toISOString(),
    endDate: new Date("2026-03-18").toISOString(),
    location: "Barcelona, Spain",
    companions: COMPANIONS,
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
        fileName: "Park Tickets.pdf",
        mimeType: "application/pdf",
        url: "https://shscucanawhrjahqokvn.supabase.co/storage/v1/object/sign/documents/sample.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lOTkxY2YyNC1mZTQ0LTQwZWMtYTVlOS02NGQ3ZTBjOWE5NmUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvc2FtcGxlLnBkZiIsImlhdCI6MTc2OTYzNjAyNSwiZXhwIjoxNzcyMjI4MDI1fQ.N2gWPG7FepWu9mnxkPs4cbyQS0B0Puy8cnyGxx-K-h4",
        caption: "Book tickets and learn about visiting hours",
      },
      {
        id: "document-2",
        fileName: "Sample docs",
        mimeType: "application/doc",
        url: "https://shscucanawhrjahqokvn.supabase.co/storage/v1/object/sign/documents/file-sample_100kB.doc?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lOTkxY2YyNC1mZTQ0LTQwZWMtYTVlOS02NGQ3ZTBjOWE5NmUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvZmlsZS1zYW1wbGVfMTAwa0IuZG9jIiwiaWF0IjoxNzY5NjM3MjA5LCJleHAiOjE4MDExNzMyMDl9.T5UufhWe11c-hPOxU1qkwsfplG4Dqq3Gr9NnqSYi0ms",
        caption: "A super long caption that should wrap to the next line",
      },
      {
        id: "document-3",
        fileName: "Sample spreadsheet",
        mimeType: "application/xlsx",
        url: "https://shscucanawhrjahqokvn.supabase.co/storage/v1/object/sign/documents/file_example_XLS_10.xls?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lOTkxY2YyNC1mZTQ0LTQwZWMtYTVlOS02NGQ3ZTBjOWE5NmUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvZmlsZV9leGFtcGxlX1hMU18xMC54bHMiLCJpYXQiOjE3Njk2MzcyNTQsImV4cCI6MTgwMTE3MzI1NH0.jEEmjZyiRXaudUsnDGP1xWNie4QlJdDaugyiUCVGwy8",
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
  // Upcoming Trip 1 (starts Feb 15, 2026)
  {
    id: "2",
    title: "London Adventure",
    startDate: new Date("2026-02-15").toISOString(),
    endDate: new Date("2026-02-22").toISOString(),
    location: "London, UK",
    companions: COMPANIONS,
    pins: PINS,
    checklistItems: [
      {
        id: "checklist-item-3",
        title: "Book theater tickets",
        completed: false,
        createdBy: USERS[0],
      },
    ],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
  // Upcoming Trip 2 (starts March 10, 2026)
  {
    id: "3",
    title: "東京之旅",
    startDate: new Date("2026-03-10").toISOString(),
    endDate: new Date("2026-03-20").toISOString(),
    location: "Tokyo, Japan",
    companions: COMPANIONS,
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
  // Upcoming Trip 3 (starts Feb 28, 2026)
  {
    id: "4",
    title: "Paris City Break",
    startDate: new Date("2026-02-28").toISOString(),
    endDate: new Date("2026-03-05").toISOString(),
    location: "Paris, France",
    companions: COMPANIONS,
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
  // Past Trip 1 (ended Dec 20, 2025)
  {
    id: "5",
    title: "New York Winter",
    startDate: new Date("2025-12-10").toISOString(),
    endDate: new Date("2025-12-20").toISOString(),
    location: "New York, USA",
    companions: COMPANIONS,
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
  // Past Trip 2 (ended Jan 15, 2026)
  {
    id: "6",
    title: "Rome Discovery",
    startDate: new Date("2026-01-05").toISOString(),
    endDate: new Date("2026-01-15").toISOString(),
    location: "Rome, Italy",
    companions: COMPANIONS,
    pins: PINS,
    checklistItems: [],
    referenceLinks: [],
    documents: [],
    images: [],
    expenses: [],
  },
] as const satisfies Trip[];
