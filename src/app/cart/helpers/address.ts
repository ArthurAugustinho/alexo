export const formatAddress = (address: {
  recipientName: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}) => {
  const parts = [
    address.recipientName,
    `${address.street}, ${address.number}`,
  ];

  if (address.complement) {
    parts.push(address.complement);
  }

  parts.push(address.neighborhood);
  parts.push(`${address.city} - ${address.state}`);
  parts.push(`CEP: ${address.zipCode}`);

  return parts.join(" • ");
};
