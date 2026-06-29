// ---------------------------------------------------------------------------
// Booking-flow helpers extracted from Taj_full_booking.js for testability
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api-uatv2.tajhotels.com';

/**
 * Build the hotel-availability request payload.
 */
function buildAvailabilityPayload({
  startDate,
  endDate,
  numRooms = 1,
  adults = 1,
  children = 0,
  hotelId,
  rateFilter = 'RRG,PKG,MD',
  memberTier = 'Gold',
  packageType = 'PKG',
  isOfferLandingPage = false,
  isLogin = true,
} = {}) {
  if (!startDate || !endDate || !hotelId) {
    throw new Error('startDate, endDate, and hotelId are required');
  }
  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error('endDate must be after startDate');
  }
  if (numRooms < 1) {
    throw new Error('numRooms must be at least 1');
  }
  if (adults < 1) {
    throw new Error('adults must be at least 1');
  }
  if (children < 0) {
    throw new Error('children cannot be negative');
  }
  return {
    endDate,
    numRooms,
    adults,
    children,
    startDate,
    hotelId,
    rateFilter,
    memberTier,
    package: packageType,
    isOfferLandingPage,
    isLogin,
  };
}

/**
 * Build the add-to-cart request payload.
 */
function buildAddToCartPayload({ city, hotelName, checkIn, checkOut, hotelId, category = 'Hotel booking' } = {}) {
  if (!city || !hotelName || !checkIn || !checkOut || !hotelId) {
    throw new Error('city, hotelName, checkIn, checkOut, and hotelId are required');
  }
  return {
    category,
    hotel: [{
      city,
      hotelName,
      checkIn,
      checkOut,
      hotelId,
    }],
  };
}

/**
 * Build the fetch-order request payload.
 */
function buildFetchOrderPayload({ orderId, returnUrl, isLogin = true, journeyType = 'PAY LATER' } = {}) {
  if (!orderId || !returnUrl) {
    throw new Error('orderId and returnUrl are required');
  }
  return {
    orderId,
    returnUrl,
    isLogin,
    journeyType,
  };
}

/**
 * Build the confirm-order request payload.
 */
function buildConfirmOrderPayload({ orderId } = {}) {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  return { orderId };
}

/**
 * Build standard JSON headers used by booking API requests.
 */
function buildBookingHeaders({ customerHash, jwtToken, clientId } = {}) {
  const base = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (customerHash) base.customerhash = customerHash;
  if (jwtToken) base.jwttoken = jwtToken;
  if (clientId) base.clientid = clientId;
  return base;
}

/**
 * Build the endpoint URL for a given service path.
 */
function buildEndpointUrl(path, baseUrl) {
  const base = baseUrl || DEFAULT_BASE_URL;
  if (!path) {
    throw new Error('path is required');
  }
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

module.exports = {
  DEFAULT_BASE_URL,
  buildAvailabilityPayload,
  buildAddToCartPayload,
  buildFetchOrderPayload,
  buildConfirmOrderPayload,
  buildBookingHeaders,
  buildEndpointUrl,
};
