// src/config/roles.js   or   src/constants/roles.js

export const ROLES = {
  ADMIN:    "admin",
  MANAGER:  "manager",
  STAFF:    "staff",
  VIEWER:   "viewer",
};

export const ROLE_MODULES = {
  [ROLES.ADMIN]: [
    "dashboard",
    "customers",
    "vendors",
    "containers",
    "orders",
    "consignments",
    "tracking",
    "users",                  // manage users
    "settings",               // full settings
    "payment-types",
    "categories",
    "vessels",
    "places",
    "banks",
    "third-parties",
    "eta-setup",
    "barcode-print",
  ],

  [ROLES.MANAGER]: [
    "dashboard",
    "customers",
    "vendors",
    "containers",
    "orders",
    "consignments",
    "tracking",
    "users",                  // can see / maybe limited edit
  ],

  [ROLES.STAFF]: [
    "dashboard",
    "orders",
    "consignments",
    "tracking",
  ],

  [ROLES.VIEWER]: [
    "dashboard",
    "tracking",               // read-only
  ],
};