const express = require('express');
const router = express.Router();
const {
  getAllCodes,
  getCodeById,
  createCode,
  updateCode,
  deleteCode,
  verifyCode,
  getCodesByRoom,
  getStats,
  getMyCodes,
  getCodeReservations
} = require('../controllers/codePromoController');

const { protect } = require('../middlewares/authMiddleware');

// Routes publiques
router.get('/room/:chambreId', getCodesByRoom);
router.post('/verify', verifyCode);

// ✅ NOUVELLE route : codes du titulaire connecté
router.get('/my', protect, getMyCodes);

// Routes protégées (admin)
router.get('/stats', protect, getStats);
router.get('/', protect, getAllCodes);
router.get('/:id', protect, getCodeById);
router.post('/', protect, createCode);
router.put('/:id', protect, updateCode);
router.delete('/:id', protect, deleteCode);

// ✅ NOUVELLE route : réservations d'un code (admin ou titulaire)
router.get('/:id/reservations', protect, getCodeReservations);

module.exports = router;