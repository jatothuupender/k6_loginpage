const {
  TEST_PHONES,
  pickPhone,
  buildOtpPayload,
  buildVerifyOtpPayload,
  buildJsonHeaders,
  isOtpResponseValid,
} = require('../utils/phone-helpers');

// ---------------------------------------------------------------------------
// TEST_PHONES constant
// ---------------------------------------------------------------------------
describe('TEST_PHONES', () => {
  it('contains 5 entries', () => {
    expect(TEST_PHONES).toHaveLength(5);
  });

  it('each entry has phone and countryCode', () => {
    TEST_PHONES.forEach((entry) => {
      expect(entry).toHaveProperty('phone');
      expect(entry).toHaveProperty('countryCode');
      expect(typeof entry.phone).toBe('string');
      expect(typeof entry.countryCode).toBe('string');
    });
  });

  it('phone numbers are 10 digits', () => {
    TEST_PHONES.forEach((entry) => {
      expect(entry.phone).toMatch(/^\d{10}$/);
    });
  });

  it('all country codes are 91 (India)', () => {
    TEST_PHONES.forEach((entry) => {
      expect(entry.countryCode).toBe('91');
    });
  });
});

// ---------------------------------------------------------------------------
// pickPhone
// ---------------------------------------------------------------------------
describe('pickPhone', () => {
  it('returns the first phone for VU 1', () => {
    expect(pickPhone(1)).toEqual(TEST_PHONES[0]);
  });

  it('returns the second phone for VU 2', () => {
    expect(pickPhone(2)).toEqual(TEST_PHONES[1]);
  });

  it('wraps around when VU exceeds phone list length', () => {
    expect(pickPhone(6)).toEqual(TEST_PHONES[0]);
    expect(pickPhone(7)).toEqual(TEST_PHONES[1]);
    expect(pickPhone(11)).toEqual(TEST_PHONES[0]);
  });

  it('works with a custom phone list', () => {
    const customPhones = [{ phone: '1111111111', countryCode: '1' }];
    expect(pickPhone(1, customPhones)).toEqual(customPhones[0]);
    expect(pickPhone(2, customPhones)).toEqual(customPhones[0]);
  });

  it('throws on empty phone list', () => {
    expect(() => pickPhone(1, [])).toThrow('Phone list must not be empty');
  });

  it('throws on invalid vuIndex (0)', () => {
    expect(() => pickPhone(0)).toThrow('vuIndex must be a positive integer');
  });

  it('throws on negative vuIndex', () => {
    expect(() => pickPhone(-1)).toThrow('vuIndex must be a positive integer');
  });

  it('throws on non-number vuIndex', () => {
    expect(() => pickPhone('abc')).toThrow('vuIndex must be a positive integer');
  });

  it('distributes VUs evenly across phones', () => {
    const seen = new Map();
    for (let vu = 1; vu <= 100; vu++) {
      const p = pickPhone(vu);
      seen.set(p.phone, (seen.get(p.phone) || 0) + 1);
    }
    expect(seen.size).toBe(5);
    seen.forEach((count) => expect(count).toBe(20));
  });
});

// ---------------------------------------------------------------------------
// buildOtpPayload
// ---------------------------------------------------------------------------
describe('buildOtpPayload', () => {
  it('returns correct payload with all fields', () => {
    const result = buildOtpPayload('7659086950', '91', 'token123');
    expect(result).toEqual({
      phone: '7659086950',
      countryCode: '91',
      recaptchaToken: 'token123',
    });
  });

  it('defaults recaptchaToken to empty string when omitted', () => {
    const result = buildOtpPayload('7659086950', '91');
    expect(result.recaptchaToken).toBe('');
  });

  it('throws when phone is missing', () => {
    expect(() => buildOtpPayload(null, '91')).toThrow('phone and countryCode are required');
  });

  it('throws when countryCode is missing', () => {
    expect(() => buildOtpPayload('7659086950', null)).toThrow('phone and countryCode are required');
  });

  it('throws when both are missing', () => {
    expect(() => buildOtpPayload()).toThrow('phone and countryCode are required');
  });
});

// ---------------------------------------------------------------------------
// buildVerifyOtpPayload
// ---------------------------------------------------------------------------
describe('buildVerifyOtpPayload', () => {
  const validArgs = {
    phone: '7659086950',
    otp: '254265',
    refId: '3b857f7e-c19c-4c37-9b47-dab806474e14',
    countryCode: '+91',
    isFromTCP: false,
    codeChallenge: 'challenge',
    codeVerifier: 'verifier',
  };

  it('returns correct payload with all fields', () => {
    const result = buildVerifyOtpPayload(validArgs);
    expect(result).toEqual({
      phone: '7659086950',
      otp: '254265',
      refId: '3b857f7e-c19c-4c37-9b47-dab806474e14',
      countryCode: '+91',
      isFromTCP: false,
      codeChallenge: 'challenge',
      codeVerifier: 'verifier',
    });
  });

  it('defaults optional fields when omitted', () => {
    const result = buildVerifyOtpPayload({
      phone: '7659086950',
      otp: '254265',
      refId: 'ref123',
      countryCode: '+91',
    });
    expect(result.isFromTCP).toBe(false);
    expect(result.codeChallenge).toBe('');
    expect(result.codeVerifier).toBe('');
  });

  it('throws when phone is missing', () => {
    expect(() => buildVerifyOtpPayload({ ...validArgs, phone: '' })).toThrow(
      'phone, otp, refId, and countryCode are required'
    );
  });

  it('throws when otp is missing', () => {
    expect(() => buildVerifyOtpPayload({ ...validArgs, otp: '' })).toThrow(
      'phone, otp, refId, and countryCode are required'
    );
  });

  it('throws when refId is missing', () => {
    expect(() => buildVerifyOtpPayload({ ...validArgs, refId: '' })).toThrow(
      'phone, otp, refId, and countryCode are required'
    );
  });

  it('throws when countryCode is missing', () => {
    expect(() => buildVerifyOtpPayload({ ...validArgs, countryCode: '' })).toThrow(
      'phone, otp, refId, and countryCode are required'
    );
  });
});

// ---------------------------------------------------------------------------
// buildJsonHeaders
// ---------------------------------------------------------------------------
describe('buildJsonHeaders', () => {
  it('returns Content-Type and Accept headers', () => {
    expect(buildJsonHeaders()).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  });

  it('returns a new object each call (not shared reference)', () => {
    const h1 = buildJsonHeaders();
    const h2 = buildJsonHeaders();
    expect(h1).not.toBe(h2);
    expect(h1).toEqual(h2);
  });
});

// ---------------------------------------------------------------------------
// isOtpResponseValid
// ---------------------------------------------------------------------------
describe('isOtpResponseValid', () => {
  it('returns true for a clean response', () => {
    expect(isOtpResponseValid({ success: true })).toBe(true);
  });

  it('returns false when error field is present', () => {
    expect(isOtpResponseValid({ error: 'bad request' })).toBe(false);
  });

  it('returns false when errorCode field is present', () => {
    expect(isOtpResponseValid({ errorCode: 400 })).toBe(false);
  });

  it('returns false for null body', () => {
    expect(isOtpResponseValid(null)).toBe(false);
  });

  it('returns false for undefined body', () => {
    expect(isOtpResponseValid(undefined)).toBe(false);
  });

  it('returns true when error fields are falsy (0, empty string)', () => {
    expect(isOtpResponseValid({ error: '', errorCode: 0 })).toBe(true);
  });
});
