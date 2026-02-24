import { SquareClient } from "square";

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceAmount: number;
  priceCurrency: string;
}

export async function listServices(
  client: SquareClient,
  locationId: string
): Promise<ServiceInfo[]> {
  const response = await client.catalog.searchItems({
    enabledLocationIds: [locationId],
    productTypes: ["APPOINTMENTS_SERVICE"],
  });

  return (response.items || []).flatMap((item) => {
    if (item.type !== "ITEM") return [];
    const itemData = item.itemData;
    return (itemData?.variations || []).flatMap((v) => {
      if (v.type !== "ITEM_VARIATION") return [];
      const varData = v.itemVariationData;
      return [
        {
          id: v.id,
          name: `${itemData?.name} - ${varData?.name}`,
          durationMinutes: Number(
            varData?.serviceDuration
              ? varData.serviceDuration / BigInt(60000)
              : 30
          ),
          priceAmount:
            Number(varData?.priceMoney?.amount || BigInt(0)) / 100,
          priceCurrency: varData?.priceMoney?.currency || "USD",
        },
      ];
    });
  });
}

export async function getBusinessHours(
  client: SquareClient,
  locationId: string
) {
  const response = await client.locations.get({ locationId });
  return response.location?.businessHours?.periods || [];
}
