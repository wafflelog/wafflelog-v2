import { IconPinCategory } from "@/components/icon/pin-category";
import { TitleRegular } from "@/components/title/regular";
import { Dialog } from "@/components/ui/dialog";
import { UIInputDate } from "@/components/ui/input/date";
import { UIInputText } from "@/components/ui/input/text";
import { UIInputTime } from "@/components/ui/input/time";
import { CATEGORIES } from "@/constants/pin-categories";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { buildTransportMetadata, EMPTY_PIN_METADATA } from "@/lib/pin";
import {
  actionCreateLocalPin,
  actionSyncLocalPin,
  actionUpdateLocalPin,
} from "@/lib/sqlite/model/pin";
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { newPinFormSchema } from "./schema";

type DialogNewPinStep = "category" | "details";

type DialogNewPinProps = {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  visible: boolean;
  onDismiss: () => void;
  mode?: "create" | "edit";
  initialPin?: {
    id: string;
    name: string;
    startDate: string;
    startTime: string | null;
    endDate: string;
    endTime: string | null;
    allDay: boolean;
    categoryId: string;
    metadataJson: {
      version: 1;
      departure?: string;
      destination?: string;
      carrier?: string;
      reference?: string;
    };
  };
};

export const DialogNewPin = ({
  tripId,
  tripStartDate,
  tripEndDate,
  visible,
  onDismiss,
  mode = "create",
  initialPin,
}: DialogNewPinProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [pinName, setPinName] = useState("");
  const [pinCategoryId, setPinCategoryId] = useState("");
  const [pinStartDate, setPinStartDate] = useState("");
  const [pinStartTime, setPinStartTime] = useState("");
  const [pinEndDate, setPinEndDate] = useState("");
  const [pinEndTime, setPinEndTime] = useState("");
  const [pinAllDay, setPinAllDay] = useState(false);
  const [transportDeparture, setTransportDeparture] = useState("");
  const [transportDestination, setTransportDestination] = useState("");
  const [transportCarrier, setTransportCarrier] = useState("");
  const [transportReference, setTransportReference] = useState("");
  const [step, setStep] = useState<DialogNewPinStep>("category");
  const isEditMode = mode === "edit";
  const isTransport = pinCategoryId === "transport";

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEditMode && initialPin) {
      setPinName(initialPin.name);
      setPinCategoryId(initialPin.categoryId);
      setPinStartDate(initialPin.startDate);
      setPinStartTime(initialPin.startTime ?? "");
      setPinEndDate(initialPin.endDate);
      setPinEndTime(initialPin.endTime ?? "");
      setPinAllDay(initialPin.allDay);
      setTransportDeparture(initialPin.metadataJson.departure ?? "");
      setTransportDestination(initialPin.metadataJson.destination ?? "");
      setTransportCarrier(initialPin.metadataJson.carrier ?? "");
      setTransportReference(initialPin.metadataJson.reference ?? "");
      setStep("details");
      return;
    }

    setPinName("");
    setPinCategoryId("");
    setPinStartDate("");
    setPinStartTime("");
    setPinEndDate("");
    setPinEndTime("");
    setPinAllDay(false);
    setTransportDeparture("");
    setTransportDestination("");
    setTransportCarrier("");
    setTransportReference("");
    setStep("category");
  }, [visible, isEditMode, initialPin]);

  const createPinMutation = useMutation({
    mutationFn: actionCreateLocalPin,
    onSuccess: async (localPin) => {
      if (session?.user.id) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId],
          }),
        ]);
      }
      setPinName("");
      setPinCategoryId("");
      setPinStartDate("");
      setPinStartTime("");
      setPinEndDate("");
      setPinEndTime("");
      setPinAllDay(false);
      setTransportDeparture("");
      setTransportDestination("");
      setTransportCarrier("");
      setTransportReference("");
      setStep("category");
      onDismiss();
      showMessage("Pin saved locally", "info");

      try {
        await actionSyncLocalPin(localPin);

        if (session?.user.id) {
          await queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId],
          });
        }
      } catch (error) {
        console.error("Error syncing new pin:", error);
      }
    },
    onError: (error) => {
      console.error("Error creating pin:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create pin";
      showMessage(message, "error");
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: actionUpdateLocalPin,
    onSuccess: async (localPin) => {
      if (session?.user.id && initialPin) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["local-pin", localPin.id, session.user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pins", tripId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["local-pin-locations"],
          }),
        ]);
      }

      onDismiss();
      showMessage("Pin updated locally", "info");

      try {
        await actionSyncLocalPin(localPin);

        if (session?.user.id) {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["local-pin", localPin.id, session.user.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["local-pins", tripId],
            }),
          ]);
        }
      } catch (error) {
        console.error("Error syncing updated pin:", error);
      }
    },
    onError: (error) => {
      console.error("Error updating pin:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update pin";
      showMessage(message, "error");
    },
  });

  const handleDismiss = () => {
    onDismiss();
  };

  const handleConfirm = () => {
    if (!session?.user.id) {
      showMessage("You must be signed in to create a pin", "error");
      return;
    }

    if (step === "category") {
      if (!pinCategoryId) {
        showMessage("Select a pin category", "error");
        return;
      }

      setStep("details");
      return;
    }

    const result = newPinFormSchema.safeParse({
      pinName,
      pinCategoryId,
      pinStartDate,
      pinStartTime,
      pinEndDate,
      pinEndTime,
      pinAllDay,
      transportDeparture,
      transportDestination,
      transportCarrier,
      transportReference,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your pin details and try again.";
      showMessage(message, "error");
      return;
    }

    const pinStartDateValue = dayjs(result.data.pinStartDate);
    const pinEndDateValue = dayjs(result.data.pinEndDate);
    const tripStartDateValue = dayjs(tripStartDate);
    const tripEndDateValue = dayjs(tripEndDate);

    if (
      pinStartDateValue.isBefore(tripStartDateValue, "day") ||
      pinEndDateValue.isAfter(tripEndDateValue, "day")
    ) {
      showMessage(
        `Choose dates between ${formatDate(tripStartDate)} and ${formatDate(tripEndDate)}`,
        "error",
      );
      return;
    }

    const metadataJson =
      result.data.pinCategoryId === "transport"
        ? buildTransportMetadata({
            departure: result.data.transportDeparture,
            destination: result.data.transportDestination,
            carrier: result.data.transportCarrier,
            reference: result.data.transportReference,
          })
        : EMPTY_PIN_METADATA;

    if (isEditMode) {
      if (!initialPin) {
        showMessage("Pin not found", "error");
        return;
      }

      updatePinMutation.mutate({
        id: initialPin.id,
        userId: session.user.id,
        name: result.data.pinName,
        startDate: result.data.pinStartDate,
        startTime: result.data.pinAllDay ? null : result.data.pinStartTime || null,
        endDate: result.data.pinEndDate,
        endTime: result.data.pinAllDay ? null : result.data.pinEndTime || null,
        allDay: result.data.pinAllDay,
        categoryId: result.data.pinCategoryId,
        metadataJson,
      });
      return;
    }

    createPinMutation.mutate({
      tripId,
      userId: session.user.id,
      name: result.data.pinName,
      startDate: result.data.pinStartDate,
      startTime: result.data.pinAllDay ? null : result.data.pinStartTime || null,
      endDate: result.data.pinEndDate,
      endTime: result.data.pinAllDay ? null : result.data.pinEndTime || null,
      allDay: result.data.pinAllDay,
      categoryId: result.data.pinCategoryId,
      metadataJson,
    });
  };

  return (
    <>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        title={isEditMode ? "Edit Pin" : "New Pin"}
        size="md"
        confirmText={step === "category" ? "Next" : isEditMode ? "Save" : "Create"}
        onConfirm={handleConfirm}
      >
        <View style={styles.content}>
          {step === "category" ? (
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const isSelected = pinCategoryId === category.id;

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardActive,
                    ]}
                    onPress={() => {
                      setPinCategoryId(category.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <IconPinCategory
                      category={category}
                      color={
                        isSelected
                          ? getColor(colors.blue)
                          : getColor(colors.textDarkGrey)
                      }
                      size={22}
                    />
                    <TitleRegular
                      size="sm"
                      weight={isSelected ? "600" : "500"}
                      color={isSelected ? colors.blue : colors.textDarkGrey}
                    >
                      {category.name}
                    </TitleRegular>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <>
              {!isEditMode && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep("category")}
                >
                  <TitleRegular size="sm" weight="600" color={colors.blue}>
                    Change category
                  </TitleRegular>
                </TouchableOpacity>
              )}
              <UIInputText
                placeholder="Enter pin name"
                value={pinName}
                onChange={setPinName}
                autoFocus
              />
              <UIInputDate
                placeholder="Start date"
                value={pinStartDate}
                onChange={(date) => {
                  setPinStartDate(date);
                  if (
                    !pinEndDate ||
                    dayjs(pinEndDate).isBefore(dayjs(date), "day")
                  ) {
                    setPinEndDate(date);
                  }
                }}
                minimumDate={dayjs(tripStartDate).toDate()}
                maximumDate={dayjs(tripEndDate).toDate()}
              />
              <UIInputDate
                placeholder="End date"
                value={pinEndDate}
                onChange={setPinEndDate}
                minimumDate={dayjs(pinStartDate || tripStartDate).toDate()}
                maximumDate={dayjs(tripEndDate).toDate()}
              />
              <TouchableOpacity
                style={[styles.toggle, pinAllDay && styles.toggleActive]}
                onPress={() => setPinAllDay((value) => !value)}
              >
                <TitleRegular
                  size="md"
                  weight="600"
                  color={pinAllDay ? colors.blue : colors.textDarkGrey}
                >
                  All day
                </TitleRegular>
              </TouchableOpacity>
              {!pinAllDay && (
                <>
                  <UIInputTime
                    placeholder="Start time (optional)"
                    value={pinStartTime}
                    onChange={setPinStartTime}
                  />
                  <UIInputTime
                    placeholder="End time (optional)"
                    value={pinEndTime}
                    onChange={setPinEndTime}
                  />
                </>
              )}
              {isTransport && (
                <View style={styles.transportFields}>
                  <UIInputText
                    placeholder="Departure"
                    value={transportDeparture}
                    onChange={setTransportDeparture}
                    autoCapitalize="words"
                  />
                  <UIInputText
                    placeholder="Destination"
                    value={transportDestination}
                    onChange={setTransportDestination}
                    autoCapitalize="words"
                  />
                  <UIInputText
                    placeholder="Carrier"
                    value={transportCarrier}
                    onChange={setTransportCarrier}
                    autoCapitalize="words"
                  />
                  <UIInputText
                    placeholder="Reference"
                    value={transportReference}
                    onChange={setTransportReference}
                    autoCapitalize="characters"
                  />
                </View>
              )}
            </>
          )}
        </View>
        <SystemMessageModal />
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: gaps.sm,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: gaps.sm,
  },
  categoryCard: {
    width: "47%",
    minHeight: 76,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
  },
  categoryCardActive: {
    borderColor: getColor(colors.blue),
    backgroundColor: getColor(colors.blue, 0.1),
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: gaps.xs,
  },
  toggle: {
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.sm,
    padding: gaps.sm,
  },
  toggleActive: {
    backgroundColor: getColor(colors.blue, 0.1),
    borderColor: getColor(colors.blue),
  },
  transportFields: {
    gap: gaps.sm,
  },
});
