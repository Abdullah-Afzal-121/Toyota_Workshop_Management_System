const express  = require('express');
const router   = express.Router();
const Car          = require('../models/Car');
const ServiceStage = require('../models/ServiceStage');
const JobMaster    = require('../models/JobMaster');
const User         = require('../models/User');
const Bay          = require('../models/Bay');
const bcrypt       = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * POST /api/admin/add-car
 * Admin – registers a new car. No stages are auto-created;
 * the admin adds them manually via the stage management sheet.
 * Body: { customerName, carModel, regNumber }
 */
router.post('/add-car', verifyToken, requireRole('admin', 'advisor'), async (req, res) => {
  try {
    const { customerName, carModel, regNumber, assignedMechanic, phoneNumber, needsAlignment, needsWashing } = req.body;

    if (!customerName || !carModel || !regNumber) {
      return res.status(400).json({ message: 'customerName, carModel, and regNumber are required.' });
    }

    // Check for duplicate registration
    const existing = await Car.findOne({ regNumber: regNumber.toUpperCase() });
    if (existing) return res.status(409).json({ message: `Car with reg ${regNumber.toUpperCase()} already exists.` });

    const car = await Car.create({
      customerName,
      carModel,
      regNumber: regNumber.toUpperCase(),
      phoneNumber: phoneNumber || '',
      needsAlignment: !!needsAlignment,
      needsWashing: !!needsWashing,
      assignedMechanic: assignedMechanic || null,
      serviceAdvisor: req.user ? req.user._id : null,
    });

    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.status(201).json({ message: 'Car registered successfully.', car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/stats
 * Admin – dashboard KPI counts.
 */
router.get('/stats', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (_req, res) => {
  try {
    const [total, inService, ready, pending] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'in-service' }),
      Car.countDocuments({ status: 'ready' }),
      Car.countDocuments({ status: 'pending' }),
    ]);
    res.json({ total, inService, ready, pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/cars
 * Admin – list all cars enriched with their current active stage name.
 */
router.get('/cars', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (_req, res) => {
  try {
    const cars = await Car.find()
      .populate('assignedMechanic', 'name email bayName')
      .populate('serviceAdvisor', 'name email role')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      cars.map(async (car) => {
        const stages = await ServiceStage.find({ carId: car._id })
          .populate('assignedTechnician', 'name bayName')
          .sort({ order: 1 });
        const currentStage =
          stages.find((s) => !s.isCompleted)?.stageName ||
          (stages.length ? 'All Stages Complete' : 'No Stages');
        const completedCount = stages.filter((s) => s.isCompleted).length;
        const progress = stages.length
          ? Math.round((completedCount / stages.length) * 100)
          : 0;
        const totalEstimatedMinutes = stages.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
        return { 
          ...car.toObject(), 
          stages,
          currentStage, 
          progress, 
          stageCount: stages.length,
          completedCount,
          totalEstimatedMinutes
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/cars/:carId/stages
 * Admin – list all stages for a specific car.
 */
router.get('/cars/:carId/stages', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const stages = await ServiceStage.find({ carId: req.params.carId }).sort({ order: 1 });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/cars/:carId/stages
 * Admin – add a new stage to an existing car.
 * Body: { stageName, estimatedMinutes? }
 */
router.post('/cars/:carId/stages', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const { stageName, estimatedMinutes } = req.body;
    if (!stageName?.trim()) return res.status(400).json({ message: 'stageName is required.' });
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    const last = await ServiceStage.findOne({ carId: req.params.carId }).sort({ order: -1 });
    const nextOrder = last ? last.order + 1 : 1;
    const estMin = estimatedMinutes ? parseInt(estimatedMinutes) : null;
    const stage = await ServiceStage.create({
      stageName: stageName.trim(),
      carId: req.params.carId,
      order: nextOrder,
      estimatedMinutes: estMin && estMin > 0 ? estMin : null,
    });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.status(201).json(stage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/cars/:carId
 * Advisor/Admin – update car details (name, model, phone, reg, flags).
 * Only allowed when car has no completed stages (i.e. work has not started).
 */
router.patch('/cars/:carId', verifyToken, requireRole('admin', 'advisor'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const { customerName, carModel, regNumber, phoneNumber, needsAlignment, needsWashing } = req.body;

    if (customerName !== undefined) car.customerName = customerName.trim();
    if (carModel     !== undefined) car.carModel     = carModel.trim() || 'N/A';
    if (phoneNumber  !== undefined) car.phoneNumber  = phoneNumber.trim();
    if (needsAlignment !== undefined) car.needsAlignment = !!needsAlignment;
    if (needsWashing   !== undefined) car.needsWashing   = !!needsWashing;

    // If reg number is changing, check for duplicate
    if (regNumber !== undefined) {
      const newReg = regNumber.trim().toUpperCase();
      if (newReg !== car.regNumber) {
        const exists = await Car.findOne({ regNumber: newReg, _id: { $ne: car._id } });
        if (exists) return res.status(409).json({ message: `Registration number ${newReg} is already in use.` });
      }
      car.regNumber = regNumber.trim().toUpperCase();
    }

    await car.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Car details updated.', car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/cars/:carId
 * Admin/Advisor – remove a car and all associated stages.
 * Used for rollback when registration fails partway through.
 */
router.delete('/cars/:carId', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    // Only allow deletion if car has no completed stages (safety guard)
    const completedStages = await ServiceStage.countDocuments({ carId: req.params.carId, isCompleted: true });
    if (completedStages > 0) {
      return res.status(400).json({ message: 'Cannot delete a car with completed stages.' });
    }
    await ServiceStage.deleteMany({ carId: req.params.carId });
    await car.deleteOne();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Car and all stages removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/stages/:stageId
 * Admin – remove a single stage (only if not yet completed).
 */
router.delete('/stages/:stageId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    if (stage.isCompleted) return res.status(400).json({ message: 'Cannot delete a completed stage.' });
    await stage.deleteOne();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Stage deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/stages/:stageId/allocate
 * JC – Assign a technician and customize estimated duration.
 */
router.put('/stages/:stageId/allocate', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const { assignedTechnician, estimatedMinutes } = req.body;
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    
    if (assignedTechnician !== undefined) stage.assignedTechnician = assignedTechnician || null;
    if (estimatedMinutes !== undefined) stage.estimatedMinutes = estimatedMinutes;
    
    await stage.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Stage allocated.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/cars/:carId/allocate-all
 * JC – Assign a technician to the vehicle globally, mapping to all pending stages.
 */
router.put('/cars/:carId/allocate-all', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const { assignedMechanic, customEstimatedMinutes } = req.body;
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    // Update car global assigned mechanic
    car.assignedMechanic = assignedMechanic || null;
    await car.save();

    // Update all uncompleted stages with this technician
    const stages = await ServiceStage.find({ carId: car._id, isCompleted: false });
    for (const stage of stages) {
      stage.assignedTechnician = assignedMechanic || null;
      if (customEstimatedMinutes) {
        stage.estimatedMinutes = customEstimatedMinutes;
      }
      await stage.save();
    }

    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Vehicle and all pending stages allocated.', car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/stages/:stageId/verify
 * JC – Verify completion of a stage.
 */
router.put('/stages/:stageId/verify', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    
    stage.jcVerified = true;
    await stage.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Stage verified by JC.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/stages/:stageId/reject
 * JC – Reject a completed stage, sending it back to the mechanic for rework.
 */
router.put('/stages/:stageId/reject', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    
    // Reset completion status
    stage.isCompleted = false;
    stage.jcVerified = false;
    stage.completedAt = null;
    stage.durationSeconds = null;

    // Add an automated remark for context
    stage.remarks.push({
      text: '❌ REJECTED BY JOB CONTROLLER - Requires Rework',
      isStoppage: true,
      createdAt: new Date()
    });

    await stage.save();

    // Ensure car status is back to in-service if it was somehow marked ready
    await Car.findByIdAndUpdate(stage.carId, { status: 'in-service' });

    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Stage rejected and sent back for rework.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/stages/:stageId/remarks/:remarkId/acknowledge
 * JC - Acknowledge a stoppage/remark.
 */
router.put('/stages/:stageId/remarks/:remarkId/acknowledge', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });
    
    const remark = stage.remarks.id(req.params.remarkId);
    if (remark) {
      remark.acknowledgedByJC = true;
      await stage.save();
    }
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Remark acknowledged.', stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/stages/:stageId/remarks/:remarkId/customer-response
 * Advisor – records the customer's response (approved / declined) on a stoppage remark.
 * Once recorded, the mechanic's 10-minute wait is lifted immediately.
 * Body: { response: 'approved' | 'declined' }
 */
router.put('/stages/:stageId/remarks/:remarkId/customer-response', verifyToken, requireRole('admin', 'advisor'), async (req, res) => {
  try {
    const { response } = req.body;
    if (!['approved', 'declined'].includes(response)) {
      return res.status(400).json({ message: "response must be 'approved' or 'declined'." });
    }

    const stage = await ServiceStage.findById(req.params.stageId);
    if (!stage) return res.status(404).json({ message: 'Stage not found.' });

    const remark = stage.remarks.id(req.params.remarkId);
    if (!remark) return res.status(404).json({ message: 'Remark not found.' });
    if (!remark.isStoppage) return res.status(400).json({ message: 'Customer response can only be recorded on stoppage remarks.' });

    remark.customerResponse = response;
    remark.customerResponseAt = new Date();
    remark.responseRecordedBy = req.user._id;

    // Only auto-resume if customer APPROVED — declined means the work should not proceed automatically
    if (response === 'approved' && stage.isPaused && stage.lastPausedAt) {
      const pausedSeconds = Math.round((new Date() - stage.lastPausedAt) / 1000);
      stage.totalPausedSeconds = (stage.totalPausedSeconds || 0) + pausedSeconds;
      stage.isPaused = false;
      stage.lastPausedAt = null;
    }

    await stage.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: `Customer response recorded: ${response}.`, stage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/cars/:carId
 * Admin – delete a car and all its associated stages.
 */
router.delete('/cars/:carId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    await ServiceStage.deleteMany({ carId: req.params.carId });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Car and all associated stages deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/cars/:carId/status
 * Update the status of a car (e.g. to 'closed')
 */
router.put('/cars/:carId/status', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const { status } = req.body;
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    
    car.status = status;
    // Track when the car first became ready for delivery
    if (status === 'ready' && !car.readyAt) {
      car.readyAt = new Date();
    } else if (status !== 'ready') {
      car.readyAt = null;
    }
    await car.save();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Car status updated.', car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ACCOUNT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/staff
 * Returns all non-admin user accounts (mechanic + customer).
 */
router.get('/staff', verifyToken, requireRole('admin', 'job_controller'), async (_req, res) => {
  try {
    const users = await User.find({}).select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/staff
 * Admin creates a new staff account (mechanic, customer, or admin).
 * Body: { name, email, password, role }
 */
router.post('/staff', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, bayName, specialization } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (!['admin', 'advisor', 'job_controller', 'mechanic', 'customer'].includes(role))
      return res.status(400).json({ message: 'Role must be admin, advisor, job_controller, mechanic, or customer.' });

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists)
      return res.status(409).json({ message: 'An account with that email already exists.' });

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      bayName: bayName || null,
      specialization: specialization || null,
    });
    res.status(201).json({
      message: 'Account created successfully.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, bayName: user.bayName, specialization: user.specialization, createdAt: user.createdAt },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/staff/:userId
 * Admin deletes a staff account.
 */
router.delete('/staff/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: `Account for ${user.email} deleted.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/profile
 * Admin updates their own name (and optionally email).
 * Requires: Bearer token
 */
router.put('/profile', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required.' });

    const updates = { name: name.trim() };
    if (email && email.trim()) {
      const emailLower = email.trim().toLowerCase();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: req.user.id } });
      if (existing) return res.status(409).json({ message: 'Email already in use.' });
      updates.email = emailLower;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Profile updated.', user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || null, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/change-password
 * Admin changes their own password.
 * Body: { currentPassword, newPassword }
 */
router.put('/change-password', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/avatar
 * Admin uploads a profile picture (base64 data URL).
 * Body: { avatar } — base64 data URL string
 */
router.put('/avatar', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'Avatar data is required.' });
    // Basic size guard: base64 of 2MB ≈ 2.7MB string
    if (avatar.length > 3 * 1024 * 1024) return res.status(413).json({ message: 'Image too large. Max 2MB.' });

    const user = await User.findByIdAndUpdate(req.user.id, { avatar }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Avatar updated.', avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── Job Master File Routes ───────────────────────────────────────────────────

/**
 * GET /api/admin/job-master
 * Fetch all job master templates
 */
router.get('/job-master', verifyToken, requireRole('admin', 'advisor', 'job_controller'), async (req, res) => {
  try {
    const jobs = await JobMaster.find().sort({ title: 1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/job-master
 * Create a new service template
 */
router.post('/job-master', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Basic structural auth check, if needed
    if (!['admin', 'advisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins or advisors can modify the Job Master schema.' });
    }

    const { title, estimatedMinutes, category } = req.body;
    if (!title || !estimatedMinutes || !category) return res.status(400).json({ message: 'Title, category, and estimatedMinutes are required.' });

    const exists = await JobMaster.findOne({ title: title.trim() });
    if (exists) return res.status(409).json({ message: 'Service with this exact title already exists.' });

    const job = await JobMaster.create({ title: title.trim(), category: category.trim(), estimatedMinutes });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.status(201).json({ message: 'Job Template inserted.', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/job-master/:id
 * Delete a service template
 */
router.delete('/job-master/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!['admin', 'advisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permissions denied.' });
    }
    await JobMaster.findByIdAndDelete(req.params.id);
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Template removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/job-master/:id
 */
router.put('/job-master/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!['admin', 'advisor'].includes(req.user.role)) return res.status(403).json({ message: 'Permissions denied.' });
    const { title, estimatedMinutes, category } = req.body;
    const update = {};
    if (title) update.title = title.trim();
    if (estimatedMinutes) update.estimatedMinutes = estimatedMinutes;
    if (category) update.category = category.trim();

    const job = await JobMaster.findByIdAndUpdate(req.params.id, update, { new: true });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Template updated.', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/staff/:id/status
 */
router.patch('/staff/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'User status updated.', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/cars/:id/archive
 */
router.patch('/cars/:id/archive', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Car archived.', car });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Bay Management Routes ──────────────────────────────────────────────────────

/**
 * GET /api/admin/bays
 * Fetch all bays, enriched with assigned mechanics and the active vehicles in those bays.
 */
router.get('/bays', verifyToken, requireRole('admin', 'job_controller'), async (req, res) => {
  try {
    const bays = await Bay.find().sort({ createdAt: 1 });
    
    // Instead of doing multiple queries per bay in a loop, we can just aggregate or parallelize.
    const enrichedBays = await Promise.all(
      bays.map(async (bay) => {
        // Find mechanics working in this bay
        const mechanics = await User.find({ role: 'mechanic', bayName: bay.name, isActive: true }).select('name email');
        const mechanicIds = mechanics.map(m => m._id);

        // Find cars assigned to those mechanics and not archived/closed
        const cars = await Car.find({ assignedMechanic: { $in: mechanicIds }, status: { $in: ['pending', 'in-service', 'ready'] } }).select('regNumber carModel status customerName');

        return {
          ...bay.toObject(),
          mechanics,
          cars
        };
      })
    );

    res.json(enrichedBays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/bays
 */
router.post('/bays', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!['admin', 'advisor'].includes(req.user.role)) return res.status(403).json({ message: 'Permissions denied.' });
    
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Bay name is required.' });

    const exists = await Bay.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ message: 'Bay with this name already exists.' });

    const bay = await Bay.create({ name: name.trim(), description: description || '' });
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.status(201).json({ message: 'Bay created successfully.', bay });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/bays/:id
 */
router.put('/bays/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!['admin', 'advisor'].includes(req.user.role)) return res.status(403).json({ message: 'Permissions denied.' });
    
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Bay name is required.' });

    const bay = await Bay.findById(req.params.id);
    if (!bay) return res.status(404).json({ message: 'Bay not found.' });

    const oldName = bay.name;
    const newName = name.trim();

    // Check conflict
    if (oldName !== newName) {
      const exists = await Bay.findOne({ name: newName });
      if (exists) return res.status(409).json({ message: 'Another bay with this name exists.' });
    }

    bay.name = newName;
    if (description !== undefined) bay.description = description;
    await bay.save();

    // Cascade update all mechanics who were assigned to the old bay name
    if (oldName !== newName) {
      await User.updateMany({ role: 'mechanic', bayName: oldName }, { bayName: newName });
    }

    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Bay updated successfully.', bay });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/bays/:id
 */
router.delete('/bays/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (!['admin', 'advisor'].includes(req.user.role)) return res.status(403).json({ message: 'Permissions denied.' });

    const bay = await Bay.findById(req.params.id);
    if (!bay) return res.status(404).json({ message: 'Bay not found.' });

    // Optional: unassign mechanics or leave them. We'll simply set their bayName to null.
    await User.updateMany({ role: 'mechanic', bayName: bay.name }, { bayName: null });

    await bay.deleteOne();
    if (req.app.get('io')) req.app.get('io').emit('workshop_update');
    res.json({ message: 'Bay deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
