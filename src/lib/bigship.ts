const BIGSHIP_BASE_URL = process.env.BIGSHIP_BASE_URL || 'https://api.bigship.direct/';
const BIGSHIP_USERNAME = process.env.BIGSHIP_USERNAME;
const BIGSHIP_PASSWORD = process.env.BIGSHIP_PASSWORD;
const BIGSHIP_ACCESS_KEY = process.env.BIGSHIP_ACCESS_KEY;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getBigShipToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: BIGSHIP_USERNAME,
        password: BIGSHIP_PASSWORD,
        access_key: BIGSHIP_ACCESS_KEY,
      }),
    });

    const data = await response.json();

    if (data.status) {
      cachedToken = data.data.token;
      // Set expiry 5 minutes before actual expiry to be safe
      tokenExpiry = new Date(data.data.tokenExpiringAt).getTime() - 5 * 60 * 1000;
      return cachedToken;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('[BIGSHIP_LOGIN_ERROR]', error.message);
    throw error;
  }
}

export async function getBigShipWarehouses(segment: string = 'domestic_b2c') {
  const token = await getBigShipToken();
  try {
    // We'll try domestic_b2c first as it's the most common for e-commerce
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/get-warehouse-list?page=1&perPage=25&segment_type=${segment}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    // If no warehouses found in b2c, we could optionally try b2b, 
    // but usually, the user knows which segment they are using.
    return data;
  } catch (error: any) {
    console.error('[BIGSHIP_WAREHOUSE_ERROR]', error.message);
    throw error;
  }
}

export async function createBigShipOrder(orderData: any) {
  const token = await getBigShipToken();
  try {
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/create-order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return await response.json();
  } catch (error: any) {
    console.error('[BIGSHIP_CREATE_ORDER_ERROR]', error.message);
    throw error;
  }
}

export async function getRatesForOrder(masterCustomOrderId: string) {
  const token = await getBigShipToken();
  try {
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/courier-wise-shipment-cost`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MasterCustomOrderId: masterCustomOrderId }),
    });
    return await response.json();
  } catch (error: any) {
    console.error('[BIGSHIP_RATES_ERROR]', error.message);
    throw error;
  }
}

export async function manifestBigShipOrder(params: {
  masterCustomOrderId: string;
  courierId: string | number;
}) {
  const token = await getBigShipToken();
  try {
    // For Domestic, it must be form-data
    const formData = new FormData();
    formData.append('MasterCustomOrderId', params.masterCustomOrderId);
    formData.append('courierId', String(params.courierId));
    formData.append('riskTypeId', '2'); // Owner Risk

    // Note: When using fetch with FormData, do NOT set Content-Type header manually
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/place-order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error: any) {
    console.error('[BIGSHIP_MANIFEST_ERROR]', error.message);
    throw error;
  }
}

export async function trackBigShipOrder(masterCustomOrderId: string) {
  const token = await getBigShipToken();
  try {
    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/track-order?CustomGlobalOrderId=${masterCustomOrderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  } catch (error: any) {
    console.error('[BIGSHIP_TRACK_ERROR]', error.message);
    throw error;
  }
}
