/**
 * Meta constants shared between server senders and client components.
 *
 * This module deliberately has no `server-only` import and no secrets: the
 * admin modal ("use client") imports it, and a `server-only` file cannot be
 * imported from client code.
 */

export const CAPI_EVENT_TYPES = [
  { value: "Lead", label: "Lead" },
  { value: "Purchase", label: "Purchase" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "CompleteRegistration", label: "Registration" },
  { value: "StartTrial", label: "Start Trial" },
  { value: "Custom", label: "Custom" },
] as const;

/** Meta's allowed shape for a custom event name. */
export const CUSTOM_EVENT_NAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/;

export const CAPI_CURRENCIES = ["INR", "USD", "AED", "GBP", "EUR"] as const;

/** Project currency — used for the automatic Lead event's custom_data. */
export const DEFAULT_CURRENCY = "INR";

/** Dial code assumed when a phone number arrives without one (invariant 7). */
export const DEFAULT_COUNTRY_DIAL_CODE = "91";
