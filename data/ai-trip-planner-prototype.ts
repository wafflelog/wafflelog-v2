import {
  type AiPlannerConversationMessage,
  type AiPlannerPlanViewModel,
} from "@/types/ai-trip-planner";

export const AI_PLANNER_PROMPT_SUGGESTIONS = [
  "A relaxed food weekend",
  "Nature without a car",
  "Family-friendly city break",
];

export const AI_PLANNER_INITIAL_MESSAGES: AiPlannerConversationMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    body: "Tell me what you have in mind. A destination is helpful, but you can also start with a mood, budget, pace, or the sort of memories you want to make.",
    time: "10:31",
  },
  {
    id: "request",
    role: "user",
    body: "Plan a relaxed four-day food and culture trip to Osaka for two adults. We love independent restaurants and local neighbourhoods, but want limited nightlife and no more than three activities per day.",
    time: "10:32",
  },
  {
    id: "draft-ready",
    role: "assistant",
    body: "I’ve put together a neighbourhood-led first draft with plenty of breathing room. It begins around old Osaka, keeps one day for nature, and leaves the final afternoon flexible.",
    time: "10:34",
    draftRevision: 2,
  },
];

export const AI_PLANNER_PROTOTYPE_PLAN: AiPlannerPlanViewModel = {
  revision: 2,
  title: "Osaka, one neighbourhood at a time",
  destination: "Osaka, Japan",
  dateRange: "12–15 Oct · 4 days",
  summary:
    "A relaxed route through market streets, small restaurants, historic districts and green Osaka—with no more than three planned stops each day.",
  assumptions: [
    "You are staying near Namba or another central transport hub.",
    "You are comfortable using trains and walking for up to 25 minutes at a time.",
  ],
  warnings: [
    "Restaurant opening days and reservations should be checked closer to travel.",
  ],
  checklist: [
    "Reserve the day-two dinner once dates are confirmed",
    "Add an ICOCA card to both phones",
    "Pack comfortable shoes for the Minoh walk",
  ],
  days: [
    {
      id: "day-1",
      label: "Day 1 · Mon 12 Oct",
      title: "Markets and old Osaka",
      summary: "Ease in with local food and a lantern-lit evening walk.",
      items: [
        {
          id: "kuromon-market",
          time: "10:30",
          title: "Kuromon Ichiba Market",
          description:
            "Graze through the covered market and keep lunch informal so you can follow whatever looks good.",
          category: "food",
          reason:
            "A flexible first stop that matches your interest in local food without committing to a packed schedule.",
          sources: [
            {
              title: "Kuromon Market official guide",
              url: "https://kuromon.com/en/",
            },
          ],
        },
        {
          id: "hozenji",
          time: "15:30",
          title: "Hozenji Yokocho",
          description:
            "Explore the narrow stone lanes around Hozenji before the evening crowds arrive.",
          category: "attraction",
          reason:
            "It adds a smaller historic district close to Namba and requires very little travel on arrival day.",
          sources: [
            {
              title: "Osaka Convention & Tourism Bureau",
              url: "https://osaka-info.jp/en/spot/hozenji-yokocho/",
            },
          ],
        },
      ],
    },
    {
      id: "day-2",
      label: "Day 2 · Tue 13 Oct",
      title: "Everyday Osaka",
      summary: "Architecture, independent shops and a memorable dinner.",
      items: [
        {
          id: "nakazakicho",
          time: "10:00",
          title: "Nakazakicho neighbourhood walk",
          description:
            "Wander through converted wooden houses, small galleries and independent coffee shops.",
          category: "other",
          reason:
            "The area offers the local, independent atmosphere you asked for and works well without a rigid route.",
          sources: [
            {
              title: "Osaka neighbourhood guide",
              url: "https://osaka-info.jp/en/",
            },
          ],
        },
        {
          id: "museum-housing",
          time: "13:30",
          title: "Museum of Housing and Living",
          description:
            "See a full-scale recreation of Edo-period Osaka and learn how the city’s streets evolved.",
          category: "attraction",
          reason:
            "It gives useful cultural context while staying close to Nakazakicho.",
          sources: [
            {
              title: "Museum of Housing and Living",
              url: "https://www.osaka-angenet.jp/konjyakukan/",
            },
          ],
        },
        {
          id: "tenma-dinner",
          time: "18:30",
          title: "Small-plate dinner around Tenma",
          description:
            "Choose a compact counter restaurant north of Tenma market; reserve only if a particular place stands out.",
          category: "food",
          reason:
            "Tenma has the lively food culture you want without turning the evening into a nightlife itinerary.",
          sources: [],
        },
      ],
    },
    {
      id: "day-3",
      label: "Day 3 · Wed 14 Oct",
      title: "Green escape to Minoh",
      summary: "A gentle nature day with a flexible return to the city.",
      items: [
        {
          id: "minoh-train",
          time: "09:30",
          title: "Train to Minoh Park",
          description:
            "Travel north by train and pick up snacks near Minoh Station before starting the walk.",
          category: "transport",
          reason:
            "The route is practical without a car and leaves enough time for a relaxed morning.",
          sources: [
            {
              title: "Hankyu Railway travel guide",
              url: "https://www.hankyu.co.jp/global/en/",
            },
          ],
        },
        {
          id: "minoh-falls",
          time: "11:00",
          title: "Minoh Falls walk",
          description:
            "Follow the riverside path to the waterfall, stopping for maple-leaf snacks along the way.",
          category: "nature",
          reason:
            "It adds a calm contrast to the city days and the main route is easy to follow independently.",
          sources: [
            {
              title: "Minoh tourism information",
              url: "https://minohkankou.net/",
            },
          ],
        },
      ],
    },
    {
      id: "day-4",
      label: "Day 4 · Thu 15 Oct",
      title: "Art, design and an open afternoon",
      summary: "One cultural anchor, then time to revisit a favourite area.",
      items: [
        {
          id: "nakanoshima-art",
          time: "10:30",
          title: "Nakanoshima Museum of Art",
          description:
            "Choose the exhibition that appeals most, then walk along the river and stop for lunch nearby.",
          category: "attraction",
          reason:
            "A single cultural anchor leaves the final afternoon open rather than over-planning your departure day.",
          sources: [
            {
              title: "Nakanoshima Museum of Art",
              url: "https://nakka-art.jp/en/",
            },
          ],
        },
      ],
    },
  ],
};
