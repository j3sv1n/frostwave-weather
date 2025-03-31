import { useState } from "react";
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

  const handleGlobeClick = ({ lat, lng }) => {
    console.log("Clicked location:", lat, lng);
    fetchWeather(`${lat},${lng}`);
  };

//   const fetchWeather = async (lat, lng) => {
//     console.log(`Fetching weather for: ${lat}, ${lng}`);
//     const res = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
//     const data = await res.json();
//     console.log("Weather data received:", data);
//     return data;
//   };

  const fetchWeather = async (loc) => {
      console.log(`Fetching weather for location: ${loc}`); 
      try {
        const response = await axios.get(WEATHER_URL, {
          params: { key: API_KEY, q: loc, days: 3 },
        });
        console.log("Weather data fetched successfully:", response.data); 
        setHoverData({ temperature: response.data.current.temp_c });
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
                globeImageUrl="/map1.jpg"
                backgroundColor="rgba(0,0,0,0)"
                onGlobeClick={handleGlobeClick} // Capture clicks
            />
          {hoverData && (
            <Popover>
              <PopoverTrigger>
                <div
                  style={{ position: "absolute", top: "50%", left: "50%" }}
                >
                  🔵
                </div>
              </PopoverTrigger>
              <PopoverContent>
                Temperature: {hoverData.temperature}°C
              </PopoverContent>
            </Popover>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default WeatherGlobe;
