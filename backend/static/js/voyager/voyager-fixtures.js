/**
 * JourneylyAI — Voyager Studio Demonstration Fixtures
 * 
 * NOTE: These are centralized demonstration fixtures for prototyping.
 * They represent structured location and weather contracts that will be
 * replaced by Django backend services and API providers in later phases.
 */

window.VoyagerFixtures = (function() {
  'use strict';

  // Searchable demonstration destinations with verified coordinates
  const DESTINATIONS = [
    {
      id: 'dest_paris',
      displayName: 'Paris, Île-de-France',
      shortName: 'Paris',
      country: 'France',
      lat: 48.8566,
      lon: 2.3522,
      type: 'City',
      timezone: 'Europe/Paris',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_rome',
      displayName: 'Rome, Lazio',
      shortName: 'Rome',
      country: 'Italy',
      lat: 41.9028,
      lon: 12.4964,
      type: 'City',
      timezone: 'Europe/Rome',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_barcelona',
      displayName: 'Barcelona, Catalonia',
      shortName: 'Barcelona',
      country: 'Spain',
      lat: 41.3879,
      lon: 2.1699,
      type: 'City',
      timezone: 'Europe/Madrid',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_kyoto',
      displayName: 'Kyoto, Kansai',
      shortName: 'Kyoto',
      country: 'Japan',
      lat: 35.0116,
      lon: 135.7681,
      type: 'City',
      timezone: 'Asia/Tokyo',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_zurich',
      displayName: 'Zurich, Canton of Zurich',
      shortName: 'Zurich',
      country: 'Switzerland',
      lat: 47.3769,
      lon: 8.5417,
      type: 'City',
      timezone: 'Europe/Zurich',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_london',
      displayName: 'London, Greater London',
      shortName: 'London',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
      type: 'City',
      timezone: 'Europe/London',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_amsterdam',
      displayName: 'Amsterdam, North Holland',
      shortName: 'Amsterdam',
      country: 'Netherlands',
      lat: 52.3676,
      lon: 4.9041,
      type: 'City',
      timezone: 'Europe/Amsterdam',
      provider: 'demo-fixture'
    },
    {
      id: 'dest_newyork',
      displayName: 'New York, New York',
      shortName: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
      type: 'City',
      timezone: 'America/New_York',
      provider: 'demo-fixture'
    }
  ];

  // Normalized demonstration weather generator
  function generateMockWeather(destination, dateStr) {
    if (!destination) return null;

    // Deterministic pseudo-random values based on destination id and date
    const seed = (destination.shortName.charCodeAt(0) + (dateStr ? dateStr.charCodeAt(dateStr.length - 1) : 0)) % 10;
    
    const conditions = [
      { text: 'Sunny', icon: 'sun', min: 14, max: 23, precip: 5, risk: 'low' },
      { text: 'Partly Cloudy', icon: 'cloud-sun', min: 12, max: 20, precip: 15, risk: 'low' },
      { text: 'Passing Showers', icon: 'cloud-rain', min: 10, max: 17, precip: 65, risk: 'moderate' },
      { text: 'Clear & Crisp', icon: 'sun', min: 9, max: 18, precip: 0, risk: 'low' },
      { text: 'Overcast', icon: 'cloud', min: 11, max: 16, precip: 25, risk: 'low' },
      { text: 'Thunderstorm Expected', icon: 'cloud-lightning', min: 15, max: 22, precip: 80, risk: 'high' }
    ];

    const cond = conditions[seed % conditions.length];
    
    // 24-hour forecast sequence
    const hourly = [];
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    hours.forEach((h, idx) => {
      const tempVariation = Math.sin((idx / hours.length) * Math.PI) * (cond.max - cond.min);
      const temp = Math.round(cond.min + tempVariation);
      const hourPrecip = cond.risk === 'high' ? Math.min(95, cond.precip + (idx % 3) * 5) : Math.max(0, cond.precip - (idx % 2) * 5);
      hourly.push({
        time: h,
        tempC: temp,
        condition: cond.text,
        icon: cond.icon,
        precipProb: hourPrecip
      });
    });

    return {
      destinationName: destination.displayName,
      date: dateStr || '2026-11-01',
      condition: cond.text,
      icon: cond.icon,
      tempMin: cond.min,
      tempMax: cond.max,
      precipProb: cond.precip,
      windSpeedKmh: 14 + (seed * 2),
      confidence: 'Demonstration forecast',
      hourly: hourly,
      isDemonstration: true
    };
  }

  // Pre-configured demonstration trip
  const SAMPLE_TRIP = {
    title: 'Autumn Explorer: Paris & Rome',
    status: 'draft',
    destinations: [
      {
        id: 'dest_paris_stay',
        location: DESTINATIONS[0],
        arrivalDate: '2026-11-01',
        departureDate: '2026-11-03',
        arrivalTime: '10:00',
        departureTime: '14:00'
      },
      {
        id: 'dest_rome_stay',
        location: DESTINATIONS[1],
        arrivalDate: '2026-11-03',
        departureDate: '2026-11-05',
        arrivalTime: '17:30',
        departureTime: '12:00'
      }
    ],
    activities: [
      {
        id: 'act_1',
        destinationStayId: 'dest_paris_stay',
        dayNumber: 1,
        date: '2026-11-01',
        title: 'Louvre Museum Guided Tour',
        category: 'Culture',
        time: '14:00',
        durationMinutes: 150,
        locationName: 'Musée du Louvre, Rue de Rivoli',
        lat: 48.8606,
        lon: 2.3376,
        notes: 'Pre-booked timed tickets. Wing Sully entry.'
      },
      {
        id: 'act_2',
        destinationStayId: 'dest_paris_stay',
        dayNumber: 1,
        date: '2026-11-01',
        title: 'Seine River Sunset Stroll',
        category: 'Relaxation',
        time: '18:00',
        durationMinutes: 60,
        locationName: 'Pont des Arts',
        lat: 48.8583,
        lon: 2.3375,
        notes: 'Casual walk before evening dinner.'
      },
      {
        id: 'act_3',
        destinationStayId: 'dest_paris_stay',
        dayNumber: 2,
        date: '2026-11-02',
        title: 'Montmartre & Sacré-Cœur Exploration',
        category: 'Sightseeing',
        time: '09:30',
        durationMinutes: 180,
        locationName: 'Basilique du Sacré-Cœur',
        lat: 48.8867,
        lon: 2.3431,
        notes: 'Cobblestone walk, visit local artist square.'
      },
      {
        id: 'act_4',
        destinationStayId: 'dest_rome_stay',
        dayNumber: 3,
        date: '2026-11-03',
        title: 'Trastevere Evening Dinner & Gelato',
        category: 'Dining',
        time: '20:00',
        durationMinutes: 120,
        locationName: 'Piazza di Santa Maria in Trastevere',
        lat: 41.8897,
        lon: 12.4700,
        notes: 'Classic Roman pasta and stroll.'
      },
      {
        id: 'act_5',
        destinationStayId: 'dest_rome_stay',
        dayNumber: 4,
        date: '2026-11-04',
        title: 'Colosseum & Roman Forum Walk',
        category: 'Culture',
        time: '09:00',
        durationMinutes: 180,
        locationName: 'Piazza del Colosseo',
        lat: 41.8902,
        lon: 12.4922,
        notes: 'Morning entry before midday heat.'
      }
    ]
  };

  return {
    DESTINATIONS: DESTINATIONS,
    SAMPLE_TRIP: SAMPLE_TRIP,
    generateMockWeather: generateMockWeather
  };
})();
