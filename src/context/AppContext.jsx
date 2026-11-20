import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { api } from "../api";
import { useAuth } from "./AuthContext";

export const AppContext = createContext(null);

const CACHE_PREFIX = "appctx:v1:";
const CACHE_TTL_MS = 10 * 60 * 1000;

const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw);
    return { data: d, fresh: Date.now() - t < CACHE_TTL_MS };
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ t: Date.now(), d: data }),
    );
  } catch {
    sessionStorage.removeItem(CACHE_PREFIX + key);
  }
};

const clearCache = () => {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    return;
  }
};

const RESOURCES = {
  customers: {
    url: "/api/customers",
    params: { search: "All", limit: 5000 },
    select: (res) => res.data,
    error: "An error occurred while fetching customers.",
    initialLoading: true,
  },
  places: {
    url: "/api/options/places/crud",
    select: (res) => res.data.places,
    error: "An error occurred while fetching places.",
  },
  statuses: {
    url: "/api/options/allStatus",
    select: (res) => res.data.statuses,
    error: "An error occurred while fetching statuses.",
  },
  modules: {
    url: "/api/options/modules",
    select: (res) => res.data.modules,
    error: "An error occurred while fetching modules.",
  },
  companies: {
    url: "/api/options/companies",
    select: (res) => res.data.data || [],
    error: "Failed to load companies",
    serverMessage: true,
    toast: false,
  },
  thirdParties: {
    url: "/api/options/thirdParty/crud",
    select: (res) => res.data.third_parties || [],
    error: "Failed to load third parties. Please try again.",
  },
  drivers: {
    url: "/api/options/drivers",
    select: (res) => res.data.rows || [],
    error: "Failed to load drivers. Please try again.",
    emptyOn404: true,
  },
  driverTrucks: {
    url: "/api/options/driver-trucks",
    select: (res) => res.data.rows || [],
    error: "Failed to load driver trucks. Please try again.",
    emptyOn404: true,
  },
  systemSettings: {
    url: "/api/options/system-settings",
    select: (res) => res.data.data || [],
    error: "Failed to load system settings.",
  },
  zohoInvoices: {
    url: "/api/zoho-invoice",
    select: (res) => res.data?.invoices || [],
    error: "Failed to fetch invoices.",
    serverMessage: true,
    quietStatuses: [403],
  },
  banks: {
    url: "/api/options/banks/crud",
    select: (res) => res.data.banks || [],
    error: "Failed to load banks.",
    lazy: true,
  },
  paymentTypes: {
    url: "/api/options/payment-types/crud",
    select: (res) => res.data.paymentTypes || [],
    error: "Failed to load payment types.",
    lazy: true,
  },
  vessels: {
    url: "/api/options/vessels/crud",
    select: (res) => res.data.vessels || [],
    error: "Failed to load vessels.",
    lazy: true,
  },
  shippingLines: {
    url: "/api/options/shipping-lines",
    select: (res) => res.data.shippingLineOptions || [],
    error: "Failed to load shipping lines.",
    lazy: true,
  },
  currencies: {
    url: "/api/options/currencies",
    select: (res) => res.data.currencyOptions || [],
    error: "Failed to load currencies.",
    lazy: true,
  },
  categories: {
    url: "/api/options/categories/crud",
    select: (res) => res.data.categories || [],
    error: "Failed to load categories.",
    lazy: true,
  },
  subCategories: {
    url: "/api/options/subcategories/crud",
    select: (res) => res.data.subCategories || [],
    error: "Failed to load subcategories.",
    lazy: true,
  },
};

const RESOURCE_KEYS = Object.keys(RESOURCES);

const createInitialState = (pending) =>
  Object.fromEntries(
    RESOURCE_KEYS.map((key) => [
      key,
      {
        data: [],
        loading: Boolean(RESOURCES[key].initialLoading) && pending,
        error: "",
      },
    ]),
  );

