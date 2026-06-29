const {
  DEFAULT_BASE_URL,
  buildAvailabilityPayload,
  buildAddToCartPayload,
  buildFetchOrderPayload,
  buildConfirmOrderPayload,
  buildBookingHeaders,
  buildEndpointUrl,
} = require('../utils/booking-helpers');

// ---------------------------------------------------------------------------
// DEFAULT_BASE_URL
// ---------------------------------------------------------------------------
describe('DEFAULT_BASE_URL', () => {
  it('points to the UAT API', () => {
    expect(DEFAULT_BASE_URL).toBe('https://api-uatv2.tajhotels.com');
  });
});

// ---------------------------------------------------------------------------
// buildAvailabilityPayload
// ---------------------------------------------------------------------------
describe('buildAvailabilityPayload', () => {
  const validArgs = {
    startDate: '2026-06-02',
    endDate: '2026-06-03',
    hotelId: 'e1058dfa-fe44-4933-bb1b-85621258d217',
  };

  it('returns correct payload with required fields only', () => {
    const result = buildAvailabilityPayload(validArgs);
    expect(result).toEqual({
      startDate: '2026-06-02',
      endDate: '2026-06-03',
      numRooms: 1,
      adults: 1,
      children: 0,
      hotelId: 'e1058dfa-fe44-4933-bb1b-85621258d217',
      rateFilter: 'RRG,PKG,MD',
      memberTier: 'Gold',
      package: 'PKG',
      isOfferLandingPage: false,
      isLogin: true,
    });
  });

  it('accepts custom optional values', () => {
    const result = buildAvailabilityPayload({
      ...validArgs,
      numRooms: 3,
      adults: 2,
      children: 1,
      rateFilter: 'RRG',
      memberTier: 'Platinum',
      packageType: 'MD',
      isOfferLandingPage: true,
      isLogin: false,
    });
    expect(result.numRooms).toBe(3);
    expect(result.adults).toBe(2);
    expect(result.children).toBe(1);
    expect(result.rateFilter).toBe('RRG');
    expect(result.memberTier).toBe('Platinum');
    expect(result.package).toBe('MD');
    expect(result.isOfferLandingPage).toBe(true);
    expect(result.isLogin).toBe(false);
  });

  it('throws when startDate is missing', () => {
    expect(() => buildAvailabilityPayload({ endDate: '2026-06-03', hotelId: 'x' })).toThrow(
      'startDate, endDate, and hotelId are required'
    );
  });

  it('throws when endDate is missing', () => {
    expect(() => buildAvailabilityPayload({ startDate: '2026-06-02', hotelId: 'x' })).toThrow(
      'startDate, endDate, and hotelId are required'
    );
  });

  it('throws when hotelId is missing', () => {
    expect(() =>
      buildAvailabilityPayload({ startDate: '2026-06-02', endDate: '2026-06-03' })
    ).toThrow('startDate, endDate, and hotelId are required');
  });

  it('throws when endDate is before startDate', () => {
    expect(() =>
      buildAvailabilityPayload({ ...validArgs, startDate: '2026-06-05', endDate: '2026-06-03' })
    ).toThrow('endDate must be after startDate');
  });

  it('throws when endDate equals startDate', () => {
    expect(() =>
      buildAvailabilityPayload({ ...validArgs, startDate: '2026-06-03', endDate: '2026-06-03' })
    ).toThrow('endDate must be after startDate');
  });

  it('throws when numRooms is less than 1', () => {
    expect(() => buildAvailabilityPayload({ ...validArgs, numRooms: 0 })).toThrow(
      'numRooms must be at least 1'
    );
  });

  it('throws when adults is less than 1', () => {
    expect(() => buildAvailabilityPayload({ ...validArgs, adults: 0 })).toThrow(
      'adults must be at least 1'
    );
  });

  it('throws when children is negative', () => {
    expect(() => buildAvailabilityPayload({ ...validArgs, children: -1 })).toThrow(
      'children cannot be negative'
    );
  });
});

// ---------------------------------------------------------------------------
// buildAddToCartPayload
// ---------------------------------------------------------------------------
describe('buildAddToCartPayload', () => {
  const validArgs = {
    city: 'Mumbai',
    hotelName: 'Taj Lands End, Mumbai',
    checkIn: '2026-06-02',
    checkOut: '2026-06-03',
    hotelId: 'e1058dfa-fe44-4933-bb1b-85621258d217',
  };

  it('returns correct payload structure', () => {
    const result = buildAddToCartPayload(validArgs);
    expect(result.category).toBe('Hotel booking');
    expect(result.hotel).toHaveLength(1);
    expect(result.hotel[0]).toEqual({
      city: 'Mumbai',
      hotelName: 'Taj Lands End, Mumbai',
      checkIn: '2026-06-02',
      checkOut: '2026-06-03',
      hotelId: 'e1058dfa-fe44-4933-bb1b-85621258d217',
    });
  });

  it('accepts custom category', () => {
    const result = buildAddToCartPayload({ ...validArgs, category: 'Spa booking' });
    expect(result.category).toBe('Spa booking');
  });

  it('throws when city is missing', () => {
    expect(() => buildAddToCartPayload({ ...validArgs, city: '' })).toThrow(
      'city, hotelName, checkIn, checkOut, and hotelId are required'
    );
  });

  it('throws when hotelName is missing', () => {
    expect(() => buildAddToCartPayload({ ...validArgs, hotelName: '' })).toThrow(
      'city, hotelName, checkIn, checkOut, and hotelId are required'
    );
  });

  it('throws when checkIn is missing', () => {
    expect(() => buildAddToCartPayload({ ...validArgs, checkIn: '' })).toThrow(
      'city, hotelName, checkIn, checkOut, and hotelId are required'
    );
  });

  it('throws when checkOut is missing', () => {
    expect(() => buildAddToCartPayload({ ...validArgs, checkOut: '' })).toThrow(
      'city, hotelName, checkIn, checkOut, and hotelId are required'
    );
  });

  it('throws when hotelId is missing', () => {
    expect(() => buildAddToCartPayload({ ...validArgs, hotelId: '' })).toThrow(
      'city, hotelName, checkIn, checkOut, and hotelId are required'
    );
  });
});

