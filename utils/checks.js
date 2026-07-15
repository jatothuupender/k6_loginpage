import { check } from 'k6';

// Check that the response status equals the expected code.
export function checkStatus(res, name, expectedStatus = 200) {
  return check(res, {
    [name]: (r) => r.status === expectedStatus,
  });
}

// Check that the response status is 200 or 201 (common for create operations).
export function checkStatusOk(res, name) {
  return check(res, {
    [name]: (r) => r.status === 200 || r.status === 201,
  });
}

// Check that the response body exists and contains no error fields.
export function checkNoError(res, namePrefix = '') {
  const prefix = namePrefix ? `${namePrefix}: ` : '';
  return check(res, {
    [`${prefix}response has body`]: (r) => r.body && r.body.length > 0,
    [`${prefix}no error in body`]: (r) => {
      try {
        const json = r.json();
        return !json.error && !json.errorCode;
      } catch (_) {
        return false;
      }
    },
  });
}
