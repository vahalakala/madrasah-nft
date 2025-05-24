import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  // Pakai env var tanpa NEXT_PUBLIC_ agar tidak ter-expose ke frontend
  const PINATA_JWT = process.env.PINATA_JWT;

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = new FormData();
  data.append('file', new Blob([buffer]), file.name);

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
      maxBodyLength: 'Infinity',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return NextResponse.json({ IpfsHash: res.data.IpfsHash }, { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload to Pinata' }, { status: 500 });
  }
}
