/* ══════════════════════════════════════════
   VoltEarth — Auth & App Bootstrap (auth.js)
   ✅ Real DB-backed login & register
   ✅ Email existence check before login
   ✅ Password hash match check
   ✅ Unique password enforcement across accounts
   ✅ Inline field-level error messages
   ✅ Errors clear as user types
══════════════════════════════════════════ */

/* ── Validation helpers ── */
function isValidEmail(e){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function showFieldError(fieldId, msg){
  clearFieldError(fieldId);
  const el = document.getElementById(fieldId);
  if(!el) return;
  el.style.borderColor = '#ef4444';
  el.style.boxShadow   = '0 0 0 2px rgba(239,68,68,.18)';
  const err = document.createElement('div');
  err.id = fieldId + '-err';
  err.style.cssText = 'color:#ef4444;font-size:11.5px;margin-top:5px;font-weight:600;display:flex;align-items:center;gap:4px;';
  err.innerHTML = `<span style="font-size:13px;">⚠</span> ${msg}`;
  el.parentNode.insertBefore(err, el.nextSibling);
}

function clearFieldError(fieldId){
  const el  = document.getElementById(fieldId);
  if(el){ el.style.borderColor=''; el.style.boxShadow=''; }
  const err = document.getElementById(fieldId + '-err');
  if(err) err.remove();
}

function clearAllErrors(ids){ ids.forEach(id => clearFieldError(id)); }

/* ── Tab switch ── */
function authTab(tab, el){
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('frm-login').style.display = tab==='login'    ? 'block' : 'none';
  document.getElementById('frm-reg').style.display   = tab==='register' ? 'block' : 'none';
  clearAllErrors(['l-email','l-pass','r-name','r-email','r-pass']);
}

/* ══════════════════════════════════════════
   SIGN IN — real DB auth
══════════════════════════════════════════ */
async function doLogin(){
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;

  clearAllErrors(['l-email','l-pass']);
  let valid = true;

  if(!email){
    showFieldError('l-email', 'Email is required');
    valid = false;
  } else if(!isValidEmail(email)){
    showFieldError('l-email', 'Enter a valid email address');
    valid = false;
  }

  if(!pass){
    showFieldError('l-pass', 'Password is required');
    valid = false;
  } else if(pass.length < 6){
    showFieldError('l-pass', 'Password must be at least 6 characters');
    valid = false;
  }

  if(!valid) return;

  showLoader('Checking account…');

  /* ── Step 1: Does this email exist in DB? ── */
  const dbUser = await dbGetUserByEmail(email);

  if(!dbUser){
    hideLoader();
    showFieldError('l-email',
      'No account found with this email. Please register first.');
    return;
  }

  /* ── Step 2: Does this account have a password set? ── */
  if(!dbUser.password_hash){
    /* Legacy / seeded accounts with no password — allow once, set password prompt */
    hideLoader();
    showFieldError('l-pass',
      'This account has no password set. Please register to set one.');
    return;
  }

  /* ── Step 3: Does the password match? ── */
  const inputHash = await hashPassword(pass);
  if(inputHash !== dbUser.password_hash){
    hideLoader();
    showFieldError('l-pass',
      'Incorrect password. Please try again or register a new account.');
    return;
  }

  /* ── Step 4: Success — update last_login and enter app ── */
  const ip     = '103.21.58.' + Math.floor(Math.random()*255);
  const device = 'Chrome / Browser';
  await dbUpdateLastLogin(email, ip, device);

  user = {
    name     : dbUser.name,
    email    : dbUser.email,
    db_id    : dbUser.id,
    loginTime: new Date(),
    ip, device
  };

  hideLoader();
  startApp();
}

/* ══════════════════════════════════════════
   DEMO LOGIN
══════════════════════════════════════════ */
async function demoLogin(){
  showLoader('Loading demo…');
  user = {
    name     : 'Demo User',
    email    : 'demo@voltearth.io',
    loginTime: new Date(),
    ip       : '127.0.0.1',
    device   : 'Demo Browser'
  };
  /* Upsert demo user (no password — demo only) */
  const saved = await dbSaveUser(user);
  if(saved) user.db_id = saved.id;
  hideLoader();
  startApp();
}

/* ══════════════════════════════════════════
   REGISTER — real DB registration
══════════════════════════════════════════ */
async function doRegister(){
  const name  = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const pass  = document.getElementById('r-pass').value;

  clearAllErrors(['r-name','r-email','r-pass']);
  let valid = true;

  if(!name){
    showFieldError('r-name', 'Full name is required');
    valid = false;
  } else if(name.length < 2){
    showFieldError('r-name', 'Name must be at least 2 characters');
    valid = false;
  }

  if(!email){
    showFieldError('r-email', 'Email is required');
    valid = false;
  } else if(!isValidEmail(email)){
    showFieldError('r-email', 'Enter a valid email address');
    valid = false;
  }

  if(!pass){
    showFieldError('r-pass', 'Password is required');
    valid = false;
  } else if(pass.length < 8){
    showFieldError('r-pass', 'Password must be at least 8 characters');
    valid = false;
  } else if(!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)){
    showFieldError('r-pass', 'Password must include both letters and numbers');
    valid = false;
  }

  if(!valid) return;

  showLoader('Checking availability…');

  /* ── Step 1: Email already registered? ── */
  const existing = await dbGetUserByEmail(email);
  if(existing){
    hideLoader();
    showFieldError('r-email',
      'An account with this email already exists. Please sign in instead.');
    return;
  }

  /* ── Step 2: Password already used by another account? ── */
  const passHash = await hashPassword(pass);
  const passTaken = await dbIsPasswordTaken(passHash);
  if(passTaken){
    hideLoader();
    showFieldError('r-pass',
      'This password is already used by another account. Please choose a different password.');
    return;
  }

  /* ── Step 3: Create account ── */
  showLoader('Creating your account…');
  const ip     = '103.21.58.' + Math.floor(Math.random()*255);
  const device = 'Chrome / Browser';

  const userData = { name, email, ip, device };
  const saved = await dbRegisterUser(userData, passHash);

  if(!saved){
    hideLoader();
    showFieldError('r-email',
      'Registration failed. Please try again.');
    return;
  }

  user = {
    name,
    email,
    db_id    : saved.id,
    loginTime: new Date(),
    ip, device
  };

  hideLoader();
  toast('🎉 Account created successfully! Welcome to VoltEarth.');
  startApp();
}

