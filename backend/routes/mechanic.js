const express  = require('express');
const router   = express.Router();
const Car          = require('../models/Car');
const ServiceStage = require('../models/ServiceStage');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * PATCH /api/mechanic/set-estimate/:stageId
 * Mechanic – set or update the estimated minutes for a stage.
 * Body: { estimatedMinutes }  (pass null to clear)
 */
router.patch('/set-estimate/:stageId', async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    if (stage.isCompleted) return res.status(400).json({ message: 'Cannot change estimate on a completed stage.' });

    const mins = parseInt(req.body.estimatedMinutes);
    stage.estimatedMinutes = (!isNaN(mins) && mins > 0) ? mins : null;
    await stage.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');

    res.json({ message: 'Estimate updated.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/mechanic/start-stage/:stageId
 * Mechanic – marks a stage as started (records startedAt).
 * Only works if stage has not been started yet.
 */
router.patch('/start-stage/:stageId', verifyToken, async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    if (stage.startedAt) return res.status(400).json({ message: 'Stage already started.' });
    if (stage.isCompleted) return res.status(400).json({ message: 'Stage is already completed.' });

    const activeStage = await ServiceStage.findOne({
      assignedTechnician: req.user._id,
      startedAt: { $ne: null },
      isCompleted: false
    });
    if (activeStage) {
      return res.status(400).json({ message: 'You must complete your active job before starting another one.' });
    }

    const uncompletedPreviousStage = await ServiceStage.findOne({
      carId: stage.carId,
      order: { $lt: stage.order },
      isCompleted: false
    });
    if (uncompletedPreviousStage) {
      return res.status(400).json({ message: 'You cannot start this job until previous jobs for this vehicle are completed.' });
    }

    stage.startedAt = new Date();
    await stage.save();

    // Set car status to in-service
    await Car.findByIdAndUpdate(stage.carId, { status: 'in-service' });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');

    res.json({ message: `Stage "${stage.stageName}" started.`, stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/mechanic/complete-stage/:stageId
 * Mechanic – toggles the isCompleted flag on a stage.
 * Records completedAt + durationSeconds when completing;
 * clears timing fields when undoing.
 */
router.patch('/complete-stage/:stageId', verifyToken, async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    stage.isCompleted = !stage.isCompleted;

    if (stage.isCompleted) {
      // Check 10-minute wait rule — bypassed if advisor recorded a customer response
      if (stage.remarks && stage.remarks.length > 0) {
        const latestRemark = stage.remarks[stage.remarks.length - 1];
        const diffMins = (new Date() - new Date(latestRemark.createdAt)) / 1000 / 60;

        // Check if the last stoppage remark has a customer response
        const stoppageRemarks = stage.remarks.filter(r => r.isStoppage);
        const lastStoppage = stoppageRemarks[stoppageRemarks.length - 1];
        const customerResponded = lastStoppage && lastStoppage.customerResponse;

        if (diffMins < 10 && !customerResponded) {
          return res.status(400).json({ message: `You must wait 10 minutes after adding a remark before ending the job. (${Math.ceil(10 - diffMins)}m remaining)` });
        }
      }

      // Mark complete: record time + calculate duration
      stage.completedAt = new Date();
      if (stage.startedAt) {
        let additionalPausedSecs = 0;
        if (stage.isPaused && stage.lastPausedAt) {
          additionalPausedSecs = Math.round((stage.completedAt - stage.lastPausedAt) / 1000);
        }
        stage.totalPausedSeconds = (stage.totalPausedSeconds || 0) + additionalPausedSecs;
        stage.isPaused = false;
        stage.lastPausedAt = null;

        stage.durationSeconds = Math.round((stage.completedAt - stage.startedAt) / 1000) - stage.totalPausedSeconds;
      }
    } else {
      // Undo: clear all timing so mechanic can restart the stage
      stage.startedAt          = null;
      stage.completedAt        = null;
      stage.durationSeconds    = null;
      stage.isPaused           = false;
      stage.totalPausedSeconds = 0;
      stage.lastPausedAt       = null;
    }

    await stage.save();

    // Disable auto-car-status calculation since JC handles 'ready' explicitly.
    // However, we still set it to 'in-service' if not already.
    await Car.findByIdAndUpdate(stage.carId, { status: 'in-service' });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');

    res.json({ message: `Stage "${stage.stageName}" marked as ${stage.isCompleted ? 'complete' : 'incomplete'}.`, stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/mechanic/stages/:stageId/remarks
 * Mechanic - Add a live remark / stoppage reason
 */
router.post('/stages/:stageId/remarks', async (req, res) => {
  try {
    const { text, isStoppage } = req.body;
    if (!text) return res.status(400).json({ message: 'Remark text is required.' });

    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    stage.remarks.push({ text, isStoppage: !!isStoppage });
    
    // Auto-pause if it's a stoppage and not already paused
    if (isStoppage && !stage.isPaused) {
      stage.isPaused = true;
      stage.lastPausedAt = new Date();
    }

    await stage.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');

    res.json({ message: 'Remark added.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/mechanic/cars
 * Mechanic – returns the FULL job card for each assigned car,
 * including ALL stages (not just the mechanic's own).
 * Each stage has isMyStage: true if assigned to this mechanic.
 */
router.get('/cars', verifyToken, async (req, res) => {
  try {
    // Find which cars this mechanic has at least one stage on
    const myStages = await ServiceStage.find({ assignedTechnician: req.user._id })
      .populate('carId')
      .sort({ order: 1 });

    const carIds = [...new Set(myStages.map(st => st.carId ? st.carId._id.toString() : null).filter(Boolean))];
    if (carIds.length === 0) return res.json([]);

    // Fetch ALL stages for those cars, populated with technician info
    const allStagesForCars = await ServiceStage.find({ carId: { $in: carIds } })
      .populate('assignedTechnician', 'name bayName')
      .sort({ order: 1 });

    // Build car map seeded with car documents
    const carMap = {};
    myStages.forEach((st) => {
      if (!st.carId) return;
      const cId = st.carId._id.toString();
      if (!carMap[cId]) {
        carMap[cId] = { ...st.carId.toObject(), stages: [] };
      }
    });

    // Attach ALL stages to each car
    allStagesForCars.forEach((st) => {
      const cId = st.carId.toString();
      if (!carMap[cId]) return;

      const uncompletedPreviousStage = allStagesForCars.find(s =>
        s.carId.toString() === cId &&
        s.order < st.order &&
        !s.isCompleted
      );

      const stageObj = st.toObject();
      stageObj.isMyStage = st.assignedTechnician
        ? st.assignedTechnician._id.toString() === req.user._id.toString()
        : false;
      stageObj.isStartable = !uncompletedPreviousStage;

      carMap[cId].stages.push(stageObj);
    });

    // Sort stages within each car by order
    Object.values(carMap).forEach(car => {
      car.stages.sort((a, b) => a.order - b.order);
    });

    res.json(Object.values(carMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * PATCH /api/mechanic/resume-stage/:stageId
 * Mechanic - Resume a paused job
 */
router.patch('/resume-stage/:stageId', verifyToken, async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    if (stage.isPaused && stage.lastPausedAt) {
      const pausedSeconds = Math.round((new Date() - stage.lastPausedAt) / 1000);
      stage.totalPausedSeconds = (stage.totalPausedSeconds || 0) + pausedSeconds;
      stage.isPaused = false;
      stage.lastPausedAt = null;
      await stage.save();

      if (req.app.get('io')) req.app.get('io').emit('workshop_update');
      res.json({ message: 'Stage resumed.', stage });
    } else {
      res.status(400).json({ message: 'Stage is not currently paused.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
