import { useState } from "react";
import Globe from "react-globe.gl";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import sunLogo from '/sun.svg';

const WeatherGlobe = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoverData, setHoverData] = useState(null);

  const handleGlobeClick = async (lat, lng) => {
    const weatherData = await fetchWeather(lat, lng);
    setHoverData({ lat, lng, temperature: weatherData.temp });
  };

  const fetchWeather = async (lat, lng) => {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
    const data = await res.json();
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
            onGlobeClick={({ lat, lng }) => handleGlobeClick(lat, lng)}
          />
          {hoverData && (
            <HoverCard>
              <HoverCardTrigger>
                <div
                  style={{ position: "absolute", top: "50%", left: "50%" }}
                >
                  🔵
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                Temperature: {hoverData.temperature}°C
              </HoverCardContent>
            </HoverCard>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default WeatherGlobe;