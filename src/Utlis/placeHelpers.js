export const getPlaceName = (placeId, filterPlaces) => {
  if (!placeId) return "-";
  const place = filterPlaces.find((p) => p.value === placeId.toString());
  return place ? place.label : placeId;
};
