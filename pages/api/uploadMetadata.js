import axios from 'axios';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metadata = req.body;

    const pinataApiUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    const response = await axios.post(pinataApiUrl, metadata, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).json({ IpfsHash: response.data.IpfsHash });
  } catch (error) {
    console.error('Upload metadata error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to upload metadata' });
  }
}
