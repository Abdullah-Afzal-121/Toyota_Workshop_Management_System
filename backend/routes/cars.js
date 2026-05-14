const express  = require('express');
const router   = express.Router();
const Car          = require('../models/Car');
const ServiceStage = require('../models/ServiceStage');

/**
 * GET /api/cars/:regNumber
 * Public – customer tracks their car by registration number.
 */
router.get('/:regNumber', async (req, res) => {
  try {
    const car = await Car.findOne({ regNumber: req.params.regNumber.toUpperCase() }).sort({ createdAt: -1 });
    if (!car) return res.status(404).json({ message: 'Car not found. Check your registration number.' });

    // ── Verification: Name + Phone must match ──
    const providedPhone = (req.query.phone || '').replace(/\s/g, '');
    const providedName  = (req.query.name  || '').trim().toLowerCase();

    const storedPhone = (car.phoneNumber  || '').replace(/\s/g, '');
    const storedName  = (car.customerName || '').trim().toLowerCase();

    if (!providedPhone || !providedName) {
      return res.status(403).json({ message: 'Please fill in your Name and Phone Number to verify ownership.' });
    }
    if (providedPhone !== storedPhone || providedName !== storedName) {
      return res.status(403).json({ message: 'Details do not match our records. Please check your Name and Phone Number.' });
    }

    const stages = await ServiceStage.find({ carId: car._id }).sort({ order: 1 });

    // Strip internal JC rejection remarks — customers should never see these
    const customerStages = stages.map(stage => {
      const s = stage.toObject();
      if (s.remarks && s.remarks.length > 0) {
        s.remarks = s.remarks.filter(r => !r.text || !r.text.includes('REJECTED BY JOB CONTROLLER'));
      }
      return s;
    });

    const completed = stages.filter((s) => s.isCompleted).length;
    const progress  = stages.length ? Math.round((completed / stages.length) * 100) : 0;

    res.json({ car, stages: customerStages, progress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/cars/:regNumber/feedback
 * Customer – submit a star rating and comment once the car is ready.
 * Body: { rating (1-5), comment (optional) }
 */
router.post('/:regNumber/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    const car = await Car.findOne({ regNumber: req.params.regNumber.toUpperCase() }).sort({ createdAt: -1 });
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    if (car.status !== 'ready') {
      return res.status(400).json({ message: 'Feedback can only be submitted once the car is marked as Ready.' });
    }
    car.feedback = { rating: Number(rating), comment: (comment || '').trim(), submittedAt: new Date() };
    await car.save();
    res.json({ message: 'Thank you for your feedback!', feedback: car.feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
