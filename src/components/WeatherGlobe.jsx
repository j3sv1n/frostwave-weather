import { useState } from "react";
import Globe from "react-globe.gl";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import sunLogo from '/sun.svg';

const WeatherGlobe = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoverData, setHoverData] = useState(null);

  const handleGlobeClick = ({ lat, lng }) => {
    console.log("Clicked location:", lat, lng);
    fetchWeather(lat, lng); // Fetch and display weather
  };

  const fetchWeather = async (lat, lng) => {
    console.log(`Fetching weather for: ${lat}, ${lng}`);
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
    const data = await res.json();
    console.log("Weather data received:", data);
    return data;
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
