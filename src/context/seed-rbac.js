import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
};

const ACTIONS = [
  { code: "view", name: "View" },
  { code: "create", name: "Create" },
  { code: "edit", name: "Edit" },
  { code: "delete", name: "Delete" },
];

const MODULES = [
  { code: "dashboard", name: "Dashboard" },
  { code: "customers", name: "Customers" },
  { code: "vendors", name: "Vendors" },
  { code: "containers", name: "Containers" },
  { code: "release", name: "Container Releases" },
  { code: "orders", name: "Orders" },
  { code: "consignments", name: "Consignments" },
  { code: "tracking", name: "Tracking" },
  { code: "users", name: "Users" },
  { code: "permissions", name: "Permissions" },
  { code: "notifications", name: "Notifications" },
  { code: "payment-types", name: "Payment Types" },
  { code: "categories", name: "Categories" },
  { code: "vessels", name: "Vessels" },
  { code: "places", name: "Places" },
  { code: "banks", name: "Banks" },
  { code: "third-parties", name: "Third Parties" },
  { code: "barcode-print", name: "Barcode Print" },
  { code: "eta-setup", name: "ETA Setup" },
  { code: "bug-report", name: "Bug Report" },
  { code: "rbac", name: "RBAC" },
  { code: "roles", name: "Roles" },
];

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    dashboard: ["view"],
    customers: ["view", "create", "edit", "delete"],
    vendors: ["view", "create", "edit", "delete"],
    containers: ["view", "create", "edit", "delete"],
    release: ["view", "create", "edit", "delete"],
    orders: ["view", "create", "edit", "delete"],
    consignments: ["view", "create", "edit", "delete"],
    tracking: ["view"],
    users: ["view", "create", "edit", "delete"],
    permissions: ["view", "create", "edit", "delete"],
    notifications: ["view", "create", "edit", "delete"],
    "payment-types": ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit", "delete"],
    vessels: ["view", "create", "edit", "delete"],
    places: ["view", "create", "edit", "delete"],
    banks: ["view", "create", "edit", "delete"],
    "third-parties": ["view", "create", "edit", "delete"],
    "barcode-print": ["view"],
    "eta-setup": ["view", "create", "edit", "delete"],
    "bug-report": ["view", "create", "edit", "delete"],
    rbac: ["view", "create", "edit", "delete"],
    roles: ["view", "create", "edit", "delete"],
  },

  [ROLES.MANAGER]: {
    dashboard: ["view"],
    customers: ["view", "create", "edit"],
    vendors: ["view", "create", "edit"],
    containers: ["view", "create", "edit"],
    release: ["view", "create", "edit"],
    orders: ["view", "create", "edit"],
    consignments: ["view", "create", "edit"],
    tracking: ["view"],
    users: ["view"],
    notifications: ["view"],
    "barcode-print": ["view"],
    rbac: ["view"],
    roles: ["view"],
  },

  [ROLES.STAFF]: {
    dashboard: ["view"],
    orders: ["view", "create", "edit"],
    consignments: ["view", "create", "edit"],
    tracking: ["view"],
    "barcode-print": ["view"],
  },

  [ROLES.VIEWER]: {
    dashboard: ["view"],
    orders: ["view"],
    consignments: ["view"],
    containers: ["view"],
    release: ["view"],
    tracking: ["view"],
  },
};

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const action of ACTIONS) {
      await client.query(
        `INSERT INTO permission_actions (code, name)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [action.code, action.name],
      );
    }

    for (const role of Object.values(ROLES)) {
      await client.query(
        `INSERT INTO roles (name)
         VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [role],
      );
    }

    for (const mod of MODULES) {
      await client.query(
        `INSERT INTO modules (code, name)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [mod.code, mod.name],
      );
    }

    for (const [roleName, moduleMap] of Object.entries(ROLE_PERMISSIONS)) {
      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = $1",
        [roleName],
      );
      const roleId = roleResult.rows[0]?.id;
      if (!roleId) continue;

      for (const [moduleCode, actions] of Object.entries(moduleMap)) {
        const modResult = await client.query(
          "SELECT id FROM modules WHERE code = $1",
          [moduleCode],
        );
        const moduleId = modResult.rows[0]?.id;
        if (!moduleId) continue;

        for (const actionCode of actions) {
          const actionResult = await client.query(
            "SELECT id FROM permission_actions WHERE code = $1",
            [actionCode],
          );
          const actionId = actionResult.rows[0]?.id;
          if (!actionId) continue;

          await client.query(
            `INSERT INTO role_permissions (role_id, module_id, action_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (role_id, module_id, action_id) DO NOTHING`,
            [roleId, moduleId, actionId],
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log("RBAC seeded successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
