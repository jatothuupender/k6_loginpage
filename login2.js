import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const otpLatency   = new Trend('otp_generation_latency', true);
const otpSuccess   = new Rate('otp_generation_success_rate');
const otpErrors    = new Counter('otp_generation_errors');

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------
export const options = {
    
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 VUs
    { duration: '1m',  target: 10 },   // Hold at 10 VUs
    { duration: '30s', target: 50 },   // Ramp up to 50 VUs
    { duration: '2m',  target: 50 },   // Hold at 50 VUs
    { duration: '30s', target: 0  },   // Ramp down
  ],
  thresholds: {
    http_req_duration:             ['p(95)<3000'],   // 95th percentile < 3 s
    otp_generation_success_rate:   ['rate>0.95'],    // >95 % success
    otp_generation_latency:        ['p(90)<2000'],   // 90th percentile < 2 s
  },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BASE_URL = 'https://api-uatv2.tajhotels.com';

// Test phone numbers – rotate across VUs so the API doesn't see the same
// number in every concurrent request.
const TEST_PHONES = [
  { phone: '7659086950', countryCode: '91' },
  { phone: '9876543210', countryCode: '91' },
  { phone: '8765432109', countryCode: '91' },
  { phone: '7654321098', countryCode: '91' },
  { phone: '6543210987', countryCode: '91' },
];

// NOTE: reCAPTCHA tokens are single-use and expire quickly.
// In a real load test you must either:
//   (a) bypass reCAPTCHA in UAT (ask the Taj dev team for a bypass header/key), OR
//   (b) generate a fresh token per iteration via a headless browser (e.g. k6-browser).
// Always pass a fresh token via: k6 run -e RECAPTCHA_TOKEN=<token> login2.js
const RECAPTCHA_TOKEN = __ENV.RECAPTCHA_TOKEN;

// ---------------------------------------------------------------------------
// Helper – pick a test phone number for the current VU
// ---------------------------------------------------------------------------
function pickPhone() {
  return TEST_PHONES[(__VU - 1) % TEST_PHONES.length];
}

// ---------------------------------------------------------------------------
// Step 1 – Generate OTP
// ---------------------------------------------------------------------------
function generateOtp(phone, countryCode) {
  const url     = `${BASE_URL}/ssoService/generate-phone-otp`;
  const payload = JSON.stringify({
    phone,
    countryCode,
    recaptchaToken: RECAPTCHA_TOKEN,
  });
  const params  = {
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    tags: { name: 'generate_phone_otp' },
  };

  const res = http.post(url, payload, params);

  // Record custom metrics
  otpLatency.add(res.timings.duration);
  const ok = check(res, {
    'OTP: status is 200':           (r) => r.status === 200,
    'OTP: response has body':       (r) => r.body && r.body.length > 0,
    'OTP: no error in body':        (r) => {
      try {
        const json = r.json();
        return !json.error && !json.errorCode;
      } catch (_) {
        return false;
      }
    },
  });

  if (!ok) {
    otpErrors.add(1);
    console.error(`[VU ${__VU}] OTP failed | status=${res.status} | body=${res.body}`);
  }
  otpSuccess.add(ok ? 1 : 0);

  return { res, ok };
}

// ---------------------------------------------------------------------------
// Step 2 – Verify OTP  (extend this once you have the verify endpoint)
// ---------------------------------------------------------------------------
// function verifyOtp(phone, countryCode, otp) {
//   const url     = `${BASE_URL}/ssoService/verify-phone-otp`;
//   const payload = JSON.stringify({ phone, countryCode, otp });
//   const params  = {
//     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//     tags: { name: 'verify_phone_otp' },
//   };
//   const res = http.post(url, payload, params);
//   check(res, {
//     'Verify OTP: status is 200': (r) => r.status === 200,
//   });
//   return res;
// }

// ---------------------------------------------------------------------------
// Default function (executed per VU per iteration)
// ---------------------------------------------------------------------------
export default function () {
  if (!RECAPTCHA_TOKEN) {
    console.error('Missing required env var: RECAPTCHA_TOKEN. Pass via -e RECAPTCHA_TOKEN=<token>');
    return;
  }

  const { phone, countryCode } = pickPhone();

  // --- Step 1: Generate OTP ---
  const { res: otpRes, ok } = generateOtp(phone, countryCode);

  if (ok) {
    // Simulate user reading the OTP SMS (realistic think time)
    sleep(Math.random() * 3 + 2); // 2–5 s

    // --- Step 2: Verify OTP (uncomment when endpoint is known) ---
    // const otp = '123456'; // In real tests, parse from a mock/stub SMS service
    // verifyOtp(phone, countryCode, otp);
  }

  // Think time between iterations
  sleep(Math.random() * 2 + 1); // 1–3 s
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------
export function setup() {
  console.log('=== Taj Hotels – OTP Login Load Test ===');
  console.log(`Target: ${BASE_URL}`);
  console.log('NOTE: reCAPTCHA tokens are single-use. Tests may fail at scale');
  console.log('      unless the UAT environment has reCAPTCHA bypass enabled.');
  console.log('      Pass a fresh token via: k6 run -e RECAPTCHA_TOKEN=<token> script.js');
}

export function teardown(data) {
  console.log('=== Test Complete ===');
}