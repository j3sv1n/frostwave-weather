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
const STREET_VIEW_URL = "https://maps.googleapis.com/maps/api/streetview";
const STREET_VIEW_SIZE = "400x300"; // Adjust size as needed
const STREET_VIEW_KEY = import.meta.env.VITE_STREET_VIEW_KEY; // Ensure you have this in your .env file

const WeatherGlobe = () => {
    const { theme } = useContext(ThemeContext);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hoverData, setHoverData] = useState(null);
    const [pinCoords, setPinCoords] = useState(null);
    const globeRef = useRef(null);

    const handleGlobeClick = async ({ lat, lng }) => {
        console.log("Clicked location:", lat, lng);
    
        const roundedLocForWeather = `${lat.toFixed(1)},${lng.toFixed(1)}`;
    
        // Preserve the existing location name from hoverData
        setHoverData(prevData => ({
            ...prevData,
            lat,
            lng,
            streetViewImage: `${STREET_VIEW_URL}?size=${STREET_VIEW_SIZE}&location=${lat.toFixed(4)},${lng.toFixed(4)}&key=${STREET_VIEW_KEY}`,
        }));
    
        zoomToLocation(lat, lng);
    };    

    const zoomToLocation = (lat, lng) => {
        if (globeRef.current) {
            globeRef.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
        }
    };

    const fetchWeather = async (loc, displayName) => {
        console.log(`Fetching weather for location: ${loc}`);
        try {
            const response = await axios.get(WEATHER_URL, {
                params: { key: API_KEY, q: loc, days: 3 },
            });
            console.log("Weather data fetched successfully:", response.data);
    
            const latitude = parseFloat(loc.split(",")[0]);
            const longitude = parseFloat(loc.split(",")[1]);
    
            const streetViewImage = `${STREET_VIEW_URL}?size=${STREET_VIEW_SIZE}&location=${latitude},${longitude}&key=${STREET_VIEW_KEY}`;
    
            setHoverData({
                temperature: response.data?.current?.temp_c,
                lat: latitude,
                lng: longitude,
                locationName: response.data?.location?.name,
                streetViewImage: streetViewImage,
            });
        } catch (error) {
            console.error("Error fetching weather:", error);
        }
    };

    useEffect(() => {
        if (globeRef.current && hoverData) {
            console.log("Hover Data:", hoverData);
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
                    if (typeof setIsWeatherGlobeDrawerOpen === 'function') {
                        setIsWeatherGlobeDrawerOpen(open);
                    }
                }}
            >
                <DrawerTrigger asChild>
                    {!drawerOpen && (
                        <button
                            onClick={() => setDrawerOpen(true)}
                            style={{
                                background: theme === "dark" ? "rgba(220, 220, 220, 1)" : "rgba(50, 50, 50, 1)",
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
                                stroke={theme === "dark" ? "black" : "white"}
                            />
                        </button>
                    )}
                </DrawerTrigger>
                <DrawerContent className={drawerContentClasses}>
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
                            <PopoverContent className="w-[450px] h-auto flex flex-col items-center justify-center p-4 text-xl font-bold text-zinc-100 bg-zinc-900 rounded-lg shadow-lg">
                                {hoverData.streetViewImage && (
                                    <img
                                        src={decodeURIComponent(hoverData.streetViewImage)}
                                        alt={`Street View of ${hoverData.locationName || 'selected location'}`}
                                        className="w-full rounded-md mb-2"
                                    />
                                )}
                                <div className="text-center">
                                    {hoverData.temperature && (
                                        <div>{hoverData.temperature}°C</div>
                                    )}
                                    {hoverData.locationName && (
                                        <p className="text-sm font-normal mt-1">
                                            {hoverData.locationName}
                                        </p>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default WeatherGlobe;