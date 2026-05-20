const mongoose = require('mongoose');

const codePromoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  applicableToAll: {
    type: Boolean,
    default: true
  },
  chambres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chambre'
  }],
  // ✅ NOUVEAU : Titulaire du code promo
  titulaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null = appartient à l'hôtel
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  utilisationMax: {
    type: Number,
    required: true,
    min: 1,
    default: 100
  },
  utilisationActuelle: {
    type: Number,
    default: 0
  },
  minimumStay: {
    type: Number,
    default: 1,
    min: 1
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif'],
    default: 'actif'
  }
}, { timestamps: true });

module.exports = mongoose.model('CodePromo', codePromoSchema);