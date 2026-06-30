import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapView({ locations }) {
  if (!locations.length) return <p>No location data found</p>;

  return ( <div className="h-[500px] w-full mt-6 rounded-xl overflow-hidden">
    <MapContainer
    
    center={[locations[0].latitude, locations[0].longitude]}
    zoom={10}
    scrollWheelZoom={false}
     className="h-full w-full"
  >    a
    <TileLayer
      attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    
    {locations.map((loc, index) => (

      <Marker key={index} position={[loc.latitude, loc.longitude]}>
        <Popup>
          <strong>{index + 1}) {loc.locationName}</strong><br />
          Battery: {loc.battery}%<br />
          Time: {loc.createdDateTime}
        </Popup>
      </Marker>
    ))}
  </MapContainer>
  </div>

    
  );
}

export default MapView;
