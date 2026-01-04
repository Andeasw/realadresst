const CONFIG = {
  MAX_RETRIES: 5,
  TIMEOUT_MS: 3000,
  USER_AGENT: 'IDConsole/7.0 (CloudflareWorker)',
}

export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url)
    let country = searchParams.get('country')
    const nonce = crypto.randomUUID()

    let addressData = { full: '', road: '', city: 'Unknown', state: '', zip: '', house: '' }
    let userData = { name: '', gender: '', photo: '', phone: '' }
    
    let ipLoc = null
    if (!country) {
      if (request.cf && request.cf.latitude && request.cf.longitude) {
        country = request.cf.country
        ipLoc = { lat: request.cf.latitude, lng: request.cf.longitude }
      } else {
        country = getRandomCountry()
      }
    }

    try {
      for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS)
        try {
          let loc
          if (ipLoc) {
            loc = i === 0 ? ipLoc : {
              lat: ipLoc.lat + (Math.random() - 0.5) * 0.01,
              lng: ipLoc.lng + (Math.random() - 0.5) * 0.01
            }
          } else {
            loc = getRandomLocationInCountry(country)
          }

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`, {
            headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': request.url },
            signal: controller.signal
          })
          
          if (!res.ok) continue
          const data = await res.json()
          const a = data.address
          
          if (a && (a.road || a.city || a.town || a.suburb || a.village || a.county)) {
            addressData = {
              house: a.house_number || Math.floor(Math.random() * 2000) + 1,
              road: a.road || '',
              city: a.city || a.town || a.village || a.county || 'Unknown City',
              state: a.state || a.region || "",
              zip: a.postcode || getMockZipCode(country),
            }
            addressData.full = formatAddress(addressData, country)
            break
          }
        } catch (e) {
        } finally {
          clearTimeout(tid)
        }
      }
      
      if (!addressData.full) {
        addressData.full = `Fallback Road, Anime City, ${country || 'US'}`
        addressData.zip = getMockZipCode(country)
      }

    } catch (e) {}

    const natMap = { 'UK': 'GB', 'CN': 'US', 'TW': 'US', 'HK': 'US', 'JP': 'US', 'KR': 'US' }
    const natQuery = natMap[country] || country
    const natParam = ['US','GB','FR','DE','AU','BR','CA','ES','MX','TR','IN'].includes(natQuery) ? `&nat=${natQuery}` : ''

    try {
      const uRes = await fetch(`https://randomuser.me/api/?inc=name,gender,picture&noinfo${natParam}`, { 
        headers: { 'User-Agent': CONFIG.USER_AGENT } 
      })
      if (uRes.ok) {
        const uJson = await uRes.json()
        const u = uJson.results[0]
        userData = {
          name: `${u.name.first} ${u.name.last}`,
          gender: u.gender.charAt(0).toUpperCase() + u.gender.slice(1),
          photo: u.picture.large,
          phone: ''
        }
      } else {
        throw new Error('User fetch failed')
      }
    } catch (e) {
      userData = { name: 'Miku Hatsune', gender: 'Female', photo: 'https://ui-avatars.com/api/?name=Miku+Hatsune&background=39c5bb&color=fff&size=128', phone: '' }
    }
    
    userData.phone = getRandomPhoneNumber(country)

    const clientState = { user: userData, address: addressData }
    const safeState = JSON.stringify(clientState).replace(/</g, '\\u003c')

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>虚拟身份控制台 | ID Console</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%2372efdd%22/><text x=%2250%22 y=%2260%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>ID</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style nonce="${nonce}">
    :root {
      --primary: #4cc9f0;
      --secondary: #4361ee;
      --bg-grad: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
      --glass-bg: rgba(255, 255, 255, 0.9);
      --border: 1px solid rgba(255,255,255,0.8);
      --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
      --text: #2d3436;
    }
    * { box-sizing: border-box; }
    
    body {
      font-family: 'M PLUS Rounded 1c', sans-serif;
      margin: 0; min-height: 100vh;
      background: var(--bg-grad);
      background-attachment: fixed;
      display: flex; justify-content: center; padding: 40px 20px;
      color: var(--text);
    }

    .main-container { width: 100%; max-width: 1280px; display: flex; flex-direction: column; gap: 25px; }

    .top-section { 
      display: grid; 
      grid-template-columns: 420px 1fr; 
      gap: 25px; 
      align-items: stretch;
    }

    .card {
      background: var(--glass-bg);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: var(--border); border-radius: 24px;
      box-shadow: var(--shadow); padding: 30px;
      display: flex; flex-direction: column;
    }

    .profile-card { justify-content: space-between; }
    
    .avatar-area {
      display: flex; align-items: center; gap: 20px; margin-bottom: 25px;
      padding-bottom: 20px; border-bottom: 2px dashed rgba(0,0,0,0.05);
    }
    .avatar {
      width: 90px; height: 90px; border-radius: 50%;
      border: 4px solid #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.1); object-fit: cover;
    }
    .name-area h1 { margin: 0; font-size: 1.6rem; color: #333; line-height: 1.2; }
    .badges { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; color: #fff; font-weight: 700; background: var(--secondary); }

    .info-grid { display: flex; flex-direction: column; gap: 12px; }
    
    .info-row {
      background: #fff; padding: 15px; border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.03); cursor: pointer;
      transition: transform 0.2s, border 0.2s;
    }
    .info-row:hover { transform: translateY(-2px); border-color: var(--primary); }
    
    .label { font-size: 0.75rem; font-weight: 800; color: #888; text-transform: uppercase; margin-bottom: 5px; }
    .val { font-size: 1.05rem; font-weight: 700; color: #444; word-break: break-word; line-height: 1.4; }

    .btn-refresh {
      margin-top: 30px; width: 100%; padding: 15px; border: none; border-radius: 16px;
      background: linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%);
      color: #fff; font-size: 1.1rem; font-weight: 800; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3); transition: 0.2s;
    }
    .btn-refresh:active { transform: scale(0.98); }

    .map-card { padding: 0; overflow: hidden; position: relative; min-height: 500px; }
    .map-tools { position: absolute; top: 20px; right: 20px; z-index: 10; }
    .country-sel {
      padding: 12px 20px; border-radius: 12px; border: none;
      background: rgba(255,255,255,0.95); font-weight: 700; color: #444; font-size: 0.9rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15); outline: none; cursor: pointer;
    }
    iframe { width: 100%; height: 100%; border: none; }

    .history-card { padding: 0; overflow: hidden; }
    .h-header {
      padding: 20px 30px; background: rgba(255,255,255,0.6);
      font-weight: 800; color: #555; font-size: 1rem;
      border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;
    }
    .btn-clear { border: none; background: none; color: #e17055; font-weight: 800; cursor: pointer; font-size: 0.9rem; }
    
    .table-container { overflow-x: auto; width: 100%; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th { text-align: left; padding: 15px 30px; color: #888; font-size: 0.8rem; background: rgba(255,255,255,0.3); text-transform: uppercase; }
    td { padding: 18px 30px; border-top: 1px solid rgba(0,0,0,0.03); color: #555; font-size: 0.95rem; vertical-align: middle; }
    tr:hover td { background: rgba(255,255,255,0.5); }
    .col-addr { max-width: 450px; white-space: normal; line-height: 1.5; }
    .btn-del {
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #ffebec; color: #d63031; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-weight: bold; transition: 0.2s;
    }
    .btn-del:hover { background: #ff7675; color: #fff; }

    .toast {
      position: fixed; top: 40px; left: 50%; transform: translate(-50%, -200%);
      background: #fff; padding: 12px 35px; border-radius: 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); color: var(--secondary); font-weight: 800;
      opacity: 0; transition: 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); pointer-events: none; z-index: 100;
    }
    .toast.show { transform: translate(-50%, 0); opacity: 1; }

    @media(max-width: 950px) {
      .top-section { grid-template-columns: 1fr; }
      .map-card { min-height: 350px; }
    }
  </style>
</head>
<body>
  <div class="toast" id="toast">✨ 已复制 Copied</div>

  <div class="main-container">
    <div class="top-section">
      <div class="card profile-card">
        <div>
          <div class="avatar-area">
            <img src="${escapeHtml(userData.photo)}" class="avatar" alt="Avatar">
            <div class="name-area">
              <h1>${escapeHtml(userData.name)}</h1>
              <div class="badges">
                <span class="badge">${escapeHtml(userData.gender)}</span>
                <span class="badge" style="background:var(--primary)">${escapeHtml(addressData.city)}</span>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-row js-copy" data-val="${escapeHtml(userData.name)}">
              <div class="label">👤 姓名 / Name</div>
              <div class="val">${escapeHtml(userData.name)}</div>
            </div>
            <div class="info-row js-copy" data-val="${escapeHtml(userData.phone)}">
              <div class="label">📞 电话 / Phone</div>
              <div class="val">${escapeHtml(userData.phone)}</div>
            </div>
            <div class="info-row js-copy" data-val="${escapeHtml(addressData.zip)}">
              <div class="label">📮 邮编 / Zip Code</div>
              <div class="val">${escapeHtml(addressData.zip)}</div>
            </div>
            <div class="info-row js-copy" data-val="${escapeHtml(addressData.full)}">
              <div class="label">📍 地址 / Address</div>
              <div class="val">${escapeHtml(addressData.full)}</div>
            </div>
          </div>
        </div>

        <button class="btn-refresh" id="btn-reload">↻ 生成新身份 (Reroll Identity)</button>
      </div>

      <div class="card map-card">
        <div class="map-tools">
          <select id="country-select" class="country-sel">
            ${getCountryOptions(country)}
          </select>
        </div>
        <iframe 
          src="https://www.google.com/maps?q=${encodeURIComponent(addressData.full)}&output=embed" 
          loading="lazy" 
          referrerpolicy="no-referrer">
        </iframe>
      </div>
    </div>

    <div class="card history-card">
      <div class="h-header">
        <span>📜 自动记录 / History Log</span>
        <button id="btn-clear" class="btn-clear">清空记录 Clear All</button>
      </div>
      <div class="table-container">
        <table id="tb">
          <thead>
            <tr>
              <th width="60"></th>
              <th width="180">姓名 Name</th>
              <th width="100">性别 Gender</th>
              <th width="160">电话 Phone</th>
              <th>地址 Address</th>
            </tr>
          </thead>
          <tbody id="h-body"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const STATE = JSON.parse('${safeState}');
    const KEY = 'anime_id_history_v9';

    function esc(s) { return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
    
    function toast() {
      const t = document.getElementById('toast');
      t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'), 1500);
    }

    (function autoSave() {
      const db = JSON.parse(localStorage.getItem(KEY)||'[]');
      if (db.length > 0 && db[0].addr === STATE.address.full && db[0].name === STATE.user.name) {
        return;
      }
      db.unshift({
        name: STATE.user.name,
        gender: STATE.user.gender,
        phone: STATE.user.phone,
        addr: STATE.address.full,
        ts: Date.now()
      });
      if(db.length > 50) db.pop();
      localStorage.setItem(KEY, JSON.stringify(db));
    })();

    function renderHistory() {
      const db = JSON.parse(localStorage.getItem(KEY)||'[]');
      const b = document.getElementById('h-body');
      if(!db.length) {
        b.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#aaa">暂无记录 / No History 🍃</td></tr>';
        return;
      }
      b.innerHTML = db.map((x,i) => \`
        <tr>
          <td><button class="btn-del" data-idx="\${i}">×</button></td>
          <td style="font-weight:700;color:#333">\${esc(x.name)}</td>
          <td>\${esc(x.gender)}</td>
          <td>\${esc(x.phone)}</td>
          <td class="col-addr">\${esc(x.addr)}</td>
        </tr>\`).join('');
    }

    document.querySelectorAll('.js-copy').forEach(el => {
      el.addEventListener('click', () => { navigator.clipboard.writeText(el.dataset.val).then(toast); });
    });

    document.getElementById('btn-reload').addEventListener('click', () => location.reload());
    document.getElementById('country-select').addEventListener('change', e => location.href='?country='+e.target.value);
    
    document.getElementById('btn-clear').addEventListener('click', () => {
      if(confirm('确定要清空所有历史记录吗？\\nAre you sure to clear all history?')) {
        localStorage.removeItem(KEY);
        renderHistory();
      }
    });

    document.getElementById('h-body').addEventListener('click', e => {
      if(e.target.closest('.btn-del')) {
        const idx = e.target.closest('.btn-del').dataset.idx;
        const db = JSON.parse(localStorage.getItem(KEY)||'[]');
        db.splice(idx, 1);
        localStorage.setItem(KEY, JSON.stringify(db));
        renderHistory();
      }
    });

    renderHistory();
  </script>
</body>
</html>
    `
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'Content-Security-Policy': `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; frame-src https://www.google.com; connect-src 'self'; base-uri 'self'; form-action 'self';`,
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'clipboard-write=(self)'
      }
    })
  }
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

function formatAddress(address, country) {
  const parts = [
    address.house ? `${address.house}` : '',
    address.road,
    address.city,
    address.state,
    address.zip,
    country
  ].filter(Boolean);
  
  return parts.join(', ');
}

function getMockZipCode(c) {
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const map = {
    'US': () => r(10000, 99999).toString(),
    'CN': () => r(100000, 999999).toString(),
    'UK': () => `SW1A ${r(1,9)}AA`,
    'JP': () => `${r(100,999)}-${r(1000,9999)}`,
    'default': () => r(10000, 99999).toString()
  }
  return (map[c] || map['default'])();
}

function getRandomLocationInCountry(c) {
  const m = {
    "US": [{ lat: 40.7128, lng: -74.0060 }, { lat: 34.0522, lng: -118.2437 }, { lat: 41.8781, lng: -87.6298 }],
    "UK": [{ lat: 51.5074, lng: -0.1278 }, { lat: 53.4808, lng: -2.2426 }],
    "FR": [{ lat: 48.8566, lng: 2.3522 }, { lat: 45.7640, lng: 4.8357 }],
    "DE": [{ lat: 52.5200, lng: 13.4050 }, { lat: 50.1109, lng: 8.6821 }],
    "CN": [{ lat: 39.9042, lng: 116.4074 }, { lat: 31.2304, lng: 121.4737 }, { lat: 23.1291, lng: 113.2644 }],
    "TW": [{ lat: 25.0330, lng: 121.5654 }, { lat: 22.6273, lng: 120.3014 }],
    "HK": [{ lat: 22.3193, lng: 114.1694 }, { lat: 22.2855, lng: 114.1577 }],
    "JP": [{ lat: 35.6895, lng: 139.6917 }, { lat: 34.6937, lng: 135.5023 }],
    "IN": [{ lat: 28.6139, lng: 77.2090 }, { lat: 19.0760, lng: 72.8777 }],
    "AU": [{ lat: -33.8688, lng: 151.2093 }, { lat: -37.8136, lng: 144.9631 }],
    "BR": [{ lat: -23.5505, lng: -46.6333 }, { lat: -22.9068, lng: -43.1729 }],
    "CA": [{ lat: 43.6532, lng: -79.3832 }, { lat: 45.5017, lng: -73.5673 }],
    "RU": [{ lat: 55.7558, lng: 37.6173 }, { lat: 59.9343, lng: 30.3351 }],
    "ZA": [{ lat: -33.9249, lng: 18.4241 }, { lat: -26.2041, lng: 28.0473 }],
    "MX": [{ lat: 19.4326, lng: -99.1332 }, { lat: 20.6597, lng: -103.3496 }],
    "KR": [{ lat: 37.5665, lng: 126.9780 }, { lat: 35.1796, lng: 129.0756 }],
    "IT": [{ lat: 41.9028, lng: 12.4964 }, { lat: 45.4642, lng: 9.1900 }],
    "ES": [{ lat: 40.4168, lng: -3.7038 }, { lat: 41.3851, lng: 2.1734 }],
    "TR": [{ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 }],
    "SA": [{ lat: 24.7136, lng: 46.6753 }, { lat: 21.4858, lng: 39.1925 }],
    "AR": [{ lat: -34.6037, lng: -58.3816 }, { lat: -31.4201, lng: -64.1888 }],
    "EG": [{ lat: 30.0444, lng: 31.2357 }, { lat: 31.2001, lng: 29.9187 }],
    "NG": [{ lat: 6.5244, lng: 3.3792 }, { lat: 9.0765, lng: 7.3986 }],
    "ID": [{ lat: -6.2088, lng: 106.8456 }, { lat: -7.2575, lng: 112.7521 }]
  }
  const l = m[c] || m["US"]
  const t = l[Math.floor(Math.random() * l.length)]
  return { 
    lat: t.lat + (Math.random() - 0.5) * 0.05, 
    lng: t.lng + (Math.random() - 0.5) * 0.05 
  }
}

function getRandomPhoneNumber(c) {
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const n = (len) => Array.from({length:len}, () => Math.floor(Math.random()*10)).join('');
  
  const f = {
    "US": () => `+1 (${r(200,999)}) ${r(200,999)}-${n(4)}`,
    "UK": () => `+44 7${n(9)}`, 
    "FR": () => `+33 ${r(6,7)}${n(8)}`, 
    "DE": () => `+49 1${r(50,79)} ${n(8)}`, 
    "CN": () => `+86 1${r(30,99)} ${n(8)}`, 
    "TW": () => `+886 9${n(8)}`, 
    "HK": () => `+852 ${r(5,9)}${n(7)}`, 
    "JP": () => `+81 ${r(70,90)}-${n(4)}-${n(4)}`, 
    "IN": () => `+91 ${r(6000,9999)} ${n(6)}`, 
    "AU": () => `+61 4${n(8)}`, 
    "BR": () => `+55 ${r(11,99)} 9${n(8)}`, 
    "CA": () => `+1 (${r(200,999)}) ${r(200,999)}-${n(4)}`,
    "RU": () => `+7 9${n(9)}`, 
    "ZA": () => `+27 ${r(60,89)} ${n(7)}`,
    "MX": () => `+52 ${r(11,99)} ${n(8)}`,
    "KR": () => `+82 10-${n(4)}-${n(4)}`,
    "IT": () => `+39 3${n(9)}`, 
    "ES": () => `+34 6${n(8)}`, 
    "TR": () => `+90 5${n(9)}`, 
    "SA": () => `+966 5${n(8)}`, 
    "AR": () => `+54 9 ${r(11,99)} ${n(8)}`,
    "EG": () => `+20 1${r(0,2)}${n(8)}`, 
    "NG": () => `+234 ${r(70,90)}${n(8)}`,
    "ID": () => `+62 8${n(9)}` 
  }
  return (f[c] || f["US"])()
}

function getRandomCountry() {
  const c = ["US","UK","FR","DE","CN","TW","HK","JP","IN","AU","BR","CA","RU","ZA","MX","KR","IT","ES","TR","SA","AR","EG","NG","ID"]
  return c[Math.floor(Math.random()*c.length)]
}

function getCountryOptions(s) {
  const l = [
    {n:"United States 美国",c:"US"}, {n:"United Kingdom 英国",c:"UK"}, {n:"France 法国",c:"FR"},
    {n:"Germany 德国",c:"DE"}, {n:"China 中国",c:"CN"}, {n:"Taiwan 中国台湾",c:"TW"},
    {n:"Hong Kong 中国香港",c:"HK"}, {n:"Japan 日本",c:"JP"}, {n:"India 印度",c:"IN"},
    {n:"Australia 澳大利亚",c:"AU"}, {n:"Brazil 巴西",c:"BR"}, {n:"Canada 加拿大",c:"CA"},
    {n:"Russia 俄罗斯",c:"RU"}, {n:"South Africa 南非",c:"ZA"}, {n:"Mexico 墨西哥",c:"MX"},
    {n:"South Korea 韩国",c:"KR"}, {n:"Italy 意大利",c:"IT"}, {n:"Spain 西班牙",c:"ES"},
    {n:"Turkey 土耳其",c:"TR"}, {n:"Saudi Arabia 沙特",c:"SA"}, {n:"Argentina 阿根廷",c:"AR"},
    {n:"Egypt 埃及",c:"EG"}, {n:"Nigeria 尼日利亚",c:"NG"}, {n:"Indonesia 印尼",c:"ID"}
  ]
  return l.map(i=>`<option value="${escapeHtml(i.c)}" ${i.c===s?'selected':''}>${escapeHtml(i.n)}</option>`).join('')
}
