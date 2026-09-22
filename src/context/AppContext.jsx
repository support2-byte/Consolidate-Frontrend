import { createContext, useEffect, useState, useRef } from "react";
import { api } from "../api";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [modules, setModules] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [thirdParties, setThirdParties] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverTracks, setDriverTracks] = useState([]);
  const [systemSettings, setSystemSettings] = useState([]);

  const [placesLoading, setPlacesLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [thirdPartiesLoading, setThirdPartiesLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverTracksLoading, setDriverTracksLoading] = useState(false);
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);

  const isInitialized = useRef(false);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams({
        search: "All",
        limit: 5000,
      });

      const response = await api.get(`/api/customers?${params}`);

      if (response.status === 200) {
        setCustomers(response.data);
      } else {
        toast.error("Failed to load customers data.");
      }
    } catch (error) {
      console.error("Customer Fetch Error:", error);
      toast.error("An error occurred while fetching customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPlaces = async () => {
    try {
      setPlacesLoading(true);
      const response = await api.get(`/api/options/places/crud`);

      if (response.status === 200) {
        setPlaces(response.data.places);
      } else {
        toast.error("Failed to load locations.");
      }
    } catch (error) {
      console.error("Places Fetch Error:", error);
      toast.error("An error occurred while fetching places.");
    } finally {
      setPlacesLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      setStatusLoading(true);
      const response = await api.get(`/api/options/allStatus`);

      if (response.status === 200) {
        setStatuses(response.data.statuses);
      } else {
        toast.error("Failed to load system statuses.");
      }
    } catch (error) {
      console.error("Status Fetch Error:", error);
      toast.error("An error occurred while fetching statuses.");
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      setModulesLoading(true);
      const response = await api.get("/api/options/modules");

      if (response.status === 200) {
        setModules(response.data.modules);
      } else {
        toast.error("Failed to load system statuses.");
      }
    } catch (error) {
      console.error("Modules Fetch Error:", error);
      toast.error("An error occurred while fetching modules.");
    } finally {
      setModulesLoading(false);
    }
  };

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const { data } = await api.get("/api/options/companies");
      setCompanies(data.data || []);
    } catch (err) {
      setCompaniesError(
        err.response?.data?.message || "Failed to load companies",
      );
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchThirdParties = async () => {
    try {
      setThirdPartiesLoading(true);
      const response = await api.get("api/options/thirdParty/crud");
      const data = response.data.third_parties || [];
      setThirdParties(data);
    } catch (err) {
      console.error("Error fetching third parties:", err);
      toast.error("Failed to load third parties. Please try again.");
    } finally {
      setThirdPartiesLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setDriversLoading(true);
      const response = await api.get("api/options/drivers");
      setDrivers(response.data.rows || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setDrivers([]);
      } else {
        console.error("Error fetching drivers:", err);
        toast.error("Failed to load drivers. Please try again.");
      }
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchDriverTracks = async () => {
    try {
      setDriverTracksLoading(true);
      const response = await api.get("api/options/driver-tracks");
      setDriverTracks(response.data.rows || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setDriverTracks([]);
      } else {
        console.error("Error fetching driver tracks:", err);
        toast.error("Failed to load driver tracks. Please try again.");
      }
    } finally {
      setDriverTracksLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setSystemSettingsLoading(true);
      const { data } = await api.get("/api/options/system-settings");
      setSystemSettings(data.data || []);
    } catch (err) {
      console.error("Error fetching system settings:", err);
      toast.error("Failed to load system settings.");
    } finally {
      setSystemSettingsLoading(false);
    }
  };

  const getSystemRate = (key, fallback = 0) => {
    const setting = systemSettings.find((s) => s.key === key);
    return setting ? Number(setting.value) : fallback;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoadingCustomers(false);
      isInitialized.current = false;
      return;
    }

    if (isInitialized.current) return;
    isInitialized.current = true;

    fetchCustomers();
    fetchPlaces();
    fetchStatuses();
    fetchModules();
    fetchCompanies();
    fetchThirdParties();
    fetchDrivers();
    fetchDriverTracks();
    fetchSystemSettings();
    getSystemRate();
  }, [authLoading, isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        customers,
        setCustomers,
        loadingCustomers,
        places,
        setPlaces,
        placesLoading,
        fetchPlaces,
        statuses,
        setStatuses,
        statusLoading,
        fetchStatuses,
        modules,
        setModules,
        companies,
        setCompanies,
        companiesLoading,
        companiesError,
        fetchCompanies,
        thirdParties,
        setThirdParties,
        drivers,
        setDrivers,
        driversLoading,
        fetchDrivers,
        driverTracks,
        setDriverTracks,
        driverTracksLoading,
        fetchDriverTracks,
        systemSettings,
        setSystemSettings,
        systemSettingsLoading,
        fetchSystemSettings,
        getSystemRate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
