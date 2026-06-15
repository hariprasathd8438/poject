/* ══════════════════════════════════════════
   VoltEarth — Location & Navigation (location.js)
   GPS, Manual dropdowns, Location modal, Navigation
══════════════════════════════════════════ */

// GPS / LOCATION DISPLAY
// ══════════════════════════════════════════
// setGPSDisplay: updates all UI, NO coords shown for manual selections
function setGPSDisplay(city, state, country, accuracy, method, lat, lng){
  gpsData.city = city;
  gpsData.state = state;
  gpsData.country = country;
  gpsData.accuracy = accuracy;
  gpsData.method = method;
  if(lat != null) gpsData.lat = parseFloat(lat).toFixed(4);
  if(lng != null) gpsData.lng = parseFloat(lng).toFixed(4);

  const isGPS = (method === 'GPS');
  const locStr = buildLocationLabel(city, state, country);

  // GPS banner title
  const t = document.getElementById('gps-title');
  const c = document.getElementById('gps-coords');
  if(t) t.textContent = '📍 ' + locStr;
  if(c){
    if(isGPS && lat != null){
      const accStr = accuracy ? ` · ±${Math.round(accuracy)}m` : '';
      c.textContent = `${parseFloat(lat).toFixed(4)}°N, ${parseFloat(lng).toFixed(4)}°E${accStr} · via GPS`;
    } else {
      c.textContent = `via ${method}`;
    }
  }

  // Generator GPS banner
  const t2=document.getElementById('gen-gps-title'),c2=document.getElementById('gen-gps-coords');
  if(t2) t2.textContent='📍 '+locStr;
  if(c2){
    if(isGPS && lat != null){
      const accStr = accuracy ? ` · ±${Math.round(accuracy)}m` : '';
      c2.textContent = `${parseFloat(lat).toFixed(4)}°N, ${parseFloat(lng).toFixed(4)}°E${accStr} · via GPS`;
    } else {
      c2.textContent = `via ${method}`;
    }
  }

  // GPS badge
  const badge=document.getElementById('gps-badge');
  if(badge){
    badge.textContent = isGPS ? 'GPS Locked' : 'Manual Location';
    badge.className = 'badge ' + (isGPS ? 'b-ok' : 'b-info');
  }

  // Map label — show coords only for GPS
  const ml=document.getElementById('map-label');
  if(ml){
    if(isGPS && lat != null){
      ml.textContent=`${parseFloat(lat).toFixed(4)}°N, ${parseFloat(lng).toFixed(4)}°E · ${locStr}`;
    } else {
      ml.textContent = locStr;
    }
  }

  // Nav badge
  const dl=document.getElementById('dash-loc');
  if(dl) dl.textContent = locStr;

  // Temperature
  const temp = Math.round(22 + Math.random()*16);
  updTemp(temp);
  document.getElementById('temp-in').value = temp;
}

function buildLocationLabel(city, state, country){
  // Build a clean, deduplicated label
  const parts = [];
  if(city && city !== 'India' && city !== country && city !== state) parts.push(city);
  if(state && state !== country && state !== city) parts.push(state);
  if(country) parts.push(country);
  return parts.length ? parts.join(', ') : country || 'India';
}

function gpsStr(){
  if(gpsData.lat && gpsData.method === 'GPS') return `${gpsData.lat}°N, ${gpsData.lng}°E`;
  return gpsData.city && gpsData.city !== 'India' ? `${gpsData.city}, ${gpsData.state}` : 'India';
}
function gpsCity(){return gpsData.city||'Location';}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
function go(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(el&&el.classList) el.classList.add('active');
  if(id==='dashboard') setTimeout(initDashCharts,80);
  if(id==='reports') setTimeout(async()=>{
    // Try refresh from DB first
    const dbRows = await dbLoadReportRows();
    if(dbRows && dbRows.length > 0) allRptRows = dbRows;
    initRptChart(curTf);
    renderRptTable(allRptRows.slice(0,30));
  },80);
  if(id==='activity') setTimeout(async()=>{
    // Try refresh from DB first
    const dbAct = await dbLoadActivityLogs();
    if(dbAct && dbAct.length > 0){
      // Merge with in-memory logs (deduplicate by keeping DB data primary)
      allActRows = [...dbAct, ...allActRows.filter(r=>r.local)].sort((a,b)=>b.time-a.time);
    }
    buildActUI();
  },60);
  if(id==='generator') setTimeout(()=>{if(!selectedLocationType) initLocationSelection();},100);
  logAct(user?.name||'User','View Page',id.charAt(0).toUpperCase()+id.slice(1),gpsStr(),'view');
}

