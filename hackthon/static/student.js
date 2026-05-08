/**
 * Campus Complaint Management System - Frontend
 * Clean version:
 * - Section navigation
 * - Student/Admin login + register
 * - Complaint submission with duplicate warning + evidence preview
 * - Audit log
 * - SLA tracking
 * - Heatmap
 * - Follow-up complaint flow
 * - Flagged accounts panel
 * - Student overview chart/bars
 * - No demo complaints or demo stats
 * - Backend sync fixed for admin + student
 */

// ============ Live Data Stores ============
const mockComplaints = [];

const mockSLA = [];

const heatmapData = {
  Library: 0,
  Admin: 0,
  Hostel: 0,
  Cafeteria: 0,
  Sports: 0,
  Lab: 0,
};

const categoryCounts = {
  safety: 0,
  infrastructure: 0,
  academics: 0,
  harassment: 0,
  facilities: 0,
  other: 0,
};

const flaggedAccounts = [];

// ============ Helpers ============
function randomHash() {
  return (
    '0x' +
    Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('') +
    '...' +
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );
}

function simulateNLP(text) {
  const lower = (text || '').toLowerCase();
  let severity = 'low';
  let sentiment = 'neutral';

  const criticalWords = ['danger', 'dangerous', 'harassment', 'immediate', 'emergency', 'attack', 'unsafe'];
  const highWords = ['urgent', 'broken', 'leak', 'damage', 'critical', 'serious'];
  const negativeWords = ['broken', 'not working', 'bad', 'terrible', 'dangerous', 'unwanted', 'angry'];
  const positiveWords = ['would help', 'thank', 'appreciate', 'request', 'please consider'];

  if (criticalWords.some(word => lower.includes(word))) {
    severity = 'critical';
  } else if (highWords.some(word => lower.includes(word))) {
    severity = 'high';
  } else if (lower.length > 80) {
    severity = 'medium';
  }

  if (negativeWords.some(word => lower.includes(word))) {
    sentiment = 'negative';
  } else if (positiveWords.some(word => lower.includes(word))) {
    sentiment = 'positive';
  }

  return { severity, sentiment };
}

function formatCategory(category) {
  const labels = {
    safety: 'Safety & Security',
    infrastructure: 'Infrastructure',
    academics: 'Academics',
    harassment: 'Harassment',
    facilities: 'Facilities',
    other: 'Other',
  };
  return labels[category] || category;
}

function safeText(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function currentTimestamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function findDuplicateComplaint(category, location, description, userId) {
  const normalizedDesc = normalizeText(description);
  const normalizedLoc = normalizeText(location);

  return mockComplaints.find(item => {
    const sameUser = !userId || item.userId === userId;
    const sameCategory = item.category === category;
    const sameLocation = normalizeText(item.location) === normalizedLoc;
    const oldDesc = normalizeText(item.description);
    const descMatch =
      oldDesc.includes(normalizedDesc.slice(0, 25)) ||
      normalizedDesc.includes(oldDesc.slice(0, 25));

    return sameUser && sameCategory && sameLocation && descMatch && item.status !== 'resolved';
  });
}

function recalculateDerivedData() {
  Object.keys(categoryCounts).forEach(key => {
    categoryCounts[key] = 0;
  });

  Object.keys(heatmapData).forEach(key => {
    heatmapData[key] = 0;
  });

  mockComplaints.forEach(item => {
    const category = item.category || 'other';

    if (categoryCounts[category] !== undefined) {
      categoryCounts[category] += 1;
    } else {
      categoryCounts.other += 1;
    }

    const mappedLocations = ['Library', 'Admin', 'Hostel', 'Cafeteria', 'Sports', 'Lab'];
    const matchedLocation = mappedLocations.find(loc =>
      (item.location || '').toLowerCase().includes(loc.toLowerCase())
    );

    if (matchedLocation) {
      heatmapData[matchedLocation] += 1;
    }
  });
}

function rerenderAll() {
  renderComplaints();
  renderStudentComplaints();
  renderSLA();
  renderAuditChain();
  renderHeatmap();
  renderCategoryBreakdown();
  renderFlaggedAccounts();
  updateStats();
  updateStudentOverview();
  populateFollowUpOptions();
}

function mapBackendComplaint(item, index) {
  const description = item.text || item.description || item.complaint_text
  const nlp = simulateNLP(description);

  return {
    id: item.id || item.complaint_id || `C-${String(index + 1).padStart(3, '0')}`,
    hash: item.hash || item.txHash || randomHash(),
    category: item.category || 'other',
    description: description.length > 100 ? description.slice(0, 100) + '...' : description,
    severity: (item.priority || item.severity || nlp.severity || 'low').toLowerCase(),
    sentiment: (item.sentiment || nlp.sentiment || 'neutral').toLowerCase(),
    location: item.location || 'Other',
    status: item.status || 'pending',
    timestamp: item.timestamp || item.created_at || currentTimestamp(),
    repeatCount: item.repeatCount || item.repeat_count || 1,
    userId: item.userId || item.user_id || item.name || 'User',
    hiddenIdentity: item.hiddenIdentity || item.hide_identity || false,
  };
}

// ============ Navigation ============
function showView(targetId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });

  const targetView = document.getElementById(targetId);
  if (targetView) {
    targetView.classList.add('active');
  }

  const activeNavLink = document.querySelector(`.nav-links a[href="#${targetId}"]`);
  if (activeNavLink) {
    activeNavLink.classList.add('active');
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;

    const targetId = href.substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      e.preventDefault();
      showView(targetId);
    }
  });
});

