exports.normalizePhone = (phone, countryCode = '+91') => {
  if (!phone) return null;

  let p = phone.toString().trim();

  // remove spaces & dashes
  p = p.replace(/[\s-]/g, '');

  // already has +
  if (p.startsWith('+')) {
    return p;
  }

  // starts with country digits like 91xxxxxxxxxx
  if (p.length > 10) {
    return `+${p}`;
  }

  // normal 10-digit Indian number
  return `${countryCode}${p}`;
};
