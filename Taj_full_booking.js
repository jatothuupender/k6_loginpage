import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 50,
    duration: '120s'
    

};

const BASE_URL = 'https://api-uatv2.tajhotels.com';

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const customerHash = __ENV.CUSTOMER_HASH; // required – pass via -e CUSTOMER_HASH=<hash>
const jwtToken     = __ENV.JWT_TOKEN;      // required – pass via -e JWT_TOKEN=<token>

export default function () {
    if (!customerHash || !jwtToken) {
        console.error('Missing required env vars: CUSTOMER_HASH, JWT_TOKEN');
        return;
    }

    // STEP 1 - Hotel Availability
    let availabilityPayload = JSON.stringify({
        endDate: "2026-06-03",
        numRooms: 1,
        adults: 1,
        children: 0,
        startDate: "2026-06-02",
        hotelId: "e1058dfa-fe44-4933-bb1b-85621258d217",
        rateFilter: "RRG,PKG,MD",
        memberTier: "Gold",
        package: "PKG",
        isOfferLandingPage: false,
        isLogin: true
    });

    let availabilityRes = http.post(
        `${BASE_URL}/hudiniService/v1/hotel-availability`,
        availabilityPayload,
        { headers }
    );

    console.log('Availability Status: ' + availabilityRes.status);

    check(availabilityRes, {
        'availability success': (r) => r.status === 200,
    });

    sleep(2);

    // STEP 2 - Add To Cart
    let cartHeaders = {
        ...headers,
        customerhash: customerHash,
    };

    let addCartPayload = JSON.stringify({
        category: "Hotel booking",
        hotel: [{
            city: "Mumbai",
            hotelName: "Taj Lands End, Mumbai",
            checkIn: "2026-06-02",
            checkOut: "2026-06-03",
            hotelId: "e1058dfa-fe44-4933-bb1b-85621258d217"
        }]
    });

    let cartRes = http.post(
        `${BASE_URL}/cartService/v1/cart/add-to-cart`,
        addCartPayload,
        { headers: cartHeaders }
    );

    console.log('Add Cart Status: ' + cartRes.status);

    check(cartRes, {
        'cart added': (r) => r.status === 200 || r.status === 201,
    });

    sleep(2);

    // STEP 3 - Fetch Order
    let fetchHeaders = {
        ...headers,
        customerhash: customerHash,
        'offer-type': '1',
    };

    let fetchPayload = JSON.stringify({
        orderId: "UWeb_72469",
        returnUrl: "https://web-uatv2.tajhotels.com/en-in/booking/booking-confirmed",
        isLogin: true,
        journeyType: "PAY LATER"
    });

    let fetchRes = http.post(
        `${BASE_URL}/paymentService/v1/juspay/fetch-order`,
        fetchPayload,
        { headers: fetchHeaders }
    );

    console.log('Fetch Order Status: ' + fetchRes.status);

    check(fetchRes, {
        'fetch order success': (r) => r.status === 200,
    });

    sleep(2);

    // STEP 4 - Validate Token
    let tokenHeaders = {
        Authorization: `Bearer ${jwtToken}`,
        Accept: 'application/json',
    };

    let tokenRes = http.get(
        `${BASE_URL}/ssoService/validate-token`,
        { headers: tokenHeaders }
    );

    console.log('Validate Token Status: ' + tokenRes.status);

    check(tokenRes, {
        'token valid': (r) => r.status === 200,
    });

    sleep(2);

    // STEP 5 - Confirm Order
    const clientId = __ENV.CLIENT_ID || '';

    let confirmHeaders = {
        ...headers,
        customerhash: customerHash,
        jwttoken: jwtToken,
        clientid: clientId,
    };

    let confirmPayload = JSON.stringify({
        orderId: "UWeb_72469-26114418"
    });

    let confirmRes = http.post(
        `${BASE_URL}/orderService/v1/orders/confirm-order`,
        confirmPayload,
        { headers: confirmHeaders }
    );

    console.log('Confirm Order Status: ' + confirmRes.status);

    check(confirmRes, {
        'order confirmed': (r) => r.status === 200 || r.status === 201,
    });

    sleep(1);
}