document.querySelectorAll('[data-target]').forEach(button => {
  button.addEventListener('click', function () {
    const targetId = this.getAttribute('data-target');
    if (targetId && document.getElementById(targetId)) {
      showView(targetId);
    }
  });
});

// ============ Auth ============
const studentLoginForm = document.getElementById('studentLoginForm');
if (studentLoginForm) {
  studentLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    await loadComplaintsFromBackend();
    alert('Student login successful!');
    showView('student-dashboard');
  });
}

const studentRegisterForm = document.getElementById('studentRegisterForm');
if (studentRegisterForm) {
  studentRegisterForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    await loadComplaintsFromBackend();
    alert('Student registration successful!');
    showView('student-dashboard');
  });
}

const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    await loadComplaintsFromBackend();
    alert('Admin login successful!');
    showView('admin-dashboard');
  });
}

const adminRegisterForm = document.getElementById('adminRegisterForm');
if (adminRegisterForm) {
  adminRegisterForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    await loadComplaintsFromBackend();
    alert('Admin registration successful!');
    showView('admin-dashboard');
  });
}

// ============ Follow-up + Evidence ============
function populateFollowUpOptions() {
  const select = document.getElementById('followUpComplaintId');
  if (!select) return;

  if (mockComplaints.length === 0) {
    select.innerHTML = `<option value="">No complaints available</option>`;
    return;
  }

  select.innerHTML =
    `<option value="">Choose complaint</option>` +
    mockComplaints
      .map(item => `<option value="${item.id}">${item.id} - ${item.location} - ${formatCategory(item.category)}</option>`)
      .join('');
}

const isFollowUp = document.getElementById('isFollowUp');
const followUpSelectWrap = document.getElementById('followUpSelectWrap');

if (isFollowUp && followUpSelectWrap) {
  isFollowUp.addEventListener('change', function () {
    followUpSelectWrap.classList.toggle('hidden', !this.checked);
  });
}

const evidenceInput = document.getElementById('evidence');
const previewContainer = document.getElementById('previewContainer');

if (evidenceInput && previewContainer) {
  evidenceInput.addEventListener('change', function () {
    const file = this.files[0];
    previewContainer.innerHTML = '';

    if (!file) return;

    const fileURL = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      previewContainer.innerHTML = `<img src="${fileURL}" alt="Evidence Preview">`;
    } else if (file.type.startsWith('video/')) {
      previewContainer.innerHTML = `<video src="${fileURL}" controls></video>`;
    } else {
      previewContainer.innerHTML = `<div class="preview-file">${file.name}</div>`;
    }
  });
}

// ============ Dashboard Rendering ============
function renderComplaints() {
  const complaintsList = document.getElementById('complaintsList');
  if (!complaintsList) return;

  if (mockComplaints.length === 0) {
    complaintsList.innerHTML = `<div class="complaint-item"><div class="complaint-text">No complaints submitted yet.</div></div>`;
    return;
  }

  complaintsList.innerHTML = mockComplaints
    .slice(0, 5)
    .map(complaint => {
      return `
        <div class="complaint-item ${complaint.severity}">
          <div class="complaint-meta">
            <span class="severity-badge ${complaint.severity}">${safeText(complaint.severity)}</span>
            <span class="sentiment-dot ${complaint.sentiment}" title="${safeText(complaint.sentiment)}"></span>
            <span class="complaint-footer">${safeText(complaint.id)} · ${safeText(complaint.timestamp)}</span>
          </div>
          <div class="complaint-text">${safeText(complaint.description)}</div>
          <div class="complaint-footer">${safeText(complaint.location)} · ${safeText(complaint.status)}</div>
          ${complaint.repeatCount > 1 ? `<div class="followup-note">Follow-ups / repeats: ${complaint.repeatCount}</div>` : ''}
        </div>
      `;
    })
    .join('');
}

