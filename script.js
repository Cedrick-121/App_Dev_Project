/* ---------------------------------------------------------
   Data
--------------------------------------------------------- */
const REQUISITIONS = [
  { id:'ctc', name:'Certified True Copy', desc:'Certified copy of your grades for scholarships or transfer.', time:'2 working days', icon:'📄' },
  { id:'goodmoral', name:'Good Moral Character', desc:'Confirms standing and conduct while enrolled at STI.', time:'1 working day', icon:'🛡️' },
  { id:'f138', name:'Form 138', desc:'Secondary permanent record for transfer or scholarship use.', time:'2 working days', icon:'📄' },
  { id:'f137', name:'Form 137', desc:'Cumulative academic record required for transferring schools.', time:'3 working days', icon:'📄' },
  { id:'consent', name:'Consent Forms', desc:'Parental/guardian consent for minors and OJT/internship.', time:'1 working day', icon:'✍️' },
];

const state = {
  loggedIn:false,
  selected: new Set(),
  calMonth: 8, calYear: 2026, openUntilDay: 25, today: 7,
  selectedDay: null, selectedSlot: null,
  queue: [] // unified: { ref, type, title, status, dateLabel, details:[[label,value],...] }
};

/* ---------------------------------------------------------
   Login
--------------------------------------------------------- */
document.getElementById('btnDoLogin').addEventListener('click', function(){
  const btn = this;
  const label = document.getElementById('loginBtnLabel');
  btn.disabled = true;
  label.textContent = 'Signing in…';

  setTimeout(()=>{
    state.loggedIn = true;
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appShell').hidden = false;
    btn.disabled = false;
    label.textContent = 'Log in';
    renderHome();
  }, 800);
});

document.getElementById('btnLogout').addEventListener('click', ()=>{
  if(!confirm('Log out of OneDesk?')) return;
  state.loggedIn = false;
  document.getElementById('appShell').hidden = true;
  document.getElementById('loginView').classList.remove('hidden');
});

/* ---------------------------------------------------------
   Page navigation
--------------------------------------------------------- */
const PAGE_TITLES = {
  home:'Home / <b>Overview</b>',
  documents:'Services / <b>Document Requisition</b>',
  examconflict:'Services / <b>File Exam Conflict</b>',
  reschedule:'Services / <b>Class Reschedule</b>',
  myqueue:'<b>My Queue</b>'
};

