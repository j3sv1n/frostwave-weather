import { useEffect, useState, useCallback, useRef } from "react";
import { debounce } from "lodash";
import axios from "axios";
import Cookies from "js-cookie";
import Globe from "react-globe.gl";
import WeatherGlobe from "@/components/WeatherGlobe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlowArea, Glow } from "@/components/Glow"
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Search, Navigation, Heart, Settings } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm, WiFog, WiStrongWind } from "weather-icons-react";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { WiSmoke } from "react-icons/wi";


const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const WEATHER_URL = import.meta.env.VITE_WEATHER_URL;
const SEARCH_URL = import.meta.env.VITE_SEARCH_URL;
const GEMINI_URL = import.meta.env.VITE_GEMINI_URL;

function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [musicType, setMusicType] = useState("ambient");
  const [musicUrl, setMusicUrl] = useState("");
  const [audio, setAudio] = useState(null);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState("C");
  const [windSpeedUnit, setWindSpeedUnit] = useState("kph");
  
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
    getUserLocation();
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

  useEffect(() => {
    const savedTempUnit = Cookies.get("temperatureUnit");
    const savedWindUnit = Cookies.get("windSpeedUnit");

    if (savedTempUnit) setTemperatureUnit(savedTempUnit);
    if (savedWindUnit) setWindSpeedUnit(savedWindUnit);
  }, []);

  useEffect(() => {
    Cookies.set("temperatureUnit", temperatureUnit, { expires: 365 });
    Cookies.set("windSpeedUnit", windSpeedUnit, { expires: 365 });
  }, [temperatureUnit, windSpeedUnit]);

  const convertTemperature = (tempC) => {
    return temperatureUnit === "F" ? (tempC * 9) / 5 + 32 : tempC;
  };

  const convertWindSpeed = (speedKph) => {
    return windSpeedUnit === "mph" ? speedKph * 0.621371 : speedKph;
  };
  const getFoodRecommendations = (condition) => {
    const lowerCondition = condition.toLowerCase();
  
    if (lowerCondition.includes("rain") || lowerCondition.includes("storm")) {
      return [
        "Warm chicken soup 🍜 to stay cozy.",
        "Hot chocolate ☕ or herbal tea 🍵 to keep warm.",
        "Stay hydrated with at least 2 liters of water 💧.",
      ];
    } else if (lowerCondition.includes("snow") || lowerCondition.includes("cold")) {
      return [
        "Steaming hot ramen 🍜 or noodle soup.",
        "Spicy curries 🌶️ to warm yourself up.",
        "Drink at least 2.5 liters of water 💧 to stay hydrated in the dry air.",
      ];
    } else if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) {
      return [
        "Cool off with a refreshing smoothie 🍹 or iced drink 🧊.",
        "Enjoy a light salad 🥗 with seasonal fruits 🍓.",
        "Drink at least 3 liters of water 💧 to stay hydrated in the heat.",
      ];
    } else if (lowerCondition.includes("cloudy") || lowerCondition.includes("overcast")) {
      return [
        "A warm cup of coffee ☕ or tea 🍵.",
        "Freshly baked cookies 🍪 or a slice of pie 🥧.",
        "Drink at least 2 liters of water 💧 to maintain hydration.",
      ];
    } else if (lowerCondition.includes("windy")) {
      return [
        "Hearty sandwiches 🥪 or wraps to enjoy on the go.",
        "A thermos of hot soup 🍲 to keep warm.",
        "Drink at least 2 liters of water 💧 to avoid dehydration.",
      ];
    } else if (lowerCondition.includes("humid")) {
      return [
        "Cold fruit juices 🍊 or coconut water 🥥 to stay refreshed.",
        "Light meals like sushi 🍣 or fresh salads 🥗.",
        "Drink at least 3 liters of water 💧 to stay cool.",
      ];
    } else if (lowerCondition.includes("fog") || lowerCondition.includes("mist")) {
      return [
        "Warm beverages like chai tea 🍵 or hot cocoa ☕.",
        "Comfort foods like grilled cheese 🧀 and tomato soup 🍅.",
        "Drink at least 2 liters of water 💧 to stay hydrated.",
      ];
    } else if (lowerCondition.includes("haze") || lowerCondition.includes("smoke")) {
      return [
        "Avoid heavy meals; opt for light snacks like crackers 🥨 or fruits 🍎.",
        "Drink herbal teas 🍵 to soothe your throat.",
        "Stay hydrated with at least 3 liters of water 💧 to combat dryness.",
      ];
    } else {
      return [
        "Enjoy your favorite comfort food 🍴!",
        "Stay hydrated 🥤 with a drink of your choice.",
      ];
    }
  };
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

  const fetchMusic = async (weatherCondition, musicTypeOverride = musicType) => {
    try {
      console.log("Raw weather condition:", weatherCondition);
      console.log("Music type override:", musicTypeOverride);
  
      const response = await axios.get("/music.json");
      const musicData = response.data;
      console.log("Music data fetched:", musicData);
  
      const presets = Object.keys(musicData);
      console.log("Available presets:", presets);
  
      const findClosestMatch = (condition, presets) => {
        const normalizedCondition = condition.toLowerCase();
        let closestMatch = presets[0];
        let highestSimilarity = 0;
  
        presets.forEach((preset) => {
          const similarity = calculateSimilarity(normalizedCondition, preset);
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            closestMatch = preset;
          }
        });
  
        return closestMatch;
      };
  
      const calculateSimilarity = (str1, str2) => {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/_/);
        const commonWords = words1.filter((word) => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
      };
  
      const closestPreset = findClosestMatch(weatherCondition, presets);
      console.log("Closest preset:", closestPreset);
  
      if (musicData[closestPreset]) {
        const conditionMusic = musicData[closestPreset];
        if (musicTypeOverride === "ambient") {
          const ambientUrl = conditionMusic.ambient;
          console.log("Ambient music URL:", ambientUrl);
          playMusic(ambientUrl, true); 
        } else if (musicTypeOverride === "songs") {
          const randomSong =
            conditionMusic.songs[
              Math.floor(Math.random() * conditionMusic.songs.length)
            ];
          console.log("Random song URL:", randomSong);
          playMusic(randomSong, false);
        }
      } else {
        console.error("No music found for the closest preset.");
      }
    } catch (error) {
      console.error("Error fetching music metadata:", error);
    }
  };

  const playMusic = (url, isAmbient) => {
    if (audio) {
      audio.pause();
      audio.onended = null;
      setAudio(null);
    }
  
    const newAudio = new Audio(url);
    newAudio.volume = isAmbient ? 0.5 : 1.0;
    newAudio.loop = isAmbient;
  
    if (!isAmbient) {
      newAudio.onended = () => {
        fetchMusic(weather.current.condition.text, "songs");
      };
    }
  
    setAudio(newAudio);
    newAudio.play();
  };

  const crossfadeAudio = (currentAudio, nextUrl, isAmbient) => {
    setIsCrossfading(true);
  
    const fadeOutInterval = setInterval(() => {
      if (currentAudio.volume > 0.1) {
        currentAudio.volume -= 0.1;
      } else {
        clearInterval(fadeOutInterval);
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio.load();
        setAudio(null);
  
        const nextAudio = new Audio(nextUrl);
        nextAudio.volume = 0.0;
        nextAudio.loop = isAmbient; 
        nextAudio.onended = () => {
          if (!isAmbient) {
            fetchMusic(weather.current.condition.text, "songs");
          }
        };
        setAudio(nextAudio);
        nextAudio.play();
  
        // Fade in the next audio
        const fadeInInterval = setInterval(() => {
          if (nextAudio.volume < (isAmbient ? 0.5 : 1.0)) {
            nextAudio.volume += 0.1;
          } else {
            clearInterval(fadeInInterval);
            setIsCrossfading(false);
          }
        }, 200);
      }
    }, 200); 
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
    
  const fetchWeather = async (loc) => {
    console.log(`Fetching weather for location: ${loc}`); 
    try {
      const response = await axios.get(WEATHER_URL, {
        params: { key: API_KEY, q: loc, days: 5 },
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

  const calculateDaylightDuration = (sunrise, sunset) => {
    const parseTime = (time) => {
      const [hours, minutesPart] = time.split(":");
      const minutes = parseInt(minutesPart, 10);
      const isPM = time.toLowerCase().includes("pm");
      return parseInt(hours, 10) % 12 + (isPM ? 12 : 0) + minutes / 60;
    };

    const sunriseTime = parseTime(sunrise);
    const sunsetTime = parseTime(sunset);
    const daylightHours = sunsetTime - sunriseTime;

    const hours = Math.floor(daylightHours);
    const minutes = Math.round((daylightHours - hours) * 60);

    return `${hours} hr ${minutes} min`;
  };

  const getHourlyForecastData = () => {
    if (!weather?.forecast?.forecastday) return [];
    const currentHour = new Date().getHours();
    const todayForecast = weather.forecast.forecastday[0]?.hour || [];
    return todayForecast
      .slice(currentHour, currentHour + 7) // Get current hour and next 6 hours
      .map((hour) => ({
        time: new Date(hour.time).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
        temp: hour.temp_c,
      }));
  };

  const hourlyData = getHourlyForecastData();
  console.log("Hourly Data:", hourlyData);

  const fetchAiSummary = async (weatherData) => {
    if (!weatherData || !weatherData.forecast || !weatherData.forecast.forecastday) return;
  
    const forecastDetails = weatherData.forecast.forecastday
      .map((day) => {
        const date = new Date(day.date).toLocaleDateString("en-US", { weekday: "long" });
        return `${date}: ${day.day.avgtemp_c}°C, ${day.day.condition.text}`;
      })
      .join("\n");
  
    const prompt = `Provide a concise summary of the current weather conditions in a friendly tone. 
    Include the weather conditions, temperature, and any notable patterns. 
    Ensure the summary is exactly 50 words long.
  
    Location: ${weatherData.location.name}
    Temperature: ${weatherData.current.temp_c}°C
    Condition: ${weatherData.current.condition.text}
  
    3-Day Forecast:
    ${forecastDetails}`;
  
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
  
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0] &&
        response.data.candidates[0].content.parts[0].text
      ) {
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
    <div className="bg-[linear-gradient(45deg,_theme(colors.zinc.900)_0%,_theme(colors.zinc.950)_20%,_theme(colors.zinc.950)_40%,__theme(colors.zinc.800)_75%,__theme(colors.zinc.950)_100%)] min-h-screen mb-30">
      <div className="max-w-[65%] mx-auto px-0 py-6 space-y-6 flex flex-col min-h-screen">
        <div className="sticky top-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-zinc-100">Frostwave</h1>
            {/* <div className="pt-2">
              <ThemeToggle />
            </div> */}
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                checked={musicType === "songs"}
                onCheckedChange={(isChecked) => {
                  const newMusicType = isChecked ? "songs" : "ambient";
                  setMusicType(newMusicType);

                  if (weather && weather.current && weather.current.condition) {
                    console.log(`Switch toggled. New music type: ${newMusicType}`);
                    fetchMusic(weather.current.condition.text, newMusicType); 
                  } else {
                    console.warn("Weather data is not available. Cannot fetch music.");
                  }
                }}
              />
              <span className="text-zinc-100">
                {musicType === "ambient" ? "Ambient" : "Songs"}
              </span>
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

          <div>
            <WeatherGlobe />
          </div>

          <div className="flex items-center space-x-2">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-2 p-2"
                >
                  <Settings className="w-5 h-5" /> 
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right" 
                className="p-6 h-screen flex flex-col ml-[-50px]"
              >
                <div className="flex flex-col space-y-6 ml-0">
                  <h2 className="text-2xl font-bold">Settings</h2>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Temperature Units</span>
                    <Tabs value={temperatureUnit} onValueChange={setTemperatureUnit}>
                      <TabsList>
                        <TabsTrigger value="C">C</TabsTrigger>
                        <TabsTrigger value="F">F</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Wind Speed Units</span>
                    <Tabs value={windSpeedUnit} onValueChange={setWindSpeedUnit}>
                      <TabsList>
                        <TabsTrigger value="kph">kph</TabsTrigger>
                        <TabsTrigger value="mph">mph</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
                <div className="drop-shadow-lg transition-transform duration-300 hover:drop-shadow-glow" >
                  {getWeatherIcon(weather.current.condition.text)}
                </div>
                <p className="text-8xl font-bold text-zinc-100 fade-in transition-transform duration-30 hover:drop-shadow-glow">
                  {Math.round(
                    convertTemperature(
                      weather.current.temp_c % 1 < 0.6
                        ? Math.floor(weather.current.temp_c)
                        : Math.ceil(weather.current.temp_c)
                    )
                  )}
                  °{temperatureUnit}
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

        <div className="flex flex-row justify-between gap-6 mt-4">
          <div className="flex flex-col flex-1 gap-3">
            <Card className="p-3 bg-zinc-950 text-zinc-100 transition-transform duration-300 hover:scale-105">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Quick Summary</h3>
                {aiSummary ? (
                  <div className="text-sm italic" style={{ textAlign: "justify" }}>
                    {aiSummary.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="mb-1">🌟 {paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <Skeleton className="w-full h-16 rounded" />
                )}
              </CardContent>
            </Card>
            <div></div>

            <Card className="p-3 bg-zinc-950 text-zinc-100 transition-transform duration-300 hover:scale-105">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">🍴 Food Recommendations</h3>
                {weather?.current?.condition?.text ? (
                  <div className="text-sm" style={{ textAlign: "justify" }}>
                    {getFoodRecommendations(weather.current.condition.text).map((item, index) => (
                      <p key={index} className="mb-1">🍽️ {item}</p>
                    ))}
                  </div>
                ) : (
                  <Skeleton className="w-full h-16 rounded" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="p-3 bg-zinc-950 text-zinc-100 transition-transform duration-300 hover:scale-105 h-full">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">5-Day Forecast</h3>
                <AnimatePresence mode="wait">
                  {weather?.forecast?.forecastday ? (
                    <motion.div
                      key={weather.forecast.forecastday.map((day) => day.date).join(",")}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Table className="overflow-hidden text-sm">
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
                                  weekday: "long",
                                })}
                              </TableCell>
                              <TableCell className="flex items-center space-x-2">
                                <div className="flex items-center justify-center w-6 h-6">
                                  {getWeatherIcon(day.day.condition.text)}
                                </div>
                                <span>
                                  {Math.round(convertTemperature(day.day.avgtemp_c))}°
                                  {temperatureUnit}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="w-full h-6 rounded" />
                      <Skeleton className="w-full h-6 rounded" />
                      <Skeleton className="w-full h-6 rounded" />
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-row w-full mt-4" style={{ gap: "0.3rem" }}>
          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 text-left mr-4 h-[135px] transition-transform duration-30 hover:scale-110">
            <CardContent className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Humidity</h3>
                {weather?.current?.humidity ? (
                  <div>
                    <p className="text-4xl font-bold">{weather.current.humidity}%</p>
                    <p className="text-sm text-zinc-400">
                      {weather.current.humidity > 70 ? "High" : "Normal"}
                    </p>
                  </div>
                ) : (
                  <Skeleton className="w-full h-12 rounded" />
                )}
              </div>
              <div className="flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full">
                <WiRain className="text-6xl text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 text-left h-[135px] transition-transform duration-30 hover:scale-110">
            <CardContent className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">UV Index</h3>
                {weather?.current?.uv !== undefined ? (
                  <div>
                    <p className="text-4xl font-bold">{weather.current.uv}</p>
                    <p className="text-sm text-zinc-400">
                      {weather.current.uv === 0
                        ? "Very Low"
                        : weather.current.uv > 7
                        ? "High"
                        : weather.current.uv > 3
                        ? "Moderate"
                        : "Low"}
                    </p>
                  </div>
                ) : (
                  <Skeleton className="w-full h-12 rounded" />
                )}
              </div>
              <div className="flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full">
                <WiDaySunny
                  className={`text-6xl ${
                    weather?.current?.uv > 7 ? "text-red-500" : "text-white"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-row w-full mt-4" style={{ gap: "0.3rem" }}>
          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 text-left mr-4 h-[220px] transition-transform duration-30 hover:scale-110">
            <CardContent className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Wind Speed</h3>
                {weather?.current?.wind_kph ? (
                  <div>
                    <p className="text-4xl font-bold">
                      {Math.round(convertWindSpeed(weather.current.wind_kph))} {windSpeedUnit}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {convertWindSpeed(weather.current.wind_kph) > 30 ? "Strong" : "Moderate"}
                    </p>
                  </div>
                ) : (
                  <Skeleton className="w-full h-12 rounded" />
                )}
              </div>
              <div className="flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full">
                <WiStrongWind className="text-6xl text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 p-4 bg-zinc-950 text-zinc-100 text-left h-[220px] transition-transform duration-30 hover:scale-110">
            <CardContent className="flex flex-col justify-center">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-2">Sunrise & Sunset</h3>
                  <p className="text-sm text-zinc-400">
                  {weather?.forecast?.forecastday[0]?.astro
                    ? `${calculateDaylightDuration(
                        weather.forecast.forecastday[0].astro.sunrise,
                        weather.forecast.forecastday[0].astro.sunset
                      )} · Daylight`
                    : "Loading..."}
                </p>
              </div>
              {weather?.forecast?.forecastday[0]?.astro ? (
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart
                      data={[
                        { time: "Start", value: 0 },
                        { time: "Sunrise", value: 20 },
                        { time: "Noon", value: 100 },
                        { time: "Sunset", value: 20 },
                        { time: "End", value: 0 },
                      ]}
                    >
                      {/* X-Axis */}
                      <XAxis
                        dataKey="time"
                        tick={false} // Remove X-Axis labels
                        axisLine={false}
                        tickLine={false}
                      />
                      {/* Y-Axis */}
                      <YAxis hide />
                      {/* Horizontal Reference Line */}
                      <ReferenceLine y={50} stroke="#6b7280" strokeWidth={1} />
                      {/* Inverted U Shape */}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ffffff" // White for the curve
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between items-center text-sm text-zinc-400 mt-1">
                    <span>{weather.forecast.forecastday[0].astro.sunrise}</span>
                    <span>{weather.forecast.forecastday[0].astro.sunset}</span>
                  </div>
                </div>
              ) : (
                <Skeleton className="w-full h-12 rounded" />
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default App;
