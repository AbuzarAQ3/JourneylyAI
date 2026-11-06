/**
 * JourneylyAI — Voyager Studio Map Controller
 * Isolated Leaflet controller for destination and activity markers & route visualization.
 */

window.VoyagerMap = (function() {
  'use strict';

  let mapInstance = null;
  let markerGroup = null;
  let routeLine = null;
  let onMarkerClickCallback = null;
  let isMapInitialized = false;

  /**
   * Initialize Leaflet map instance on container element
   */
  function init(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) return;

    options = options || {};
    onMarkerClickCallback = options.onMarkerClick || null;

    // Check if Leaflet library is loaded
    if (typeof L === 'undefined') {
      showFallback(container, 'Leaflet mapping library is currently unavailable.');
      return;
    }

    try {
      // Default view over Europe/World center
      mapInstance = L.map(containerId, {
        zoomControl: true,
        attributionControl: true
      }).setView([46.5, 6.0], 5);

      // Standard OpenStreetMap street tiles with required ODbL attribution
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      });

      tileLayer.on('tileerror', function() {
        console.warn('VoyagerMap: Map tile loading error, falling back gracefully.');
      });

      tileLayer.addTo(mapInstance);
      markerGroup = L.layerGroup().addTo(mapInstance);
      isMapInitialized = true;

      // Invalidate size after layout rendering
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 250);

    } catch (err) {
      console.error('VoyagerMap: Failed to initialize Leaflet:', err);
      showFallback(container, 'Unable to initialize interactive map. The rest of Voyager remains fully operational.');
    }
  }

  /**
   * Render fallback when map cannot initialize
   */
  function showFallback(container, message) {
    container.innerHTML = `
      <div class="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 border border-gray-200 rounded-xl">
        <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p class="text-sm font-semibold text-gray-700 mb-1">Map View Unavailable</p>
        <p class="text-xs text-gray-500 max-w-xs">${message}</p>
        <p class="text-xs text-gray-400 mt-3">Coordinates and stops remain organized in your itinerary.</p>
      </div>
    `;
  }

  /**
   * Update map with destination stays and activities
   */
  function updateMarkers(stops, selectedId) {
    if (!isMapInitialized || !mapInstance || !markerGroup) return;

    markerGroup.clearLayers();
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
      routeLine = null;
    }

    if (!stops || stops.length === 0) {
      mapInstance.setView([46.5, 6.0], 5);
      return;
    }

    const latLngs = [];
    stops.forEach((stop, index) => {
      if (typeof stop.lat !== 'number' || typeof stop.lon !== 'number') return;

      const isSelected = (stop.id === selectedId || (stop.activityId && stop.activityId === selectedId));
      const latLng = [stop.lat, stop.lon];
      latLngs.push(latLng);

      // Custom numbered pin using HTML divIcon
      const pinHtml = `
        <div class="voyager-pin ${isSelected ? 'is-selected' : ''}" data-stop-id="${stop.id}">
          <span>${index + 1}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'voyager-custom-marker',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Popup with context
      const popupContent = `
        <div class="p-1 text-xs">
          <div class="font-bold text-gray-900">${stop.name}</div>
          <div class="text-gray-500 text-[11px]">${stop.subtitle || 'Stop ' + (index + 1)}</div>
          ${stop.date ? `<div class="text-gray-400 text-[10px] mt-1">${stop.date}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'voyager-popup' });

      marker.on('click', () => {
        if (onMarkerClickCallback) {
          onMarkerClickCallback(stop);
        }
      });

      markerGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Illustrative connector line (clearly documented as an illustrative connector, not road route)
    if (latLngs.length > 1) {
      routeLine = L.polyline(latLngs, {
        color: '#C08497', // Voyager old rose
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(mapInstance);
    }

    // Adjust view bounds to show all markers
    if (latLngs.length > 0) {
      mapInstance.fitBounds(L.latLngBounds(latLngs), {
        padding: [40, 40],
        maxZoom: 13,
        animate: true
      });
    }
  }

  /**
   * Pan and focus to a single coordinate
   */
  function focusLocation(lat, lon, zoom) {
    if (!isMapInitialized || !mapInstance) return;
    mapInstance.setView([lat, lon], zoom || 12, { animate: true });
  }

  /**
   * Invalidate map size on window/panel resize
   */
  function resize() {
    if (isMapInitialized && mapInstance) {
      mapInstance.invalidateSize();
    }
  }

  return {
    init: init,
    updateMarkers: updateMarkers,
    focusLocation: focusLocation,
    resize: resize
  };
})();
