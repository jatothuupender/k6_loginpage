import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL } from './utils/config.js';
import { postJson } from './utils/http-helpers.js';
import { checkStatus, checkNoError } from './utils/checks.js';

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

// Test phone numbers - rotate across VUs so the API doesn't see the same
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
// The token below is from the captured request; replace it or use the env var.
const RECAPTCHA_TOKEN = __ENV.RECAPTCHA_TOKEN ||
  '0cAFcWeA7TkJCEFy1gn6O53Is24GwitkRDYq6Oq2sgrAtCnDbTOWFCu2jjMEn-7dY0LTuknr7hweI0l46NFTdGpj8sCZ1WEE53g6gzIR_wrU697F6uPu1N83MKEVXiPnKXU1b3DOMd7VM_M0Fc3JtmQ1NTni0mzgYI1hrkf-asa26azEjeAiljs6hK0yuF_mNDo1VX10DaGOlBb_eLLymAeamBgnRb1Zp_FkV1DCAchp_PpHPwbcsgnvtJBhJpyh-wH4_a-vB2_uf9GmXK2q94EoKWWDTtjcPlrzN9oQ0MBoKcXMBkqGbW3dSVdqJRjTtBt7ZNK8HlimbSFFEVE_-ZhtTmIwO-gx02TBjVrfB9auzin3T17TXVLQpuFvAed_fX7bCF6Vj_SGysYOmCFPU9EnJ-j1DQtf0L-sCyiweZPyhezEeUEGndcJww3qCGi7yJVkpMG49WgmCxiAfcZawrQlH2_OxscmkHp5-KZ_gp0jpWsmEcMo9SdRFhbxpTUK2EB9sn1ajszMZVJF3dGf5WTn5yXLQJcYZbNtB4t_sz1OVPWZEvvYwF3DWg9_UThzYeCAcy9NMWNlF18Y8x15WRGj3-Sn-rkiC3xaQ0p6ssOxnmZnBIgJie2dqFOcMIXu0yq8UrF6VdZaIKBRo6ttpaXuMLy77gwSscU9a4LRBJNusSTrZcxWEHdIfYax5VKNSFBoO0A8vek5ZOqAT2sV3L-oJnAr1Uo3ELsj_HPCLZ0VW2GCwUMut3fRV8k3A8MMmmIdGxRfHGkmh8sqDy7S3--lCdzyID_rofD3fwpRsovn7B4HcRocnB1LMx-XJKrgVMn_wZexzvexMi1Jz5iG0EW9uwAlTgU5gwFwOUGasERdp844EbE0bXpcgcPRoiqJU6J3QPG1biHUM_kg7cQCLeKwflSHyJMXDQPIwLL94fjZQeUsCpNnlP2x53W75fSyJAeLR88Nzt4knmIOgTMJimppVcwKevrHWK6oJFwg_Ydw1wcaF0-yMXZaXedhAgwZ2ZkMgfIrlUdxSbRdYnyIs_kFIpwWMr7e2Y5lq-WrRUll5DmN_i7YTLMywP37fNgkP0BNPXu2DbbYrTqUQL0DU2kOigaolE6avYvkR4Utxc9MY19pomPl9a8jTR-KDHtJxdoDnwcqQDBSvL1viyqiGiQKxSqfRuGu6DeQDNb-_nAa6yCqlEgVpoSU5vC1yQaF7Nek776BeNNtHKVudR3zjunLf23ytxAxSj8XTHooIt_XVSGIH_fkICN61sRSVR9vt8ZCJt8km8VYjkF5V3vZ44bz_geF11wDVBk4QW1Bg9Bz1iDG3f_h-OqutZvt5NzNKIy88XhKp_AUy0WgzZ-3_CoEGw2B7PXPPMu-6-jalZfcaOSTmEByubYvXf-6nejxRLGoPuoL9_hlwMuAo5MMTkHs67ejcIZlYXV6FdvhZDa9GqsBig5vTJdUlYVq_etM95q7tZLAG_eFLdBWsku5T4YGolna3VmQ0qQytv1pScM3PC7bTU39Yov_QLH2BCgpYpI4VG7i9yeXEr3MWT2yaGMt4j2n8koIbAkF0Dm9f7hAYTN871xran_IVnaGUSkLF6Y12TF4vdHe9N9MhHIeUxgqyPgVgP1qH3rAHZVyhfrSvzdzmatRTlxGTJ6uFNSuEYc46ELsFzVdHWKTkz4w4Ja6DDnSAwGGlgCv2mNecHrchQEma9h61gxA2ki4Dp9vrRJVckUXJ7aq0Re-ELmlLT02Xea3D3Jx9DKeeMJwMMgpwsvZh_SS2xufQxzFDjx7rzx_AHC56razetVGG_uaiYcGty7uNwPV6me1z6o8ZGouiYxkpHHj4bGaNVKeANjCn7fPL0vgTsWslgKi34gKGJr8jhwBEDM6aErd9cvh1Qjmu4aQ2Xj8WoFfJtpHOM8HSuWuQDjh9IEJPOlORFHPDEqEaXjoT03l2I71h8L9IEkIdRNtdb1N3XMi70_vfNid8eY9bvkSlCa7H';

