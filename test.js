import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
    const response = http.get('https://web-uatv2.tajhotels.com/en-in');
    console.log('Status Code: ' + response.status);
    sleep(1);
}