// ---------------------------------------------------------------------------
// buildFetchOrderPayload
// ---------------------------------------------------------------------------
describe('buildFetchOrderPayload', () => {
  const validArgs = {
    orderId: 'UWeb_72469',
    returnUrl: 'https://web-uatv2.tajhotels.com/en-in/booking/booking-confirmed',
  };

  it('returns correct payload with defaults', () => {
    const result = buildFetchOrderPayload(validArgs);
    expect(result).toEqual({
      orderId: 'UWeb_72469',
      returnUrl: 'https://web-uatv2.tajhotels.com/en-in/booking/booking-confirmed',
      isLogin: true,
      journeyType: 'PAY LATER',
    });
  });

  it('accepts custom journeyType', () => {
    const result = buildFetchOrderPayload({ ...validArgs, journeyType: 'PAY NOW' });
    expect(result.journeyType).toBe('PAY NOW');
  });

  it('accepts isLogin false', () => {
    const result = buildFetchOrderPayload({ ...validArgs, isLogin: false });
    expect(result.isLogin).toBe(false);
  });

  it('throws when orderId is missing', () => {
    expect(() => buildFetchOrderPayload({ returnUrl: 'https://example.com' })).toThrow(
      'orderId and returnUrl are required'
    );
  });

  it('throws when returnUrl is missing', () => {
    expect(() => buildFetchOrderPayload({ orderId: 'O1' })).toThrow(
      'orderId and returnUrl are required'
    );
  });
});

// ---------------------------------------------------------------------------
// buildConfirmOrderPayload
// ---------------------------------------------------------------------------
describe('buildConfirmOrderPayload', () => {
  it('returns correct payload', () => {
    expect(buildConfirmOrderPayload({ orderId: 'UWeb_72469-26114418' })).toEqual({
      orderId: 'UWeb_72469-26114418',
    });
  });

  it('throws when orderId is missing', () => {
    expect(() => buildConfirmOrderPayload({})).toThrow('orderId is required');
  });

  it('throws when called with no arguments', () => {
    expect(() => buildConfirmOrderPayload()).toThrow('orderId is required');
  });
});

// ---------------------------------------------------------------------------
// buildBookingHeaders
// ---------------------------------------------------------------------------
describe('buildBookingHeaders', () => {
  it('returns base headers when no extra params given', () => {
    const result = buildBookingHeaders();
    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  });

  it('includes customerhash when provided', () => {
    const result = buildBookingHeaders({ customerHash: 'abc123' });
    expect(result.customerhash).toBe('abc123');
  });

  it('includes jwttoken when provided', () => {
    const result = buildBookingHeaders({ jwtToken: 'tok123' });
    expect(result.jwttoken).toBe('tok123');
  });

  it('includes clientid when provided', () => {
    const result = buildBookingHeaders({ clientId: 'cid' });
    expect(result.clientid).toBe('cid');
  });

  it('includes all extra headers when all are provided', () => {
    const result = buildBookingHeaders({
      customerHash: 'hash',
      jwtToken: 'jwt',
      clientId: 'client',
    });
    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      customerhash: 'hash',
      jwttoken: 'jwt',
      clientid: 'client',
    });
  });

  it('omits undefined optional headers', () => {
    const result = buildBookingHeaders({ customerHash: 'hash' });
    expect(result).not.toHaveProperty('jwttoken');
    expect(result).not.toHaveProperty('clientid');
  });
});

// ---------------------------------------------------------------------------
// buildEndpointUrl
// ---------------------------------------------------------------------------
describe('buildEndpointUrl', () => {
  it('builds URL with default base', () => {
    expect(buildEndpointUrl('/ssoService/validate-token')).toBe(
      'https://api-uatv2.tajhotels.com/ssoService/validate-token'
    );
  });

  it('builds URL with custom base', () => {
    expect(buildEndpointUrl('/foo', 'https://custom.api.com')).toBe(
      'https://custom.api.com/foo'
    );
  });

  it('handles path without leading slash', () => {
    expect(buildEndpointUrl('ssoService/validate-token')).toBe(
      'https://api-uatv2.tajhotels.com/ssoService/validate-token'
    );
  });

  it('throws when path is missing', () => {
    expect(() => buildEndpointUrl()).toThrow('path is required');
  });

  it('throws when path is empty string', () => {
    expect(() => buildEndpointUrl('')).toThrow('path is required');
  });
});
