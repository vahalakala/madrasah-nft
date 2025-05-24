import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  try {
    const metadata = await req.json();

    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return NextResponse.json({ IpfsHash: res.data.IpfsHash }, { status: 200 });
  } catch (err) {
    console.error('Metadata upload error:', err);
    return NextResponse.json({ error: 'Failed to upload metadata' }, { status: 500 });
  }
}
