const BOUTIQUES = [
  { id: 'BELM-JKT-01', name: 'BELM Jakarta - Gedung Antam Pulogadung', city: 'Jakarta', province: 'DKI Jakarta', address: 'Jl. Letjen TB Simatupang No.1, Jakarta Selatan' },
  { id: 'BELM-JKT-02', name: 'BELM Jakarta - Wisma Antam Mampang', city: 'Jakarta', province: 'DKI Jakarta', address: 'Jl. TB Simatupang No.1, Mampang, Jakarta Selatan' },
  { id: 'BELM-JKT-03', name: 'BELM Jakarta - Graha Irama Kuningan', city: 'Jakarta', province: 'DKI Jakarta', address: 'Jl. H.R. Rasuna Said Blok X-1, Jakarta Selatan' },
  { id: 'BELM-BDG-01', name: 'BELM Bandung', city: 'Bandung', province: 'Jawa Barat', address: 'Jl. Asia Afrika No.50, Bandung' },
  { id: 'BELM-SBY-01', name: 'BELM Surabaya', city: 'Surabaya', province: 'Jawa Timur', address: 'Jl. Pemuda No.27-31, Surabaya' },
  { id: 'BELM-SMG-01', name: 'BELM Semarang', city: 'Semarang', province: 'Jawa Tengah', address: 'Jl. Pemuda No.150, Semarang' },
  { id: 'BELM-YGY-01', name: 'BELM Yogyakarta', city: 'Yogyakarta', province: 'DI Yogyakarta', address: 'Jl. Malioboro No.54, Yogyakarta' },
  { id: 'BELM-MDN-01', name: 'BELM Medan', city: 'Medan', province: 'Sumatera Utara', address: 'Jl. Diponegoro No.20, Medan' },
  { id: 'BELM-PLB-01', name: 'BELM Palembang', city: 'Palembang', province: 'Sumatera Selatan', address: 'Jl. Kapten A. Rivai No.33, Palembang' },
  { id: 'BELM-PDG-01', name: 'BELM Padang', city: 'Padang', province: 'Sumatera Barat', address: 'Jl. Bagindo Azizchan No.2, Padang' },
  { id: 'BELM-PKU-01', name: 'BELM Pekanbaru', city: 'Pekanbaru', province: 'Riau', address: 'Jl. Jenderal Sudirman No.415, Pekanbaru' },
  { id: 'BELM-BTM-01', name: 'BELM Batam', city: 'Batam', province: 'Kepulauan Riau', address: 'Jl. Imam Bonjol, Nagoya, Batam' },
  { id: 'BELM-MKS-01', name: 'BELM Makassar', city: 'Makassar', province: 'Sulawesi Selatan', address: 'Jl. Sultan Hasanuddin No.5, Makassar' },
  { id: 'BELM-MND-01', name: 'BELM Manado', city: 'Manado', province: 'Sulawesi Utara', address: 'Jl. Sam Ratulangi No.1, Manado' },
  { id: 'BELM-DPS-01', name: 'BELM Denpasar - Bali', city: 'Denpasar', province: 'Bali', address: 'Jl. Cokroaminoto No.8, Denpasar' },
  { id: 'BELM-BPN-01', name: 'BELM Balikpapan', city: 'Balikpapan', province: 'Kalimantan Timur', address: 'Jl. Jenderal Sudirman No.32, Balikpapan' },
  { id: 'BELM-SMR-01', name: 'BELM Samarinda', city: 'Samarinda', province: 'Kalimantan Timur', address: 'Jl. Mulawarman No.45, Samarinda' },
  { id: 'BELM-PLK-01', name: 'BELM Pontianak', city: 'Pontianak', province: 'Kalimantan Barat', address: 'Jl. Tanjungpura No.135, Pontianak' },
  { id: 'BELM-BJM-01', name: 'BELM Banjarmasin', city: 'Banjarmasin', province: 'Kalimantan Selatan', address: 'Jl. Lambung Mangkurat No.15, Banjarmasin' },
  { id: 'BELM-AMB-01', name: 'BELM Ambon', city: 'Ambon', province: 'Maluku', address: 'Jl. Rijali No.1, Ambon' },
];

const GOLD_WEIGHTS = [0.5, 1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000];

const BASE_PRICES = {
  0.5: 840000, 1: 1670000, 2: 3330000, 3: 4975000,
  5: 8270000, 10: 16490000, 25: 41175000, 50: 82300000,
  100: 164550000, 250: 411125000, 500: 822200000, 1000: 1644000000,
};

module.exports = { BOUTIQUES, GOLD_WEIGHTS, BASE_PRICES };
