const nowIso = () => new Date().toISOString();

const clean = (value) => String(value ?? '').trim();

const createAddressId = () => `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeAddress = (input = {}, fallbackId = null) => {
  const normalized = {
    id: clean(input.id || input._id || fallbackId || createAddressId()),
    fullName: clean(input.fullName),
    phone: clean(input.phone),
    street: clean(input.street || input.address),
    city: clean(input.city),
    state: clean(input.state),
    pincode: clean(input.pincode),
    isDefault: Boolean(input.isDefault),
  };

  if (input.createdAt) normalized.createdAt = input.createdAt;
  if (input.updatedAt) normalized.updatedAt = input.updatedAt;

  return normalized;
};

const normalizeAddressList = (addresses = []) => {
  const seen = new Set();
  const normalized = (Array.isArray(addresses) ? addresses : [])
    .map((address) => normalizeAddress(address, address?.id || address?._id))
    .filter((address) => {
      if (!address.id || seen.has(address.id)) return false;
      seen.add(address.id);
      return Boolean(
        address.fullName ||
        address.phone ||
        address.street ||
        address.city ||
        address.state ||
        address.pincode
      );
    });

  if (normalized.length === 0) return [];

  const hasDefault = normalized.some((address) => address.isDefault);

  return normalized.map((address, index) => ({
    ...address,
    isDefault: hasDefault ? address.isDefault : index === 0,
  }));
};

const attachAddressTimestamps = (address, previous = null) => ({
  ...address,
  createdAt: previous?.createdAt || address.createdAt || nowIso(),
  updatedAt: nowIso(),
});

const isCompleteAddress = (address = {}) => (
  Boolean(
    clean(address.fullName) &&
    clean(address.phone) &&
    clean(address.street || address.address) &&
    clean(address.city) &&
    clean(address.state) &&
    clean(address.pincode)
  )
);

module.exports = {
  createAddressId,
  normalizeAddress,
  normalizeAddressList,
  attachAddressTimestamps,
  isCompleteAddress,
};
