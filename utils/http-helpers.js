import http from 'k6/http';
import { JSON_HEADERS } from './config.js';

// Make a POST request with JSON headers, optional extra headers, and request tagging.
// Logs the response status (and optionally the body) to the console.
export function postJson(url, payload, { extraHeaders = {}, tags = {}, logBody = false } = {}) {
  const params = {
    headers: { ...JSON_HEADERS, ...extraHeaders },
  };
  if (Object.keys(tags).length > 0) {
    params.tags = tags;
  }

  const res = http.post(url, JSON.stringify(payload), params);
  logResponse(res, url, logBody);
  return res;
}

// Make a GET request with optional headers and request tagging.
export function getJson(url, { extraHeaders = {}, tags = {} } = {}) {
  const params = {
    headers: { ...JSON_HEADERS, ...extraHeaders },
  };
  if (Object.keys(tags).length > 0) {
    params.tags = tags;
  }

  const res = http.get(url, params);
  logResponse(res, url);
  return res;
}

// Log the status code (and optionally the body) of a response.
function logResponse(res, url, logBody = false) {
  const endpoint = url.split('/').pop();
  console.log(`${endpoint} Status: ${res.status}`);
  if (logBody) {
    console.log(res.body);
  }
}