const reducer = (state, action) => {
  switch (action.type) {
    case "patch":
      return {
        ...state,
        [action.key]: { ...state[action.key], ...action.patch },
      };
    case "reset":
      return createInitialState(false);
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, true, createInitialState);

  const stateRef = useRef(state);
  stateRef.current = state;
  const inflight = useRef(new Map());
  const generation = useRef(0);
  const initialized = useRef(false);

  const load = useCallback((key, { silent = false } = {}) => {
    if (inflight.current.has(key)) return inflight.current.get(key);

    const config = RESOURCES[key];
    const gen = generation.current;

    const run = async () => {
      if (!silent) {
        dispatch({ type: "patch", key, patch: { loading: true, error: "" } });
      }
      try {
        const res = await api.get(
          config.url,
          config.params ? { params: config.params } : undefined,
        );
        if (gen !== generation.current) return;
        const data = config.select(res);
        writeCache(key, data);
        dispatch({
          type: "patch",
          key,
          patch: { data, loading: false, error: "" },
        });
      } catch (err) {
        if (gen !== generation.current) return;
        const status = err.response?.status;

        if (status === 404 && config.emptyOn404) {
          dispatch({
            type: "patch",
            key,
            patch: { data: [], loading: false, error: "" },
          });
          return;
        }

        const message = config.serverMessage
          ? err.response?.data?.message || config.error
          : config.error;

        if (!config.quietStatuses?.includes(status)) {
          console.error(`[AppContext] ${key} fetch failed:`, err);
          if (config.toast !== false) toast.error(message);
        }

        dispatch({
          type: "patch",
          key,
          patch: { loading: false, error: message },
        });
      }
    };

    const promise = run().finally(() => inflight.current.delete(key));
    inflight.current.set(key, promise);
    return promise;
  }, []);

  const setData = useCallback((key, value) => {
    const prev = stateRef.current[key].data;
    const next = typeof value === "function" ? value(prev) : value;
    stateRef.current = {
      ...stateRef.current,
      [key]: { ...stateRef.current[key], data: next },
    };
    writeCache(key, next);
    dispatch({ type: "patch", key, patch: { data: next } });
  }, []);

  const fetchers = useMemo(
    () =>
      Object.fromEntries(
        RESOURCE_KEYS.map((key) => [key, (options) => load(key, options)]),
      ),
    [load],
  );

  const setters = useMemo(
    () =>
      Object.fromEntries(
        RESOURCE_KEYS.map((key) => [key, (value) => setData(key, value)]),
      ),
    [setData],
  );

  const refreshAll = useCallback(
    () =>
      Promise.all(
        RESOURCE_KEYS.filter((key) => !RESOURCES[key].lazy).map((key) =>
          load(key, { silent: true }),
        ),
      ),
    [load],
  );

  const syncZohoInvoices = useCallback(async () => {
    dispatch({ type: "patch", key: "zohoInvoices", patch: { syncing: true } });
    try {
      await api.post("/api/zoho-invoice/sync");
      await load("zohoInvoices", { silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sync invoices.");
    } finally {
      dispatch({
        type: "patch",
        key: "zohoInvoices",
        patch: { syncing: false },
      });
    }
  }, [load]);

  const systemSettings = state.systemSettings.data;

  const getSystemRate = useCallback(
    (key, fallback = 0) => {
      const setting = systemSettings.find((s) => s.key === key);
      return setting ? Number(setting.value) : fallback;
    },
    [systemSettings],
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      generation.current += 1;
      inflight.current.clear();
      initialized.current = false;
      clearCache();
      dispatch({ type: "reset" });
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    RESOURCE_KEYS.forEach((key) => {
      const cached = readCache(key);
      if (cached) {
        dispatch({
          type: "patch",
          key,
          patch: { data: cached.data, loading: false },
        });
      }
      if (!RESOURCES[key].lazy && !cached?.fresh) {
        load(key, { silent: Boolean(cached) });
      }
    });
  }, [authLoading, isAuthenticated, load]);

  const ensure = useCallback(
    (keys) =>
      Promise.all(
        keys.map((key) => {
          const cached = readCache(key);
          return cached?.fresh ? null : load(key, { silent: Boolean(cached) });
        }),
      ),
    [load],
  );

  const reload = useCallback(
    (keys) => Promise.all(keys.map((key) => load(key, { silent: true }))),
    [load],
  );

  const value = useMemo(
    () => ({
      customers: state.customers.data,
      setCustomers: setters.customers,
      loadingCustomers: state.customers.loading,
      fetchCustomers: fetchers.customers,

      places: state.places.data,
      setPlaces: setters.places,
      placesLoading: state.places.loading,
      fetchPlaces: fetchers.places,

      statuses: state.statuses.data,
      setStatuses: setters.statuses,
      statusLoading: state.statuses.loading,
      fetchStatuses: fetchers.statuses,

      modules: state.modules.data,
      setModules: setters.modules,
      modulesLoading: state.modules.loading,
      fetchModules: fetchers.modules,

      companies: state.companies.data,
      setCompanies: setters.companies,
      companiesLoading: state.companies.loading,
      companiesError: state.companies.error,
      fetchCompanies: fetchers.companies,

      thirdParties: state.thirdParties.data,
      setThirdParties: setters.thirdParties,
      thirdPartiesLoading: state.thirdParties.loading,
      fetchThirdParties: fetchers.thirdParties,

      drivers: state.drivers.data,
      setDrivers: setters.drivers,
      driversLoading: state.drivers.loading,
      fetchDrivers: fetchers.drivers,

      driverTrucks: state.driverTrucks.data,
      setDriverTracks: setters.driverTrucks,
      setDriverTrucks: setters.driverTrucks,
      driverTrucksLoading: state.driverTrucks.loading,
      fetchDriverTrucks: fetchers.driverTrucks,

      systemSettings,
      setSystemSettings: setters.systemSettings,
      systemSettingsLoading: state.systemSettings.loading,
      fetchSystemSettings: fetchers.systemSettings,
      getSystemRate,

      zohoInvoices: state.zohoInvoices.data,
      zohoInvoicesLoading: state.zohoInvoices.loading,
      zohoInvoicesSyncing: Boolean(state.zohoInvoices.syncing),
      fetchZohoInvoices: fetchers.zohoInvoices,
      syncZohoInvoices,

      banks: state.banks.data,
      paymentTypes: state.paymentTypes.data,
      vessels: state.vessels.data,
      shippingLines: state.shippingLines.data,
      currencies: state.currencies.data,
      categories: state.categories.data,
      subCategories: state.subCategories.data,
      ensure,
      reload,

      refreshAll,
    }),
    [
      state,
      systemSettings,
      setters,
      fetchers,
      getSystemRate,
      syncZohoInvoices,
      refreshAll,
      ensure,
      reload,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
