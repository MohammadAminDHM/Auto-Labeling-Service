import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:6996", // your FastAPI later
});

export default api;
