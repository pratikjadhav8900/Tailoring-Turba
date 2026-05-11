import { NextRequest, NextResponse } from 'next/server';
import { getBigShipWarehouses, getBigShipToken } from '@/lib/bigship';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Scan for warehouses. Testing 'local' first as it was found to be the correct one for this account.
    let warehouses = await getBigShipWarehouses('local');
    
    // Fallbacks just in case
    if (!warehouses.status || !warehouses.data?.warehouse?.length) {
      const b2cWarehouses = await getBigShipWarehouses('domestic_b2c');
      if (b2cWarehouses.status && b2cWarehouses.data?.warehouse?.length) {
        warehouses = b2cWarehouses;
      }
    }
    
    return NextResponse.json(warehouses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const token = await getBigShipToken();
    const BIGSHIP_BASE_URL = process.env.BIGSHIP_BASE_URL || 'https://api.bigship.direct/';

    const response = await fetch(`${BIGSHIP_BASE_URL}api/outbound/save-warehouse-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
