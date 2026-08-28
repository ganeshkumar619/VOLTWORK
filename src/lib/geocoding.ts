/**
 * VoltWork AI - Geocoding & GPS Location Utilities
 * Handles GPS coordinate capture, reverse geocoding, address structuring, and navigation mapping.
 */

export interface StructuredAddress {
  doorNo: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  gpsCaptured: boolean;
}

/**
 * Formats structured address components into the standard official format:
 * "Door No, Street, Area, City, District, State - PIN"
 * Example: "123, Main Street, Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716"
 */
export function formatFullAddress(parts: {
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}): string {
  const doorNo = (parts.doorNo || '').trim();
  const street = (parts.street || '').trim();
  const area = (parts.area || 'Mudukkumeendanpatti').trim();
  const city = (parts.city || 'Kovilpatti').trim();
  const district = (parts.district || 'Thoothukudi').trim();
  const state = (parts.state || 'Tamilnadu').trim();
  const pincode = (parts.pincode || '628716').trim();

  const lines: string[] = [];
  if (doorNo && street) {
    lines.push(`${doorNo}, ${street}`);
  } else if (doorNo) {
    lines.push(doorNo);
  } else if (street) {
    lines.push(street);
  }

  if (area && area.toLowerCase() !== city.toLowerCase()) {
    lines.push(area);
  }

  if (city) {
    lines.push(city);
  }

  if (district && district.toLowerCase() !== city.toLowerCase()) {
    lines.push(district);
  }

  const statePin = pincode ? `${state} - ${pincode}` : state;
  if (statePin) {
    lines.push(statePin);
  }

  return lines.join(', ');
}

/**
 * Reverse geocodes latitude and longitude coordinates into a structured Indian address.
 * First queries the server proxy `/api/geocode/reverse`, falling back gracefully if offline.
 */
export async function reverseGeocodeGPS(
  latitude: number,
  longitude: number
): Promise<StructuredAddress> {
  const lat = Number(latitude.toFixed(6));
  const lng = Number(longitude.toFixed(6));

  let doorNo = '';
  let street = '';
  let area = '';
  let city = '';
  let district = '';
  let state = 'Tamilnadu';
  let pincode = '';

  // 1. Try server proxy endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      doorNo = data.doorNo || '';
      street = data.street || '';
      area = data.area || '';
      city = data.city || '';
      district = data.district || '';
      state = data.state || 'Tamilnadu';
      pincode = data.pincode || '';
    }
  } catch (serverErr) {
    console.warn('Backend reverse geocode attempt failed, trying browser direct:', serverErr);

    // 2. Direct browser fetch without forbidden headers
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-IN, en',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};

        doorNo = addr.house_number || addr.building || addr.house_name || '';
        street = addr.road || addr.street || addr.residential || addr.pedestrian || '';
        area =
          addr.suburb ||
          addr.neighbourhood ||
          addr.village ||
          addr.hamlet ||
          addr.quarter ||
          addr.residential ||
          addr.locality ||
          '';
        city =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.city_district ||
          addr.subdistrict ||
          addr.county ||
          '';
        district = addr.state_district || addr.county || addr.district || '';
        state = addr.state || 'Tamilnadu';
        pincode = addr.postcode || '';
      }
    } catch (browserErr) {
      console.warn('Direct reverse geocode fallback applied:', browserErr);
    }
  }

  // 3. Fallback defaults if components remain empty
  const isLocalHQ = Math.abs(lat - 9.1726) < 0.35 && Math.abs(lng - 77.8711) < 0.35;
  if (!area) area = isLocalHQ ? 'Mudukkumeendanpatti' : (city || 'Mudukkumeendanpatti');
  if (!city) city = isLocalHQ ? 'Kovilpatti' : (area || 'Kovilpatti');
  if (!district) district = isLocalHQ ? 'Thoothukudi' : 'Thoothukudi';
  if (!state) state = 'Tamilnadu';
  if (!pincode) pincode = isLocalHQ ? '628716' : '628716';

  const formattedAddress = formatFullAddress({
    doorNo,
    street,
    area,
    city,
    district,
    state,
    pincode,
  });

  return {
    doorNo,
    street,
    area,
    city,
    district,
    state,
    pincode,
    formattedAddress,
    latitude: lat,
    longitude: lng,
    gpsCaptured: true,
  };
}

/**
 * Calculates Great-Circle distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Returns a Google Maps directions URL from worker/origin to customer location
 */
export function getNavigationUrl(
  destLat: number,
  destLng: number,
  destAddress?: string
): string {
  if (destLat && destLng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    destAddress || 'Kovilpatti'
  )}`;
}
