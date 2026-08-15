import { EMPTY_PIN_METADATA } from "@/lib/helper/pin";
import { sqlite } from "@/lib/sqlite/client";
import {
  actionGetLocalAiPlanningSession,
  actionMarkLocalAiPlanningSessionImported,
} from "@/lib/sqlite/model/ai-planning-session";
import {
  actionCreateLocalChecklistItem,
  actionSyncLocalChecklistItem,
  type LocalChecklistItem,
} from "@/lib/sqlite/model/checklist-item";
import {
  actionCreateLocalNote,
  actionSyncLocalNote,
  type LocalNote,
} from "@/lib/sqlite/model/note";
import { actionUpsertLocalPinLocation } from "@/lib/sqlite/model/pin-location";
import {
  actionCreateLocalPin,
  actionSyncLocalPin,
  type LocalPin,
} from "@/lib/sqlite/model/pin";
import {
  actionCreateLocalReferenceLink,
  actionSyncLocalReferenceLink,
  type LocalReferenceLink,
} from "@/lib/sqlite/model/reference-link";
import {
  actionCreateLocalTrip,
  actionGetLocalTrip,
  actionSyncLocalTrip,
  type LocalTrip,
} from "@/lib/sqlite/model/trip";
import { type AiPlannerDraftSelection } from "@/types/ai-trip-planner";
import dayjs from "dayjs";

import { getPlanningItemCategory } from "./plan-adapter";
import { type PlanningResult } from "./types";

export type ImportAiPlanningResultInput = {
  userId: string;
  sessionId: string;
  startDate: string;
  result: PlanningResult;
  selection: AiPlannerDraftSelection;
};

export type ImportedAiTrip = {
  trip: LocalTrip;
  pins: LocalPin[];
  notes: LocalNote[];
  checklistItems: LocalChecklistItem[];
  referenceLinks: LocalReferenceLink[];
  alreadyImported: boolean;
};

