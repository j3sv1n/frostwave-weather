import { useEffect, useState, useCallback, useRef } from "react";
import { debounce } from "lodash";
import axios from "axios";
import Cookies from "js-cookie";
import sunLogo from '/sun.svg';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Search, Navigation, Heart } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm, WiFog } from "weather-icons-react";

const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const WEATHER_URL = import.meta.env.VITE_WEATHER_URL;
const SEARCH_URL = import.meta.env.VITE_SEARCH_URL;
const GEMINI_URL = import.meta.env.VITE_GEMINI_URL;
const AUDIUS_API_URL = import.meta.env.VITE_AUDIUS_URL;

function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [musicUrl, setMusicUrl] = useState("");
  const inputRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
    getUserLocation();
    fetchMusic();
    const savedFavorites = Cookies.get("favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Error parsing favorites from cookies:", error);
        setFavorites([]);
      }
    }
  }, []);

  const getWeatherIcon = (condition) => {
    const zinc100Color = "rgb(244, 244, 245)";
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return <WiDaySunny size={192} color={zinc100Color} />;
      case "cloudy":
      case "partly cloudy":
        return <WiCloud size={192} color={zinc100Color} />;
      case "rain":
      case "showers":
        return <WiRain size={192} color={zinc100Color} />;
      case "snow":
      case "sleet":
        return <WiSnow size={192} color={zinc100Color} />;
      case "thunderstorm":
      case "storm":
        return <WiThunderstorm size={192} color={zinc100Color} />;
      case "fog":
      case "mist":
        return <WiFog size={192} color={zinc100Color} />;
      default:
        return <WiDaySunny size={192} color={zinc100Color} />;
    }
  };

  const toggleFavorite = (place) => {
    if (!place) return; 
  
    const updatedFavorites = favorites.includes(place)
      ? favorites.filter((fav) => fav !== place) 
      : [...favorites, place]; 
  
    setFavorites(updatedFavorites);
  
    try {
      Cookies.set("favorites", JSON.stringify(updatedFavorites), { expires: 365 });
    } catch (error) {
      console.error("Error saving favorites to cookies:", error);
    }
  };

  const getUserLocation = () => {
    console.log("Attempting to get user location..."); 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`User location: Latitude ${latitude}, Longitude ${longitude}`); 
        const locationString = `${latitude},${longitude}`;
        setCurrentLocation(locationString); 
        fetchWeather(locationString); 
      },
      (error) => {
        console.error("Error getting user location:", error);
      }
    );
  };

  const fetchMusic = async () => {
    try {
      console.log("Fetching music from backend...");
      const response = await axios.get("http://localhost:5000/get-music");
      console.log("Full API Response:", response.data); 
      console.log("Fetched Music URL:", response.data.streamUrl);
      setMusicUrl(response.data.streamUrl);
    } catch (error) {
      console.error("Error fetching music:", error);
    }
  };       
    
  const fetchWeather = async (loc) => {
  console.log(`Fetching weather for location: ${loc}`); 
  try {
    const response = await axios.get(WEATHER_URL, {
      params: { key: API_KEY, q: loc, days: 7 },
    });
    console.log("Weather data fetched successfully:", response.data); 
    setWeather(response.data); 
    setCurrentLocation(loc); 
    fetchAiSummary(response.data); 
    fetchMusic(response.data.current.condition.text); 
  } catch (error) {
    console.error("Error fetching weather:", error); 
  }
};

  const fetchAiSummary = async (weatherData) => {
    if (!weatherData) return;
    const prompt = `Summarize the current weather conditions in a friendly tone. Mention temperature, weather conditions, and give recommendations if necessary. Don't greet with the place name. Don't make it too big.\n\nLocation: ${weatherData.location.name}\nTemperature: ${weatherData.current.temp_c}°C\nCondition: ${weatherData.current.condition.text}`;

    try {
      const response = await axios.post(
        GEMINI_URL,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY, 
          },
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0] && response.data.candidates[0].content.parts[0].text) {
          setAiSummary(response.data.candidates[0].content.parts[0].text);
      } else {
        setAiSummary("Could not generate AI summary. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      setAiSummary("Could not generate AI summary. Please try again later.");
    }
  };
  
  const debouncedFetchSearchResults = useCallback(
    debounce((query) => {
      if (query.length >= 3) {
        fetchSearchResults(query);
      } else {
        setSearchResults([]); 
      }
    }, 300),
    []
  );

  const fetchSearchResults = async (query) => {
    try {
      const response = await axios.get(SEARCH_URL, {
        params: { key: API_KEY, q: query },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setLocation(query);
    debouncedFetchSearchResults(query);
  };

  return (
    //<div className="bg-[linear-gradient(45deg,_theme(colors.zinc.950)_0%,_theme(colors.zinc.800)_50%,__theme(colors.zinc.900)_75%,__theme(colors.zinc.950)_100%)] min-h-screen">
    <div className="bg-[linear-gradient(45deg,_theme(colors.zinc.900)_0%,_theme(colors.zinc.950)_20%,_theme(colors.zinc.950)_40%,__theme(colors.zinc.800)_75%,__theme(colors.zinc.950)_100%)] min-h-screen">
      <div className="max-w-[65%] mx-auto px-0 py-6 space-y-6 flex flex-col h-screen">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-zinc-100">Frostwave</h1>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-lg text-zinc-400">
            <Navigation className="w-5 h-5 text-zinc-400" />
            <AnimatePresence mode="wait">
              {weather?.location?.name && (
                <motion.p
                  key={weather.location.name} // Trigger animation on location change
                  initial={{ opacity: 0, y: -10 }} // Start animation
                  animate={{ opacity: 1, y: 0 }} // End animation
                  exit={{ opacity: 0, y: 10 }} // Exit animation
                  transition={{ duration: 0.5 }} // Animation duration
                >
                  {weather.location.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  value={location}
                  onFocus={() => setSearchResults([])}
                  onChange={(e) => {
                    const query = e.target.value;
                    setLocation(query);
                    debouncedFetchSearchResults(query);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      fetchWeather(searchResults[0].name);
                    }
                  }}
                  placeholder="Search..."
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  onClick={() => {
                    if (searchResults.length > 0) {
                      fetchWeather(searchResults[0].name);
                    }
                  }}
                >
                  <Search className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-none"
              style={{
                width: inputRef.current ? `${inputRef.current.offsetWidth}px` : "300px",
              }}
            >

              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between cursor-pointer p-3 hover:bg-zinc-800 rounded"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      fetchWeather(result.name);
                    }}
                  >
                    <span>
                      {result.name}, {result.region}
                    </span>
                    <button
                      className="ml-2"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        toggleFavorite(result.name);
                      }}
                    >
                      {favorites.includes(result.name) ? (
                        <Heart
                          className="w-5 h-5 text-red-500 transition-transform duration-300 hover:scale-110"
                          fill="currentColor"
                        />
                      ) : (
                        <Heart
                          className="w-5 h-5 text-zinc-400 transition-transform duration-300 hover:scale-110"
                        />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="p-3 text-zinc-400">
                  {location.trim() === "" ? "Start typing to search..." : "No results found"}
                </p>
              )}

              {favorites.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-zinc-400 text-sm mb-2">Favorites</h4>
                  {favorites.map((fav, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between cursor-pointer p-3 hover:bg-zinc-800 rounded"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        fetchWeather(fav);
                      }}
                    >
                      <span>{fav}</span>
                      <button
                        className="ml-2"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          toggleFavorite(fav);
                        }}
                      >
                        <Heart
                          className="w-5 h-5 text-red-500 transition-transform duration-300 hover:scale-110"
                          fill="currentColor"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="cursor-pointer flex items-center p-3 hover:bg-zinc-800 rounded mt-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log("Current Location button clicked");
                  getUserLocation();
                }}
              >
                <Navigation className="w-5 h-5 text-zinc-400 mr-2" />
                <span>Current Location</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
    
        <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: "300px" }}>
          <AnimatePresence mode="wait">
            {weather ? (
              <motion.div
                key={weather.location.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-6"
              >
                <div className="drop-shadow-lg transition-transform duration-300 hover:scale-125 hover:drop-shadow-glow" >
                  {getWeatherIcon(weather.current.condition.text)}
                </div>
                <p className="text-8xl font-bold text-zinc-100 fade-in transition-transform duration-30 hover:scale-110 hover:drop-shadow-glow">
                  {Math.round(
                    weather.current.temp_c % 1 < 0.6
                      ? Math.floor(weather.current.temp_c)
                      : Math.ceil(weather.current.temp_c)
                  )}
                  °C
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-6"
              >
                <Skeleton className="w-56 h-56 rounded-full" />
                <Skeleton className="w-40 h-20 rounded" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    
        <div className="flex flex-row w-full mt-auto" style={{ gap: "0.3rem" }}>
          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 text-center mr-4 h-[250px] transition-transform duration-30 hover:scale-110">
            <CardContent>
              {aiSummary ? (
                <p
                  className="text-lg italic pt-2"
                  style={{ textAlign: "justify" }}
                >
                  {aiSummary}
                </p>
              ) : (
                <Skeleton className="w-full h-20 rounded pt-2" />
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 h-[250px] transition-transform duration-30 hover:scale-110">
            <CardContent className="overflow-hidden">
              <h3 className="text-xl font-semibold mb-2">3-Day Forecast</h3>
              <AnimatePresence mode="wait">
                {weather?.forecast?.forecastday ? (
                  <motion.div
                    key={weather.forecast.forecastday.map((day) => day.date).join(",")} // Trigger animation on forecast change
                    initial={{ opacity: 0, y: 10 }} // Start animation
                    animate={{ opacity: 1, y: 0 }} // End animation
                    exit={{ opacity: 0, y: -10 }} // Exit animation
                    transition={{ duration: 0.5 }} // Animation duration
                  >
                    <Table className="overflow-hidden">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Temp (°C)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weather.forecast.forecastday.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </TableCell>
                            <TableCell className="flex items-center space-x-2">
                              <div className="flex items-center justify-center w-8 h-8">
                                {getWeatherIcon(day.day.condition.text)}
                              </div>
                              <span>{day.day.avgtemp_c}°C</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="w-full h-8 rounded" />
                    <Skeleton className="w-full h-8 rounded" />
                    <Skeleton className="w-full h-8 rounded" />
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
