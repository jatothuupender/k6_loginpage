import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
    let response = http.get('https://web-uatv2.tajhotels.com/en-in');

    const passed = check(response, {
        'status is 200': (r) => r.status === 200,
        'response body is not empty': (r) => r.body && r.body.length > 0,
    });

    if (!passed) {
        console.error(`[VU ${__VU}] Request failed | status=${response.status} | body=${response.body}`);
    }

    sleep(1);
}