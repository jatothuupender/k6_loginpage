# JMeter – Taj Hotels OTP Login Load Test

JMeter port of the k6 login scripts (`login.js` / `login2.js`). It exercises the
SSO OTP login flow:

1. `POST /ssoService/generate-phone-otp` – request an OTP for a phone number.
2. `POST /ssoService/verify-phone-otp` – verify the OTP (uses the `refId`
   extracted from step 1).

## Files

- `login.jmx` – the JMeter test plan.
- `phones.csv` – phone numbers rotated across virtual users (threads).

## Prerequisites

- [Apache JMeter](https://jmeter.apache.org/) 5.x (`brew install jmeter`, or
  download the binary).

## Run (non-GUI / CLI – recommended for load tests)

```bash
cd jmeter
jmeter -n -t login.jmx -l results.jtl -e -o report \
  -JRECAPTCHA_TOKEN="<fresh-token>" \
  -JOTP="123456"
```

`-e -o report` generates an HTML dashboard in `report/`.

## Configurable properties (`-J<name>=<value>`)

| Property          | Default                              | Meaning                                  |
| ----------------- | ------------------------------------ | ---------------------------------------- |
| `BASE_URL`        | `https://api-uatv2.tajhotels.com`    | Target host                              |
| `RECAPTCHA_TOKEN` | *(empty)*                            | reCAPTCHA token for generate-otp         |
| `THREADS`         | `50`                                 | Concurrent virtual users                 |
| `RAMP_UP`         | `60`                                 | Ramp-up period (seconds)                 |
| `DURATION`        | `240`                                | Total run time (seconds)                 |
| `OTP`             | `123456`                             | OTP used in the verify step              |

## Notes

- **reCAPTCHA**: tokens are single-use and expire quickly. For meaningful load
  you must either have reCAPTCHA bypass enabled in UAT, or generate a fresh
  token per request. Pass one via `-JRECAPTCHA_TOKEN=...`.
- **OTP verification** will only pass if the UAT environment accepts a static
  test OTP; otherwise the verify step is expected to fail (same caveat as the
  k6 scripts).
- Open `login.jmx` in the JMeter GUI to tweak the plan interactively.
