import { TableRow, TableCell, Tooltip, List } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
  "&:last-child td, &:last-child th": { border: 0 },
  "&:hover": { backgroundColor: theme.palette.action.selected },
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: "12px",
  padding: theme.spacing(1.5, 2),
}));

export const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
  fontSize: "0.875rem",
  padding: theme.spacing(1.5, 2),
  borderBottom: `2px solid ${theme.palette.primary.dark}`,
}));

export const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.body2.fontSize,
    width: 600,
  },
}));

export const StyledList = styled(List)(({ theme }) => ({
  padding: theme.spacing(1),
  "& .MuiListItem-root": {
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.25),
    "&:hover": { backgroundColor: theme.palette.action.hover },
  },
}));
