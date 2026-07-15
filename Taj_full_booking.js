import { sleep } from 'k6';
import { BASE_URL } from './utils/config.js';
import { postJson, getJson } from './utils/http-helpers.js';
import { checkStatus, checkStatusOk } from './utils/checks.js';

export const options = {
    vus: 50,
    duration: '120s'
};

const customerHash = 'f34f41f4fb9fe59afb433029b871a151';
const jwtToken = 'PASTE_JWT_TOKEN';

export default function () {

    // STEP 1 - Hotel Availability
    const availabilityRes = postJson(
        `${BASE_URL}/hudiniService/v1/hotel-availability`,
        {
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
        }
    );
    checkStatus(availabilityRes, 'availability success');
    sleep(2);

    // STEP 2 - Add To Cart
    const cartRes = postJson(
        `${BASE_URL}/cartService/v1/cart/add-to-cart`,
        {
            category: "Hotel booking",
            hotel: [{
                city: "Mumbai",
                hotelName: "Taj Lands End, Mumbai",
                checkIn: "2026-06-02",
                checkOut: "2026-06-03",
                hotelId: "e1058dfa-fe44-4933-bb1b-85621258d217"
            }]
        },
        { extraHeaders: { customerhash: customerHash } }
    );
    checkStatusOk(cartRes, 'cart added');
    sleep(2);

    // STEP 3 - Fetch Order
    const fetchRes = postJson(
        `${BASE_URL}/paymentService/v1/juspay/fetch-order`,
        {
            orderId: "UWeb_72469",
            returnUrl: "https://web-uatv2.tajhotels.com/en-in/booking/booking-confirmed",
            isLogin: true,
            journeyType: "PAY LATER"
        },
        {
            extraHeaders: { customerhash: customerHash, 'offer-type': '1' },
            logBody: true,
        }
    );
    checkStatus(fetchRes, 'fetch order success');
    sleep(2);

    // STEP 4 - Validate Token
    const tokenRes = getJson(
        `${BASE_URL}/ssoService/validate-token`,
        { extraHeaders: { Authorization: `Bearer ${jwtToken}` } }
    );
    checkStatus(tokenRes, 'token valid');
    sleep(2);

    // STEP 5 - Confirm Order
    const confirmRes = postJson(
        `${BASE_URL}/orderService/v1/orders/confirm-order`,
        { orderId: "UWeb_72469-26114418" },
        {
            extraHeaders: {
                customerhash: customerHash,
                jwttoken: jwtToken,
                clientid: '67827000.1772099402',
            },
            logBody: true,
        }
    );
    checkStatusOk(confirmRes, 'order confirmed');
    sleep(1);
}
