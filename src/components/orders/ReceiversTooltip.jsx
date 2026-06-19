import {
  Card,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { getStatusColors } from "../../Utlis/statusColors";

export const StatusChip = ({ status }) => {
  const colors = getStatusColors(status);
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 18,
        fontSize: "0.65rem",
        marginLeft: 2,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    />
  );
};

export const PrettyList = ({ receivers, title, onCopyContainer }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#fafafa",
        width: 600,
        boxShadow: "none",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "bold", color: "#f58220" }}
          >
            {title}
          </Typography>
          <Chip
            label={`(${receivers?.length || 0})`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontSize: "0.7rem",
              height: 20,
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        </Box>

        <Stack spacing={1} sx={{ maxHeight: "auto", overflow: "auto" }}>
          {receivers?.length > 0 ? (
            receivers.map((receiver, rIdx) => (
              <Card
                key={rIdx}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "grey.200",
                  backgroundColor: "#fff",
                  boxShadow: "none",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {receiver.receiverName || "Unnamed Receiver"}
                    </Typography>
                  </Box>
                  <StatusChip status={receiver.status} />
                </Stack>

                <Divider sx={{ mt: 1 }} />

                {receiver.shippingdetails?.length > 0 ? (
                  receiver.shippingdetails.map((item, sIdx) => (
                    <Box key={sIdx} sx={{ mt: 1, pl: 1 }}>
                      <Box sx={{ flexDirection: "column" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.category || "Unknown Category"} -{" "}
                          {item.subcategory || "Unknown Subcategory"} (
                          {item.type || "Unknown Type"}) Total:{" "}
                          {item.totalNumber ?? 0}, Weight: {item.weight ?? 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty Total Assigned:{" "}
                          {Math.max(
                            0,
                            parseInt(item.totalNumber || 0) -
                              parseInt(item.remainingItems || 0),
                          ).toLocaleString()}{" "}
                          / Remaining Items:{" "}
                          {parseInt(item.remainingItems || 0).toLocaleString()}
                        </Typography>
                      </Box>

                      {item.containerDetails?.length > 0 ? (
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          display="flex"
                          spacing={1}
                          sx={{
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                          }}
                        >
                          {item.containerDetails.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              style={{
                                marginTop: 5,
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                alignSelf: "center",
                                flex: 1,
                                display: "flex",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  label={`${c.container.container_number} - ${c.assign_total_box} boxes (${c.assign_weight} kg)`}
                                  size="large"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ marginBottom: 2 }}
                                />
                                <Tooltip
                                  title="Copy Container Number"
                                  sx={{ marginBottom: 2 }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      onCopyContainer?.(
                                        c.container.container_number,
                                      )
                                    }
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              <StatusChip status={c.status} />
                            </div>
                          ))}
                        </Stack>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          No containers assigned
                        </Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    No shipping details
                  </Typography>
                )}

                {receiver.drop_off_details?.length > 0 && (
                  <Box sx={{ mt: 1, pl: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Drop Off Details:
                    </Typography>
                    {receiver.drop_off_details.map((dod, dIdx) => (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        key={dIdx}
                        display="block"
                      >
                        {dod.drop_method} - {dod.dropoff_name} (
                        {dod.drop_off_mobile}) on {dod.drop_date}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Card>
            ))
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 3,
                color: "text.secondary",
              }}
            >
              <EmojiEventsIcon
                sx={{ fontSize: 40, color: "grey.300", mb: 1 }}
              />
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                No receivers available
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Card>
  );
};