function normalizeRequiredValue(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} is required`);
  }

  return normalized;
}

function validateSelection(
  result: PlanningResult,
  selection: AiPlannerDraftSelection,
) {
  const availableItemIds = new Set(
    result.days.flatMap((day) => day.items.map((item) => item.draftId)),
  );
  const availableChecklistItems = new Set(
    result.checklistSuggestions.map((item) => item.title),
  );

  for (const itemId of selection.itineraryItemIds) {
    if (!availableItemIds.has(itemId)) {
      throw new Error(`Draft item ${itemId} is no longer available`);
    }
  }

  for (const title of selection.checklistItems) {
    if (!availableChecklistItems.has(title)) {
      throw new Error(`Checklist item ${title} is no longer available`);
    }
  }
}

function buildTripNote(result: PlanningResult) {
  const sections = [result.summary.trim()];

  if (result.warnings.length > 0) {
    sections.push(
      `Worth checking:\n${result.warnings
        .map((warning) => `• ${warning.trim()}`)
        .join("\n")}`,
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

function buildPinNote(
  item: PlanningResult["days"][number]["items"][number],
) {
  const sections = [item.description.trim()];
  const reason = item.reason.trim();

  if (reason) {
    sections.push(`Why it fits: ${reason}`);
  }

  if (item.estimatedDurationMinutes) {
    sections.push(`Suggested duration: ${item.estimatedDurationMinutes} minutes`);
  }

  return sections.filter(Boolean).join("\n\n");
}

function hasCoordinates(
  location: PlanningResult["days"][number]["items"][number]["location"],
) {
  return Boolean(
    location &&
      location.latitude !== null &&
      Number.isFinite(location.latitude) &&
      location.longitude !== null &&
      Number.isFinite(location.longitude),
  );
}

export async function actionImportAiPlanningResult(
  input: ImportAiPlanningResultInput,
): Promise<ImportedAiTrip> {
  const userId = normalizeRequiredValue(input.userId, "User ID");
  const sessionId = normalizeRequiredValue(
    input.sessionId,
    "Planning session ID",
  );
  const parsedStartDate = dayjs(input.startDate);

  if (!parsedStartDate.isValid()) {
    throw new Error("Trip start date is invalid");
  }

  validateSelection(input.result, input.selection);
  let importedAiTrip: ImportedAiTrip | null = null;

  await sqlite.withTransactionAsync(async () => {
    const planningSession = await actionGetLocalAiPlanningSession(
      sessionId,
      userId,
    );

    if (!planningSession) {
      throw new Error("Planning session not found");
    }

    if (planningSession.importedTripId) {
      const importedTrip = await actionGetLocalTrip(
        planningSession.importedTripId,
        userId,
      );

      if (!importedTrip) {
        throw new Error("The imported trip could not be found");
      }

      importedAiTrip = {
        trip: importedTrip,
        pins: [],
        notes: [],
        checklistItems: [],
        referenceLinks: [],
        alreadyImported: true,
      };
      return;
    }

    const selectedItemIds = new Set(input.selection.itineraryItemIds);
    const selectedChecklistItems = new Set(input.selection.checklistItems);
    const trip = await actionCreateLocalTrip({
      userId,
      title: input.result.title,
      startDate: parsedStartDate.format("YYYY-MM-DD"),
      endDate: parsedStartDate
        .add(input.result.durationDays - 1, "day")
        .format("YYYY-MM-DD"),
    });
    const pins: LocalPin[] = [];
    const notes: LocalNote[] = [];
    const checklistItems: LocalChecklistItem[] = [];
    const referenceLinks: LocalReferenceLink[] = [];
    const tripNote = buildTripNote(input.result);

    if (tripNote) {
      notes.push(
        await actionCreateLocalNote({
          tripId: trip.id,
          userId,
          text: tripNote,
        }),
      );
    }

    for (const day of input.result.days) {
      const pinDate = parsedStartDate
        .add(day.dayNumber - 1, "day")
        .format("YYYY-MM-DD");

      for (const item of day.items) {
        if (!selectedItemIds.has(item.draftId)) {
          continue;
        }

        const pin = await actionCreateLocalPin({
          tripId: trip.id,
          userId,
          name: item.title,
          startDate: pinDate,
          endDate: null,
          time: item.suggestedStartTime?.trim() || null,
          endTime: null,
          categoryId: getPlanningItemCategory(item.type, item.category),
          metadataJson: EMPTY_PIN_METADATA,
        });
        pins.push(pin);

        const pinNote = buildPinNote(item);

        if (pinNote) {
          notes.push(
            await actionCreateLocalNote({
              tripId: trip.id,
              pinId: pin.id,
              userId,
              text: pinNote,
            }),
          );
        }

        if (hasCoordinates(item.location)) {
          const location = item.location!;

          await actionUpsertLocalPinLocation({
            pinId: pin.id,
            userId,
            placeId:
              location.externalPlaceId?.trim() ||
              `ai:${sessionId}:${item.draftId}`,
            displayName: location.name,
            formattedAddress: location.searchQuery,
            latitude: location.latitude!,
            longitude: location.longitude!,
          });
        }

        for (const source of item.sources) {
          referenceLinks.push(
            await actionCreateLocalReferenceLink({
              tripId: trip.id,
              pinId: pin.id,
              userId,
              url: source.url,
              caption: source.title,
            }),
          );
        }
      }
    }

    for (const suggestion of input.result.checklistSuggestions) {
      if (!selectedChecklistItems.has(suggestion.title)) {
        continue;
      }

      checklistItems.push(
        await actionCreateLocalChecklistItem({
          tripId: trip.id,
          userId,
          title: suggestion.title,
        }),
      );
    }

    for (const link of input.result.referenceLinks) {
      referenceLinks.push(
        await actionCreateLocalReferenceLink({
          tripId: trip.id,
          userId,
          url: link.url,
          caption: link.title,
        }),
      );
    }

    await actionMarkLocalAiPlanningSessionImported(sessionId, userId, trip.id);

    importedAiTrip = {
      trip,
      pins,
      notes,
      checklistItems,
      referenceLinks,
      alreadyImported: false,
    };
  });

  if (!importedAiTrip) {
    throw new Error("Trip import did not complete");
  }

  return importedAiTrip;
}

export async function actionSyncImportedAiTrip(imported: ImportedAiTrip) {
  await actionSyncLocalTrip(imported.trip);
  await Promise.all([
    ...imported.pins.map(actionSyncLocalPin),
    ...imported.checklistItems.map(actionSyncLocalChecklistItem),
  ]);
  await Promise.all([
    ...imported.notes.map(actionSyncLocalNote),
    ...imported.referenceLinks.map(actionSyncLocalReferenceLink),
  ]);
}