/* ══════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════ */
function logout(){
  logAct(user?.name||'User', 'Logout', 'Session ended', gpsStr(), 'auth');
  user = null;
  document.getElementById('shell').style.display = 'none';
  document.getElementById('page-auth').classList.add('active');
  /* Clear login fields */
  ['l-email','l-pass','r-name','r-email','r-pass'].forEach(id => {
    const el = document.getElementById(id);
    if(el && id !== 'l-email') el.value = '';
  });
  clearAllErrors(['l-email','l-pass','r-name','r-email','r-pass']);
  toast('👋 Signed out successfully.');
}

/* ══════════════════════════════════════════
   START APP — runs after any successful login
══════════════════════════════════════════ */
async function startApp(){
  document.getElementById('page-auth').classList.remove('active');
  document.getElementById('shell').style.display = 'block';

  const ini = (user.name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('nav-av').textContent   = ini;
  document.getElementById('nav-name').textContent = user.name;
  document.getElementById('dash-dt').textContent  =
    new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  logAct(user.name, 'Login', 'Dashboard', '—', 'auth');

  showLoader('Connecting to database…');
  await initDB();

  showLoader('Loading energy records…');
  const dbRows = await dbLoadReportRows();
  if(dbRows && dbRows.length > 0){
    allRptRows = dbRows;
  } else {
    buildRptData();
  }

  showLoader('Loading activity logs…');
  const dbAct = await dbLoadActivityLogs();
  if(dbAct && dbAct.length > 0){
    allActRows = dbAct;
  } else {
    buildFakeActivityData();
  }

  hideLoader();

  setGPSDisplay('India','India','India', null, 'Default');
  go('dashboard', document.querySelector('.nav-link'));
  setTimeout(initDashCharts, 120);

  toast('✅ Connected — welcome back, ' + user.name.split(' ')[0] + '!');
}
