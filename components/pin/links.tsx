import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2 as Link2Icon } from "lucide-react-native";

import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
import { colors, getColor } from "@/constants/theme";
import {
  actionListLocalReferenceLinksByPin,
  actionSoftDeleteLocalReferenceLink,
} from "@/lib/sqlite/model/reference-link";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinLinksProps = {
  pinId: string;
  tripId: string;
  userId: string;
};

export const PinLinks = ({ pinId, tripId, userId }: PinLinksProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReferenceLinkId, setSelectedReferenceLinkId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();

  const { data: localReferenceLinks = [] } = useQuery({
    queryKey: ["local-reference-links", pinId, userId],
    queryFn: () => actionListLocalReferenceLinksByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
  });

  const softDeleteReferenceLinkMutation = useMutation({
    mutationFn: (referenceLinkId: string) =>
      actionSoftDeleteLocalReferenceLink(referenceLinkId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-reference-links", pinId, userId],
      });
      setIsDeleteDialogOpen(false);
      setSelectedReferenceLinkId(null);
    },
  });

  return (
    <>
      <PinSectionTemplate
        title="Reference Links"
        icon={<Link2Icon size={24} color={getColor(colors.purple)} />}
        onAdd={() => setIsDialogOpen(true)}
        addText="Add Reference Link"
      >
        {localReferenceLinks.map((referenceLink, index) => (
          <View key={referenceLink.id}>
            <CardPinReferenceLinkRegular
              referenceLink={{
                id: referenceLink.id,
                title: referenceLink.title ?? referenceLink.url,
                url: referenceLink.url,
                caption: referenceLink.caption ?? undefined,
              }}
              onDeletePress={() => {
                setSelectedReferenceLinkId(referenceLink.id);
                setIsDeleteDialogOpen(true);
              }}
            />
            {index < localReferenceLinks.length - 1 && (
              <View style={pinSectionStyles.divider} />
            )}
          </View>
        ))}
      </PinSectionTemplate>

      <DialogNewReferenceLink
        pinId={pinId}
        tripId={tripId}
        visible={isDialogOpen}
        onDismiss={() => setIsDialogOpen(false)}
      />

      <ConfirmActionDialog
        visible={isDeleteDialogOpen}
        title="Delete Link"
        message="Are you sure you want to delete this reference link?"
        confirmText="Delete"
        onDismiss={() => {
          setIsDeleteDialogOpen(false);
          setSelectedReferenceLinkId(null);
        }}
        onConfirm={() => {
          if (!selectedReferenceLinkId) {
            return;
          }

          softDeleteReferenceLinkMutation.mutate(selectedReferenceLinkId);
        }}
        isPending={softDeleteReferenceLinkMutation.isPending}
        confirmVariant="danger"
      />
    </>
  );
};
