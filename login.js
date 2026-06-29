import { check, sleep } from 'k6';
import { BASE_URL } from './utils/config.js';
import { postJson } from './utils/http-helpers.js';
import { checkStatus } from './utils/checks.js';

export const options = {
    vus: 200,
    duration: '120s',
};

export default function () {
    const payload = {
        phone: "7659086950",
        otp: "254265",
        refId: "3b857f7e-c19c-4c37-9b47-dab806474e14",
        countryCode: "+91",
        isFromTCP: false,
        codeChallenge: "dXfbsZzxtEGf_ImqvaB4fFnhYiuyYd3bgmOpoxrr-3A",
        codeVerifier: "aDyMG7xk701_4UENI_X.-eY_EDNEvuBjD4alL5n18PYG2JRqEfwhrL4kjCeTrnQP"
    };

    const res = postJson(`${BASE_URL}/ssoService/verify-phone-otp`, payload);

    check(res, {
        'response has success': (r) => r.json('success') !== null,
    });
    checkStatus(res, 'status is 200');

    sleep(1);
}
