const express = require('express');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendTelegramMessage } = require('../services/telegram');
const { BOUTIQUES } = require('../utils/constants');
const router = express.Router();
router.use(authMiddleware);

router.put('/setup', async (req, res) => {
  try {
    const { telegramToken, telegramChatId } = req.body;
    if (!telegramToken || !telegramChatId)
      return res.status(400).json({ message: 'Token dan Chat ID diperlukan' });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { telegramToken, telegramChatId },
      select: { id: true, name: true, email: true, telegramToken: true, telegramChatId: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/setup', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { telegramToken: null, telegramChatId: null },
    });
    res.json({ message: 'Konfigurasi Telegram dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, telegramToken: true, telegramChatId: true },
    });
    if (!user.telegramToken || !user.telegramChatId)
      return res.status(400).json({ message: 'Setup Telegram terlebih dahulu' });

    const message = `✅ *Notifikasi Test Berhasil\\!*\n\nHalo ${user.name}\\! Bot Telegram Anda sudah terhubung dengan *Gold Asset Manager*\\.\n\n🪙 Anda akan menerima notifikasi:\n• Stok emas tersedia di butik pilihan\n• Update harga emas harian\n\n_Dikirim dari Gold Asset Manager_`;
    await sendTelegramMessage(user.telegramToken, user.telegramChatId, message);
    await prisma.notification.create({ data: { userId: req.user.id, type: 'TEST', message: 'Test notifikasi berhasil dikirim' } });
    res.json({ message: 'Notifikasi test berhasil dikirim!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: `Gagal: ${err.message}` });
  }
});

router.get('/monitors', async (req, res) => {
  try {
    const monitors = await prisma.monitoredBoutique.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(monitors);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/monitors', async (req, res) => {
  try {
    const { boutiqueId, weightGram } = req.body;
    if (!boutiqueId || !weightGram)
      return res.status(400).json({ message: 'boutiqueId dan weightGram diperlukan' });

    const boutiqueInfo = BOUTIQUES.find(b => b.id === boutiqueId);
    if (!boutiqueInfo) return res.status(404).json({ message: 'Butik tidak ditemukan' });

    const existing = await prisma.monitoredBoutique.findFirst({
      where: { userId: req.user.id, boutiqueId, weightGram: parseFloat(weightGram) },
    });
    if (existing) return res.status(400).json({ message: 'Pemantauan sudah ada' });

    const monitor = await prisma.monitoredBoutique.create({
      data: { userId: req.user.id, boutiqueId, boutiqueName: boutiqueInfo.name, weightGram: parseFloat(weightGram) },
    });
    res.status(201).json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/monitors/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const monitor = await prisma.monitoredBoutique.findUnique({ where: { id } });
    if (!monitor || monitor.userId !== req.user.id)
      return res.status(404).json({ message: 'Monitor tidak ditemukan' });

    const updated = await prisma.monitoredBoutique.update({ where: { id }, data: { isActive: !monitor.isActive } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/monitors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const monitor = await prisma.monitoredBoutique.findUnique({ where: { id } });
    if (!monitor || monitor.userId !== req.user.id)
      return res.status(404).json({ message: 'Monitor tidak ditemukan' });

    await prisma.monitoredBoutique.delete({ where: { id } });
    res.json({ message: 'Pemantauan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { sentAt: 'desc' },
      take: 30,
    });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
