import { useState, useRef } from "react";
import axios from "axios";
import Globe from "react-globe.gl";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import sunLogo from '/sun.svg';

const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const WEATHER_URL = import.meta.env.VITE_WEATHER_URL;

const WeatherGlobe = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoverData, setHoverData] = useState(null);
  const globeRef = useRef(null);

  const handleGlobeClick = ({ lat, lng }) => {
    console.log("Clicked location:", lat, lng);
    const roundedLoc = `${lat.toFixed(1)},${lng.toFixed(1)}`;
    fetchWeather(roundedLoc);
    zoomToLocation(lat, lng);
  };

  const zoomToLocation = (lat, lng) => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
    }
  };

  const fetchWeather = async (loc) => {
    console.log(`Fetching weather for location: ${loc}`);
    try {
      const response = await axios.get(WEATHER_URL, {
        params: { key: API_KEY, q: loc, days: 3 },
      });
      console.log("Weather data fetched successfully:", response.data);
      setHoverData({ temperature: response.data.current.temp_c, lat: parseFloat(loc.split(",")[0]), lng: parseFloat(loc.split(",")[1]) });
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  return (
    <div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button onClick={() => setDrawerOpen(true)}>Open Map</Button>
        </DrawerTrigger>
        <DrawerContent className="p-4 bg-black text-white">
          <Globe
            ref={globeRef}
            globeImageUrl="/map1.jpg"
            backgroundColor="rgba(0,0,0,0)"
            onGlobeClick={handleGlobeClick}
          />
          {hoverData && (
            <Popover open>
              <PopoverTrigger asChild>
                <div
                  style={{
                    position: "absolute",
                    top: `${50 + hoverData.lat * 0.5}%`,
                    left: `${50 + hoverData.lng * 0.5}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  📍
                </div>
              </PopoverTrigger>
              <PopoverContent>
                {hoverData.temperature}°C
              </PopoverContent>
            </Popover>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default WeatherGlobe;
