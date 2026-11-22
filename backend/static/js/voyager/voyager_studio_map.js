
(() => {
    "use strict";

    function createPopup(location) {
        const popup = document.createElement("div");
        popup.className = "voyager-map-popup";

        const title = document.createElement("div");
        title.className = "voyager-map-popup__title";
        title.textContent = `${location.position}. ${location.name}`;

        const arrival = document.createElement("div");
        arrival.className = "voyager-map-popup__detail";
        arrival.textContent = `Arrival: ${location.arrival}`;

        const departure = document.createElement("div");
        departure.className = "voyager-map-popup__detail";
        departure.textContent = `Departure: ${location.departure}`;

        popup.append(title, arrival, departure);

        return popup;
    }


    function createMarkerIcon(positions, markerType) {

        const label = positions.join(", ");
        const isGroup = positions.length > 1;

        const width = isGroup
            ? Math.max(48, label.length * 8 + 20)
            : 38;

        return L.divIcon({
            className: "voyager-numbered-marker",

            html: `
                <span class="voyager-marker voyager-marker--${isGroup ? "group" : markerType}">
                    ${label}
                </span>
            `,

            iconSize: [width, 38],
            iconAnchor: [width / 2, 19],
            popupAnchor: [0, -20],
        });
    }


    function initializeMap(mapElement, locations) {

        if (mapElement._voyagerMap || !window.L) return;

        const mapKey = mapElement.dataset.mapKey;

        const map = L.map(mapElement, {
            scrollWheelZoom: false,
        }).setView([20, 0], 2);

        mapElement._voyagerMap = map;

        if (mapKey) {
            L.tileLayer(
                `https://api.maptiler.com/maps/openstreetmap/256/{z}/{x}/{y}.jpg?key=${mapKey}`,
                {
                    attribution:
                        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> ' +
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
                    maxZoom: 19,
                }
            ).addTo(map);
        } else {
            console.error("MapTiler key is missing.");
        }


        if (!locations.length) return;

        const latLngs = locations.map(location => [
            location.lat,
            location.lng,
        ]);


        // Illustrative dotted route.
        if (latLngs.length > 1) {
            L.polyline(latLngs, {
                color: "#8458B3",
                weight: 3,
                opacity: 0.85,
                dashArray: "5 9",
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map);
        }


// Group locations sharing approximately the same coordinates.
const markerGroups = new Map();

locations.forEach(location => {

    // Five decimal places gives approximately metre-level grouping.
    const coordinateKey =
        `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;

    if (!markerGroups.has(coordinateKey)) {
        markerGroups.set(coordinateKey, {
            lat: location.lat,
            lng: location.lng,
            locations: [],
        });
    }

    markerGroups.get(coordinateKey).locations.push(location);
});


        // Render one marker per geographical group.
        markerGroups.forEach(group => {

            const visits = group.locations;
            const positions = visits.map(location => location.position);

            let markerType = "stop";

            if (visits.length > 1) {
                markerType = "group";
            } else if (positions[0] === locations[0].position) {
                markerType = "start";
            } else if (
                positions[0] === locations[locations.length - 1].position
            ) {
                markerType = "end";
            }

            const marker = L.marker(
                [group.lat, group.lng],
                {
                    icon: createMarkerIcon(positions, markerType),
                }
            ).addTo(map);

            marker.bindPopup(createPopup(visits), {
                maxWidth: 280,
                minWidth: 200,
            });

            const tooltipLabel = positions.length > 1
                ? `Stops ${positions.join(", ")} · ${visits[0].name}`
                : visits[0].name;

            marker.bindTooltip(tooltipLabel, {
                direction: "top",
                offset: [0, -18],
            });
        });


        // Frame the journey.
        if (latLngs.length === 1) {
            map.setView(latLngs[0], 11);
        } else {
            map.fitBounds(L.latLngBounds(latLngs), {
                padding: [40, 40],
                maxZoom: 11,
            });
        }

        requestAnimationFrame(() => {
            map.invalidateSize();
        });
    }


    function initializeVoyagerMaps(root = document) {

        const dataElement = document.getElementById(
            "journey-locations-data"
        );

        if (!dataElement || !window.L) {
            console.error("Journey data or Leaflet is missing.");
            return;
        }

        let locations;

        try {
            locations = JSON.parse(dataElement.textContent);
        } catch (error) {
            console.error("Invalid journey data:", error);
            return;
        }

        locations = locations
            .map(location => ({
                ...location,
                lat: Number(location.lat),
                lng: Number(location.lng),
            }))
            .filter(location =>
                Number.isFinite(location.lat) &&
                Number.isFinite(location.lng) &&
                location.lat >= -90 &&
                location.lat <= 90 &&
                location.lng >= -180 &&
                location.lng <= 180
            )
            .sort((a, b) => a.position - b.position);


        const maps = root.matches?.(".voyager-map")
            ? [root]
            : [...(root.querySelectorAll?.(".voyager-map") || [])];


        maps.forEach(mapElement => {

            if (mapElement._voyagerResizeObserver) return;

            if (window.ResizeObserver) {

                const observer = new ResizeObserver(entries => {

                    const { width, height } = entries[0].contentRect;

                    // Don't initialize a display:none map.
                    if (width <= 0 || height <= 0) return;

                    if (!mapElement._voyagerMap) {
                        initializeMap(mapElement, locations);
                    } else {
                        mapElement._voyagerMap.invalidateSize();
                    }
                });

                observer.observe(mapElement);

                mapElement._voyagerResizeObserver = observer;

            } else if (
                mapElement.getBoundingClientRect().width > 0
            ) {
                initializeMap(mapElement, locations);
            }
        });
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => initializeVoyagerMaps(),
            { once: true }
        );
    } else {
        initializeVoyagerMaps();
    }


    // Support maps inserted or replaced through HTMX.
    document.body.addEventListener("htmx:afterSwap", event => {
        initializeVoyagerMaps(event.target);
    });

})();
