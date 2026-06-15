/* ══════════════════════════════════════════
   VoltEarth — Download Module (download.js)
   Modal, CSV export, date range validation
══════════════════════════════════════════ */

// DOWNLOAD MODAL
// ══════════════════════════════════════════
function openModal(type,preset){
  dlType=type||'report';
  dlTf=preset||'weekly';
  document.getElementById('dl-modal').classList.add('on');
  const sub=document.getElementById('modal-sub');
  if(type==='activity') sub.textContent='Download user activity log (logins, searches, views, GPS locations)';
  else if(type==='result') sub.textContent='Download energy analysis result report';
  else sub.textContent='Download energy generation report by time period';
  // Set preset selection
  document.querySelectorAll('.mopt').forEach(o=>{o.classList.toggle('sel',o.dataset.tf===dlTf);});
  // Init date fields to sensible defaults
  const today=new Date();
  const todayStr=today.toISOString().slice(0,10);
  const weekAgo=new Date(today);weekAgo.setDate(weekAgo.getDate()-6);
  document.getElementById('cr-start').value=weekAgo.toISOString().slice(0,10);
  document.getElementById('cr-end').value=todayStr;
  document.getElementById('cr-start').max=todayStr;
  document.getElementById('cr-end').max=todayStr;
  // Show/hide custom box
  const isCustom=(dlTf==='custom');
  document.getElementById('custom-range-box').classList.toggle('on',isCustom);
  resetCustomValidation();
  if(isCustom) validateCustomRange();
}
function closeModal(){
  document.getElementById('dl-modal').classList.remove('on');
  resetCustomValidation();
}
function selOpt(el,tf){
  document.querySelectorAll('.mopt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');
  dlTf=tf;
  const isCustom=(tf==='custom');
  document.getElementById('custom-range-box').classList.toggle('on',isCustom);
  resetCustomValidation();
  if(isCustom) validateCustomRange();
}
function resetCustomValidation(){
  document.getElementById('cr-err').classList.remove('on');
  document.getElementById('cr-preview').classList.remove('on');
  document.getElementById('cr-start').classList.remove('err');
  document.getElementById('cr-end').classList.remove('err');
  document.getElementById('dl-confirm-btn').disabled=false;
  document.getElementById('dl-confirm-btn').style.opacity='1';
}
function validateCustomRange(){
  const sVal=document.getElementById('cr-start').value;
  const eVal=document.getElementById('cr-end').value;
  const errEl=document.getElementById('cr-err');
  const preEl=document.getElementById('cr-preview');
  const sInput=document.getElementById('cr-start');
  const eInput=document.getElementById('cr-end');
  const btn=document.getElementById('dl-confirm-btn');
  errEl.classList.remove('on');preEl.classList.remove('on');
  sInput.classList.remove('err');eInput.classList.remove('err');
  btn.disabled=false;btn.style.opacity='1';
  if(!sVal&&!eVal){errEl.textContent='⚠️ Please select both a start date and end date.';errEl.classList.add('on');btn.disabled=true;btn.style.opacity='.5';return false;}
  if(!sVal){errEl.textContent='⚠️ Start date is required.';errEl.classList.add('on');sInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  if(!eVal){errEl.textContent='⚠️ End date is required.';errEl.classList.add('on');eInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  const start=new Date(sVal),end=new Date(eVal),today=new Date();
  today.setHours(23,59,59,999);
  if(start>today){errEl.textContent='⚠️ Start date cannot be in the future.';errEl.classList.add('on');sInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  if(end>today){errEl.textContent='⚠️ End date cannot be in the future.';errEl.classList.add('on');eInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  if(start>end){errEl.textContent='⚠️ Start date must be before or equal to the end date.';errEl.classList.add('on');sInput.classList.add('err');eInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  const diffDays=Math.round((end-start)/(1000*60*60*24))+1;
  if(diffDays>366){errEl.textContent='⚠️ Date range exceeds 366 days. Please narrow the range.';errEl.classList.add('on');sInput.classList.add('err');eInput.classList.add('err');btn.disabled=true;btn.style.opacity='.5';return false;}
  preEl.textContent='✅ Range: '+sVal+' → '+eVal+' ('+diffDays+' day'+(diffDays!==1?'s':'')+')';
  preEl.classList.add('on');
  return true;
}
function confirmDl(){
  if(dlTf==='custom'){
    const sVal=document.getElementById('cr-start').value;
    const eVal=document.getElementById('cr-end').value;
    if(!sVal||!eVal){
      document.getElementById('cr-err').textContent='⚠️ Please select both a start date and end date.';
      document.getElementById('cr-err').classList.add('on');return;
    }
    if(!validateCustomRange()) return;
    closeModal();
    execDl(dlType,dlTf,{start:sVal,end:eVal});
  } else {
    closeModal();
    execDl(dlType,dlTf);
  }
}

function execDl(type,tf,customDates){
  const label=tf==='custom'?'Custom Range':tf.charAt(0).toUpperCase()+tf.slice(1);
  toast('📥 Preparing '+label+' '+type+' report…');
  logAct(user?.name||'User','Download',label+' '+type+' report',gpsStr(),'download');
  setTimeout(()=>{
    let csv='', fname='';
    const now=new Date().toISOString().slice(0,10);
    // Helper: filter rows by date range (customDates) or by cut (days back)
    function getDateRange(){
      if(tf==='daily') return 1;
      if(tf==='weekly') return 7;
      if(tf==='monthly') return 30;
      if(tf==='yearly') return 365;
      return null; // custom
    }
    const cut=getDateRange();
    // Validate type before generating
    if(type==='activity'){
      let rows;
      if(tf==='custom'&&customDates){
        const s=new Date(customDates.start);s.setHours(0,0,0,0);
        const e=new Date(customDates.end);e.setHours(23,59,59,999);
        rows=allActRows.filter(r=>r.time>=s&&r.time<=e);
      } else {
        const cutDate=new Date();cutDate.setDate(cutDate.getDate()-cut+1);cutDate.setHours(0,0,0,0);
        rows=allActRows.filter(r=>r.time>=cutDate);
      }
      if(rows.length===0){toast('⚠️ No data found for the selected period.');return;}
      csv='VoltEarth Activity Log — '+label+' Report\n';
      csv+='Generated: '+new Date().toLocaleString()+' | By: '+(user?.name||'Unknown')+' | Location: '+gpsStr()+'\n';
      if(tf==='custom') csv+='Period: '+customDates.start+' to '+customDates.end+'\n';
      csv+='\n';
      csv+='User,Action,Detail / Search Query,GPS Location,IP Address,Device,Timestamp,Status\n';
      csv+=rows.map(r=>`"${r.name}","${r.action}","${r.detail}","${r.gps}","${r.ip}","${r.device}","${r.time.toLocaleString()}","${r.status}"`).join('\n');
      csv+='\n\nSUMMARY\nTotal Events,'+rows.length+'\nLogins,'+rows.filter(r=>r.action==='Login').length+'\nDownloads,'+rows.filter(r=>r.action==='Download').length+'\nSearches,'+rows.filter(r=>r.action==='Search').length+'\nReport Views,'+rows.filter(r=>r.action==='View Report').length+'\nUnique Users,'+[...new Set(rows.map(r=>r.name))].length;
      fname='VoltEarth_ActivityLog_'+tf+(tf==='custom'?'_'+customDates.start+'_'+customDates.end:'')+'_'+now+'.csv';
    } else if(type==='result'&&lastResult){
      csv='VoltEarth Energy Analysis Report\n';
      csv+='Generated: '+new Date().toLocaleString()+' | User: '+(user?.name||'Unknown')+' | Location: '+gpsStr()+'\n\n';
      csv+='Parameter,Value\n';
      csv+=`Location,"${lastResult.district}, ${lastResult.state}"\nGPS,${lastResult.gps}\nEnergy Type,${lastResult.type}\nSystem Size,${lastResult.sz} kW\nEfficiency,${lastResult.eff}%\nAmbient Temperature,${lastResult.temp}°C\n`;
      csv+=lastResult.type==='solar'?`Solar Irradiance,${lastResult.irr} kWh/m²/d\n`:`Wind Speed,${lastResult.wind} m/s\n`;
      csv+=`Daily Output,${lastResult.daily} kWh\nAnnual Output,${lastResult.annual} kWh\nCO2 Offset,${lastResult.co2} kg/yr\nEst. Revenue,₹${lastResult.rev}/yr\n`;
      fname='VoltEarth_AnalysisResult_'+now+'.csv';
    } else {
      let rows;
      if(tf==='custom'&&customDates){
        const s=new Date(customDates.start);s.setHours(0,0,0,0);
        const e=new Date(customDates.end);e.setHours(23,59,59,999);
        // Filter allRptRows by parsed date string
        rows=allRptRows.filter(r=>{const d=new Date(r.date);return d>=s&&d<=e;});
        if(rows.length===0) rows=allRptRows; // fallback: show all if dates don't match sample data
      } else {
        rows=allRptRows.slice(0,cut);
      }
      if(rows.length===0){toast('⚠️ No data found for the selected period.');return;}
      const total=rows.reduce((a,r)=>a+parseFloat(r.gen),0).toFixed(1);
      csv='VoltEarth Energy Generation Report — '+label+'\n';
      csv+='Generated: '+new Date().toLocaleString()+' | User: '+(user?.name||'Unknown')+' | Location: '+gpsStr()+'\n';
      if(tf==='custom') csv+='Period: '+customDates.start+' to '+customDates.end+'\n';
      csv+='\n';
      csv+='Date,Location,GPS Coordinates,Source,Generation (kWh),Environmental Data,Efficiency,Status\n';
      csv+=rows.map(r=>`"${r.date}","${r.loc}","${r.gps}","${r.src}",${r.gen},"${r.env}",${r.eff},"${r.status}"`).join('\n');
      csv+='\n\nSUMMARY\nTotal Generation (kWh),'+total+'\nRecords,'+rows.length+'\nPeriod,'+label+(tf==='custom'?' ('+customDates.start+' to '+customDates.end+')':'');
      fname='VoltEarth_GenerationReport_'+tf+(tf==='custom'?'_'+customDates.start+'_'+customDates.end:'')+'_'+now+'.csv';
    }
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=fname;a.click();
    toast('✅ '+label+' report downloaded!');
  },700);
}