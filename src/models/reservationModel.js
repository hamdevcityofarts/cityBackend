const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XAF' },
  paidAt: { type: Date, default: Date.now },
  method: {
    type: String,
    enum: ['card', 'cash', 'transfer', 'check'],
    default: 'card'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String },
  auth_code: { type: String },
  error_code: { type: String },
  error_message: { type: String },
  gateway: { type: String, default: 'cybersource_secure_acceptance' }
});

const reservationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    clientInfo: {
      name: { type: String, required: false },
      surname: { type: String, required: false },
      email: { type: String, required: false },
      phone: { type: String }
    },
    chambre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chambre',
      required: true
    },
    // ✅ NOUVEAU : Référence au code promo utilisé
    codePromo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodePromo',
      default: null
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: { type: Number, required: true, default: 1 },
    adults: { type: Number, required: true, default: 1 },
    children: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'XAF', enum: ['XAF'] },
    paymentOption: {
      type: String,
      enum: ['first-night', 'partial', 'full'],
      default: 'full'
    },
    nightsToPay: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    acompte: { type: Number, default: 0 },
    specialRequests: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'pending_payment', 'confirmed', 'cancelled', 'completed', 'payment_failed', 'partially_paid'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'transfer', 'check'],
      default: 'card'
    },
    paiement: paiementSchema,
    source: {
      type: String,
      enum: ['website', 'public_website', 'admin'],
      default: 'website'
    }
  },
  { timestamps: true }
);

reservationSchema.index({ chambre: 1, checkIn: 1, checkOut: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ client: 1 });
reservationSchema.index({ 'clientInfo.email': 1 });
reservationSchema.index({ codePromo: 1 }); // ✅ NOUVEAU index

reservationSchema.methods.calculateNights = function () {
  const checkIn = new Date(this.checkIn);
  const checkOut = new Date(this.checkOut);
  const diffTime = checkOut - checkIn;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

reservationSchema.methods.calculateAmountToPay = function (chambrePrice) {
  const totalNights = this.nights;
  const pricePerNight = chambrePrice;
  switch (this.paymentOption) {
    case 'first-night': return pricePerNight;
    case 'partial': return pricePerNight * Math.min(this.nightsToPay, totalNights);
    case 'full':
    default: return pricePerNight * totalNights;
  }
};

reservationSchema.methods.getNightsToPay = function () {
  const totalNights = this.nights;
  switch (this.paymentOption) {
    case 'first-night': return 1;
    case 'partial': return Math.min(this.nightsToPay, totalNights);
    case 'full':
    default: return totalNights;
  }
};

reservationSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) this.nights = this.calculateNights();
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);