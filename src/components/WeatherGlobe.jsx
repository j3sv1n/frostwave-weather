import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import Globe from "react-globe.gl";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Globe as GlobeIcon } from "lucide-react";
import { ThemeContext } from '@/App'; 

const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const WEATHER_URL = import.meta.env.VITE_WEATHER_URL;

const WeatherGlobe = () => {
    const { theme } = useContext(ThemeContext);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hoverData, setHoverData] = useState(null);
    const [pinCoords, setPinCoords] = useState(null);
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
            setHoverData({
                temperature: response.data?.current?.temp_c,
                lat: parseFloat(loc.split(",")[0]),
                lng: parseFloat(loc.split(",")[1]),
                locationName: response.data?.location?.name,
            });
        } catch (error) {
            console.error("Error fetching weather:", error);
        }
    };

    useEffect(() => {
        if (globeRef.current && hoverData) {
            setTimeout(() => {
                const { x, y } = globeRef.current.getScreenCoords(
                    hoverData.lat,
                    hoverData.lng
                );
                setPinCoords({ x, y });
            }, 50);
        }
    }, [globeRef, hoverData, globeRef.current?.pointOfView()]);

    const globeImage = theme === "light" ? "/maplight-fww.png" : "/mapdark-fww.png";

    const drawerContentClasses = `
        max-h-[95vh] p-4
        ${theme === "light" ? "bg-zinc-100" : "bg-zinc-950"}
    `;

    return (
        <div>
            <Drawer
                open={drawerOpen}
                onOpenChange={(open) => {
                    setDrawerOpen(open);
                    setIsWeatherGlobeDrawerOpen(open);
                }}
            >
                <DrawerTrigger asChild>
                    {!drawerOpen && (
                        <button
                            onClick={() => setDrawerOpen(true)}
                            style={{
                                // Dynamic background color with inverted zinc shades
                                background: theme === "dark" ? "rgba(220, 220, 220, 1)" : "rgba(50, 50, 50, 1)", // Dark mode - light bg, Light mode - dark bg
                                borderRadius: "50%",
                                width: "50px",
                                height: "50px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                cursor: "pointer",
                                border: "none",
                                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
                            }}
                        >
                            <GlobeIcon
                                // Dynamic icon color with inverted zinc shades
                                stroke={theme === "dark" ? "black" : "white"} // Dark mode - dark color, Light mode - light color
                            />
                        </button>
                    )}
                </DrawerTrigger>
                <DrawerContent className={drawerContentClasses}>  {/* Apply theme-dependent styles */}
                    <div className="absolute top-4 z-10" style={{ left: '17.5%' }}>
                        <h1 className={`text-2xl font-semibold ${theme === "light" ? "text-zinc-900" : "text-zinc-100"}`}>Planet Earth</h1>
                        {globeRef.current ? (
                            <p className={`text-sm ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
                                {globeRef.current.pointOfView().lat.toFixed(7)}, {globeRef.current.pointOfView().lng.toFixed(7)}
                            </p>
                        ) : (
                            <p className={`text-sm ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>Sol III: Verdant Biosphere</p>
                        )}
                    </div>
                    <Globe
                        ref={globeRef}
                        globeImageUrl={globeImage} 
                        backgroundColor="rgba(0,0,0,0)"
                        onGlobeClick={handleGlobeClick}
                    />
                    {hoverData && pinCoords && (
                        <Popover open>
                            <PopoverTrigger asChild>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: `${pinCoords.y}px`,
                                        left: `${pinCoords.x}px`,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    📍
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 h-20 flex flex-col items-center justify-center p-2 text-xl font-bold text-zinc-100 bg-zinc-900 rounded-lg shadow-lg">
                                {hoverData.temperature && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div>{hoverData.temperature}°C</div>
                                        {hoverData.locationName && (
                                            <p className="text-sm font-normal mt-1">
                                                {hoverData.locationName}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default WeatherGlobe;