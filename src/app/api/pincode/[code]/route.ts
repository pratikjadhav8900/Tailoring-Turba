import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();
    
    console.log(`[PINCODE_API] Lookup for ${code}:`, data?.[0]?.Status);

    if (data && data[0] && data[0].Status === 'Success') {
      const postOffice = data[0].PostOffice[0];
      return NextResponse.json({
        city: postOffice.District,
        state: postOffice.State,
      });
    }

    return NextResponse.json({ error: 'Pincode not found' }, { status: 404 });
  } catch (error: any) {
    console.error("[PINCODE_LOOKUP_ERROR]", error);
    return NextResponse.json({ error: "Failed to validate pincode." }, { status: 500 });
  }
}
