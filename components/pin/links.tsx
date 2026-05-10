import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link2 as Link2Icon } from "lucide-react-native";

import { CardPinReferenceLinkRegular } from "@/components/card/reference-link/regular";
import { DialogNewReferenceLink } from "@/components/dialog/new-reference-link";
import { colors, getColor } from "@/constants/theme";
import { actionListLocalReferenceLinksByPin } from "@/lib/sqlite/model/reference-link";
import { PinSectionTemplate, pinSectionStyles } from "./section-template";

type PinLinksProps = {
  pinId: string;
  tripId: string;
  userId: string;
};

export const PinLinks = ({ pinId, tripId, userId }: PinLinksProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: localReferenceLinks = [] } = useQuery({
    queryKey: ["local-reference-links", pinId, userId],
    queryFn: () => actionListLocalReferenceLinksByPin(pinId, userId),
    enabled: Boolean(pinId && userId),
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
    </>
  );
};
