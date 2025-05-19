import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // ajuste conforme o endereço do backend
});

export default api;
