import axios from "axios";
import { decryptData } from "./decryption";

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: "https://backend.cloudimts.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (token != "undefined"){
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    let data = response?.data?.data ;
    data = decryptData(data) ; 
    data = JSON.parse(data) ; 
    return data ; 
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Function to make API calls with dynamic headers
const apiHandler = {
  get: (url, params = {}, headers = {}) => api.get(url, { params, headers }),
  post: (url, data, params = {}, headers = {}) => 
    api.post(url, data, { params, headers }), 
  put: (url, data, headers = {}) => api.put(url, data, { headers }),
  delete: (url, headers = {}) => api.delete(url, { headers }),
};

export default apiHandler;
