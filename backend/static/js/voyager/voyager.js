/**
 * JourneylyAI — Voyager Studio Main Controller
 * Handles manual-first trip state, itinerary, weather synchronization,
 * Trip Index calculations, dialogs, and map communication.
 */

window.VoyagerApp = (function() {
  'use strict';

  // Application State
  const state = {
    trip: null, // null when empty
    selectedDestinationStayId: null,
    selectedDate: null,
    selectedActivityId: null,
    editingActivityId: null,
    pendingDeleteTarget: null, // { type: 'activity'|'destination', id: '...' }
    mobileActiveTab: 'itinerary', // 'itinerary' | 'weather'
    collapsedDays: new Set()
  };

  /**
   * Initialize Voyager workspace
   */
  function init() {
    setupDialogListeners();
    setupGlobalEventListeners();
    setupMobileTabControls();

    // Check if map container exists
    VoyagerMap.init('voyager-map', {
      onMarkerClick: handleMarkerClick
    });

    // Initial render
    render();

    // Responsive listener for map sizing
    window.addEventListener('resize', debounce(() => {
      VoyagerMap.resize();
    }, 150));
  }

  /**
   * Setup accessible dialog listeners with light-dismiss fallback
   */
  function setupDialogListeners() {
    const dialogs = document.querySelectorAll('dialog');
    dialogs.forEach(dialog => {
      // Fallback for browsers without declarative closedby support
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isContent = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          );
          if (!isContent) {
            dialog.close();
          }
        });
      }
    });
  }

  /**
   * Setup UI event delegations
   */
  function setupGlobalEventListeners() {
    // Quick start / Step by step / Load Demo triggers
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      switch (action) {
        case 'open-start-modal':
          openDestinationModal({ isFirst: true });
          break;
        case 'load-sample-trip':
          loadSampleTrip();
          break;
        case 'open-add-destination':
          openDestinationModal({ isFirst: false });
          break;
        case 'open-add-activity':
          openActivityModal({ dayDate: btn.dataset.dayDate, stayId: btn.dataset.stayId });
          break;
        case 'edit-activity':
          openActivityModal({ activityId: btn.dataset.activityId });
          break;
        case 'delete-activity':
          confirmDelete({ type: 'activity', id: btn.dataset.activityId });
          break;
        case 'move-activity-up':
          moveActivity(btn.dataset.activityId, -1);
          break;
        case 'move-activity-down':
          moveActivity(btn.dataset.activityId, 1);
          break;
        case 'select-activity':
          selectActivity(btn.dataset.activityId);
          break;
        case 'select-day':
          selectDay(btn.dataset.dayDate, btn.dataset.stayId);
          break;
        case 'toggle-day-collapse':
          toggleDayCollapse(btn.dataset.dayDate);
          break;
        case 'reset-trip':
          confirmResetTrip();
          break;
        case 'recalibrate-assessment':
          simulateRecalibration();
          break;
        case 'close-dialog':
          closeNearestDialog(btn);
          break;
      }
    });

    // Destination picker search input
    const destSearchInput = document.getElementById('dest-search-input');
    if (destSearchInput) {
      destSearchInput.addEventListener('input', (e) => {
        filterDestinationResults(e.target.value);
      });
    }

    // Time presets in forms
    document.querySelectorAll('.time-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetInputId = btn.dataset.targetInput;
        const targetInput = document.getElementById(targetInputId);
        if (targetInput) {
          targetInput.value = btn.dataset.time;
        }
      });
    });

    // Destination form submission
    const destForm = document.getElementById('destination-modal-form');
    if (destForm) {
      destForm.addEventListener('submit', handleDestinationFormSubmit);
    }

    // Activity form submission
    const actForm = document.getElementById('activity-modal-form');
    if (actForm) {
      actForm.addEventListener('submit', handleActivityFormSubmit);
    }

    // Confirmation dialog confirm button
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', executeConfirmedDelete);
    }
  }

  /**
   * Mobile tab toggling
   */
  function setupMobileTabControls() {
    const tabItinerary = document.getElementById('tab-btn-itinerary');
    const tabWeather = document.getElementById('tab-btn-weather');
    if (!tabItinerary || !tabWeather) return;

    tabItinerary.addEventListener('click', () => {
      state.mobileActiveTab = 'itinerary';
      updateMobileTabsUI();
    });

    tabWeather.addEventListener('click', () => {
      state.mobileActiveTab = 'weather';
      updateMobileTabsUI();
    });
  }

  function updateMobileTabsUI() {
    const tabItinerary = document.getElementById('tab-btn-itinerary');
    const tabWeather = document.getElementById('tab-btn-weather');
    const colItinerary = document.getElementById('col-itinerary');
    const colWeather = document.getElementById('col-weather');

    if (!tabItinerary || !tabWeather || !colItinerary || !colWeather) return;

    if (state.mobileActiveTab === 'itinerary') {
      tabItinerary.className = 'flex-1 py-2 text-center text-xs font-semibold border-b-2 border-voyager-rose text-voyager-graphite bg-white';
      tabWeather.className = 'flex-1 py-2 text-center text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50';
      colItinerary.classList.remove('hidden');
      colWeather.classList.add('hidden');
      colWeather.classList.remove('block');
    } else {
      tabWeather.className = 'flex-1 py-2 text-center text-xs font-semibold border-b-2 border-voyager-rose text-voyager-graphite bg-white';
      tabItinerary.className = 'flex-1 py-2 text-center text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50';
      colWeather.classList.remove('hidden');
      colItinerary.classList.add('hidden');
      colItinerary.classList.remove('block');
    }
  }

  /**
   * Main rendering loop
   */
  function render() {
    const emptyStateContainer = document.getElementById('voyager-empty-state');
    const workspaceContainer = document.getElementById('voyager-workspace');
    const tripTitleDisplay = document.getElementById('trip-title-display');
    const tripDatesDisplay = document.getElementById('trip-dates-display');
    const tripResetBtn = document.getElementById('btn-reset-trip');

    if (!state.trip || !state.trip.destinations || state.trip.destinations.length === 0) {
      if (emptyStateContainer) emptyStateContainer.classList.remove('hidden');
      if (workspaceContainer) workspaceContainer.classList.add('hidden');
      if (tripTitleDisplay) tripTitleDisplay.textContent = 'New Travel Itinerary';
      if (tripDatesDisplay) tripDatesDisplay.textContent = 'Awaiting destinations';
      if (tripResetBtn) tripResetBtn.classList.add('hidden');
      renderTripIndex(null);
      renderWeatherPanel(null, null);
      VoyagerMap.updateMarkers([], null);
      return;
    }

    if (emptyStateContainer) emptyStateContainer.classList.add('hidden');
    if (workspaceContainer) workspaceContainer.classList.remove('hidden');
    if (tripResetBtn) tripResetBtn.classList.remove('hidden');

    // Update Header
    if (tripTitleDisplay) tripTitleDisplay.textContent = state.trip.title || 'My Journey';
    const dates = computeTripDateRange();
    if (tripDatesDisplay) {
      tripDatesDisplay.textContent = dates ? `${dates.start} to ${dates.end} (${dates.totalDays} Days)` : 'Custom Dates';
    }

    // Auto-select first stay & date if none selected
    if (!state.selectedDestinationStayId && state.trip.destinations.length > 0) {
      state.selectedDestinationStayId = state.trip.destinations[0].id;
      state.selectedDate = state.trip.destinations[0].arrivalDate;
    }

    // Render Panels
    const assessment = calculateTripIndex();
    renderTripIndex(assessment);
    renderItineraryPanel();
    
    // Find active destination and date for weather
    const currentStay = state.trip.destinations.find(d => d.id === state.selectedDestinationStayId) || state.trip.destinations[0];
    const currentDate = state.selectedDate || (currentStay ? currentStay.arrivalDate : null);
    renderWeatherPanel(currentStay ? currentStay.location : null, currentDate);

    // Update Map
    syncMapMarkers();
  }

  /**
   * Synchronize markers with current stops
   */
  function syncMapMarkers() {
    if (!state.trip || !state.trip.destinations) {
      VoyagerMap.updateMarkers([], null);
      return;
    }

    const stops = [];
    state.trip.destinations.forEach((stay, stayIdx) => {
      stops.push({
        id: stay.id,
        stayId: stay.id,
        name: stay.location.shortName,
        subtitle: `${stay.location.country} (Stay ${stayIdx + 1})`,
        lat: stay.location.lat,
        lon: stay.location.lon,
        date: stay.arrivalDate
      });

      // Also include activities with coordinates if distinct
      const stayActs = state.trip.activities.filter(a => a.destinationStayId === stay.id);
      stayActs.forEach((act) => {
        if (typeof act.lat === 'number' && typeof act.lon === 'number') {
          // If slightly offset or distinct POI
          stops.push({
            id: act.id,
            activityId: act.id,
            stayId: stay.id,
            name: act.title,
            subtitle: act.locationName || act.category,
            lat: act.lat,
            lon: act.lon,
            date: act.date
          });
        }
      });
    });

    const activeId = state.selectedActivityId || state.selectedDestinationStayId;
    VoyagerMap.updateMarkers(stops, activeId);
  }

  /**
   * Map marker click callback
   */
  function handleMarkerClick(stop) {
    if (stop.activityId) {
      selectActivity(stop.activityId);
    } else if (stop.stayId) {
      const stay = state.trip.destinations.find(d => d.id === stop.stayId);
      if (stay) {
        selectDay(stay.arrivalDate, stay.id);
      }
    }
  }

  /**
   * Calculate Trip Index assessment (deterministic simulation)
   */
  function calculateTripIndex() {
    if (!state.trip || !state.trip.destinations || state.trip.destinations.length === 0) {
      return null;
    }

    const totalDestinations = state.trip.destinations.length;
    const totalActivities = state.trip.activities.length;

    // Density factor: activities per day
    const dateRange = computeTripDateRange();
    const days = Math.max(1, dateRange ? dateRange.totalDays : 1);
    const avgPerDay = totalActivities / days;

    let densityRisk = 0.1;
    if (avgPerDay > 4) densityRisk = 0.65;
    else if (avgPerDay > 2.5) densityRisk = 0.35;
    else if (avgPerDay < 1) densityRisk = 0.15;

    // Transit factor: multi-city moves
    let transitRisk = totalDestinations > 3 ? 0.45 : (totalDestinations > 1 ? 0.25 : 0.1);

    // Weather exposure factor: outdoor activities with potential rain
    let weatherRisk = 0.2;
    state.trip.activities.forEach(act => {
      const stay = state.trip.destinations.find(d => d.id === act.destinationStayId);
      if (stay) {
        const weather = VoyagerFixtures.generateMockWeather(stay.location, act.date);
        if (weather && weather.precipProb > 50 && ['Sightseeing', 'Nature', 'Relaxation'].includes(act.category)) {
          weatherRisk = Math.min(0.8, weatherRisk + 0.15);
        }
      }
    });

    // Weighted risk
    const weightedRisk = (weatherRisk * 0.35) + (densityRisk * 0.35) + (transitRisk * 0.30);
    const score = Math.max(1.0, Math.min(10.0, 10 * (1 - weightedRisk)));
    const roundedScore = Math.round(score * 10) / 10;

    let status = 'Good';
    let statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let summary = 'Itinerary exhibits comfortable pacing and balanced activity density across destinations.';

    if (roundedScore < 6.0) {
      status = 'Needs Review';
      statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
      summary = 'High activity density or potential weather exposure on scheduled outdoor days. Consider spacing activities.';
    } else if (roundedScore < 8.0) {
      status = 'Fair';
      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
      summary = 'Moderate daily schedule. Ensure buffer time between multi-city transfers and late afternoon activities.';
    }

    return {
      score: roundedScore,
      status: status,
      statusClass: statusClass,
      summary: summary,
      factors: {
        density: Math.round(densityRisk * 100),
        weather: Math.round(weatherRisk * 100),
        transit: Math.round(transitRisk * 100)
      },
      coverage: totalActivities > 0 ? 'Full' : 'Limited Data',
      isDemo: true
    };
  }

  /**
   * Render Trip Index component
   */
  function renderTripIndex(assessment) {
    const card = document.getElementById('trip-index-card');
    if (!card) return;

    if (!assessment) {
      card.innerHTML = `
        <div class="p-4 bg-white border border-gray-200 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Trip Index</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">Pending</span>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-extrabold text-gray-300">—</span>
            <span class="text-xs text-gray-400">/ 10</span>
          </div>
          <p class="text-xs text-gray-500 mt-2">Add your first destination and activities to calculate plan stability and weather foresight.</p>
        </div>
      `;
      return;
    }

    card.innerHTML = `
      <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-xs transition-all hover:border-gray-300">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-voyager-graphite">Trip Index</span>
            <span class="text-[10px] text-gray-400" title="Demonstration assessment based on schedule density, travel buffers & mock forecast">(Demo)</span>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${assessment.statusClass}">
            ${assessment.status}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-baseline space-x-1">
            <span class="text-3xl font-black text-voyager-graphite">${assessment.score.toFixed(1)}</span>
            <span class="text-xs font-semibold text-gray-400">/ 10</span>
          </div>
          <button type="button" data-action="recalibrate-assessment" class="text-xs font-medium text-voyager-rose hover:text-voyager-graphite flex items-center space-x-1 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Recalibrate</span>
          </button>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div class="h-1.5 rounded-full ${assessment.score >= 8 ? 'bg-emerald-500' : (assessment.score >= 6 ? 'bg-amber-500' : 'bg-rose-500')}" style="width: ${assessment.score * 10}%"></div>
        </div>

        <p class="text-xs text-gray-600 mt-2.5 leading-relaxed">${assessment.summary}</p>

        <div class="mt-3 pt-2.5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="bg-gray-50 rounded p-1">
            <div class="text-gray-400 text-[10px]">Pacing</div>
            <div class="font-semibold text-gray-700">${100 - assessment.factors.density}%</div>
          </div>
          <div class="bg-gray-50 rounded p-1">
            <div class="text-gray-400 text-[10px]">Weather Fit</div>
            <div class="font-semibold text-gray-700">${100 - assessment.factors.weather}%</div>
          </div>
          <div class="bg-gray-50 rounded p-1">
            <div class="text-gray-400 text-[10px]">Buffer</div>
            <div class="font-semibold text-gray-700">${100 - assessment.factors.transit}%</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render day-by-day Itinerary panel
   */
  function renderItineraryPanel() {
    const container = document.getElementById('itinerary-days-container');
    if (!container) return;

    if (!state.trip || !state.trip.destinations || state.trip.destinations.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Build day sequence across stays
    const daysMap = [];
    state.trip.destinations.forEach((stay) => {
      const dates = getDatesBetween(stay.arrivalDate, stay.departureDate);
      dates.forEach((dateStr) => {
        // Prevent duplicate day entries if consecutive
        if (!daysMap.some(d => d.dateStr === dateStr && d.stay.id === stay.id)) {
          daysMap.push({
            dateStr: dateStr,
            stay: stay
          });
        }
      });
    });

    let html = '';
    daysMap.forEach((dayInfo, idx) => {
      const dayNum = idx + 1;
      const dateStr = dayInfo.dateStr;
      const stay = dayInfo.stay;
      const isSelectedDay = (state.selectedDate === dateStr && state.selectedDestinationStayId === stay.id);
      const isCollapsed = state.collapsedDays.has(dateStr);

      const dayActivities = state.trip.activities.filter(a => a.date === dateStr && a.destinationStayId === stay.id);

      html += `
        <div class="bg-white border ${isSelectedDay ? 'border-voyager-rose shadow-xs' : 'border-gray-200'} rounded-xl p-4 transition-all" data-day-card="${dateStr}">
          <!-- Day Header -->
          <div class="flex items-center justify-between cursor-pointer" data-action="select-day" data-day-date="${dateStr}" data-stay-id="${stay.id}">
            <div class="flex items-center space-x-2.5">
              <span class="flex items-center justify-center w-7 h-7 rounded-lg ${isSelectedDay ? 'bg-voyager-rose text-white font-bold' : 'bg-gray-100 text-gray-700 font-semibold'} text-xs">
                ${dayNum}
              </span>
              <div>
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-bold text-voyager-graphite">${formatDisplayDate(dateStr)}</h4>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-voyager-blue/30 text-voyager-graphite">
                    ${stay.location.shortName}
                  </span>
                </div>
                <div class="text-[11px] text-gray-400 mt-0.5">${dayActivities.length} ${dayActivities.length === 1 ? 'activity' : 'activities'} scheduled</div>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button type="button" data-action="toggle-day-collapse" data-day-date="${dateStr}" class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors" title="${isCollapsed ? 'Expand Day' : 'Collapse Day'}">
                <svg class="w-4 h-4 transform ${isCollapsed ? '-rotate-90' : 'rotate-0'} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Activities container -->
          <div class="${isCollapsed ? 'hidden' : 'block'} mt-3 space-y-2.5">
            ${dayActivities.length === 0 ? `
              <div class="py-3 px-3 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                <p class="text-xs text-gray-400">No activities scheduled yet.</p>
                <button type="button" data-action="open-add-activity" data-day-date="${dateStr}" data-stay-id="${stay.id}" class="mt-1.5 inline-flex items-center space-x-1 text-xs font-medium text-voyager-rose hover:text-voyager-graphite">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add First Activity</span>
                </button>
              </div>
            ` : dayActivities.map((act, actIdx) => renderActivityCardHtml(act, actIdx, dayActivities.length)).join('')}

            ${dayActivities.length > 0 ? `
              <div class="pt-1">
                <button type="button" data-action="open-add-activity" data-day-date="${dateStr}" data-stay-id="${stay.id}" class="w-full py-2 px-3 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-voyager-rose hover:text-voyager-rose hover:bg-rose-50/20 transition-all flex items-center justify-center space-x-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Activity</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render individual Activity Card HTML
   */
  function renderActivityCardHtml(act, index, totalInDay) {
    const isSelected = (state.selectedActivityId === act.id);
    const categoryColors = {
      Culture: 'bg-voyager-pink/40 text-voyager-graphite',
      Sightseeing: 'bg-voyager-blue/40 text-voyager-graphite',
      Dining: 'bg-amber-100 text-amber-800',
      Nature: 'bg-emerald-100 text-emerald-800',
      Relaxation: 'bg-purple-100 text-purple-800',
      Transit: 'bg-gray-100 text-gray-700'
    };
    const catClass = categoryColors[act.category] || 'bg-gray-100 text-gray-700';

    return `
      <div class="group border ${isSelected ? 'border-voyager-rose ring-1 ring-voyager-rose bg-rose-50/20' : 'border-gray-200 bg-white hover:border-gray-300'} rounded-lg p-3 transition-all cursor-pointer" data-action="select-activity" data-activity-id="${act.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1 pr-2">
            <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${catClass}">
                ${act.category}
              </span>
              ${act.time ? `<span class="text-[11px] font-semibold text-voyager-graphite">⏰ ${act.time}</span>` : ''}
              ${act.durationMinutes ? `<span class="text-[10px] text-gray-400">(${formatDuration(act.durationMinutes)})</span>` : ''}
            </div>

            <h5 class="text-xs font-bold text-gray-900 mt-1.5 leading-snug">${escapeHtml(act.title)}</h5>

            ${act.locationName ? `
              <div class="flex items-center text-[11px] text-gray-500 mt-1">
                <svg class="w-3 h-3 mr-1 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span class="truncate">${escapeHtml(act.locationName)}</span>
              </div>
            ` : ''}

            ${act.notes ? `<p class="text-[11px] text-gray-500 italic mt-1 line-clamp-2">${escapeHtml(act.notes)}</p>` : ''}
          </div>

          <!-- Activity Action Buttons -->
          <div class="flex items-center space-x-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <!-- Move Up -->
            <button type="button" data-action="move-activity-up" data-activity-id="${act.id}" ${index === 0 ? 'disabled class="p-1 text-gray-200 cursor-not-allowed"' : 'class="p-1 text-gray-400 hover:text-voyager-graphite transition-colors"'} title="Move up">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <!-- Move Down -->
            <button type="button" data-action="move-activity-down" data-activity-id="${act.id}" ${index === totalInDay - 1 ? 'disabled class="p-1 text-gray-200 cursor-not-allowed"' : 'class="p-1 text-gray-400 hover:text-voyager-graphite transition-colors"'} title="Move down">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <!-- Edit -->
            <button type="button" data-action="edit-activity" data-activity-id="${act.id}" class="p-1 text-gray-400 hover:text-voyager-rose transition-colors" title="Edit activity">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <!-- Delete -->
            <button type="button" data-action="delete-activity" data-activity-id="${act.id}" class="p-1 text-gray-400 hover:text-rose-600 transition-colors" title="Delete activity">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render contextual Weather Panel
   */
  function renderWeatherPanel(location, dateStr) {
    const container = document.getElementById('weather-panel-content');
    if (!container) return;

    if (!location || !dateStr) {
      container.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center p-6 text-center text-gray-400">
          <svg class="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <p class="text-xs font-semibold text-gray-600">Select an itinerary day</p>
          <p class="text-[11px] text-gray-400 mt-1">Weather foresight updates automatically based on the chosen destination and date.</p>
        </div>
      `;
      return;
    }

    const weather = VoyagerFixtures.generateMockWeather(location, dateStr);
    if (!weather) return;

    // Check if an activity is selected with a start time
    let selectedActTime = null;
    if (state.selectedActivityId) {
      const act = state.trip.activities.find(a => a.id === state.selectedActivityId);
      if (act && act.time) selectedActTime = act.time;
    }

    // Weather condition icon SVG map
    const weatherIcons = {
      sun: `<svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
      'cloud-sun': `<svg class="w-8 h-8 text-voyager-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>`,
      'cloud-rain': `<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-2 4m-4-4l-2 4m-4-4l-2 4M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>`,
      cloud: `<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>`,
      'cloud-lightning': `<svg class="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`
    };

    const mainIcon = weatherIcons[weather.icon] || weatherIcons.sun;

    let html = `
      <div class="space-y-4">
        <!-- Daily Overview Card -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h4 class="text-sm font-bold text-voyager-graphite">${escapeHtml(weather.destinationName)}</h4>
              <p class="text-xs text-gray-500">${formatDisplayDate(weather.date)}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
              Demo Forecast
            </span>
          </div>

          <div class="flex items-center justify-between py-2 border-y border-gray-100 my-2">
            <div class="flex items-center space-x-3">
              ${mainIcon}
              <div>
                <div class="text-xl font-black text-voyager-graphite">${weather.tempMax}°C</div>
                <div class="text-xs text-gray-500">${weather.condition}</div>
              </div>
            </div>

            <div class="text-right text-xs space-y-1">
              <div class="text-gray-500">Low: <span class="font-bold text-gray-700">${weather.tempMin}°C</span></div>
              <div class="text-blue-600">Precip: <span class="font-bold">${weather.precipProb}%</span></div>
              <div class="text-gray-400 text-[10px]">Wind: ${weather.windSpeedKmh} km/h</div>
            </div>
          </div>

          <div class="text-[11px] text-gray-400 italic">
            Hourly simulation highlights conditions nearest your planned activity times.
          </div>
        </div>

        <!-- Hourly Outlook Strip -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-xs font-bold uppercase tracking-wider text-voyager-graphite">Hourly Forecast</h5>
            ${selectedActTime ? `<span class="text-[10px] text-voyager-rose font-medium">Highlighting around ${selectedActTime}</span>` : ''}
          </div>

          <div class="space-y-1.5 custom-scroll max-h-80 overflow-y-auto pr-1">
            ${weather.hourly.map(hour => {
              const isNearestHour = isHourNearActivity(hour.time, selectedActTime);
              return `
                <div class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs transition-colors ${isNearestHour ? 'bg-voyager-rose/15 border border-voyager-rose/40 font-semibold' : 'hover:bg-gray-50'}">
                  <span class="w-12 text-gray-600 text-[11px]">${hour.time}</span>
                  <div class="flex items-center space-x-2 flex-1 justify-center">
                    <span class="text-gray-700 text-xs">${hour.condition}</span>
                    ${hour.precipProb > 30 ? `<span class="text-[10px] text-blue-600 font-semibold">${hour.precipProb}% 🌧️</span>` : ''}
                  </div>
                  <span class="w-10 text-right font-bold text-gray-900">${hour.tempC}°</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Helper to check if hourly forecast time is near activity time
   */
  function isHourNearActivity(hourStr, actTimeStr) {
    if (!actTimeStr) return false;
    const hourVal = parseInt(hourStr.split(':')[0], 10);
    const actHourVal = parseInt(actTimeStr.split(':')[0], 10);
    return Math.abs(hourVal - actHourVal) <= 1;
  }

  /**
   * Selection Handlers
   */
  function selectActivity(activityId) {
    state.selectedActivityId = activityId;
    const act = state.trip.activities.find(a => a.id === activityId);
    if (act) {
      state.selectedDate = act.date;
      state.selectedDestinationStayId = act.destinationStayId;
      if (typeof act.lat === 'number' && typeof act.lon === 'number') {
        VoyagerMap.focusLocation(act.lat, act.lon, 14);
      }
    }
    render();
  }

  function selectDay(dateStr, stayId) {
    state.selectedDate = dateStr;
    state.selectedDestinationStayId = stayId;
    state.selectedActivityId = null; // reset activity focus
    const stay = state.trip.destinations.find(d => d.id === stayId);
    if (stay && stay.location) {
      VoyagerMap.focusLocation(stay.location.lat, stay.location.lon, 11);
    }
    render();
  }

  function toggleDayCollapse(dateStr) {
    if (state.collapsedDays.has(dateStr)) {
      state.collapsedDays.delete(dateStr);
    } else {
      state.collapsedDays.add(dateStr);
    }
    render();
  }

  /**
   * Activity Management (Add, Edit, Delete, Move)
   */
  function openActivityModal({ dayDate, stayId, activityId }) {
    const dialog = document.getElementById('activity-modal-dialog');
    const form = document.getElementById('activity-modal-form');
    const titleEl = document.getElementById('activity-modal-title');
    if (!dialog || !form) return;

    form.reset();
    state.editingActivityId = activityId || null;

    // Populate day date and stay selector
    const dateInput = document.getElementById('act-date-input');
    const staySelect = document.getElementById('act-stay-select');

    // Populate stay options
    if (staySelect && state.trip) {
      staySelect.innerHTML = state.trip.destinations.map(stay => `
        <option value="${stay.id}">${stay.location.displayName} (${stay.arrivalDate})</option>
      `).join('');
    }

    if (activityId) {
      // Edit mode
      const act = state.trip.activities.find(a => a.id === activityId);
      if (!act) return;
      if (titleEl) titleEl.textContent = 'Edit Activity';
      document.getElementById('act-title-input').value = act.title;
      document.getElementById('act-category-select').value = act.category;
      document.getElementById('act-time-input').value = act.time || '';
      document.getElementById('act-duration-input').value = act.durationMinutes || 60;
      document.getElementById('act-location-input').value = act.locationName || '';
      document.getElementById('act-notes-input').value = act.notes || '';
      if (dateInput) dateInput.value = act.date;
      if (staySelect) staySelect.value = act.destinationStayId;
    } else {
      // Add mode
      if (titleEl) titleEl.textContent = 'Add New Activity';
      if (dateInput) dateInput.value = dayDate || (state.selectedDate || '');
      if (staySelect && stayId) staySelect.value = stayId;
    }

    dialog.showModal();
  }

  function handleActivityFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('act-title-input').value.trim();
    if (!title) return;

    const category = document.getElementById('act-category-select').value;
    const time = document.getElementById('act-time-input').value || null;
    const durationMinutes = parseInt(document.getElementById('act-duration-input').value, 10) || 60;
    const locationName = document.getElementById('act-location-input').value.trim();
    const notes = document.getElementById('act-notes-input').value.trim();
    const date = document.getElementById('act-date-input').value;
    const destinationStayId = document.getElementById('act-stay-select').value;

    const stay = state.trip.destinations.find(d => d.id === destinationStayId);
    const lat = stay ? stay.location.lat : null;
    const lon = stay ? stay.location.lon : null;

    if (state.editingActivityId) {
      // Update existing
      const act = state.trip.activities.find(a => a.id === state.editingActivityId);
      if (act) {
        act.title = title;
        act.category = category;
        act.time = time;
        act.durationMinutes = durationMinutes;
        act.locationName = locationName;
        act.notes = notes;
        act.date = date;
        act.destinationStayId = destinationStayId;
        showToast('Activity updated');
      }
    } else {
      // Create new
      const newAct = {
        id: 'act_' + Date.now(),
        destinationStayId: destinationStayId,
        date: date,
        title: title,
        category: category,
        time: time,
        durationMinutes: durationMinutes,
        locationName: locationName,
        lat: lat,
        lon: lon,
        notes: notes
      };
      state.trip.activities.push(newAct);
      state.selectedActivityId = newAct.id;
      showToast('Activity added to itinerary');
    }

    closeNearestDialog(document.getElementById('activity-modal-dialog'));
    render();
  }

  function moveActivity(activityId, direction) {
    const actIdx = state.trip.activities.findIndex(a => a.id === activityId);
    if (actIdx === -1) return;

    const act = state.trip.activities[actIdx];
    // Find all activities on the same day & destination
    const sameDayActs = state.trip.activities.filter(a => a.date === act.date && a.destinationStayId === act.destinationStayId);
    const posInDay = sameDayActs.findIndex(a => a.id === activityId);
    const targetPos = posInDay + direction;

    if (targetPos < 0 || targetPos >= sameDayActs.length) return;

    const targetAct = sameDayActs[targetPos];
    const targetIdx = state.trip.activities.findIndex(a => a.id === targetAct.id);

    // Swap in state array
    state.trip.activities[actIdx] = targetAct;
    state.trip.activities[targetIdx] = act;

    showToast('Activity sequence updated');
    render();
  }

  function confirmDelete(target) {
    state.pendingDeleteTarget = target;
    const dialog = document.getElementById('confirmation-modal-dialog');
    const msg = document.getElementById('confirmation-modal-message');
    if (!dialog) return;

    if (target.type === 'activity') {
      const act = state.trip.activities.find(a => a.id === target.id);
      if (msg) msg.textContent = `Are you sure you want to remove "${act ? act.title : 'this activity'}" from your plan?`;
    }

    dialog.showModal();
  }

  function executeConfirmedDelete() {
    if (!state.pendingDeleteTarget) return;

    if (state.pendingDeleteTarget.type === 'activity') {
      state.trip.activities = state.trip.activities.filter(a => a.id !== state.pendingDeleteTarget.id);
      if (state.selectedActivityId === state.pendingDeleteTarget.id) {
        state.selectedActivityId = null;
      }
      showToast('Activity deleted');
    }

    state.pendingDeleteTarget = null;
    closeNearestDialog(document.getElementById('confirmation-modal-dialog'));
    render();
  }

  /**
   * Destination Management (Add Destination)
   */
  let selectedFixtureLocation = null;

  function openDestinationModal({ isFirst }) {
    const dialog = document.getElementById('destination-modal-dialog');
    const form = document.getElementById('destination-modal-form');
    const titleEl = document.getElementById('dest-modal-title');
    if (!dialog || !form) return;

    form.reset();
    selectedFixtureLocation = null;
    updateSelectedFixtureUI(null);
    filterDestinationResults('');

    if (isFirst) {
      if (titleEl) titleEl.textContent = 'Start Your Trip — Add Destination';
    } else {
      if (titleEl) titleEl.textContent = 'Add Destination Stop';
    }

    dialog.showModal();
  }

  function filterDestinationResults(query) {
    const listContainer = document.getElementById('dest-results-list');
    if (!listContainer) return;

    const q = (query || '').toLowerCase().trim();
    const matches = VoyagerFixtures.DESTINATIONS.filter(d => 
      d.displayName.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      listContainer.innerHTML = `
        <div class="p-3 text-center text-xs text-gray-400">
          No matching demonstration destinations. (Fixtures include Paris, Rome, Barcelona, Kyoto, Zurich, etc.)
        </div>
      `;
      return;
    }

    listContainer.innerHTML = matches.map(dest => `
      <div class="p-2.5 rounded-lg border border-gray-100 hover:border-voyager-rose hover:bg-rose-50/20 cursor-pointer transition-colors flex items-center justify-between dest-item" data-dest-id="${dest.id}">
        <div>
          <div class="text-xs font-bold text-gray-900">${dest.displayName}</div>
          <div class="text-[10px] text-gray-400">${dest.country} • ${dest.type}</div>
        </div>
        <span class="text-[10px] text-voyager-rose font-medium">Select</span>
      </div>
    `).join('');

    // Attach click handlers
    listContainer.querySelectorAll('.dest-item').forEach(el => {
      el.addEventListener('click', () => {
        const destId = el.dataset.destId;
        selectedFixtureLocation = VoyagerFixtures.DESTINATIONS.find(d => d.id === destId);
        updateSelectedFixtureUI(selectedFixtureLocation);
      });
    });
  }

  function updateSelectedFixtureUI(dest) {
    const selectedDisplay = document.getElementById('selected-dest-display');
    const nameEl = document.getElementById('selected-dest-name');
    if (!selectedDisplay || !nameEl) return;

    if (!dest) {
      selectedDisplay.classList.add('hidden');
    } else {
      selectedDisplay.classList.remove('hidden');
      nameEl.textContent = `${dest.displayName} (${dest.country})`;
    }
  }

  function handleDestinationFormSubmit(e) {
    e.preventDefault();
    if (!selectedFixtureLocation) {
      showToast('Please select a destination from the list', 'error');
      return;
    }

    const arrDate = document.getElementById('dest-arrival-date').value;
    const depDate = document.getElementById('dest-departure-date').value;
    const arrTime = document.getElementById('dest-arrival-time').value || null;
    const depTime = document.getElementById('dest-departure-time').value || null;

    if (!arrDate || !depDate) {
      showToast('Please select arrival and departure dates', 'error');
      return;
    }

    if (new Date(depDate) < new Date(arrDate)) {
      showToast('Departure date cannot precede arrival date', 'error');
      return;
    }

    // Initialize trip if none
    if (!state.trip) {
      state.trip = {
        title: `Journey to ${selectedFixtureLocation.shortName}`,
        destinations: [],
        activities: []
      };
    }

    const stayId = 'stay_' + Date.now();
    const newStay = {
      id: stayId,
      location: selectedFixtureLocation,
      arrivalDate: arrDate,
      departureDate: depDate,
      arrivalTime: arrTime,
      departureTime: depTime
    };

    state.trip.destinations.push(newStay);
    state.selectedDestinationStayId = stayId;
    state.selectedDate = arrDate;

    closeNearestDialog(document.getElementById('destination-modal-dialog'));
    showToast(`Added ${selectedFixtureLocation.shortName} to your journey`);
    render();
  }

  /**
   * Sample Trip Loader
   */
  function loadSampleTrip() {
    // Deep clone sample trip
    state.trip = JSON.parse(JSON.stringify(VoyagerFixtures.SAMPLE_TRIP));
    state.selectedDestinationStayId = state.trip.destinations[0].id;
    state.selectedDate = state.trip.destinations[0].arrivalDate;
    state.selectedActivityId = null;
    showToast('Sample itinerary loaded');
    render();
  }

  function confirmResetTrip() {
    if (confirm('Start a fresh itinerary? Current changes in this demo session will be reset.')) {
      state.trip = null;
      state.selectedDestinationStayId = null;
      state.selectedDate = null;
      state.selectedActivityId = null;
      render();
      showToast('Itinerary reset to empty state');
    }
  }

  function simulateRecalibration() {
    showToast('Recalibrating schedule with weather & density checks...');
    setTimeout(() => {
      render();
      showToast('Plan assessment refreshed');
    }, 600);
  }

  /**
   * Utility Helpers
   */
  function closeNearestDialog(el) {
    const dialog = el.closest('dialog') || el;
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('voyager-toast');
    const msgEl = document.getElementById('voyager-toast-message');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2800);
  }

  function computeTripDateRange() {
    if (!state.trip || !state.trip.destinations || state.trip.destinations.length === 0) return null;
    let minDate = state.trip.destinations[0].arrivalDate;
    let maxDate = state.trip.destinations[0].departureDate;

    state.trip.destinations.forEach(d => {
      if (d.arrivalDate < minDate) minDate = d.arrivalDate;
      if (d.departureDate > maxDate) maxDate = d.departureDate;
    });

    const diffMs = new Date(maxDate) - new Date(minDate);
    const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    return {
      start: minDate,
      end: maxDate,
      totalDays: totalDays
    };
  }

  function getDatesBetween(startStr, endStr) {
    const dates = [];
    let curr = new Date(startStr);
    const end = new Date(endStr);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatDuration(minutes) {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  return {
    init: init
  };
})();

// Auto-boot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.VoyagerApp.init();
});
