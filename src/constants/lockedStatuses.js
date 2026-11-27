export const LOCKED_STATUSES = ["Delivered", "Shipment Delivered", "Cancelled"];

export const isLockedStatus = (status) =>
  LOCKED_STATUSES.includes(String(status ?? "").trim());

export const consignmentLockedMessage = (status) =>
  `This consignment is ${status}, so its status can no longer be changed.`;

export const containerEtaLockedMessage = (status) =>
  `This container's ETA status is ${status}, so its ETA and ETA status can no longer be changed.`;

export const buildStatusRankMap = (statuses = []) => {
  const map = new Map();
  (statuses || [])
    .filter((s) => s.status === true)
    .forEach((s) => {
      const rank = Number(s.sorting_number) || 0;
      [s.order_status, s.container_status, s.consignment_status]
        .filter(Boolean)
        .forEach((name) => {
          const key = String(name).trim().toLowerCase();
          if (!map.has(key) || rank < map.get(key)) map.set(key, rank);
        });
    });
  return map;
};

export const getStatusRank = (rankMap, name) =>
  rankMap.get(
    String(name ?? "")
      .trim()
      .toLowerCase(),
  ) ?? 0;

export const isBackwardStatus = (rankMap, current, next) => {
  const c = getStatusRank(rankMap, current);
  const n = getStatusRank(rankMap, next);
  return c > 0 && n > 0 && n < c;
};

export const ETA_MAX_DAYS = 30;

const toLocalDate = (v) => {
  if (!v) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [y, m, d] = v.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const toISO = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const etaWindow = (currentEta) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = toLocalDate(currentEta);
  const base = cur && cur > today ? cur : today;
  const max = new Date(base);
  max.setDate(max.getDate() + ETA_MAX_DAYS);
  return { min: toISO(base), max: toISO(max) };
};

export const isEtaInWindow = (currentEta, next) => {
  if (!next) return false;
  const { min, max } = etaWindow(currentEta);
  return next >= min && next <= max;
};
