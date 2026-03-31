const express = require('express');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, quantity, purchasePrice, currentPrice, purchaseDate, notes } = req.body;
    if (!name || !type || !quantity || !purchasePrice || !purchaseDate)
      return res.status(400).json({ message: 'Field wajib tidak lengkap' });

    const asset = await prisma.asset.create({
      data: {
        userId: req.user.id,
        name, type,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : null,
        purchaseDate: new Date(purchaseDate),
        notes,
      },
    });
    res.status(201).json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id)
      return res.status(404).json({ message: 'Aset tidak ditemukan' });

    const { name, type, quantity, purchasePrice, currentPrice, purchaseDate, notes } = req.body;
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name, type,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        currentPrice: currentPrice !== undefined ? parseFloat(currentPrice) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        notes,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id)
      return res.status(404).json({ message: 'Aset tidak ditemukan' });

    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Aset berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
