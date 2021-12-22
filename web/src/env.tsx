// @ts-nocheck
import axios from "axios";

export const API_DOMAIN: string = __API_DOMAIN_NAME;
export const WEB_DOMAIN: string = __WEB_DOMAIN_NAME;
export const API_PORT: string = __API_PORT;
export const WEB_PORT: string = __WEB_PORT;
export const API_URL: string = `https://${API_DOMAIN}:${API_PORT}`;
export const WEB_URL: string = `https://${WEB_DOMAIN}:${WEB_PORT}`;

export const requests = axios.create({
  baseURL: API_URL,
});
