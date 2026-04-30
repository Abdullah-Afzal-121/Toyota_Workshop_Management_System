const fs = require('fs');
let code = fs.readFileSync('admin.js', 'utf8');

if (!code.includes('requireRole')) {
  code = code.replace(
    'const { verifyToken } = require(\'../middleware/authMiddleware\');',
    'const { verifyToken, requireRole } = require(\'../middleware/authMiddleware\');'
  );
}

// Helper to inject our middleware.
// Pattern will match router.get('/path', verifyToken, async (req, res) => {
// or router.get('/path', async (req, res) => {
function inject(route, method, roles) {
  const requireStr = `requireRole(${roles.map(r => `'${r}'`).join(', ')})`;
  
  // Create an explicit regex
  // E.g. router.get('/cars',
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex1 = new RegExp(`router\\.${method}\\('${escapedRoute}',\\s*verifyToken,\\s*async`, 'g');
  const regex2 = new RegExp(`router\\.${method}\\('${escapedRoute}',\\s*async`, 'g');
  
  let matchCount = 0;
  
  if (regex1.test(code)) {
    code = code.replace(regex1, `router.${method}('${route}', verifyToken, ${requireStr}, async`);
    matchCount++;
  } else if (regex2.test(code)) {
    code = code.replace(regex2, `router.${method}('${route}', verifyToken, ${requireStr}, async`);
    matchCount++;
  } else {
    // try removing verifyToken completely if not standard spaced
    const loose = new RegExp(`router\\.${method}\\('${escapedRoute}',(.*?)\\(`);
    console.log("Could not find strict match for:", method, route);
  }
}

// Admin / Advisor endpoints
inject('/add-car', 'post', ['admin', 'advisor']);
inject('/cars/:carId/status', 'put', ['admin', 'advisor', 'job_controller']);

// Analytics & listings
inject('/stats', 'get', ['admin', 'advisor', 'job_controller']);
inject('/cars', 'get', ['admin', 'advisor', 'job_controller']);
inject('/cars/:carId/stages', 'get', ['admin', 'advisor', 'job_controller']);

// Job Controller updates
inject('/stages/:stageId/allocate', 'put', ['admin', 'job_controller']);
inject('/cars/:carId/allocate-all', 'put', ['admin', 'job_controller']);
inject('/stages/:stageId/verify', 'put', ['admin', 'job_controller']);
inject('/stages/:stageId/remarks/:remarkId/acknowledge', 'put', ['admin', 'job_controller']);

// Standard Admin only
inject('/cars/:carId/stages', 'post', ['admin']);
inject('/stages/:stageId', 'delete', ['admin']);
inject('/cars/:carId', 'delete', ['admin']);

inject('/staff', 'get', ['admin']);
inject('/staff', 'post', ['admin']);
inject('/staff/:userId', 'delete', ['admin']);
inject('/staff/:id/status', 'patch', ['admin']);

inject('/job-master', 'get', ['admin', 'advisor', 'job_controller']);
inject('/job-master', 'post', ['admin']);
inject('/job-master/:id', 'delete', ['admin']);
inject('/job-master/:id', 'put', ['admin']);

inject('/cars/:id/archive', 'patch', ['admin']);

// Bays
inject('/bays', 'get', ['admin', 'job_controller']);
inject('/bays', 'post', ['admin']);
inject('/bays/:id', 'put', ['admin']);
inject('/bays/:id', 'delete', ['admin']);

// Profile and Avatar
inject('/profile', 'put', ['admin', 'advisor', 'job_controller']);
inject('/avatar', 'put', ['admin', 'advisor', 'job_controller']);
inject('/change-password', 'put', ['admin', 'advisor', 'job_controller']);

fs.writeFileSync('admin.js', code, 'utf8');
console.log("admin.js patched successfully.");
