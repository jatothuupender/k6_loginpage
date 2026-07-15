import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 200,
    duration: '120s',
};

export default function () {

    const url = 'https://api-uatv2.tajhotels.com/ssoService/verify-phone-otp';

    const payload = JSON.stringify({
        phone: "7659086950",
        otp: "254265",
        refId: "3b857f7e-c19c-4c37-9b47-dab806474e14",
        countryCode: "+91",
        isFromTCP: false,
        codeChallenge: "dXfbsZzxtEGf_ImqvaB4fFnhYiuyYd3bgmOpoxrr-3A",
        codeVerifier: "aDyMG7xk701_4UENI_X.-eY_EDNEvuBjD4alL5n18PYG2JRqEfwhrL4kjCeTrnQP"
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    let res = http.post(url, payload, params);

    const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'response body is not empty': (r) => r.body && r.body.length > 0,
        'response has success field': (r) => {
            try {
                const json = r.json();
                return json.success !== undefined;
            } catch (e) {
                console.error(`[VU ${__VU}] Failed to parse JSON response: ${e.message}`);
                return false;
            }
        },
    });

    if (!passed) {
        console.error(`[VU ${__VU}] Verify OTP failed | status=${res.status} | body=${res.body}`);
    }

    sleep(1);
}