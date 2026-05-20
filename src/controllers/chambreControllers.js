const Chambre = require('../models/chambreModel');
const path = require('path');
const fs = require('fs');

// ✅ CRÉATION CORRIGÉE - ACCEPTE LES URLs CLOUDINARY DEPUIS LE BODY
exports.createChambre = async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body);
    console.log('📁 Fichiers reçus (ignorés car on utilise Cloudinary):', req.files);

    const { 
      number, 
      name, 
      type, 
      category, 
      capacity, 
      price, 
      size, 
      bedType, 
      status, 
      description, 
      amenities,
      images              // ✅ NOUVEAU : on récupère le tableau d'images depuis le body
    } = req.body;

    // Vérifier si le numéro existe déjà
    const existing = await Chambre.findOne({ number });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Une chambre avec ce numéro existe déjà' 
      });
    }

    // ✅ TRAITEMENT DES IMAGES CLOUDINARY (envoyées par le frontend)
    let processedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      processedImages = images.map((img, idx) => ({
        url: img.url,                    // URL Cloudinary (secure_url)
        alt: img.alt || `${name} - Image ${idx + 1}`,
        isPrimary: img.isPrimary !== undefined ? img.isPrimary : (idx === 0),
        order: img.order !== undefined ? img.order : idx
      }));
      console.log('🖼️ Images Cloudinary récupérées:', processedImages);
    }

    // Création de la chambre avec les images Cloudinary
    const chambre = await Chambre.create({
      number,
      name,
      type,
      category,
      capacity: parseInt(capacity),
      price: parseFloat(price),
      currency: 'XAF',
      size,
      bedType,
      status: status || 'disponible',
      description,
      amenities: Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []),
      images: processedImages
    });

    console.log('✅ Chambre créée avec succès (Cloudinary) :', {
      id: chambre._id,
      number: chambre.number,
      imagesCount: chambre.images.length
    });

    res.status(201).json({
      success: true,
      message: 'Chambre créée avec succès',
      chambre
    });
  } catch (err) {
    console.error('❌ Erreur création chambre:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la création de la chambre',
      error: err.message 
    });
  }
};

// ✅ AUTRES FONCTURES (inchangées)
exports.getChambres = async (req, res) => {
  try {
    const chambres = await Chambre.find({ isActive: true });
    
    res.json({
      success: true,
      count: chambres.length,
      chambres
    });
  } catch (err) {
    console.error('❌ Erreur récupération chambres:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des chambres',
      error: err.message 
    });
  }
};

exports.getChambreById = async (req, res) => {
  try {
    const chambre = await Chambre.findById(req.params.id);
    
    if (!chambre) {
      return res.status(404).json({ 
        success: false,
        message: 'Chambre non trouvée' 
      });
    }

    res.json({
      success: true,
      chambre
    });
  } catch (err) {
    console.error('❌ Erreur récupération chambre:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération de la chambre',
      error: err.message 
    });
  }
};

exports.updateChambre = async (req, res) => {
  try {
    const chambre = await Chambre.findById(req.params.id);
    
    if (!chambre) {
      return res.status(404).json({ 
        success: false,
        message: 'Chambre non trouvée' 
      });
    }

    // Si le body contient un champ `images`, on le traite comme un tableau d'URLs Cloudinary
    if (req.body.images && Array.isArray(req.body.images)) {
      req.body.images = req.body.images.map((img, idx) => ({
        url: img.url,
        alt: img.alt || chambre.name,
        isPrimary: img.isPrimary !== undefined ? img.isPrimary : (idx === 0),
        order: img.order || idx
      }));
    }

    Object.assign(chambre, req.body);
    await chambre.save();

    res.json({
      success: true,
      message: 'Chambre mise à jour avec succès',
      chambre
    });
  } catch (err) {
    console.error('❌ Erreur mise à jour chambre:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour de la chambre',
      error: err.message 
    });
  }
};

exports.deleteChambre = async (req, res) => {
  try {
    const chambre = await Chambre.findById(req.params.id);
    
    if (!chambre) {
      return res.status(404).json({ 
        success: false,
        message: 'Chambre non trouvée' 
      });
    }

    // (Optionnel) Supprimer les images du serveur local – mais comme on utilise Cloudinary,
    // on ne fait rien ici. Si vous voulez supprimer aussi sur Cloudinary, il faudrait appeler l'API.
    // Par défaut, on laisse les images sur Cloudinary.

    chambre.isActive = false;
    await chambre.save();

    res.json({
      success: true,
      message: 'Chambre supprimée avec succès'
    });
  } catch (err) {
    console.error('❌ Erreur suppression chambre:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression de la chambre',
      error: err.message 
    });
  }
};

// ⚠️ Les fonctions uploadImage, uploadMultipleImages, deleteImage ne sont plus utilisées
// avec Cloudinary. Vous pouvez les conserver ou les commenter selon vos besoins.
// Elles ne sont pas nécessaires pour le fonctionnement avec Cloudinary.

exports.uploadImage = async (req, res) => {
  // Conservé pour compatibilité, mais inactif si vous n'utilisez plus l'upload local
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Aucun fichier uploadé' 
      });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/rooms/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      image: { url: imageUrl, filename: req.file.filename }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    const uploadedImages = req.files.map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/rooms/${file.filename}`,
      filename: file.filename
    }));
    res.json({ success: true, message: `${req.files.length} image(s) uploadée(s)`, images: uploadedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../uploads/rooms', filename);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    await Chambre.updateMany(
      { 'images.url': { $regex: filename } },
      { $pull: { images: { url: { $regex: filename } } } }
    );
    res.json({ success: true, message: 'Image supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};