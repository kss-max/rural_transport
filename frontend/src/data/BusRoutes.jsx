// Predefined Bus Routes for Rural Transport System
// These routes connect various villages and towns in the region

export const BUS_ROUTES = [
  {
    routeId: 'R101',
    routeName: 'Pakalakkunja → Vitla',
    fromPlace: 'Pakalakkunja',
    toPlace: 'Vitla',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S101', stopName: 'Pakalakkunja Bus Stop', latitude: 12.8234, longitude: 75.1234 },
      { stopId: 'S102', stopName: 'Muruva Junction', latitude: 12.8345, longitude: 75.1345 },
      { stopId: 'S103', stopName: 'Manila Center', latitude: 12.8456, longitude: 75.1456 },
      { stopId: 'S104', stopName: 'Peruvai Market', latitude: 12.8567, longitude: 75.1567 },
      { stopId: 'S105', stopName: 'Vitla Bus Stand', latitude: 12.8678, longitude: 75.1678 }
    ]
  },
  {
    routeId: 'R102',
    routeName: 'Vitla → Pakalakkunja',
    fromPlace: 'Vitla',
    toPlace: 'Pakalakkunja',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S105', stopName: 'Vitla Bus Stand', latitude: 12.8678, longitude: 75.1678 },
      { stopId: 'S104', stopName: 'Peruvai Market', latitude: 12.8567, longitude: 75.1567 },
      { stopId: 'S103', stopName: 'Manila Center', latitude: 12.8456, longitude: 75.1456 },
      { stopId: 'S102', stopName: 'Muruva Junction', latitude: 12.8345, longitude: 75.1345 },
      { stopId: 'S101', stopName: 'Pakalakkunja Bus Stop', latitude: 12.8234, longitude: 75.1234 }
    ]
  },
  {
    routeId: 'R103',
    routeName: 'Kuddupadavu → Adyanadka',
    fromPlace: 'Kuddupadavu',
    toPlace: 'Adyanadka',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S201', stopName: 'Kuddupadavu Village', latitude: 12.7234, longitude: 75.2234 },
      { stopId: 'S202', stopName: 'Kepu Cross', latitude: 12.7345, longitude: 75.2345 },
      { stopId: 'S203', stopName: 'Manila Junction', latitude: 12.7456, longitude: 75.2456 },
      { stopId: 'S204', stopName: 'Adyanadka Bus Stand', latitude: 12.7567, longitude: 75.2567 }
    ]
  },
  {
    routeId: 'R104',
    routeName: 'Adyanadka → Kuddupadavu',
    fromPlace: 'Adyanadka',
    toPlace: 'Kuddupadavu',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S204', stopName: 'Adyanadka Bus Stand', latitude: 12.7567, longitude: 75.2567 },
      { stopId: 'S203', stopName: 'Manila Junction', latitude: 12.7456, longitude: 75.2456 },
      { stopId: 'S202', stopName: 'Kepu Cross', latitude: 12.7345, longitude: 75.2345 },
      { stopId: 'S201', stopName: 'Kuddupadavu Village', latitude: 12.7234, longitude: 75.2234 }
    ]
  },
  {
    routeId: 'R105',
    routeName: 'Muruva → Kepu',
    fromPlace: 'Muruva',
    toPlace: 'Kepu',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S301', stopName: 'Muruva Village', latitude: 12.8345, longitude: 75.3234 },
      { stopId: 'S302', stopName: 'Manila Town', latitude: 12.8456, longitude: 75.3345 },
      { stopId: 'S303', stopName: 'Peruvai Junction', latitude: 12.8567, longitude: 75.3456 },
      { stopId: 'S304', stopName: 'Kepu Bus Stop', latitude: 12.8678, longitude: 75.3567 }
    ]
  },
  {
    routeId: 'R106',
    routeName: 'Kepu → Muruva',
    fromPlace: 'Kepu',
    toPlace: 'Muruva',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S304', stopName: 'Kepu Bus Stop', latitude: 12.8678, longitude: 75.3567 },
      { stopId: 'S303', stopName: 'Peruvai Junction', latitude: 12.8567, longitude: 75.3456 },
      { stopId: 'S302', stopName: 'Manila Town', latitude: 12.8456, longitude: 75.3345 },
      { stopId: 'S301', stopName: 'Muruva Village', latitude: 12.8345, longitude: 75.3234 }
    ]
  },
  {
    routeId: 'R107',
    routeName: 'Manila → Vitla',
    fromPlace: 'Manila',
    toPlace: 'Vitla',
    routeType: 'MARKET_SHUTTLE',
    isActive: true,
    stops: [
      { stopId: 'S401', stopName: 'Manila Market', latitude: 12.9234, longitude: 75.4234 },
      { stopId: 'S402', stopName: 'Peruvai Center', latitude: 12.9345, longitude: 75.4345 },
      { stopId: 'S403', stopName: 'Kuddupadavu Road', latitude: 12.9456, longitude: 75.4456 },
      { stopId: 'S404', stopName: 'Vitla Town', latitude: 12.9567, longitude: 75.4567 }
    ]
  },
  {
    routeId: 'R108',
    routeName: 'Vitla → Manila',
    fromPlace: 'Vitla',
    toPlace: 'Manila',
    routeType: 'MARKET_SHUTTLE',
    isActive: true,
    stops: [
      { stopId: 'S404', stopName: 'Vitla Town', latitude: 12.9567, longitude: 75.4567 },
      { stopId: 'S403', stopName: 'Kuddupadavu Road', latitude: 12.9456, longitude: 75.4456 },
      { stopId: 'S402', stopName: 'Peruvai Center', latitude: 12.9345, longitude: 75.4345 },
      { stopId: 'S401', stopName: 'Manila Market', latitude: 12.9234, longitude: 75.4234 }
    ]
  },
  {
    routeId: 'R109',
    routeName: 'Peruvai → Adyanadka',
    fromPlace: 'Peruvai',
    toPlace: 'Adyanadka',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S501', stopName: 'Peruvai Village', latitude: 12.7834, longitude: 75.5234 },
      { stopId: 'S502', stopName: 'Kuddupadavu Junction', latitude: 12.7945, longitude: 75.5345 },
      { stopId: 'S503', stopName: 'Kepu Market', latitude: 12.8056, longitude: 75.5456 },
      { stopId: 'S504', stopName: 'Adyanadka Central', latitude: 12.8167, longitude: 75.5567 }
    ]
  },
  {
    routeId: 'R110',
    routeName: 'Adyanadka → Peruvai',
    fromPlace: 'Adyanadka',
    toPlace: 'Peruvai',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S504', stopName: 'Adyanadka Central', latitude: 12.8167, longitude: 75.5567 },
      { stopId: 'S503', stopName: 'Kepu Market', latitude: 12.8056, longitude: 75.5456 },
      { stopId: 'S502', stopName: 'Kuddupadavu Junction', latitude: 12.7945, longitude: 75.5345 },
      { stopId: 'S501', stopName: 'Peruvai Village', latitude: 12.7834, longitude: 75.5234 }
    ]
  },
  {
    routeId: 'R111',
    routeName: 'Pakalakkunja → Manila',
    fromPlace: 'Pakalakkunja',
    toPlace: 'Manila',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S601', stopName: 'Pakalakkunja Center', latitude: 12.6234, longitude: 75.6234 },
      { stopId: 'S602', stopName: 'Muruva Village', latitude: 12.6345, longitude: 75.6345 },
      { stopId: 'S603', stopName: 'Kepu Junction', latitude: 12.6456, longitude: 75.6456 },
      { stopId: 'S604', stopName: 'Manila Bus Stand', latitude: 12.6567, longitude: 75.6567 }
    ]
  },
  {
    routeId: 'R112',
    routeName: 'Manila → Pakalakkunja',
    fromPlace: 'Manila',
    toPlace: 'Pakalakkunja',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S604', stopName: 'Manila Bus Stand', latitude: 12.6567, longitude: 75.6567 },
      { stopId: 'S603', stopName: 'Kepu Junction', latitude: 12.6456, longitude: 75.6456 },
      { stopId: 'S602', stopName: 'Muruva Village', latitude: 12.6345, longitude: 75.6345 },
      { stopId: 'S601', stopName: 'Pakalakkunja Center', latitude: 12.6234, longitude: 75.6234 }
    ]
  },
  {
    routeId: 'R113',
    routeName: 'Kuddupadavu → Vitla',
    fromPlace: 'Kuddupadavu',
    toPlace: 'Vitla',
    routeType: 'PRIVATE_BUS',
    isActive: true,
    stops: [
      { stopId: 'S701', stopName: 'Kuddupadavu School', latitude: 12.5234, longitude: 75.7234 },
      { stopId: 'S702', stopName: 'Peruvai Cross', latitude: 12.5345, longitude: 75.7345 },
      { stopId: 'S703', stopName: 'Manila Highway', latitude: 12.5456, longitude: 75.7456 },
      { stopId: 'S704', stopName: 'Adyanadka Junction', latitude: 12.5567, longitude: 75.7567 },
      { stopId: 'S705', stopName: 'Vitla Bus Terminal', latitude: 12.5678, longitude: 75.7678 }
    ]
  },
  {
    routeId: 'R114',
    routeName: 'Vitla → Kuddupadavu',
    fromPlace: 'Vitla',
    toPlace: 'Kuddupadavu',
    routeType: 'PRIVATE_BUS',
    isActive: true,
    stops: [
      { stopId: 'S705', stopName: 'Vitla Bus Terminal', latitude: 12.5678, longitude: 75.7678 },
      { stopId: 'S704', stopName: 'Adyanadka Junction', latitude: 12.5567, longitude: 75.7567 },
      { stopId: 'S703', stopName: 'Manila Highway', latitude: 12.5456, longitude: 75.7456 },
      { stopId: 'S702', stopName: 'Peruvai Cross', latitude: 12.5345, longitude: 75.7345 },
      { stopId: 'S701', stopName: 'Kuddupadavu School', latitude: 12.5234, longitude: 75.7234 }
    ]
  },
  {
    routeId: 'R115',
    routeName: 'Kepu → Pakalakkunja',
    fromPlace: 'Kepu',
    toPlace: 'Pakalakkunja',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S801', stopName: 'Kepu Village Center', latitude: 12.4234, longitude: 75.8234 },
      { stopId: 'S802', stopName: 'Muruva Junction', latitude: 12.4345, longitude: 75.8345 },
      { stopId: 'S803', stopName: 'Manila Square', latitude: 12.4456, longitude: 75.8456 },
      { stopId: 'S804', stopName: 'Peruvai Highway', latitude: 12.4567, longitude: 75.8567 },
      { stopId: 'S805', stopName: 'Pakalakkunja Terminal', latitude: 12.4678, longitude: 75.8678 }
    ]
  },
  {
    routeId: 'R116',
    routeName: 'Pakalakkunja → Kepu',
    fromPlace: 'Pakalakkunja',
    toPlace: 'Kepu',
    routeType: 'BUS',
    isActive: true,
    stops: [
      { stopId: 'S805', stopName: 'Pakalakkunja Terminal', latitude: 12.4678, longitude: 75.8678 },
      { stopId: 'S804', stopName: 'Peruvai Highway', latitude: 12.4567, longitude: 75.8567 },
      { stopId: 'S803', stopName: 'Manila Square', latitude: 12.4456, longitude: 75.8456 },
      { stopId: 'S802', stopName: 'Muruva Junction', latitude: 12.4345, longitude: 75.8345 },
      { stopId: 'S801', stopName: 'Kepu Village Center', latitude: 12.4234, longitude: 75.8234 }
    ]
  },
  {
    routeId: 'R117',
    routeName: 'Muruva → Adyanadka',
    fromPlace: 'Muruva',
    toPlace: 'Adyanadka',
    routeType: 'MARKET_SHUTTLE',
    isActive: true,
    stops: [
      { stopId: 'S901', stopName: 'Muruva Market', latitude: 12.3234, longitude: 75.9234 },
      { stopId: 'S902', stopName: 'Kuddupadavu Circle', latitude: 12.3345, longitude: 75.9345 },
      { stopId: 'S903', stopName: 'Kepu Town', latitude: 12.3456, longitude: 75.9456 },
      { stopId: 'S904', stopName: 'Manila Bypass', latitude: 12.3567, longitude: 75.9567 },
      { stopId: 'S905', stopName: 'Adyanadka Bus Stand', latitude: 12.3678, longitude: 75.9678 }
    ]
  },
  {
    routeId: 'R118',
    routeName: 'Adyanadka → Muruva',
    fromPlace: 'Adyanadka',
    toPlace: 'Muruva',
    routeType: 'MARKET_SHUTTLE',
    isActive: true,
    stops: [
      { stopId: 'S905', stopName: 'Adyanadka Bus Stand', latitude: 12.3678, longitude: 75.9678 },
      { stopId: 'S904', stopName: 'Manila Bypass', latitude: 12.3567, longitude: 75.9567 },
      { stopId: 'S903', stopName: 'Kepu Town', latitude: 12.3456, longitude: 75.9456 },
      { stopId: 'S902', stopName: 'Kuddupadavu Circle', latitude: 12.3345, longitude: 75.9345 },
      { stopId: 'S901', stopName: 'Muruva Market', latitude: 12.3234, longitude: 75.9234 }
    ]
  }
];

// Helper function to get route by ID
export const getRouteById = (routeId) => {
  return BUS_ROUTES.find(route => route.routeId === routeId);
};

// Helper function to get active routes
export const getActiveRoutes = () => {
  return BUS_ROUTES.filter(route => route.isActive);
};

// Helper function to get routes by type
export const getRoutesByType = (routeType) => {
  return BUS_ROUTES.filter(route => route.routeType === routeType && route.isActive);
};

// Helper function to get routes from a specific place
export const getRoutesFromPlace = (fromPlace) => {
  return BUS_ROUTES.filter(route => route.fromPlace === fromPlace && route.isActive);
};

// Helper function to get all unique places
export const getAllPlaces = () => {
  const places = new Set();
  BUS_ROUTES.forEach(route => {
    places.add(route.fromPlace);
    places.add(route.toPlace);
  });
  return Array.from(places).sort();
};

export default BUS_ROUTES;