// ---------------------------------------------------------------------------
// Helper - pick a test phone number for the current VU
// ---------------------------------------------------------------------------
function pickPhone() {
  return TEST_PHONES[(__VU - 1) % TEST_PHONES.length];
}

// ---------------------------------------------------------------------------
// Step 1 - Generate OTP
// ---------------------------------------------------------------------------
function generateOtp(phone, countryCode) {
  const payload = { phone, countryCode, recaptchaToken: RECAPTCHA_TOKEN };

  const res = postJson(
    `${BASE_URL}/ssoService/generate-phone-otp`,
    payload,
    { tags: { name: 'generate_phone_otp' } }
  );

  // Record custom metrics
  otpLatency.add(res.timings.duration);

  const statusOk = checkStatus(res, 'OTP: status is 200');
  const bodyOk = checkNoError(res, 'OTP');
  const ok = statusOk && bodyOk;

  if (!ok) {
    otpErrors.add(1);
    console.error(`[VU ${__VU}] OTP failed | status=${res.status} | body=${res.body}`);
  }
  otpSuccess.add(ok ? 1 : 0);

  return { res, ok };
}

// ---------------------------------------------------------------------------
// Step 2 - Verify OTP  (extend this once you have the verify endpoint)
// ---------------------------------------------------------------------------
// function verifyOtp(phone, countryCode, otp) {
//   const res = postJson(
//     `${BASE_URL}/ssoService/verify-phone-otp`,
//     { phone, countryCode, otp },
//     { tags: { name: 'verify_phone_otp' } }
//   );
//   checkStatus(res, 'Verify OTP: status is 200');
//   return res;
// }

// ---------------------------------------------------------------------------
// Default function (executed per VU per iteration)
// ---------------------------------------------------------------------------
export default function () {
  const { phone, countryCode } = pickPhone();

  // --- Step 1: Generate OTP ---
  const { res: otpRes, ok } = generateOtp(phone, countryCode);

  if (ok) {
    // Simulate user reading the OTP SMS (realistic think time)
    sleep(Math.random() * 3 + 2); // 2-5 s

    // --- Step 2: Verify OTP (uncomment when endpoint is known) ---
    // const otp = '123456'; // In real tests, parse from a mock/stub SMS service
    // verifyOtp(phone, countryCode, otp);
  }

  // Think time between iterations
  sleep(Math.random() * 2 + 1); // 1-3 s
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------
export function setup() {
  console.log('=== Taj Hotels - OTP Login Load Test ===');
  console.log(`Target: ${BASE_URL}`);
  console.log('NOTE: reCAPTCHA tokens are single-use. Tests may fail at scale');
  console.log('      unless the UAT environment has reCAPTCHA bypass enabled.');
  console.log('      Pass a fresh token via: k6 run -e RECAPTCHA_TOKEN=<token> script.js');
}

export function teardown(data) {
  console.log('=== Test Complete ===');
}
