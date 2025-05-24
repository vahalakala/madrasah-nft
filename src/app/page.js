'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "uri", type: "string" }
    ],
    name: "safeMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formInput, setFormInput] = useState({
    name: '',
    description: '',
    writer: '',
    repro: '',
    kategori: '',
    tahun: '',
    lokasi: '',
    periode: '',
    tokoh: '',
    tag: '',
  });

  async function connectWallet() {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const prov = new ethers.providers.Web3Provider(connection);
      const sign = prov.getSigner();
      const acc = await sign.getAddress();

      setProvider(prov);
      setSigner(sign);
      setAccount(acc);
      setWalletConnected(true);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg("Gagal connect wallet: " + err.message);
    }
  }

  function handleChange(e) {
    setFormInput({ ...formInput, [e.target.name]: e.target.value });
  }

  function validateForm() {
    if (!formInput.name.trim()) {
      setErrorMsg("Nama foto harus diisi.");
      return false;
    }
    if (!formInput.description.trim()) {
      setErrorMsg("Deskripsi harus diisi.");
      return false;
    }
    if (!imageFile) {
      setErrorMsg("Gambar harus dipilih.");
      return false;
    }
    setErrorMsg('');
    return true;
  }

  async function handleMint() {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Upload gambar
      const imgFormData = new FormData();
      imgFormData.append("file", imageFile);

      const imgRes = await fetch("/api/upload", {
        method: "POST",
        body: imgFormData
      });

      const imgData = await imgRes.json();
      const imageCid = imgData.IpfsHash;
      const imageUri = `ipfs://${imageCid}`;

      // 2. Buat metadata JSON
      const metadata = {
        name: formInput.name,
        description: formInput.description,
        writer: formInput.writer,
        repro: formInput.repro,
        image: imageUri,
        attributes: [
          { trait_type: "Kategori", value: formInput.kategori },
          { trait_type: "Tahun", value: formInput.tahun },
          { trait_type: "Lokasi", value: formInput.lokasi },
          { trait_type: "Periode", value: formInput.periode },
          { trait_type: "Tokoh Terkait", value: formInput.tokoh },
          { trait_type: "Tag", value: formInput.tag }
        ]
      };

      // 3. Upload metadata
      const metadataRes = await fetch("/api/uploadmetadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata)
      });

      const metadataData = await metadataRes.json();
      const metadataCid = metadataData.IpfsHash;
      const metadataUri = `ipfs://${metadataCid}`;

      // 4. Mint NFT
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.safeMint(account, metadataUri);
      await tx.wait();

      alert("✅ NFT berhasil di-mint!");

      setFormInput({
        name: '',
        description: '',
        writer: '',
        repro: '',
        kategori: '',
        tahun: '',
        lokasi: '',
        periode: '',
        tokoh: '',
        tag: '',
      });
      setImageFile(null);
    } catch (err) {
      console.error("Minting error:", err);
      setErrorMsg("Gagal mint NFT: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Mint NFT Foto Sejarah</h1>

      {!walletConnected ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 w-full"
          disabled={loading}
        >
          Connect Wallet
        </button>
      ) : (
        <p className="mb-4 text-sm text-gray-700 break-words">Wallet connected: {account}</p>
      )}

      {errorMsg && <p className="mb-4 text-red-600">{errorMsg}</p>}

      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0])}
          className="mb-2"
          disabled={loading}
        />
      </div>

      <div className="space-y-2 mb-4">
        {Object.keys(formInput).map((key) => (
          key !== 'description' ? (
            <input
              key={key}
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={formInput[key]}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading}
            />
          ) : (
            <textarea
              key={key}
              name={key}
              placeholder="Deskripsi"
              value={formInput[key]}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading}
            />
          )
        ))}
      </div>

      <button
        disabled={!walletConnected || loading}
        onClick={handleMint}
        className={`bg-green-600 text-white px-4 py-2 rounded w-full ${(!walletConnected || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Minting...' : 'Mint NFT'}
      </button>
    </div>
  );
}
