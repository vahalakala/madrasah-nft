import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
      return res.status(500).json({ error: 'PINATA_JWT is not set' });
    }

    const { files } = await parseForm(req);
    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.filepath), file.originalFilename);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return res.status(200).json({ IpfsHash: response.data.IpfsHash });
  } catch (error) {
    console.error('Pinata upload error:', error);
    return res.status(500).json({ error: 'Pinata upload failed', details: error.message });
  }
}
