import { createContext, useEffect, useState, useRef } from "react";
import { api } from "../api";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [placesLoading, setPlacesLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

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

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    fetchCustomers();
    fetchPlaces();
    fetchStatuses();
  }, []);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
