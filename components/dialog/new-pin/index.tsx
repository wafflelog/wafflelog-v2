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
import {
  buildTransportMetadata,
  EMPTY_PIN_METADATA,
  isRangePinCategory,
} from "@/lib/helper/pin";
import { formatDate } from "@/lib/helper/utils";
import {
  actionCreateLocalPin,
  actionSyncLocalPin,
  actionUpdateLocalPin,
} from "@/lib/sqlite/model/pin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { newPinFormSchema } from "./schema";

type DialogNewPinStep = "category" | "details";

type DialogNewPinProps = {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  initialStartDate?: string | null;
  visible: boolean;
  onDismiss: () => void;
  mode?: "create" | "edit";
  initialPin?: {
    id: string;
    name: string | null;
    startDate: string;
    endDate: string | null;
    time: string | null;
    endTime: string | null;
    categoryId: string;
    metadataJson: {
      version: 1;
      departure?: string;
      destination?: string;
    };
  };
};

export const DialogNewPin = ({
  visible,
  ...props
}: DialogNewPinProps) => {
  const formKey = props.initialPin
    ? [
        "edit",
        props.initialPin.id,
        props.initialPin.name,
        props.initialPin.startDate,
        props.initialPin.endDate,
        props.initialPin.time,
        props.initialPin.endTime,
        props.initialPin.categoryId,
        props.initialPin.metadataJson.departure,
        props.initialPin.metadataJson.destination,
      ].join(":")
    : `create:${props.initialStartDate ?? ""}`;

  return <DialogNewPinVisible key={formKey} {...props} visible={visible} />;
};

const DialogNewPinVisible = ({
  tripId,
  tripStartDate,
  tripEndDate,
  initialStartDate,
  visible,
  onDismiss,
  mode = "create",
  initialPin,
}: DialogNewPinProps) => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const isEditMode = mode === "edit";
  const [pinName, setPinName] = useState(
    isEditMode && initialPin ? (initialPin.name ?? "") : "",
  );
  const [pinCategoryId, setPinCategoryId] = useState(
    isEditMode && initialPin ? initialPin.categoryId : "",
  );
  const [pinStartDate, setPinStartDate] = useState(
    isEditMode && initialPin
      ? initialPin.startDate
      : (initialStartDate ?? ""),
  );
  const [pinEndDate, setPinEndDate] = useState(
    isEditMode && initialPin
      ? (initialPin.endDate ?? "")
      : (initialStartDate ?? ""),
  );
  const [pinTime, setPinTime] = useState(
    isEditMode && initialPin ? (initialPin.time ?? "") : "",
  );
  const [pinEndTime, setPinEndTime] = useState(
    isEditMode && initialPin ? (initialPin.endTime ?? "") : "",
  );
  const [transportDeparture, setTransportDeparture] = useState(
    isEditMode && initialPin
      ? (initialPin.metadataJson.departure ?? "")
      : "",
  );
  const [transportDestination, setTransportDestination] = useState(
    isEditMode && initialPin
      ? (initialPin.metadataJson.destination ?? "")
      : "",
  );
  const [step, setStep] = useState<DialogNewPinStep>(
    isEditMode && initialPin ? "details" : "category",
  );
  const isTransport = pinCategoryId === "transport";
  const isRangePin = isRangePinCategory(pinCategoryId);

  const resetForm = () => {
    setPinName(isEditMode && initialPin ? (initialPin.name ?? "") : "");
    setPinCategoryId(isEditMode && initialPin ? initialPin.categoryId : "");
    setPinStartDate(
      isEditMode && initialPin
        ? initialPin.startDate
        : (initialStartDate ?? ""),
    );
    setPinEndDate(
      isEditMode && initialPin
        ? (initialPin.endDate ?? "")
        : (initialStartDate ?? ""),
    );
    setPinTime(isEditMode && initialPin ? (initialPin.time ?? "") : "");
    setPinEndTime(
      isEditMode && initialPin ? (initialPin.endTime ?? "") : "",
    );
    setTransportDeparture(
      isEditMode && initialPin
        ? (initialPin.metadataJson.departure ?? "")
        : "",
    );
    setTransportDestination(
      isEditMode && initialPin
        ? (initialPin.metadataJson.destination ?? "")
        : "",
    );
    setStep(isEditMode && initialPin ? "details" : "category");
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

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
      handleDismiss();
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

      handleDismiss();
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
      pinEndDate,
      pinTime,
      pinEndTime,
      transportDeparture,
      transportDestination,
    });

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        "Check your pin details and try again.";
      showMessage(message, "error");
      return;
    }

    const pinStartDateValue = dayjs(result.data.pinStartDate);
    const pinEndDateValue = dayjs(
      isRangePinCategory(result.data.pinCategoryId)
        ? result.data.pinEndDate
        : result.data.pinStartDate,
    );
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
        name: result.data.pinName || null,
        startDate: result.data.pinStartDate,
        endDate: isRangePinCategory(result.data.pinCategoryId)
          ? result.data.pinEndDate
          : null,
        time: result.data.pinTime || null,
        endTime: isRangePinCategory(result.data.pinCategoryId)
          ? result.data.pinEndTime || null
          : null,
        categoryId: result.data.pinCategoryId,
        metadataJson,
      });
      return;
    }

    createPinMutation.mutate({
      tripId,
      userId: session.user.id,
      name: result.data.pinName || null,
      startDate: result.data.pinStartDate,
      endDate: isRangePinCategory(result.data.pinCategoryId)
        ? result.data.pinEndDate
        : null,
      time: result.data.pinTime || null,
      endTime: isRangePinCategory(result.data.pinCategoryId)
        ? result.data.pinEndTime || null
        : null,
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
        confirmText={
          step === "category" ? "Next" : isEditMode ? "Save" : "Create"
        }
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
              <UIInputDate
                placeholder={isRangePin ? "Start date" : "Date"}
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
              {isRangePin && (
                <UIInputDate
                  placeholder="End date"
                  value={pinEndDate}
                  onChange={setPinEndDate}
                  minimumDate={dayjs(pinStartDate || tripStartDate).toDate()}
                  maximumDate={dayjs(tripEndDate).toDate()}
                />
              )}
              <UIInputTime
                placeholder="Time, e.g. 14:30 (optional)"
                value={pinTime}
                onChange={setPinTime}
              />
              {isRangePin && (
                <UIInputTime
                  placeholder="End time, e.g. 16:30 (optional)"
                  value={pinEndTime}
                  onChange={setPinEndTime}
                />
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
                </View>
              )}
              <UIInputText
                placeholder="Pin name (optional)"
                value={pinName}
                onChange={setPinName}
              />
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
  transportFields: {
    gap: gaps.sm,
  },
});
