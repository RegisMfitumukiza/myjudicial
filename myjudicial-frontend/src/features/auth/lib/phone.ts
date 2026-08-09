export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatRwandaPhone(value: string) {
  const digits = digitsOnly(value);
  const localNumber = digits.startsWith("250") ? digits.slice(3) : digits.replace(/^0+/, "");

  return `+250${localNumber}`;
}

export function isRwandaMobileNumber(value: string) {
  const digits = digitsOnly(value);
  return /^(?:250)?7\d{8}$/.test(digits) || /^07\d{8}$/.test(digits);
}