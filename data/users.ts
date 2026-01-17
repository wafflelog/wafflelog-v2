import { User } from "@/types/user";

export const USERS = [
  {
    id: "user-1",
    fullname: "John Doe",
  },
  {
    id: "user-2",
    fullname: "Mike Johnson",
  },
  {
    id: "user-3",
    fullname: "Jessica Chen",
  },
  {
    id: "user-4",
    fullname: "David Kim",
  },
  {
    id: "user-5",
    fullname: "Sarah Williams",
  },
] as const satisfies User[];
