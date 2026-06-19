import { createContext, useEffect, useState } from "react";
import { api } from "../api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [placesLoading, setPlacesLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

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
        console.log("No customer found!");
      }
    } catch (error) {
      console.log(error);
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
        console.log("No customer found!");
      }
    } catch (error) {
      console.log(error);
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
        console.log("No customer found!");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchPlaces();
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
