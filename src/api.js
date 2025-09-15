import axios from "axios";
export const api = axios.create({
  baseURL:"https://consolidate.onrender.com",
  withCredentials: true
});
