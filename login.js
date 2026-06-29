import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 200,
    duration: '120s',
};

const BASE_URL       = __ENV.BASE_URL       || 'https://api-uatv2.tajhotels.com';
const TEST_PHONE     = __ENV.TEST_PHONE     || '7659086950';
const TEST_OTP       = __ENV.TEST_OTP;      // required – do not hardcode OTPs
const REF_ID         = __ENV.REF_ID;        // required – session-specific
const COUNTRY_CODE   = __ENV.COUNTRY_CODE   || '+91';
const CODE_CHALLENGE = __ENV.CODE_CHALLENGE; // required – PKCE value
const CODE_VERIFIER  = __ENV.CODE_VERIFIER;  // required – PKCE value

export default function () {
    if (!TEST_OTP || !REF_ID || !CODE_CHALLENGE || !CODE_VERIFIER) {
        console.error('Missing required env vars: TEST_OTP, REF_ID, CODE_CHALLENGE, CODE_VERIFIER');
        return;
    }

    const url = `${BASE_URL}/ssoService/verify-phone-otp`;

    const payload = JSON.stringify({
        phone: TEST_PHONE,
        otp: TEST_OTP,
        refId: REF_ID,
        countryCode: COUNTRY_CODE,
        isFromTCP: false,
        codeChallenge: CODE_CHALLENGE,
        codeVerifier: CODE_VERIFIER,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    let res = http.post(url, payload, params);

    console.log('Status Code: ' + res.status);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has success': (r) => r.json('success') !== null,
    });

    sleep(1);
}