// ══════════════════════════════════════════
// TEMPERATURE GAUGE
// ══════════════════════════════════════════
function updTemp(v){
  v=parseFloat(v)||22;
  const pct=Math.min(Math.max((v+10)/65,0),1);
  const dashOff=144.5*(1-pct);
  const arc=document.getElementById('garc'),inner=document.getElementById('garc-txt');
  const tv=document.getElementById('tval'),tl=document.getElementById('tlbl');
  if(!arc) return;
  const color=v<15?'#3b82f6':v<28?'#06b6d4':v<38?'#f59e0b':'#ef4444';
  arc.style.strokeDashoffset=dashOff; arc.setAttribute('stroke',color);
  if(inner) inner.textContent=v+'°C';
  if(tv){tv.textContent=v+'°C'; tv.style.color=color;}
  const desc=v<10?'Very Cold':v<18?'Cold':v<25?'Comfortable':v<32?'Warm':v<40?'Hot':'Extreme Heat';
  const feels=Math.round(v*1.07+1.5);
  const loc = buildLocationLabel(gpsData.city, gpsData.state, gpsData.country);
  if(tl) tl.textContent=`${loc} · ${desc} · Feels like ${feels}°C`;
}

// ══════════════════════════════════════════
// DROPDOWN HANDLERS
// ══════════════════════════════════════════
function updStates(){
  const c=document.getElementById('sel-c').value;
  const se=document.getElementById('sel-s');
  se.innerHTML='<option value="">Select State</option>';
  document.getElementById('sel-d').innerHTML='<option value="">Select District</option>';
  (LOC_DATA[c]?.states||[]).forEach(s=>{
    const o=document.createElement('option');o.value=s;o.textContent=s;se.appendChild(o);
  });
}

function updDists(){
  const c=document.getElementById('sel-c').value,s=document.getElementById('sel-s').value;
  const de=document.getElementById('sel-d');
  de.innerHTML='<option value="">Select District</option>';
  (LOC_DATA[c]?.districts?.[s]||[]).forEach(d=>{
    const o=document.createElement('option');o.value=d;o.textContent=d;de.appendChild(o);
  });
}

// Called when country changes in manual mode
function onCountryChange(){
  if(!selectedLocationType) return;
  const c = document.getElementById('sel-c').value;
  const countryName = document.querySelector('#sel-c option:checked')?.textContent || c;
  if(selectedLocationType === 'country'){
    setGPSDisplay(countryName, countryName, countryName, null, 'Manual (Country)');
  }
}

// Called when state changes in manual mode
function onStateChange(){
  if(!selectedLocationType) return;
  const c = document.getElementById('sel-c').value;
  const s = document.getElementById('sel-s').value;
  const countryName = document.querySelector('#sel-c option:checked')?.textContent || c;
  if(!s) return;
  const coords = STATE_COORDS[s];
  if(selectedLocationType === 'state' || selectedLocationType === 'district'){
    setGPSDisplay(s, s, countryName, null, 'Manual (State)');
  }
}

// Called when district changes in manual mode
function onDistrictChange(){
  if(!selectedLocationType) return;
  const c = document.getElementById('sel-c').value;
  const s = document.getElementById('sel-s').value;
  const d = document.getElementById('sel-d').value;
  const countryName = document.querySelector('#sel-c option:checked')?.textContent || c;
  if(!d) return;
  if(selectedLocationType === 'district'){
    setGPSDisplay(d, s, countryName, null, 'Manual (District)');
  }
}

function selE(t){
  selEnergy=t;
  document.getElementById('e-sol').className='ebtn'+(t==='solar'?' sol':'');
  document.getElementById('e-wnd').className='ebtn'+(t==='wind'?' wnd':'');
}

