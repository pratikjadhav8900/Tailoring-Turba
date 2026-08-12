import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js/max";

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
}

export function validateAndNormalizePhone(phone: string, country: string = "IN"): PhoneValidationResult {
  if (!phone) return { isValid: false };

  const trimmed = phone.trim();

  // If it starts with "+", validate as a full E.164 number directly (typically for backend)
  if (trimmed.startsWith("+")) {
    if (!/^\+[0-9\s()-]+$/.test(trimmed) || trimmed.length > 20) {
      return { isValid: false };
    }
    try {
      const phoneNumber = parsePhoneNumberFromString(trimmed);
      if (phoneNumber && phoneNumber.isValid()) {
        const type = phoneNumber.getType();
        if (type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE") {
          return {
            isValid: true,
            normalized: phoneNumber.number
          };
        }
      }
    } catch {
      return { isValid: false };
    }
    return { isValid: false };
  }

  // Otherwise validate as a national number for the selected country (typically for frontend)
  if (!/^[0-9\s()-]+$/.test(trimmed) || trimmed.length > 15) {
    return { isValid: false };
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(trimmed, country as CountryCode);
    if (phoneNumber && phoneNumber.isValid()) {
      const type = phoneNumber.getType();
      if (type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE") {
        return {
          isValid: true,
          normalized: phoneNumber.number
        };
      }
    }
  } catch {
    // Ignore and return invalid
  }

  return { isValid: false };
}
