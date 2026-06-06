export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return '***';
  }

  const visible = localPart.slice(0, 1);
  return `${visible}***@${domain}`;
};
