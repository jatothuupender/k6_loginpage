import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '20s', target: 5 },
        { duration: '40s', target: 10 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<3000'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://api-uatv2.tajhotels.com';
const CITY = __ENV.CITY || 'Hyderabad';
const HOTEL_ID = __ENV.HOTEL_ID || 'TAJKRISHNA';
const CHECK_IN = __ENV.CHECK_IN || '2026-08-10';
const CHECK_OUT = __ENV.CHECK_OUT || '2026-08-12';
const ADULTS = Number(__ENV.ADULTS || 2);
const CHILDREN = Number(__ENV.CHILDREN || 0);

const commonParams = {
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    timeout: '90s',
};

function buildPayload() {
    return JSON.stringify({
        hotelId: HOTEL_ID,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        adults: ADULTS,
        children: CHILDREN,
    });
}

export default function () {
    const payload = buildPayload();

    const destinationRes = http.get(
        `${BASE_URL}/hotelService/search?city=${encodeURIComponent(CITY)}`,
        commonParams
    );

    check(destinationRes, {
        'Destination search returns 200': (r) => r.status === 200,
    });

    sleep(1);

    const hotelRes = http.get(
        `${BASE_URL}/hotelService/hotel-details?hotelId=${HOTEL_ID}`,
        commonParams
    );

    check(hotelRes, {
        'Hotel details returns 200': (r) => r.status === 200,
    });

    sleep(1);

    const availabilityRes = http.post(
        `${BASE_URL}/bookingService/checkAvailability`,

        payload,
        commonParams
    );

    check(availabilityRes, {
        'Availability returns 200': (r) => r.status === 200,
    });

    sleep(1);

    const priceRes = http.post(
        `${BASE_URL}/bookingService/price-summary`,
        payload,
        commonParams
    );

    check(priceRes, {
        'Price summary returns 200': (r) => r.status === 200,
    });

    sleep(1);

    const bookingRes = http.post(
        `${BASE_URL}/bookingService/createBooking`,
        payload,
        commonParams
    );

    check(bookingRes, {
        'Booking creation returns 200': (r) => r.status === 200,
    });

    sleep(2);
}