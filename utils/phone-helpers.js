// ---------------------------------------------------------------------------
// Phone-related helpers extracted from login2.js for testability
// ---------------------------------------------------------------------------

const TEST_PHONES = [
  { phone: '7659086950', countryCode: '91' },
  { phone: '9876543210', countryCode: '91' },
  { phone: '8765432109', countryCode: '91' },
  { phone: '7654321098', countryCode: '91' },
  { phone: '6543210987', countryCode: '91' },
];

/**
 * Pick a test phone number for the given VU index (1-based).
 * Rotates across TEST_PHONES so the API doesn't see the same
 * number in every concurrent request.
 */
function pickPhone(vuIndex, phones) {
  const list = phones || TEST_PHONES;
  if (!list || list.length === 0) {
    throw new Error('Phone list must not be empty');
  }
  if (typeof vuIndex !== 'number' || vuIndex < 1) {
    throw new Error('vuIndex must be a positive integer');
  }
  return list[(vuIndex - 1) % list.length];
}

/**
 * Build the JSON payload for the generate-phone-otp endpoint.
 */
function buildOtpPayload(phone, countryCode, recaptchaToken) {
  if (!phone || !countryCode) {
    throw new Error('phone and countryCode are required');
  }
  return {
    phone,
    countryCode,
    recaptchaToken: recaptchaToken || '',
  };
}

/**
 * Build the JSON payload for the verify-phone-otp endpoint.
 */
function buildVerifyOtpPayload({ phone, otp, refId, countryCode, isFromTCP, codeChallenge, codeVerifier }) {
  if (!phone || !otp || !refId || !countryCode) {
    throw new Error('phone, otp, refId, and countryCode are required');
  }
  return {
    phone,
    otp,
    refId,
    countryCode,
    isFromTCP: isFromTCP !== undefined ? isFromTCP : false,
    codeChallenge: codeChallenge || '',
    codeVerifier: codeVerifier || '',
  };
}

/**
 * Build standard JSON headers used by OTP API requests.
 */
function buildJsonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Validate an OTP response body (parsed JSON) to check for errors.
 * Returns true if the response looks successful (no error fields).
 */
function isOtpResponseValid(jsonBody) {
  if (!jsonBody) return false;
  return !jsonBody.error && !jsonBody.errorCode;
}

module.exports = {
  TEST_PHONES,
  pickPhone,
  buildOtpPayload,
  buildVerifyOtpPayload,
  buildJsonHeaders,
  isOtpResponseValid,
};
