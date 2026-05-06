// =============================================
//  STORAGE
// =============================================
const STORAGE_KEY = 'kelulusan_mahasiswa';

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// =============================================
//  STATUS
// =============================================
function getStatus(ipk) {
  const v = parseFloat(ipk);
  if (isNaN(v)) return 'unknown';
  return v > 75 ? 'lulus' : 'tidak';
}

// =============================================
//  TOAST
// =============================================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// =============================================
//  PAGE NAVIGATION
// =============================================
function showPage(page) {
  if (page === 'student') {
    document.getElementById('pageStudent').classList.remove('hidden');
    document.getElementById('pageAdmin').classList.add('hidden');
    renderStudentPage();
  } else if (page === 'admin') {
    document.getElementById('pageStudent').classList.add('hidden');
    document.getElementById('pageAdmin').classList.remove('hidden');
  }
}

// =============================================
//  INDEX (STUDENT) PAGE
// =============================================
document.getElementById('logoBtn').addEventListener('click', function () {
  showPage('admin');
});

document.getElementById('searchInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') searchData();
});

function searchData() {
  renderStudentPage(document.getElementById('searchInput').value);
}

function renderStudentPage(filter) {
  let data = getData();

  if (filter && filter.trim() !== '') {
    const q = filter.trim().toLowerCase();
    data = data.filter(m =>
      m.nim.toLowerCase().includes(q) ||
      m.nama.toLowerCase().includes(q) ||
      m.prodi.toLowerCase().includes(q)
    );
  }

  document.getElementById('statTotal').textContent = data.length;
  document.getElementById('statLulus').textContent = data.filter(m => getStatus(m.ipk) === 'lulus').length;
  document.getElementById('statTidak').textContent = data.filter(m => getStatus(m.ipk) !== 'lulus').length;

  const list = document.getElementById('studentList');
  const emptyState = document.getElementById('emptyState');
  list.querySelectorAll('.student-card').forEach(c => c.remove());

  if (data.length === 0) {
    emptyState.style.display = '';
    return;
  }
  emptyState.style.display = 'none';

  data.forEach(m => {
    const status = getStatus(m.ipk);
    const card = document.createElement('div');
    card.className = 'student-card ' + status;

    let badgeHTML = '', badgeClass = '';
    if (status === 'lulus')        { badgeHTML = '✅ LULUS';       badgeClass = 'badge-lulus'; }
    else if (status === 'tidak')   { badgeHTML = '❌ TIDAK LULUS'; badgeClass = 'badge-tidak'; }
    else                           { badgeHTML = '⚠ UNKNOWN';     badgeClass = 'badge-unknown'; }

    card.innerHTML = `
      <div class="avatar">${m.nama.charAt(0).toUpperCase()}</div>
      <div class="student-info">
        <div class="name">${escHtml(m.nama)}</div>
        <div class="detail">
          <b>NIM:</b> ${escHtml(m.nim)} &nbsp;|&nbsp;
          <b>Prodi:</b> ${escHtml(m.prodi)} &nbsp;|&nbsp;
          <b>Nilai:</b> ${parseFloat(m.ipk).toFixed(0)}
        </div>
      </div>
      <div class="status-badge ${badgeClass}">${badgeHTML}</div>
    `;
    list.appendChild(card);
  });
}

// =============================================
//  ADMIN: LOGIN / LOGOUT
// =============================================
document.getElementById('loginPass').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doLogin();
});

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginError');

  if (user === 'admin' && pass === '123') {
    sessionStorage.setItem('admin_logged_in', '1');
    err.textContent = '';
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderAdminTable();
  } else {
    err.textContent = '⚠ Username atau password salah!';
  }
}

function doLogout() {
  sessionStorage.removeItem('admin_logged_in');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginPass').value = '';
  showPage('student');
}

// =============================================
//  ADMIN: TABLE
// =============================================
function renderAdminTable() {
  const data = getData();
  const tbody = document.getElementById('adminTableBody');
  const emptyAdmin = document.getElementById('emptyAdmin');
  tbody.innerHTML = '';

  if (data.length === 0) { emptyAdmin.style.display = ''; return; }
  emptyAdmin.style.display = 'none';

  data.forEach((m, idx) => {
    const status = getStatus(m.ipk);
    let statusTxt = '', statusClass = '';
    if (status === 'lulus')        { statusTxt = 'LULUS';       statusClass = 'tbl-lulus'; }
    else if (status === 'tidak')   { statusTxt = 'TIDAK LULUS'; statusClass = 'tbl-tidak'; }
    else                           { statusTxt = 'UNKNOWN';     statusClass = 'tbl-unknown'; }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(m.nim)}</td>
      <td>${escHtml(m.nama)}</td>
      <td>${escHtml(m.prodi)}</td>
      <td>${parseFloat(m.ipk).toFixed(0)}</td>
      <td class="${statusClass}">${statusTxt}</td>
      <td><button class="btn-delete" onclick="hapusMahasiswa(${idx})">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function tambahMahasiswa() {
  const nim   = document.getElementById('inputNIM').value.trim();
  const nama  = document.getElementById('inputNama').value.trim();
  const prodi = document.getElementById('inputProdi').value.trim();
  const ipk   = document.getElementById('inputNilai').value.trim();

  if (!nim || !nama || !prodi || !ipk) {
    showToast('Semua field harus diisi!', 'error'); return;
  }

  const ipkNum = parseFloat(ipk);
  if (isNaN(ipkNum) || ipkNum < 0 || ipkNum > 100) {
    showToast('Nilai harus antara 0 dan 100!', 'error'); return;
  }

  const data = getData();
  if (data.find(m => m.nim === nim)) {
    showToast('NIM sudah terdaftar!', 'error'); return;
  }

  data.push({ nim, nama, prodi, ipk: ipkNum.toFixed(2) });
  saveData(data);

  document.getElementById('inputNIM').value   = '';
  document.getElementById('inputNama').value  = '';
  document.getElementById('inputProdi').value = '';
  document.getElementById('inputNilai').value = '';

  renderAdminTable();
  showToast(`✅ Data ${nama} berhasil ditambahkan!`);
}

function hapusMahasiswa(idx) {
  const data = getData();
  const nama = data[idx].nama;
  if (!confirm(`Hapus data ${nama}?`)) return;
  data.splice(idx, 1);
  saveData(data);
  renderAdminTable();
  showToast(`🗑 Data ${nama} dihapus.`);
}

function exportExcel() {
  const data = getData();
  if (data.length === 0) { showToast('Tidak ada data untuk diekspor!', 'error'); return; }
  if (typeof XLSX === 'undefined') { showToast('Library XLSX belum dimuat!', 'error'); return; }

  const wsData = [['NIM','Nama','Prodi','Nilai','Status']];
  data.forEach(m => {
    const s = getStatus(m.ipk);
    wsData.push([m.nim, m.nama, m.prodi, parseFloat(m.ipk),
      s === 'lulus' ? 'LULUS' : s === 'tidak' ? 'TIDAK LULUS' : 'UNKNOWN']);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{wch:12},{wch:22},{wch:18},{wch:8},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws, 'Data Kelulusan');
  XLSX.writeFile(wb, 'data_kelulusan_mahasiswa.xlsx');
  showToast('📥 Export berhasil!');
}

// =============================================
//  HELPER
// =============================================
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init student page
renderStudentPage();