import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Custom metrics for tracking failures per step
// ---------------------------------------------------------------------------
const availabilityErrors = new Counter('step1_availability_errors');
const cartErrors         = new Counter('step2_cart_errors');
const fetchOrderErrors   = new Counter('step3_fetch_order_errors');
const tokenErrors        = new Counter('step4_token_errors');
const confirmErrors      = new Counter('step5_confirm_errors');

export const options = {
    vus: 50,
    duration: '120s',
};

const BASE_URL = 'https://api-uatv2.tajhotels.com';

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const customerHash = __ENV.CUSTOMER_HASH || 'f34f41f4fb9fe59afb433029b871a151';
const jwtToken     = __ENV.JWT_TOKEN     || 'PASTE_JWT_TOKEN';

// ---------------------------------------------------------------------------
// Helper – safely parse JSON response, logging on failure
// ---------------------------------------------------------------------------
function safeParseJson(res, stepName) {
    try {
        return res.json();
    } catch (e) {
        console.error(`[VU ${__VU}] ${stepName}: Failed to parse JSON | status=${res.status} | body=${res.body}`);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------
export function setup() {
    if (jwtToken === 'PASTE_JWT_TOKEN') {
        console.warn('WARNING: JWT_TOKEN env var not set – token validation and order confirmation will fail.');
        console.warn('  Usage: k6 run -e JWT_TOKEN=<your_token> Taj_full_booking.js');
    }
}

export default function () {

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
        isLogin: true,
    });

    let availabilityRes = http.post(
        `${BASE_URL}/hudiniService/v1/hotel-availability`,
        availabilityPayload,
        { headers, tags: { name: 'hotel_availability' } }
    );

    let availabilityOk = check(availabilityRes, {
        'Step1: status is 200': (r) => r.status === 200,
        'Step1: body is not empty': (r) => r.body && r.body.length > 0,
        'Step1: no error in response': (r) => {
            const json = safeParseJson(r, 'Step1-Availability');
            return json !== null && !json.error && !json.errorCode;
        },
    });

    if (!availabilityOk) {
        availabilityErrors.add(1);
        console.error(`[VU ${__VU}] Step1 FAILED: Hotel Availability | status=${availabilityRes.status} | body=${availabilityRes.body}`);
        return; // Abort iteration – subsequent steps depend on availability
    }

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
            hotelId: "e1058dfa-fe44-4933-bb1b-85621258d217",
        }],
    });

    let cartRes = http.post(
        `${BASE_URL}/cartService/v1/cart/add-to-cart`,
        addCartPayload,
        { headers: cartHeaders, tags: { name: 'add_to_cart' } }
    );

    let cartOk = check(cartRes, {
        'Step2: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'Step2: body is not empty': (r) => r.body && r.body.length > 0,
        'Step2: no error in response': (r) => {
            const json = safeParseJson(r, 'Step2-AddToCart');
            return json !== null && !json.error && !json.errorCode;
        },
    });

    if (!cartOk) {
        cartErrors.add(1);
        console.error(`[VU ${__VU}] Step2 FAILED: Add To Cart | status=${cartRes.status} | body=${cartRes.body}`);
        return; // Abort – cannot proceed without a cart
    }

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
        journeyType: "PAY LATER",
    });

    let fetchRes = http.post(
        `${BASE_URL}/paymentService/v1/juspay/fetch-order`,
        fetchPayload,
        { headers: fetchHeaders, tags: { name: 'fetch_order' } }
    );

    let fetchOk = check(fetchRes, {
        'Step3: status is 200': (r) => r.status === 200,
        'Step3: body is not empty': (r) => r.body && r.body.length > 0,
        'Step3: no error in response': (r) => {
            const json = safeParseJson(r, 'Step3-FetchOrder');
            return json !== null && !json.error && !json.errorCode;
        },
    });

    if (!fetchOk) {
        fetchOrderErrors.add(1);
        console.error(`[VU ${__VU}] Step3 FAILED: Fetch Order | status=${fetchRes.status} | body=${fetchRes.body}`);
        return; // Abort – cannot confirm without a fetched order
    }

    sleep(2);

    // STEP 4 - Validate Token
    if (jwtToken === 'PASTE_JWT_TOKEN') {
        tokenErrors.add(1);
        console.error(`[VU ${__VU}] Step4 SKIPPED: JWT token not configured`);
        return; // Cannot proceed without a valid token
    }

    let tokenHeaders = {
        Authorization: `Bearer ${jwtToken}`,
        Accept: 'application/json',
    };

    let tokenRes = http.get(
        `${BASE_URL}/ssoService/validate-token`,
        { headers: tokenHeaders, tags: { name: 'validate_token' } }
    );

    let tokenOk = check(tokenRes, {
        'Step4: status is 200': (r) => r.status === 200,
        'Step4: token is valid': (r) => {
            const json = safeParseJson(r, 'Step4-ValidateToken');
            return json !== null && !json.error && !json.errorCode;
        },
    });

    if (!tokenOk) {
        tokenErrors.add(1);
        console.error(`[VU ${__VU}] Step4 FAILED: Validate Token | status=${tokenRes.status} | body=${tokenRes.body}`);
        return; // Abort – cannot confirm order with invalid auth
    }

    sleep(2);

    // STEP 5 - Confirm Order
    let confirmHeaders = {
        ...headers,
        customerhash: customerHash,
        jwttoken: jwtToken,
        clientid: '67827000.1772099402',
    };

    let confirmPayload = JSON.stringify({
        orderId: "UWeb_72469-26114418",
    });

    let confirmRes = http.post(
        `${BASE_URL}/orderService/v1/orders/confirm-order`,
        confirmPayload,
        { headers: confirmHeaders, tags: { name: 'confirm_order' } }
    );

    let confirmOk = check(confirmRes, {
        'Step5: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'Step5: body is not empty': (r) => r.body && r.body.length > 0,
        'Step5: no error in response': (r) => {
            const json = safeParseJson(r, 'Step5-ConfirmOrder');
            return json !== null && !json.error && !json.errorCode;
        },
    });

    if (!confirmOk) {
        confirmErrors.add(1);
        console.error(`[VU ${__VU}] Step5 FAILED: Confirm Order | status=${confirmRes.status} | body=${confirmRes.body}`);
    }

    sleep(1);
}