function goPage(name){
  document.querySelectorAll('.page-sub').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById('page-'+name);
  if(target) target.classList.add('active');
  document.querySelectorAll('.side-btn[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===name));
  document.getElementById('topbarTitle').innerHTML = PAGE_TITLES[name] || '';
  if(name==='myqueue') renderQueue('all');
  if(name==='home') renderHome();
  window.scrollTo({top:0, behavior:'smooth'});
}

document.querySelectorAll('.side-btn[data-page]').forEach(btn=>{
  btn.addEventListener('click', ()=>goPage(btn.dataset.page));
});
document.querySelectorAll('.quick-card[data-goto]').forEach(btn=>{
  btn.addEventListener('click', ()=>goPage(btn.dataset.goto));
});
document.getElementById('viewAllQueueLink').addEventListener('click', (e)=>{
  e.preventDefault(); goPage('myqueue');
});

/* ---------------------------------------------------------
   Document Requisition wizard
--------------------------------------------------------- */
function renderReqCards(){
  const grid = document.getElementById('reqCardGrid');
  grid.innerHTML = '';
  REQUISITIONS.forEach(r=>{
    const card = document.createElement('div');
    card.className = 'req-card' + (state.selected.has(r.id) ? ' selected' : '');
    card.innerHTML = `
      <div class="req-card-icon">${r.icon}</div>
      <div class="req-check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
      <h4>${r.name}</h4>
      <p>${r.desc}</p>
      <div class="req-time">${r.time}</div>
    `;
    card.addEventListener('click', ()=>{
      if(state.selected.has(r.id)) state.selected.delete(r.id); else state.selected.add(r.id);
      renderReqCards();
      updateDocStep1Gate();
    });
    grid.appendChild(card);
  });
}
function updateDocStep1Gate(){
  const n = state.selected.size;
  document.getElementById('toDocStep2').disabled = n === 0;
  document.getElementById('step1Hint').textContent = n === 0 ? 'Pick at least one document to continue.' : `${n} document${n>1?'s':''} selected.`;
}

function goDocStep(step){
  document.querySelectorAll('#page-documents .step-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('docStep'+step).classList.add('active');
  document.querySelectorAll('#page-documents .step-indicator').forEach(ind=>{
    const s = parseInt(ind.dataset.step,10);
    ind.classList.toggle('active', s===step);
    ind.classList.toggle('done', s<step);
  });
  if(step===2) renderCalendar();
  if(step===3) renderDocReview();
}
document.getElementById('toDocStep2').addEventListener('click', ()=>goDocStep(2));
document.getElementById('toDocStep3').addEventListener('click', ()=>goDocStep(3));

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function firstWeekday(y,m){ return new Date(y,m,1).getDay(); }
function hashSeed(n){ return (n*2654435761) % 97; }
function congestionFor(day){ const h = hashSeed(day)%3; return h===0?'low':h===1?'med':'high'; }

function renderCalendar(){
  document.getElementById('calMonthLabel').textContent = MONTH_NAMES[state.calMonth]+' '+state.calYear;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  const total = daysInMonth(state.calYear, state.calMonth);
  const startPad = firstWeekday(state.calYear, state.calMonth);
  for(let i=0;i<startPad;i++){
    const pad = document.createElement('div'); pad.className='cal-day pad'; grid.appendChild(pad);
  }
  for(let d=1; d<=total; d++){
    const dow = new Date(state.calYear, state.calMonth, d).getDay();
    const disabled = (dow===0||dow===6) || d<state.today || d>state.openUntilDay;
    const cell = document.createElement('button');
    cell.className = 'cal-day ' + (disabled?'disabled':'open');
    if(state.selectedDay===d && !disabled) cell.classList.add('selected');
    const numSpan = document.createElement('span'); numSpan.textContent = d; cell.appendChild(numSpan);
    if(!disabled){
      const dot = document.createElement('span'); dot.className = 'q-dot '+congestionFor(d); cell.appendChild(dot);
      cell.addEventListener('click', ()=>{
        state.selectedDay = d; state.selectedSlot = null;
        renderCalendar(); renderSlots(d); updateDocStep2Gate();
      });
    } else { cell.disabled = true; }
    grid.appendChild(cell);
  }
}
function renderSlots(day){
  const hint = document.getElementById('slotHint');
  const grid = document.getElementById('slotGrid');
  const level = congestionFor(day);
  hint.textContent = `${level==='low'?'Low':level==='med'?'Medium':'High'} queue expected on ${MONTH_NAMES[state.calMonth]} ${day}.`;
  const times = ['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM'];
  grid.innerHTML = '';
  times.forEach((t,idx)=>{
    const taken = (idx+hashSeed(day))%4===0;
    const btn = document.createElement('button');
    btn.className = 'slot-btn'+(state.selectedSlot===t?' selected':'');
    btn.textContent = t; btn.disabled = taken;
    btn.addEventListener('click', ()=>{ state.selectedSlot=t; renderSlots(day); updateDocStep2Gate(); });
    grid.appendChild(btn);
  });
}
function updateDocStep2Gate(){
  document.getElementById('toDocStep3').disabled = !(state.selectedDay && state.selectedSlot);
}
function renderDocReview(){
  const wrap = document.getElementById('reviewList');
  wrap.innerHTML = '';
  REQUISITIONS.filter(r=>state.selected.has(r.id)).forEach(r=>{
    const row = document.createElement('div');
    row.className = 'review-item';
    row.innerHTML = `<span>${r.icon}</span><span>${r.name}</span>`;
    wrap.appendChild(row);
  });
  document.getElementById('reviewDate').textContent = state.selectedDay ? `${MONTH_NAMES[state.calMonth]} ${state.selectedDay}, ${state.calYear}` : '—';
  document.getElementById('reviewTime').textContent = state.selectedSlot || '—';
}

document.getElementById('btnGenerateDoc').addEventListener('click', ()=>{
  const docs = REQUISITIONS.filter(r=>state.selected.has(r.id)).map(r=>r.name);
  const ref = 'DOC-2026-'+String(Math.floor(10000+Math.random()*89999));
  addToQueue({
    ref, type:'document', title: docs.join(', '),
    dateLabel: `${MONTH_NAMES[state.calMonth]} ${state.selectedDay}, ${state.calYear} · ${state.selectedSlot}`,
    status:'confirmed',
    details:[
      ['Documents', docs.join(', ')],
      ['Date', `${MONTH_NAMES[state.calMonth]} ${state.selectedDay}, ${state.calYear}`],
      ['Time', state.selectedSlot],
      ['Pickup at', 'Registrar Fast-Pass Lane']
    ]
  });
  openRequestModal({
    title:'Your Fast-Pass is ready', sub:'Show this at the Registrar Fast-Pass Lane on your appointment date.',
    ref, details:[
      ['Documents', docs.join(', ')],
      ['Date', `${MONTH_NAMES[state.calMonth]} ${state.selectedDay}, ${state.calYear}`],
      ['Time', state.selectedSlot]
    ]
  });
  // reset wizard
  state.selected.clear(); state.selectedDay=null; state.selectedSlot=null;
  renderReqCards(); updateDocStep1Gate(); goDocStep(1);
});

/* ---------------------------------------------------------
   Exam Conflict filing
--------------------------------------------------------- */
document.getElementById('btnSubmitConflict').addEventListener('click', ()=>{
  const s1 = document.getElementById('ecSubject1').value.trim();
  const s2 = document.getElementById('ecSubject2').value.trim();
  const date = document.getElementById('ecDate').value;
  const time = document.getElementById('ecTime').value;
  const resolution = document.getElementById('ecResolution').value;
  const reason = document.getElementById('ecReason').value.trim();

  if(!s1 || !s2 || !date || !time){
    alert('Please fill in both subjects, the exam date, and the exam time.');
    return;
  }
  const ref = 'EC-2026-'+String(Math.floor(10000+Math.random()*89999));
  const resolutionLabel = resolution==='alternate' ? 'Move one exam to an alternate schedule' : 'Request a special exam permit';
  addToQueue({
    ref, type:'examconflict', title:`${s1} vs ${s2}`,
    dateLabel:`Exam date: ${date} ${time}`, status:'pending',
    details:[['Exam 1', s1],['Exam 2', s2],['Date & time', `${date} ${time}`],['Preferred resolution', resolutionLabel]]
  });
  openRequestModal({
    title:'Conflict request filed', sub:'The Registrar will review and confirm an alternate schedule with you.',
    ref, details:[['Exam 1', s1],['Exam 2', s2],['Date & time', `${date} ${time}`],['Preferred resolution', resolutionLabel]]
  });
  document.getElementById('ecSubject1').value='';
  document.getElementById('ecSubject2').value='';
  document.getElementById('ecDate').value='';
  document.getElementById('ecTime').value='';
  document.getElementById('ecReason').value='';
});

/* ---------------------------------------------------------
   Class Reschedule request
--------------------------------------------------------- */
document.getElementById('btnSubmitReschedule').addEventListener('click', ()=>{
  const subject = document.getElementById('rsSubject').value.trim();
  const curDay = document.getElementById('rsCurrentDay').value;
  const curTime = document.getElementById('rsCurrentTime').value;
  const newDay = document.getElementById('rsNewDay').value;
  const newTime = document.getElementById('rsNewTime').value;
  const reasonSel = document.getElementById('rsReasonSelect');
  const reasonLabel = reasonSel.options[reasonSel.selectedIndex].text;

  if(!subject || !curTime || !newTime){
    alert('Please fill in the subject/section, current time, and preferred new time.');
    return;
  }
  const ref = 'RS-2026-'+String(Math.floor(10000+Math.random()*89999));
  addToQueue({
    ref, type:'reschedule', title:subject,
    dateLabel:`${curDay} ${curTime} → ${newDay} ${newTime}`, status:'pending',
    details:[['Subject / section', subject],['Current schedule', `${curDay}, ${curTime}`],['Preferred new schedule', `${newDay}, ${newTime}`],['Reason', reasonLabel]]
  });
  openRequestModal({
    title:'Reschedule request submitted', sub:'Your instructor and the Registrar will confirm room and time availability.',
    ref, details:[['Subject / section', subject],['Current schedule', `${curDay}, ${curTime}`],['Preferred new schedule', `${newDay}, ${newTime}`],['Reason', reasonLabel]]
  });
  document.getElementById('rsSubject').value='';
  document.getElementById('rsCurrentTime').value='';
  document.getElementById('rsNewTime').value='';
  document.getElementById('rsNotes').value='';
});

/* ---------------------------------------------------------
   Unified queue store + render
--------------------------------------------------------- */
function addToQueue(item){
  state.queue.push(item);
  document.getElementById('queueDot').hidden = false;
}

const TYPE_META = {
  document:{ label:'Document Pickup', icon:'📄' },
  examconflict:{ label:'Exam Conflict', icon:'🗓️' },
  reschedule:{ label:'Class Reschedule', icon:'🔁' }
};

function renderQueue(filter){
  const wrap = document.getElementById('queueList');
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('active', c.dataset.filter===filter));
  const items = [...state.queue].reverse().filter(it => filter==='all' || it.type===filter);
  if(items.length===0){
    wrap.innerHTML = `<div class="empty-note">No requests here yet.</div>`;
    return;
  }
  wrap.innerHTML = '';
  items.forEach(it=>{
    const meta = TYPE_META[it.type];
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.innerHTML = `
      <div class="qi-badge ${it.type}">${meta.icon}</div>
      <div class="qi-body">
        <h4>${meta.label} — ${it.ref}</h4>
        <p>${it.title} · ${it.dateLabel}</p>
      </div>
      <div class="qi-status ${it.status}">${it.status==='confirmed'?'Confirmed':'Pending'}</div>
    `;
    wrap.appendChild(row);
  });
}
document.getElementById('queueFilters').addEventListener('click', (e)=>{
  const chip = e.target.closest('.filter-chip');
  if(!chip) return;
  renderQueue(chip.dataset.filter);
});

/* ---------------------------------------------------------
   Home dashboard
--------------------------------------------------------- */
function renderHome(){
  document.getElementById('statPending').textContent = state.queue.length;
  document.getElementById('statDocs').textContent = state.queue.filter(q=>q.type==='document').length;
  document.getElementById('statCases').textContent = state.queue.filter(q=>q.type!=='document').length;

  const wrap = document.getElementById('homeRecentList');
  const recent = [...state.queue].reverse().slice(0,3);
  if(recent.length===0){
    wrap.innerHTML = `<div class="empty-note">Nothing filed yet — try one of the quick actions above.</div>`;
    return;
  }
  wrap.innerHTML = '';
  recent.forEach(it=>{
    const meta = TYPE_META[it.type];
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.style.marginBottom = '10px';
    row.innerHTML = `
      <div class="qi-badge ${it.type}">${meta.icon}</div>
      <div class="qi-body"><h4>${meta.label} — ${it.ref}</h4><p>${it.title} · ${it.dateLabel}</p></div>
      <div class="qi-status ${it.status}">${it.status==='confirmed'?'Confirmed':'Pending'}</div>
    `;
    wrap.appendChild(row);
  });
}

/* ---------------------------------------------------------
   Unified confirmation modal
--------------------------------------------------------- */
function openRequestModal({title, sub, ref, details}){
  document.getElementById('rcTitle').textContent = title;
  document.getElementById('rcSub').textContent = sub;
  document.getElementById('rcRef').textContent = ref;
  const wrap = document.getElementById('rcDetails');
  wrap.innerHTML = '';
  details.forEach(([label,value])=>{
    const row = document.createElement('div');
    row.className = 'rc-row';
    row.innerHTML = `<span>${label}</span><b>${value}</b>`;
    wrap.appendChild(row);
  });
  document.getElementById('requestModalOverlay').classList.add('open');
}
document.getElementById('closeRequestModal').addEventListener('click', ()=>{
  document.getElementById('requestModalOverlay').classList.remove('open');
});

/* ---------------------------------------------------------
   Init
--------------------------------------------------------- */
try{
  renderReqCards();
  updateDocStep1Gate();
}catch(e){ console.error(e); }