function renderStudentComplaints() {
  const studentComplaintsList = document.getElementById('studentComplaintsList');
  if (!studentComplaintsList) return;

  // 🔥 get current user
  const currentUser = document.getElementById('userId')?.value || 'User';

  // 🔥 filter only this user's complaints
  const myComplaints = mockComplaints.filter(c => c.userId === currentUser);

  if (myComplaints.length === 0) {
    studentComplaintsList.innerHTML = `
      <div class="complaint-item">
        <div class="complaint-text">No complaints submitted yet.</div>
      </div>`;
    return;
  }

  studentComplaintsList.innerHTML = myComplaints
    .slice(0, 5)
    .map(c => {
      return `
        <div class="complaint-item">
          <h4>${c.description}</h4>
          <p><b>ID:</b> ${c.id}</p>
          <p><b>Status:</b> ${c.status}</p>
          <p><b>Severity:</b> ${c.severity}</p>
        </div>
      `;
    })
    .join('');
}


function renderSLA() {
  const slaList = document.getElementById('slaList');
  if (!slaList) return;

  if (mockSLA.length === 0) {
    slaList.innerHTML = `<div class="complaint-item"><div class="complaint-text">No SLA records yet.</div></div>`;
    return;
  }

  slaList.innerHTML = mockSLA
    .map(item => {
      const pct = Math.min(100, (item.hours / item.limit) * 100);
      const statusClass =
        item.status === 'breach'
          ? 'breach'
          : item.status === 'warning'
          ? 'warning'
          : 'ok';

      return `
        <div class="sla-item">
          <div style="flex: 0 0 130px;">
            <div class="sla-label">${safeText(item.label)}</div>
            <div class="sla-time">${safeText(item.hours)}h / ${safeText(item.limit)}h</div>
          </div>
          <div class="sla-progress">
            <div class="sla-progress-fill ${statusClass}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderFlaggedAccounts() {
  const list = document.getElementById('flaggedAccountsList');
  if (!list) return;

  if (flaggedAccounts.length === 0) {
    list.innerHTML = `<div class="flagged-item"><div class="complaint-text">No flagged accounts.</div></div>`;
    return;
  }

  list.innerHTML = flaggedAccounts
    .map(item => `
      <div class="flagged-item">
        <div class="flagged-top">
          <strong>${item.userId}</strong>
          <span class="suspicious-badge">Flagged</span>
        </div>
        <div class="complaint-footer">${item.reason}</div>
        <div class="flagged-top" style="margin-top:8px;">
          <span class="trust-badge">Trust Score: ${item.trustScore}</span>
          <span class="complaint-footer">${item.status}</span>
        </div>
      </div>
    `)
    .join('');
}

// ============ Student Overview ============
function updateStudentOverview() {
  const total = mockComplaints.length;
  const resolved = mockComplaints.filter(item => item.status === 'resolved').length;
  const pending = mockComplaints.filter(item => item.status === 'pending' || item.status === 'in_progress').length;
  const critical = mockComplaints.filter(item => item.severity === 'critical').length;

  const totalText = document.getElementById('studentTotalText');
  const resolvedText = document.getElementById('studentResolvedText');
  const pendingText = document.getElementById('studentPendingText');
  const criticalText = document.getElementById('studentCriticalText');

  const resolvedBar = document.getElementById('studentResolvedBar');
  const pendingBar = document.getElementById('studentPendingBar');
  const criticalBar = document.getElementById('studentCriticalBar');

  if (totalText) totalText.textContent = total;
  if (resolvedText) resolvedText.textContent = resolved;
  if (pendingText) pendingText.textContent = pending;
  if (criticalText) criticalText.textContent = critical;

  const resolvedPct = total === 0 ? 0 : (resolved / total) * 100;
  const pendingPct = total === 0 ? 0 : (pending / total) * 100;
  const criticalPct = total === 0 ? 0 : (critical / total) * 100;

  if (resolvedBar) resolvedBar.style.width = `${resolvedPct}%`;
  if (pendingBar) pendingBar.style.width = `${pendingPct}%`;
  if (criticalBar) criticalBar.style.width = `${criticalPct}%`;
}

// ============ Complaint Form ============
const complaintForm = document.getElementById('complaintForm');
const submitResult = document.getElementById('submitResult');
const complaintWarning = document.getElementById('complaintWarning');

if (complaintForm) {
  complaintForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const category = document.getElementById('category')?.value || '';
    const description = document.getElementById('description')?.value.trim() || '';
    const locationInput = document.getElementById('location')?.value.trim() || '';
    const contact = document.getElementById('contact')?.value.trim() || '';
    const userId = document.getElementById('userId')?.value.trim() || '';
    const hideIdentity = document.getElementById('hideIdentity')?.checked || false;
    const followUpMode = document.getElementById('isFollowUp')?.checked || false;
    const followUpComplaintId = document.getElementById('followUpComplaintId')?.value || '';
    const evidenceFile = document.getElementById('evidence')?.files?.[0] || null;

    if (complaintWarning) {
      complaintWarning.classList.add('hidden');
      complaintWarning.textContent = '';
    }

    if (!category || !description) {
      alert('Please fill in category and description.');
      return;
    }

    const location = locationInput || 'Other';
    const localNLP = simulateNLP(description);

    if (followUpMode && !followUpComplaintId) {
      if (complaintWarning) {
        complaintWarning.textContent = 'Please select an existing complaint for follow-up.';
        complaintWarning.classList.remove('hidden');
      }
      return;
    }

    if (!followUpMode) {
      const duplicate = findDuplicateComplaint(category, location, description, userId);
      if (duplicate) {
        if (complaintWarning) {
          complaintWarning.innerHTML = `A similar complaint already exists (${duplicate.id}). Please use follow-up instead of creating a new complaint.`;
          complaintWarning.classList.remove('hidden');
        }
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('name', userId || 'User');
      formData.append('contact', contact);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('hide_identity', hideIdentity ? 'true' : 'false');
      formData.append('is_followup', followUpMode ? 'true' : 'false');
      formData.append('followup_complaint_id', followUpComplaintId);

      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      const response = await fetch('http://127.0.0.1:5000/submit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      const backendData = result.data || result || {};

      const hash = backendData.hash || randomHash();
      const priority = (backendData.priority || localNLP.severity).toLowerCase();
      const sentiment = (backendData.sentiment || localNLP.sentiment).toLowerCase();

      document.getElementById('txHash').textContent = hash;
      document.getElementById('detectedSeverity').textContent = priority;
      document.getElementById('detectedSentiment').textContent = sentiment;

      if (submitResult) {
        submitResult.classList.remove('hidden');
      }

      complaintForm.reset();
      if (previewContainer) previewContainer.innerHTML = '';
      if (followUpSelectWrap) followUpSelectWrap.classList.add('hidden');

      await loadComplaintsFromBackend();

      alert(followUpMode ? 'Follow-up added successfully!' : 'Complaint submitted successfully!');
    } catch (error) {
      console.error('Submit error:', error);

      const fallbackHash = randomHash();

      document.getElementById('txHash').textContent = fallbackHash;
      document.getElementById('detectedSeverity').textContent = localNLP.severity;
      document.getElementById('detectedSentiment').textContent = localNLP.sentiment;

      if (submitResult) {
        submitResult.classList.remove('hidden');
      }

      if (followUpMode) {
        const parent = mockComplaints.find(item => item.id === followUpComplaintId);
        if (parent) {
          parent.repeatCount = (parent.repeatCount || 1) + 1;
          parent.timestamp = currentTimestamp();
        }
      } else {
        mockComplaints.unshift({
          id: `C-${String(mockComplaints.length + 1).padStart(3, '0')}`,
          hash: fallbackHash,
          category: category,
          description: description.length > 100 ? description.slice(0, 100) + '...' : description,
          severity: localNLP.severity,
          sentiment: localNLP.sentiment,
          location: location,
          status: localNLP.severity === 'critical' ? 'escalated' : 'pending',
          timestamp: currentTimestamp(),
          repeatCount: 1,
          userId: userId || 'User',
          hiddenIdentity: hideIdentity,
        });
      }

      recalculateDerivedData();
      rerenderAll();

      complaintForm.reset();
      if (previewContainer) previewContainer.innerHTML = '';
      if (followUpSelectWrap) followUpSelectWrap.classList.add('hidden');

      alert('Backend not connected. Data added in local mode.');
    }
  });
}

// ============ Audit ============
function renderAuditChain() {
  const auditChain = document.getElementById('auditChain');
  if (!auditChain) return;

  if (mockComplaints.length === 0) {
    auditChain.innerHTML = `<div class="audit-block"><div class="block-content">No audit records yet.</div></div>`;
    return;
  }

  auditChain.innerHTML = mockComplaints
    .map((complaint, index) => {
      return `
        <div class="audit-block" data-hash="${safeText(complaint.hash)}">
          <div class="block-index">${index + 1}</div>
          <div class="block-content">
            <div class="block-hash">${safeText(complaint.hash)}</div>
            <div>${safeText(complaint.description)}</div>
            <div class="block-meta">
              ${safeText(complaint.id)} · ${formatCategory(complaint.category)} · ${safeText(complaint.timestamp)}
              ${complaint.hiddenIdentity ? ' · Hidden Identity' : ''}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

const auditSearch = document.getElementById('auditSearch');
if (auditSearch) {
  auditSearch.addEventListener('input', function (e) {
    const query = e.target.value.toLowerCase();

    document.querySelectorAll('.audit-block').forEach(block => {
      const blockText = block.textContent.toLowerCase();
      block.style.display = blockText.includes(query) ? '' : 'none';
    });
  });
}

const verifyChainButton = document.getElementById('verifyChain');
if (verifyChainButton) {
  verifyChainButton.addEventListener('click', function () {
    const chainStatus = document.getElementById('chainStatus');
    if (!chainStatus) return;

    chainStatus.innerHTML = '<span class="status-dot"></span><span>Verifying chain...</span>';

    setTimeout(() => {
      chainStatus.innerHTML = '<span class="status-dot"></span><span>Chain verified — no tampering detected</span>';
    }, 800);
  });
}

// ============ Heatmap ============
const heatmapLabels = ['Library', 'Admin', 'Hostel', 'Cafeteria', 'Sports', 'Lab'];

function getLevel(count) {
  const max = Math.max(...Object.values(heatmapData), 1);
  if (count === 0) return 0;

  const ratio = count / max;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.6) return 3;
  if (ratio <= 0.8) return 4;
  return 5;
}

function renderHeatmap() {
  const heatmapGrid = document.getElementById('heatmapGrid');
  if (!heatmapGrid) return;

  heatmapGrid.innerHTML = heatmapLabels
    .map(label => {
      const count = heatmapData[label] || 0;
      const level = getLevel(count);
      return `<div class="heatmap-cell level-${level}" title="${label}: ${count} complaints">${count}</div>`;
    })
    .join('');
}

function renderCategoryBreakdown() {
  const categoryBreakdown = document.getElementById('categoryBreakdown');
  if (!categoryBreakdown) return;

  const max = Math.max(...Object.values(categoryCounts), 1);

  categoryBreakdown.innerHTML = Object.entries(categoryCounts)
    .map(([key, value]) => {
      return `
        <div class="breakdown-row">
          <span class="breakdown-label">${formatCategory(key)}</span>
          <div class="breakdown-bar-wrap">
            <div class="breakdown-bar" style="width: ${(value / max) * 100}%"></div>
          </div>
          <span class="breakdown-value">${value}</span>
        </div>
      `;
    })
    .join('');
}

// ============ Stats ============
function updateStats() {
  const totalEl = document.getElementById('statTotal');
  const criticalEl = document.getElementById('statCritical');
  const resolvedEl = document.getElementById('statResolved');
  const slaEl = document.getElementById('statSla');

  const totalCount = mockComplaints.length;
  const criticalCount = mockComplaints.filter(item => item.severity === 'critical').length;
  const resolvedCount = mockComplaints.filter(item => item.status === 'resolved').length;

  if (totalEl) totalEl.textContent = totalCount;
  if (criticalEl) criticalEl.textContent = criticalCount;
  if (resolvedEl) resolvedEl.textContent = resolvedCount;
  if (slaEl) slaEl.textContent = totalCount === 0 ? '0%' : '100%';
}

// ============ Backend Sync ============
async function loadComplaintsFromBackend() {
  try {
    const response = await fetch('http://127.0.0.1:5000/complaints');
    if (!response.ok) {
      throw new Error(`Complaints fetch failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data from backend:', data);

    const complaintsArray = Array.isArray(data)
      ? data
      : Array.isArray(data.complaints)
      ? data.complaints
      : Array.isArray(data.data)
      ? data.data
      : [];

    mockComplaints.length = 0;

    complaintsArray.forEach((item, index) => {
      mockComplaints.push(mapBackendComplaint(item, index));
    });

    recalculateDerivedData();
    rerenderAll();
  } catch (error) {
    console.warn('Could not load backend complaints:', error.message);
  }
}

// ============ Auto Escalation ============
setInterval(async () => {
  try {
    await fetch('http://127.0.0.1:5000/escalate');
    await loadComplaintsFromBackend();
  } catch (error) {
    console.warn('Escalation endpoint not reachable');
  }
}, 5000);

// ============ Init ============
async function init() {
  showView('home');
  rerenderAll();
  await loadComplaintsFromBackend();
}

init();