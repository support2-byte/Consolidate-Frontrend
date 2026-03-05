const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });  // Your DB connection

const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
};

const ROLE_MODULES = { /* Copy your full ROLE_MODULES object here */ };

const ACTIONS = [
  { code: 'view', name: 'View / Read' },       // Add more actions as needed
  { code: 'create', name: 'Create / Add' },
  { code: 'edit', name: 'Edit / Update' },
  { code: 'delete', name: 'Delete / Remove' },
  // Add custom actions like 'approve', 'export' if needed
];

async function seed() {
  try {
    // 1. Insert actions
    for (const action of ACTIONS) {
      await pool.query(
        `INSERT INTO permission_actions (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
        [action.code, action.name]
      );
    }

    // 2. Insert roles
    for (const roleKey in ROLES) {
      await pool.query(
        `INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [ROLES[roleKey]]
      );
    }

    // 3. Insert modules (extract unique from ROLE_MODULES)
    const allModules = new Set();
    Object.values(ROLE_MODULES).forEach(mods => mods.forEach(m => allModules.add(m)));

    for (const mod of allModules) {
      const displayName = mod
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');  // e.g., 'payment-types' → 'Payment Types'

      await pool.query(
        `INSERT INTO modules (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
        [mod, displayName]
      );
    }

    // 4. Insert permissions (assume 'view' + 'create/edit/delete' for now; customize)
    for (const roleKey in ROLE_MODULES) {
      const roleName = ROLES[roleKey];
      const roleResult = await pool.query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
      const roleId = roleResult.rows[0]?.id;
      if (!roleId) continue;

      for (const modCode of ROLE_MODULES[roleKey]) {
        const modResult = await pool.query(`SELECT id FROM modules WHERE code = $1`, [modCode]);
        const modId = modResult.rows[0]?.id;
        if (!modId) continue;

        // Assign actions (e.g., full for admin, limited for others)
        const actionsToAssign = roleName === 'admin' 
          ? ['view', 'create', 'edit', 'delete']  // Full access
          : ['view', 'create', 'edit'];           // Limited

        for (const actionCode of actionsToAssign) {
          const actionResult = await pool.query(`SELECT id FROM permission_actions WHERE code = $1`, [actionCode]);
          const actionId = actionResult.rows[0]?.id;
          if (!actionId) continue;

          await pool.query(
            `INSERT INTO role_permissions (role_id, module_id, action_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [roleId, modId, actionId]
          );
        }
      }
    }

    console.log('RBAC seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();