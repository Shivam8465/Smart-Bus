
  let cachedBuses = {};
  function handleUnauthorized() {
    // Token expired/invalid → clear session and force re-login
    if (typeof clearLoginData === 'function') clearLoginData();
    alert('Session expired or invalid token. Please login again.');
    window.location.href = 'login.html';
  }

  // ── AUTH CHECK ──
const currentUser = requireLogin('admin');
if (!currentUser) {
  // requireLogin handles redirect
}

if (currentUser) {
  const pageHeader = document.querySelector('.page-header h2');
  if (pageHeader) {
    pageHeader.textContent = `Welcome, ${currentUser.name}`;
  }
}

  let cachedBuses = {};
  let cachedRoutes = {};
  let isEditingRoute = null;

  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  function openAddRouteModal() {
    isEditingRoute = null;
    document.getElementById('new-route-id').value = '';
    document.getElementById('new-route-number').value = '';
    document.getElementById('new-route-name').value = '';
    document.getElementById('new-route-stops').value = '8';
    document.getElementById('new-route-frequency').value = '20';
    if (document.getElementById('new-route-stop-names')) {
      document.getElementById('new-route-stop-names').value = '';
    }
    
    const modal = document.getElementById('add-route-modal');
    if (modal) {
      modal.querySelector('h3').textContent = '➕ Add New Route';
      const primaryBtn = modal.querySelector('.modal-footer .btn-primary');
      if (primaryBtn) primaryBtn.textContent = 'Add Route';
    }
    openModal('add-route-modal');
  }

  document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', e => { 
      if (e.target === el) el.classList.remove('open'); 
    });
  });

  function computeFleetStats(buses) {
    const busData = buses || [];
    const totalPassengers = busData.reduce((sum, b) => sum + (Number(b.passengers) || 0), 0);

    // On-time definition for prototype:
    // - exclude Off Duty
    // - on-time if status is NOT Delayed
    const activeBuses = busData.filter(b => (b.status || '') !== 'Off Duty');
    const onTimeBuses = activeBuses.filter(b => (b.status || '') !== 'Delayed');
    const onTimeRate = activeBuses.length
      ? Math.round((onTimeBuses.length / activeBuses.length) * 100)
      : 0;
      
    // Occupancy
    const totalCapacity = activeBuses.reduce((sum, b) => sum + (Number(b.capacity) || 50), 0);
    const avgOccupancy = totalCapacity ? Math.round((totalPassengers / totalCapacity) * 100) : 0;
    
    // Incidents
    const incidents = busData.reduce((sum, b) => sum + (Array.isArray(b.incidents) ? b.incidents.length : 0), 0);

    return { 
      totalPassengers, 
      onTimeRate, 
      activeCount: activeBuses.length, 
      totalBuses: busData.length,
      avgOccupancy,
      incidents
    };
  }
  
  function updateLiveStats(stats, isOffline = false) {
    const util = stats.totalBuses ? Math.round((stats.activeCount / stats.totalBuses) * 100) : 0;
    
    // Pax
    document.getElementById('live-pax-val').textContent = stats.totalPassengers;
    document.getElementById('live-pax-bar').style.width = Math.min(100, (stats.totalPassengers / 500) * 100) + '%';
    
    // On-time
    document.getElementById('live-ontime-val').textContent = stats.onTimeRate + '%';
    document.getElementById('live-ontime-bar').style.width = stats.onTimeRate + '%';
    
    // Occupancy
    document.getElementById('live-occ-val').textContent = stats.avgOccupancy + '%';
    document.getElementById('live-occ-bar').style.width = stats.avgOccupancy + '%';
    
    // Incidents
    document.getElementById('live-inc-val').textContent = stats.incidents;
    document.getElementById('live-inc-bar').style.width = Math.min(100, stats.incidents * 10) + '%';
    
    // Utilisation
    document.getElementById('live-util-val').textContent = util + '%';
    document.getElementById('live-util-bar').style.width = util + '%';
    
    // Health
    if (isOffline) {
      document.getElementById('health-main-badge').textContent = 'Server Offline';
      document.getElementById('health-main-badge').className = 'badge badge-red';
      document.getElementById('health-db').textContent = 'OFFLINE';
      document.getElementById('health-db').className = 'badge badge-red';
      document.getElementById('health-api').textContent = 'OFFLINE';
      document.getElementById('health-api').className = 'badge badge-red';
      document.getElementById('health-fleet').textContent = 'UNREACHABLE';
      document.getElementById('health-fleet').className = 'badge badge-red';
    } else {
      document.getElementById('health-main-badge').textContent = 'All Systems OK';
      document.getElementById('health-main-badge').className = 'badge badge-green';
      document.getElementById('health-db').textContent = 'ONLINE';
      document.getElementById('health-db').className = 'badge badge-green';
      document.getElementById('health-api').textContent = 'ONLINE';
      document.getElementById('health-api').className = 'badge badge-green';
      document.getElementById('health-fleet').textContent = util > 0 ? 'GOOD' : 'NO ACTIVE BUSES';
      document.getElementById('health-fleet').className = util > 0 ? 'badge badge-green' : 'badge badge-amber';
    }
  }

  // ── LOAD BUSES FROM MONGODB ──
  async function loadBusesFromDB() {
    try {
      const token    = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/buses`, {
        method:  'GET',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

if (!response.ok) {
  console.log('Failed to load from DB. Using dummy data.');
  renderBusTable(DUMMY.buses);
  return;
}

renderBusTable(data.buses);
// Update stat cards with real data
const totalEl  = document.getElementById('total-buses');
const activeEl = document.getElementById('active-buses');
const paxEl    = document.getElementById('pax-today');
const onTimeEl = document.getElementById('on-time-rate');
const onTimeDeltaEl = document.getElementById('on-time-delta');

if (totalEl) totalEl.textContent = data.count;

if (activeEl) {
  const activeCount = data.buses.filter(b => b.status === 'On Route').length;
  activeEl.textContent = `▲ ${activeCount} active now`;
}

// Live fleet-derived stats
const stats = computeFleetStats(data.buses);
if (paxEl) paxEl.textContent = stats.totalPassengers.toLocaleString();
if (onTimeEl) onTimeEl.textContent = `${stats.onTimeRate}%`;
if (onTimeDeltaEl) onTimeDeltaEl.textContent = `▲ ${stats.activeCount} buses tracked`;

// Update the complex stat cards
updateLiveStats(stats);

    } catch (error) {
      console.log('Backend not available. Using dummy data.');
      renderBusTable(DUMMY.buses);
      const paxEl    = document.getElementById('pax-today');
      const onTimeEl = document.getElementById('on-time-rate');
      const onTimeDeltaEl = document.getElementById('on-time-delta');
      const stats = computeFleetStats(DUMMY.buses.map(b => ({
        ...b,
        busId: b.id
      })));
      if (paxEl) paxEl.textContent = stats.totalPassengers.toLocaleString();
      if (onTimeEl) onTimeEl.textContent = `${stats.onTimeRate}%`;
      if (onTimeDeltaEl) onTimeDeltaEl.textContent = `▲ ${stats.activeCount} buses tracked`;
      
      // Update the complex stat cards, passing true for isOffline
      updateLiveStats(stats, true);
    }
  }
  

  // ── RENDER BUS TABLE ──
  function renderBusTable(buses) {
    const tbody   = document.getElementById('bus-table-body');
    if (!tbody) return;

    const busData = buses || DUMMY.buses;
    cachedBuses = {};

    if (busData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;
              color:var(--text-muted);padding:20px;">
            No buses found in database.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = busData.map(bus => {
      const busId = bus.busId || bus.id;
      cachedBuses[busId] = bus;
      const pct        = Math.round((bus.passengers / bus.capacity) * 100);
      const crowdColor = pct > 80 ? 'var(--red)' :
                         pct > 55 ? 'var(--amber)' : '#00d464';
      const statusBadge = {
        'On Route': 'badge-green',
        'Delayed':  'badge-amber',
        'At Stop':  'badge-blue',
        'Off Duty': 'badge-red'
      }[bus.status] || 'badge-blue';

      return `
        <tr>
          <td class="td-mono">${busId}</td>
          <td><span class="route-tag">${bus.route}</span></td>
          <td>${bus.driver}</td>
          <td>
            <span class="badge ${statusBadge}">
              ${bus.status.toUpperCase()}
            </span>
          </td>
          <td>
            <span style="font-family:var(--font-mono);font-size:0.78rem;">
              ${bus.passengers}/${bus.capacity}
            </span>
            <div style="height:6px;background:var(--border);
                        border-radius:3px;overflow:hidden;margin-top:4px;">
              <div style="width:${pct}%;height:100%;
                          background:${crowdColor};border-radius:3px;">
              </div>
            </div>
          </td>
          <td class="td-mono">${bus.eta}</td>
          <td>
            <button class="action-btn" 
                    onclick="editBus('${busId}')">Edit</button>
            <button class="action-btn danger" 
                    onclick="deleteBus('${busId}')">Remove</button>
          </td>
        </tr>`;
    }).join('');
  }

  // ── ADD NEW BUS TO MONGODB ──
  async function addNewBus() {
    const busId    = document.getElementById('new-bus-id').value.trim();
    const route    = document.getElementById('new-bus-route').value;
    const capacity = document.getElementById('new-bus-capacity').value;
    const driver   = document.getElementById('new-bus-driver').value;

    if (!busId || !route || !driver) {
      alert('Please fill all fields.');
      return;
    }

    try {
      const token    = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/buses`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          busId,
          route,
          driver,
          capacity: parseInt(capacity) || 50
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || 'Failed to add bus.');
        return;
      }

      alert(`✅ Bus ${busId} added successfully.`);
      closeModal('add-bus-modal');
      loadBusesFromDB();

    } catch (error) {
      alert('Backend not available. Cannot add bus.');
    }
  }

  // ── ADD NEW ROUTE TO MONGODB ──
  async function addNewRoute() {
    const routeId = document.getElementById('new-route-id').value.trim();
    const routeNumber = document.getElementById('new-route-number').value.trim();
    const routeName = document.getElementById('new-route-name').value.trim();
    const stopCount = parseInt(document.getElementById('new-route-stops').value, 10) || 0;
    const frequency = document.getElementById('new-route-frequency').value.trim();
    const stopNamesRaw = document.getElementById('new-route-stop-names')?.value || '';

    if (!routeId || !routeName) {
      alert('Please fill route ID and route name.');
      return;
    }

    const routeLabel = routeNumber ? `${routeNumber} — ${routeName}` : routeName;
    const parsedStopNames = stopNamesRaw
      .split(/[\n,]+/g)
      .map(s => s.trim())
      .filter(Boolean);

    // If stop names are not provided, auto-fill from built-in ROUTE_STOPS when possible
    const normalizedRouteNumber = routeNumber.toUpperCase().trim();
    const builtInStops = (typeof ROUTE_STOPS !== 'undefined' && ROUTE_STOPS && ROUTE_STOPS[normalizedRouteNumber])
      ? ROUTE_STOPS[normalizedRouteNumber].map(s => s.name)
      : [];

    const finalStopNames = parsedStopNames.length
      ? parsedStopNames
      : (builtInStops.length ? builtInStops : Array.from({ length: Math.max(0, stopCount) }, (_, index) => `Stop ${index + 1}`));

    const stops = finalStopNames.map((name, index) => ({
      name,
      position: index + 1,
      distanceKm: index * 2
    }));

    try {
      const token = localStorage.getItem('sbf_token');
      const method = isEditingRoute ? 'PUT' : 'POST';
      const url = isEditingRoute ? `${API_BASE_URL}/routes/${isEditingRoute}` : `${API_BASE_URL}/routes`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          routeId,
          name: routeLabel,
          stops,
          distance: `${Math.max(1, stops.length * 2)} km`,
          frequency: frequency ? `${frequency} min` : ''
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || `Failed to ${isEditingRoute ? 'update' : 'add'} route.`);
        return;
      }

      closeModal('add-route-modal');
      alert(`✅ Route ${routeId} ${isEditingRoute ? 'updated' : 'added'} successfully.`);
      isEditingRoute = null;
      loadRoutesFromDB();
    } catch (error) {
      alert('Backend not available. Cannot add route.');
    }
  }

  function autoFillRouteStops() {
    const routeNumberEl = document.getElementById('new-route-number');
    const stopNamesEl = document.getElementById('new-route-stop-names');
    const stopCountEl = document.getElementById('new-route-stops');
    if (!routeNumberEl || !stopNamesEl || !stopCountEl) return;

    const routeNumber = routeNumberEl.value.toUpperCase().trim();
    const builtIn = (typeof ROUTE_STOPS !== 'undefined' && ROUTE_STOPS && ROUTE_STOPS[routeNumber])
      ? ROUTE_STOPS[routeNumber]
      : null;

    // Only auto-fill if user hasn't typed custom stops
    const userTypedStops = stopNamesEl.value.trim().length > 0;
    if (!builtIn) return;
    if (userTypedStops) return;

    stopNamesEl.value = builtIn.map(s => s.name).join('\n');
    stopCountEl.value = String(builtIn.length);
  }

  // ── LOAD ROUTES FROM MONGODB ──
  async function loadRoutesFromDB() {
    const fallbackRoutes = [
      { routeId: 'RT-42A', name: '42A — City Centre → Airport', totalStops: 9, distance: '18 km', frequency: '15 min', status: 'Active' },
      { routeId: 'RT-17B', name: '17B — North Station → University', totalStops: 5, distance: '11 km', frequency: '20 min', status: 'Active' },
      { routeId: 'RT-08C', name: '08C — East Mall → West Terminal', totalStops: 6, distance: '22 km', frequency: '10 min', status: 'Suspended' },
      { routeId: 'RT-25D', name: '25D — South Bay → Central Park', totalStops: 3, distance: '8 km', frequency: '30 min', status: 'Active' }
    ];

    try {
      const token = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Routes load failed');

      cachedRoutes = {};
      (data.routes || []).forEach(r => {
        cachedRoutes[r.routeId] = r;
      });

      renderRouteTable(data.routes || []);
      populateBusRouteDropdown(data.routes || []);
      const totalRoutesEl = document.getElementById('total-routes');
      const activeRoutesEl = document.getElementById('active-routes');
      const activeCount = (data.routes || []).filter(r => (r.status || 'Active') === 'Active').length;
      if (totalRoutesEl) totalRoutesEl.textContent = data.count || 0;
      if (activeRoutesEl) activeRoutesEl.textContent = `▲ ${activeCount} active now`;
    } catch (error) {
      renderRouteTable(fallbackRoutes);
      populateBusRouteDropdown(fallbackRoutes);
      const totalRoutesEl = document.getElementById('total-routes');
      const activeRoutesEl = document.getElementById('active-routes');
      const activeCount = fallbackRoutes.filter(r => r.status === 'Active').length;
      if (totalRoutesEl) totalRoutesEl.textContent = fallbackRoutes.length;
      if (activeRoutesEl) activeRoutesEl.textContent = `▲ ${activeCount} active now`;
    }
  }

  function normalizeRouteCode(value) {
    return String(value || '').trim().toUpperCase().replace(/^RT-/, '');
  }

  function populateBusRouteDropdown(routes) {
    const sel = document.getElementById('new-bus-route');
    if (!sel) return;

    const list = (routes || [])
      .map((r) => ({
        code: normalizeRouteCode(r.routeId),
        name: r.name || ''
      }))
      .filter((r) => r.code);

    // Keep current selection if possible
    const previous = sel.value;

    sel.innerHTML = list.length
      ? list
          .map((r) => {
            const displayName = r.name.startsWith(r.code) ? r.name : `${r.code} — ${r.name || `Route ${r.code}`}`;
            return `<option value="${r.code}">${displayName}</option>`;
          })
          .join('')
      : '<option value="">No routes found</option>';

    if (previous && list.some((r) => r.code === previous)) {
      sel.value = previous;
    }
  }

  function renderRouteTable(routes) {
    const tbody = document.getElementById('route-table-body');
    if (!tbody) return;

    if (!routes || routes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">
            No routes found in database.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = routes.map((route) => {
      const status = route.status || 'Active';
      const statusBadge = {
        Active: 'badge-green',
        Inactive: 'badge-blue',
        Suspended: 'badge-amber'
      }[status] || 'badge-blue';

      return `
        <tr>
          <td class="td-mono">${route.routeId}</td>
          <td>${route.name}</td>
          <td>${route.totalStops || (route.stops ? route.stops.length : 0)}</td>
          <td>${route.distance || '—'}</td>
          <td class="td-mono">${route.frequency || '—'}</td>
          <td><span class="badge ${statusBadge}">${status.toUpperCase()}</span></td>
          <td>
            <button class="action-btn" onclick="editRoute('${route.routeId}')">Edit</button>
            <button class="action-btn danger" onclick="deleteRoute('${route.routeId}')">Delete</button>
          </td>
        </tr>`;
    }).join('');
  }
  
  function editRoute(routeId) {
    const route = cachedRoutes[routeId];
    if (!route) return;
    
    isEditingRoute = routeId;
    document.getElementById('new-route-id').value = route.routeId;
    
    // Parse route name and number (assuming "Number — Name")
    const parts = (route.name || '').split('—').map(s => s.trim());
    if (parts.length > 1) {
      document.getElementById('new-route-number').value = parts[0];
      document.getElementById('new-route-name').value = parts.slice(1).join(' — ');
    } else {
      document.getElementById('new-route-number').value = route.routeId.replace('RT-', '');
      document.getElementById('new-route-name').value = route.name || '';
    }
    
    document.getElementById('new-route-stops').value = route.totalStops || (route.stops ? route.stops.length : 8);
    document.getElementById('new-route-frequency').value = parseInt(route.frequency, 10) || 20;
    
    if (route.stops && Array.isArray(route.stops)) {
      const stopNamesEl = document.getElementById('new-route-stop-names');
      if (stopNamesEl) {
        stopNamesEl.value = route.stops.map(s => s.name).join('\n');
      }
    }
    
    // Change modal title and button text
    const modal = document.getElementById('add-route-modal');
    if (modal) {
      modal.querySelector('h3').textContent = '✏️ Edit Route';
      const primaryBtn = modal.querySelector('.modal-footer .btn-primary');
      if (primaryBtn) primaryBtn.textContent = 'Save Changes';
    }
    
    openModal('add-route-modal');
  }

  async function deleteRoute(routeId) {
    if (!confirm(`Delete Route ${routeId}?`)) return;

    try {
      const token = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        alert(data.message || 'Failed to delete route.');
        return;
      }
      alert(`✅ ${data.message}`);
      loadRoutesFromDB();
    } catch (error) {
      alert('Backend not available. Cannot delete route.');
    }
  }

  // ── DELETE BUS FROM MONGODB ──
  async function deleteBus(busId) {
    if (!confirm(`Remove Bus ${busId} from fleet?`)) return;

    try {
      const token    = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
        method:  'DELETE',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || 'Failed to delete bus.');
        return;
      }

      alert(`✅ ${data.message}`);
      loadBusesFromDB();

    } catch (error) {
      alert('Backend not available. Cannot delete bus.');
    }
  }

  // ── EDIT BUS ──
  async function editBus(busId) {
    const bus = cachedBuses[busId];
    if (!bus) {
      alert('Bus data not found. Please refresh.');
      return;
    }

    const route = prompt('Update route:', bus.route || '');
    if (route === null) return;
    const driver = prompt('Update driver name:', bus.driver || '');
    if (driver === null) return;
    const status = prompt('Update status (On Route / At Stop / Delayed / Off Duty):', bus.status || 'On Route');
    if (status === null) return;
    const capacityInput = prompt('Update capacity:', String(bus.capacity || 50));
    if (capacityInput === null) return;

    const capacity = parseInt(capacityInput, 10);
    if (!route.trim() || !driver.trim() || Number.isNaN(capacity) || capacity <= 0) {
      alert('Invalid input. Edit cancelled.');
      return;
    }

    try {
      const token = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          route: route.trim(),
          driver: driver.trim(),
          status: status.trim(),
          capacity
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to update bus.');
        return;
      }

      alert(`✅ Bus ${busId} updated successfully.`);
      loadBusesFromDB();
    } catch (error) {
      alert('Backend not available. Cannot update bus.');
    }
  }

  // ── CREATE STAFF ACCOUNT ──
  async function createStaffAccount() {
    const name     = document.getElementById('staff-name').value.trim();
    const email    = document.getElementById('staff-email').value.trim();
    const password = document.getElementById('staff-password').value.trim();
    const role     = document.getElementById('staff-role').value;

    if (!name || !email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const token    = localStorage.getItem('sbf_token');
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || 'Failed to create account.');
        return;
      }

      closeModal('add-staff-modal');
      alert(`✅ ${role.toUpperCase()} account created for ${name}.`);

    } catch (error) {
      // Fallback to localStorage
      const existing = localStorage.getItem('sbf_registered_' + email);
      if (existing) {
        alert('An account with this email already exists.');
        return;
      }
      const staffUser = {
        name, email, password, role,
        createdBy:    'admin',
        registeredOn: new Date().toLocaleString()
      };
      localStorage.setItem('sbf_registered_' + email, JSON.stringify(staffUser));
      closeModal('add-staff-modal');
      alert(`✅ ${role.toUpperCase()} account created for ${name}.`);
    }
  }

  // ── INITIAL LOAD ──
  loadBusesFromDB();
  loadRoutesFromDB();

