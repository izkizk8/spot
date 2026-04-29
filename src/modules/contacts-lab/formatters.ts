export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) {
    return 'N/A';
  }
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatEmail(email: string | undefined): string {
  if (!email) {
    return 'N/A';
  }
  return email.toLowerCase().trim();
}

export function formatContactName(contact: {
  name?: string;
  givenName?: string;
  familyName?: string;
}): string {
  if (contact.name) {
    return contact.name;
  }
  const parts = [contact.givenName, contact.familyName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unnamed Contact';
}
