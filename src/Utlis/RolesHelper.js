// src/utils/roleUtils.js

import { ROLE_MODULES } from "../context/Roles";

/**
 * Check if a given role has access to a specific module.
 * @param {string} role - The user's role (e.g. "admin", "staff")
 * @param {string} moduleName - The module to check (e.g. "users", "orders")
 * @returns {boolean} true if role has access to the module
 */
export function roleHasModule(role, moduleName) {
  if (!role || typeof role !== "string" || !moduleName) {
    console.warn("roleHasModule: invalid input", { role, moduleName });
    return false;
  }

  const allowedModules = ROLE_MODULES[role] || [];
  const hasAccess = allowedModules.includes(moduleName);

  // Optional debug log (remove or use logger in production)
  // console.log(`[roleHasModule] ${role} → ${moduleName} = ${hasAccess}`);

  return hasAccess;
}

/**
 * Check if a role has access to ANY of the required modules.
 * @param {string} role - The user's role
 * @param {string[]} requiredModules - Array of module names
 * @returns {boolean} true if at least one required module is allowed
 */
export function hasAnyOfModules(role, requiredModules = []) {
  if (!role || !Array.isArray(requiredModules) || requiredModules.length === 0) {
    return false;
  }

  const allowedModules = ROLE_MODULES[role] || [];
  return requiredModules.some((mod) => allowedModules.includes(mod));
}

/**
 * Check if a role has access to ALL of the required modules.
 * @param {string} role - The user's role
 * @param {string[]} requiredModules - Array of module names
 * @returns {boolean} true only if ALL required modules are allowed
 */
export function hasAllOfModules(role, requiredModules = []) {
  if (!role || !Array.isArray(requiredModules) || requiredModules.length === 0) {
    return false;
  }

  const allowedModules = ROLE_MODULES[role] || [];
  return requiredModules.every((mod) => allowedModules.includes(mod));
}

// ────────────────────────────────────────────────────────────────
// Aliases / more readable names (optional but helpful)
// ────────────────────────────────────────────────────────────────

export const canAccessModule = roleHasModule;
export const canAccessAnyModule = hasAnyOfModules;
export const canAccessAllModules = hasAllOfModules;

// ────────────────────────────────────────────────────────────────
// Future-proof wrapper (when you switch to dynamic permissions)
// ────────────────────────────────────────────────────────────────

/**
 * Placeholder for dynamic permission check.
 * Replace this implementation when you migrate to DB-based permissions.
 */
export function can(roleOrUser, module, action = "view") {
  // For now: fallback to static module check (most actions = module access)
  return roleHasModule(roleOrUser?.role || roleOrUser, module);

  // When dynamic:
  // return permissions?.[module]?.includes(action) ?? false;
}