// ══════════════════════════════════════════
// LOCATION TYPE SELECTION MODAL
// ══════════════════════════════════════════
function initLocationSelection(){
  if(selectedLocationType) return;
  const existing=document.getElementById('loc-modal');
  if(existing) existing.remove();

  const locModal=document.createElement('div');
  locModal.id='loc-modal';
  locModal.style.cssText=`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(8,16,31,.95);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn .3s ease;overflow:hidden;`;
  locModal.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:20px;padding:40px;max-width:440px;width:92%;animation:cardIn .4s ease;box-shadow:0 24px 64px rgba(0,0,0,.65);">
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:8px;color:var(--text);">Select Location Type</div>
      <div style="color:var(--text2);font-size:13px;margin-bottom:28px;line-height:1.55;">Choose how to specify your analysis location</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="selectLocationType('country')" style="padding:15px 18px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;color:var(--text);cursor:pointer;font-weight:600;text-align:left;transition:all .2s;font-size:14px;font-family:'Syne',sans-serif;" onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(59,130,246,.08)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg3)'">
          🌍 &nbsp;Country &nbsp;<span style="font-size:11px;color:var(--text3);font-family:'DM Sans',sans-serif;font-weight:400;">Nation-wide analysis</span>
        </button>
        <button onclick="selectLocationType('state')" style="padding:15px 18px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;color:var(--text);cursor:pointer;font-weight:600;text-align:left;transition:all .2s;font-size:14px;font-family:'Syne',sans-serif;" onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(59,130,246,.08)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg3)'">
          🗺 &nbsp;State / Province &nbsp;<span style="font-size:11px;color:var(--text3);font-family:'DM Sans',sans-serif;font-weight:400;">Region-level analysis</span>
        </button>
        <button onclick="selectLocationType('district')" style="padding:15px 18px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;color:var(--text);cursor:pointer;font-weight:600;text-align:left;transition:all .2s;font-size:14px;font-family:'Syne',sans-serif;" onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(59,130,246,.08)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg3)'">
          📌 &nbsp;District &nbsp;<span style="font-size:11px;color:var(--text3);font-family:'DM Sans',sans-serif;font-weight:400;">District-level precision</span>
        </button>
        <button onclick="selectLocationType('exact')" style="padding:15px 18px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:#fff;cursor:pointer;font-weight:700;text-align:left;transition:all .2s;font-size:14px;font-family:'Syne',sans-serif;box-shadow:0 4px 20px rgba(59,130,246,.35);" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
          📡 &nbsp;Exact GPS Location &nbsp;<span style="font-size:11px;opacity:.85;font-family:'DM Sans',sans-serif;font-weight:400;">Uses device GPS</span>
        </button>
      </div>
      <div style="color:var(--text3);font-size:11px;margin-top:20px;text-align:center;">GPS permission is only requested when you choose Exact GPS Location</div>
    </div>`;
  document.body.appendChild(locModal);
}

// ══════════════════════════════════════════
// SELECT LOCATION TYPE — CORE FIX
// ══════════════════════════════════════════
function selectLocationType(type){
  selectedLocationType = type;
  const modal = document.getElementById('loc-modal');
  if(modal) modal.remove();

  // Show back button
  document.getElementById('gen-back-btn').style.display = '';

  // Update subtitle
  const subtitleEl = document.getElementById('gen-subtitle');
  const typeLabels = {country:'Analysis by Country',state:'Analysis by State / Province',district:'Analysis by District',exact:'Analysis by Exact GPS Location'};
  if(subtitleEl) subtitleEl.textContent = typeLabels[type] || 'Configure location and energy source';

  // Update card subtitle
  const cardSub = document.getElementById('gen-card-sub');
  if(cardSub){
    const subs = {country:'Select your country for nation-wide analysis',state:'Select country and state for region analysis',district:'Select country, state and district for precision',exact:'GPS captured — verify location below'};
    cardSub.textContent = subs[type];
  }

  // Apply dropdown visibility FIRST
  applyDropdownVisibility(type);

  if(type === 'exact'){
    // Request browser GPS — only this mode ever asks for permission
    if(!navigator.geolocation){
      toast('⚠️ Geolocation not supported. Switching to manual.');
      selectedLocationType = 'district';
      applyDropdownVisibility('district');
      return;
    }
    showLoader('Requesting GPS permission…');
    document.getElementById('ltxt').textContent = 'Waiting for GPS permission…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hideLoader();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        // Reverse geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=en`)
          .then(r => r.json())
          .then(data => {
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || addr.suburb || 'Your Location';
            const state = addr.state || addr.province || 'Unknown';
            const country = addr.country || 'Unknown';
            const countryCode = addr.country_code ? addr.country_code.toUpperCase() : 'IN';

            // Update gpsData with real coords
            gpsData.lat = lat.toFixed(4);
            gpsData.lng = lng.toFixed(4);

            // Update the GPS display WITH coordinates (only GPS mode shows coords)
            setGPSDisplay(city, state, country, acc, 'GPS', lat, lng);

            // Now auto-fill the dropdowns to match the GPS city/state
            autoFillDropdowns(countryCode, state, city);

            toast(`✅ GPS: ${city}, ${state}`);
            logAct(user?.name||'User','GPS Capture',`${city}, ${state} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,'location');
          })
          .catch(() => {
            // If reverse geocode fails, still show coords
            gpsData.lat = lat.toFixed(4);
            gpsData.lng = lng.toFixed(4);
            setGPSDisplay('GPS Location', 'Unknown', 'Unknown', acc, 'GPS', lat, lng);
            toast('✅ GPS captured · Map data unavailable');
          });
      },
      (err) => {
        hideLoader();
        const msgs = {1:'Location access denied. Please allow GPS in browser settings.',2:'GPS signal not available. Try again.',3:'GPS request timed out. Try again.'};
        toast('⚠️ ' + (msgs[err.code] || 'GPS failed. Use manual selection.'));
        // Fall back: reset and show modal again
        setTimeout(() => {
          selectedLocationType = null;
          document.getElementById('gen-back-btn').style.display = 'none';
          initLocationSelection();
        }, 1500);
      },
      {enableHighAccuracy: true, timeout: 12000, maximumAge: 0}
    );

  } else if(type === 'country'){
    // Reset dropdowns, set defaults
    document.getElementById('sel-c').value = 'IN';
    updStates();
    const countryName = 'India';
    // NO coordinates displayed for manual
    setGPSDisplay(countryName, countryName, countryName, null, 'Manual (Country)');
    toast('🌍 Select a country to begin analysis');

  } else if(type === 'state'){
    document.getElementById('sel-c').value = 'IN';
    updStates();
    // Don't pre-select any state — user must choose
    setGPSDisplay('India', 'India', 'India', null, 'Manual (State)');
    toast('🗺 Select country and state');

  } else if(type === 'district'){
    document.getElementById('sel-c').value = 'IN';
    updStates();
    // Don't pre-select any state/district — user must choose
    setGPSDisplay('India', 'India', 'India', null, 'Manual (District)');
    toast('📌 Select country, state and district');
  }
}

// ══════════════════════════════════════════
// AUTO-FILL DROPDOWNS FROM GPS (Exact mode)
// ══════════════════════════════════════════
function autoFillDropdowns(countryCode, stateName, cityName){
  const cSel = document.getElementById('sel-c');
  // Match country code
  const countryMap = {'IN':'IN','US':'US','AU':'AU','DE':'DE','GB':'GB'};
  const cc = countryMap[countryCode] || 'IN';
  if(cSel){
    cSel.value = cc;
    updStates();
  }

  // Match state (fuzzy)
  const sSel = document.getElementById('sel-s');
  if(sSel && stateName){
    const stateNorm = stateName.trim().toLowerCase();
    let matched = false;
    Array.from(sSel.options).forEach(opt => {
      if(opt.value.toLowerCase() === stateNorm || opt.text.toLowerCase() === stateNorm){
        sSel.value = opt.value;
        matched = true;
      }
    });
    // Partial match fallback
    if(!matched){
      Array.from(sSel.options).forEach(opt => {
        if(opt.value.toLowerCase().includes(stateNorm) || stateNorm.includes(opt.value.toLowerCase())){
          if(!matched){ sSel.value = opt.value; matched = true; }
        }
      });
    }
    if(matched) updDists();
  }

  // Match district/city (fuzzy)
  const dSel = document.getElementById('sel-d');
  if(dSel && cityName){
    const cityNorm = cityName.trim().toLowerCase();
    let matched = false;
    Array.from(dSel.options).forEach(opt => {
      if(opt.value.toLowerCase() === cityNorm || opt.text.toLowerCase() === cityNorm){
        dSel.value = opt.value;
        matched = true;
      }
    });
    // Partial match
    if(!matched){
      Array.from(dSel.options).forEach(opt => {
        if(opt.value.toLowerCase().includes(cityNorm) || cityNorm.includes(opt.value.toLowerCase())){
          if(!matched){ dSel.value = opt.value; matched = true; }
        }
      });
    }
    // If still not matched, leave as "Select District" — user can pick manually
  }
}

// ══════════════════════════════════════════
// DROPDOWN VISIBILITY PER LOCATION TYPE
// ══════════════════════════════════════════
function applyDropdownVisibility(type){
  const fgC = document.getElementById('fg-country');
  const fgS = document.getElementById('fg-state');
  const fgD = document.getElementById('fg-district');
  const frow = document.getElementById('loc-dropdowns');
  if(!fgC) return;

  if(type === 'country'){
    fgC.style.display = '';
    fgS.style.display = 'none';
    fgD.style.display = 'none';
    frow.style.gridTemplateColumns = '1fr';
  } else if(type === 'state'){
    fgC.style.display = '';
    fgS.style.display = '';
    fgD.style.display = 'none';
    frow.style.gridTemplateColumns = '1fr 1fr';
  } else {
    // district or exact
    fgC.style.display = '';
    fgS.style.display = '';
    fgD.style.display = '';
    frow.style.gridTemplateColumns = '1fr 1fr 1fr';
  }
}

// ══════════════════════════════════════════
// BACK BUTTON
// ══════════════════════════════════════════
function genGoBack(){
  selectedLocationType = null;
  document.getElementById('gen-back-btn').style.display = 'none';
  document.getElementById('gen-res').classList.remove('on');
  // Reset subtitle
  const subtitleEl = document.getElementById('gen-subtitle');
  if(subtitleEl) subtitleEl.textContent = 'Configure location and energy source';
  const cardSub = document.getElementById('gen-card-sub');
  if(cardSub) cardSub.textContent = 'Select location type to begin';
  // Reset dropdowns back to all-visible
  applyDropdownVisibility('district');
  setTimeout(initLocationSelection, 80);
}