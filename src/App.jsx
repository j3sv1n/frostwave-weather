import { useEffect, useState, useCallback, useRef } from "react";
import { debounce } from "lodash";
import axios from "axios";
import Cookies from "js-cookie";
import Globe from "react-globe.gl";
import WeatherGlobe from "@/components/WeatherGlobe";
import Reminder from "@/components/Reminder";
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
import { ToastProvider } from "@/components/ui/toast";

const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const WEATHER_URL = import.meta.env.VITE_WEATHER_URL;
const SEARCH_URL = import.meta.env.VITE_SEARCH_URL;
const GEMINI_URL = import.meta.env.VITE_GEMINI_URL;

function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [foodRecommendations, setFoodRecommendations] = useState([]);
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
  const [theme, setTheme] = useState("dark");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isWeatherGlobeDrawerOpen, setIsWeatherGlobeDrawerOpen] = useState(false);
  
  
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
    const savedTheme = Cookies.get("theme"); 
    if (savedTheme) {
        setTheme(savedTheme);
    }
    setIsThemeLoaded(true);
  }, []);

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
    };

  const getFoodRecommendations = async (weatherData) => {
    if (!weatherData || !weatherData.current) return;

    const { condition } = weatherData.current;
    const location = weatherData.location.name;

    const prompt = `Recommend 3 foods or drinks based on the following weather and location. 
    Do not mention the current temperature. 
    Limit the response to a maximum of 50 words.
    Location: ${location}
    Condition: ${condition.text}
    `;

    try {
      const response = await axios.post(
        GEMINI_URL,
        {
          contents: [{ parts: [{ text: prompt }] }],
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
        response.data.candidates[0].content.parts[0].text
      ) {
        // Parse the AI response and set food recommendations
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        // Simple parsing - adjust as needed for your AI's response format
        const recommendations = aiResponse.split("\n").filter(item => item.trim() !== "").map(item => item.replace(/^\d+\.\s*/, '🍽️ '));
        setFoodRecommendations(recommendations);
      } else {
        setFoodRecommendations(["Could not generate food recommendations."]);
      }
    } catch (error) {
      console.error("Error fetching AI food recommendations:", error);
      setFoodRecommendations(["Could not generate food recommendations."]);
    }
  };

  const addEmojisToSummary = (text) => {
    const lowerText = text.toLowerCase();
  
    if (lowerText.includes("sunny")) {
      return `☀️ ${text} Don't forget your sunglasses! 😎`;
    } else if (lowerText.includes("rain")) {
      return `🌧️ ${text} Grab an umbrella! ☔`;
    } else if (lowerText.includes("snow")) {
      return `❄️ ${text} Time for some hot cocoa! ☕`;
    } else if (lowerText.includes("cloudy")) {
      return `☁️ ${text} A cozy day for reading indoors! 📚`;
    } else if (lowerText.includes("windy")) {
      return `💨 ${text} Hold onto your hat! 🎩`;
    } else if (lowerText.includes("humid")) {
      return `💦 ${text} Stay cool and hydrated! 🥤`;
    } else if (lowerText.includes("fog") || lowerText.includes("mist")) {
      return `🌫️ ${text} Drive safely in low visibility! 🚗`;
    } else if (lowerText.includes("haze") || lowerText.includes("smoke")) {
      return `🌁 ${text} Limit outdoor activities! 🏠`;
    } else {
      return `🌈 ${text} Enjoy the day! 🌟`;
    }
  };

  const getWeatherIcon = (condition) => {
    const iconColor = theme === "dark" ? "rgb(244, 244, 245)" : "rgb(39, 39, 42)";
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return <WiDaySunny size={192} color={iconColorColor} />;
      case "cloudy":
      case "partly cloudy":
        return <WiCloud size={192} color={iconColor} />;
      case "rain":
      case "showers":
        return <WiRain size={192} color={iconColor} />;
      case "snow":
      case "sleet":
        return <WiSnow size={192} color={iconColor} />;
      case "thunderstorm":
      case "storm":
        return <WiThunderstorm size={192} color={iconColor} />;
      case "fog":
      case "mist":
        return <WiFog size={192} color={iconColor} />;
      default:
        return <WiDaySunny size={192} color={iconColor} />;
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
        params: { key: API_KEY, q: loc, days: 7 },
      });
      console.log("Weather data fetched successfully:", response.data); 
      setWeather(response.data); 
      setCurrentLocation(loc); 
      fetchAiSummary(response.data);
      getFoodRecommendations(response.data);
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

  const [hourlyData, setHourlyData] = useState([]);
  const [isGraphVisible, setIsGraphVisible] = useState(false);
  const graphRef = useRef(null);
  console.log("Hourly Data:", hourlyData);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsGraphVisible(true);
            observer.unobserve(entry.target); // Observe only once
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    if (graphRef.current) {
      observer.observe(graphRef.current);
    }

    return () => {
      if (graphRef.current) {
        observer.unobserve(graphRef.current);
      }
    };
  }, []);

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
    Ensure the summary is exactly 35 words long. Don't mention the place name or the temperature.
  
    Location: ${weatherData.location.name}
    Temperature: ${weatherData.current.temp_c}°C
    Condition: ${weatherData.current.condition.text}
  
    7-Day Forecast:
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
    <ToastProvider>
    {/* <div className="bg-[linear-gradient(45deg,_theme(colors.zinc.900)_0%,_theme(colors.zinc.950)_20%,_theme(colors.zinc.950)_40%,__theme(colors.zinc.800)_75%,__theme(colors.zinc.950)_100%)] min-h-screen mb-30"> */}
    <div className={`min-h-screen ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"}`}>
      <div className="max-w-[65%] mx-auto px-0 py-6 space-y-6 flex flex-col min-h-screen">
        <div className="sticky top-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                Frostwave
            </h1>
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
              <span className='${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}'>
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
                    <span className="text-lg font-medium">Color Theme</span>
                    <Tabs value={theme} onValueChange={toggleTheme}>
                      <TabsList>
                        <TabsTrigger value="light">
                          <Sun className="w-5 h-5" />
                        </TabsTrigger>
                        <TabsTrigger value="dark">
                          <Moon className="w-5 h-5" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
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
                <p className='text-8xl font-bold ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"} fade-in transition-transform duration-30 hover:drop-shadow-glow'>
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

        <div className="flex flex-row justify-between gap-4 mt-4">
          {/* Left Column: Quick Summary and Food Recommendations */}
          <div className="flex flex-col flex-1 gap-3">
            {/* Quick Summary Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }} 
              transition={{ duration: 0.3 }} 
              className="relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(66,135,245,0.3)_0%,_rgba(66,135,245,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Card Content */}
              <Card className='relative p-3 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(66,135,245,0.5)] overflow-hidden h-[180px]'>
                <div className="relative z-10 p-3">
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">🌟 Quick Summary</h3>
                    {aiSummary ? (
                      <div className="text-sm space-y-2" style={{ textAlign: "justify" }}>
                        {aiSummary.split("\n\n").map((paragraph, index) => (
                          <p key={index} className="mb-1">
                            {addEmojisToSummary(paragraph)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <Skeleton className="w-full h-16 rounded" />
                    )}
                  </CardContent>
                </div>
              </Card>
            </motion.div>
            <div></div>

            {/* Food Recommendations Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
              transition={{ duration: 0.3 }} // Smooth transition
              className="relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(66,135,245,0.3)_0%,_rgba(66,135,245,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Card Content */}
              <Card className='relative p-3 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(66,135,245,0.5)] overflow-hidden h-[180px]'>
                <div className="relative z-10 p-3 pb-5">
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-1">🍴 Food Recommendations</h3>
                    {foodRecommendations.length > 0 ? (
                      <div className="text-sm space-y-1" style={{ textAlign: "justify" }}>
                        {foodRecommendations.map((item, index) => (
                          <p key={index} className='mb-1 p-1 rounded-lg ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"} text-sm'>
                            {item}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <Skeleton className="w-full h-12 rounded" />
                    )}
                  </CardContent>
                </div>
              </Card>
            </motion.div>
        </div>

        {/* Right Column: 7-Day Forecast */}
        <div className="flex-1">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
            transition={{ duration: 0.3 }} // Smooth transition
            className="relative"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,223,0,0.3)_0%,_rgba(255,223,0,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            {/* Card Content */}
            <Card className='relative p-3 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} text-left h-[385px] rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(235,115,52,0.5)] overflow-hidden'>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">7-Day Forecast</h3>
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
          </motion.div>
        </div>

        </div>
          {/* Bottom Row: Humidity and UV Index */}
          <div className="grid grid-cols-2 gap-4">
            {/* Humidity Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
              transition={{ duration: 0.3 }} // Smooth transition
              className="relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(138,43,226,0.3)_0%,_rgba(138,43,226,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Card Content */}
              <Card className='flex-1 p-4 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} text-left h-[145px] rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(127,159,212,0.5)] overflow-hidden'>
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
            </motion.div>

            {/* UV Index Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
              transition={{ duration: 0.3 }} // Smooth transition
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,0,0,0.3)_0%,_rgba(255,0,0,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Card Content */}
              <Card className='flex-1 p-4 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} text-left h-[145px] rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(235,64,52,0.5)] overflow-hidden'>
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
            </motion.div>
      </div>
    
      <div className="grid grid-cols-2 gap-4">
        {/* Wind Speed Card */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
          transition={{ duration: 0.3 }} // Smooth transition
          className="relative"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(202,253,243,0.3)_0%,_rgba(202,253,243,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

          {/* Card Content */}
          <Card className='flex-1 p-4 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} text-left h-[220px] rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(202,253,243,0.5)] overflow-hidden'>
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
        </motion.div>

        {/* Sunrise and Sunset Card */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }} // Scale up and move slightly upward on hover
          transition={{ duration: 0.3 }} // Smooth transition
          className="relative"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,165,0,0.3)_0%,_rgba(255,165,0,0)_70%)] rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

          {/* Card Content */}
          <Card className='flex-1 p-4 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"} text-left h-[220px] rounded-lg shadow-md hover:shadow-[0_0_20px_5px_rgba(235,115,52,0.5)] overflow-hidden'>
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
              <div ref={graphRef}>
                {isGraphVisible ? (
                  <>
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
                        <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <ReferenceLine y={50} stroke="#6b7280" strokeWidth={1} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={theme === "dark" ? "#ffffff" : "#27272a"} //  "#ffffff" for dark mode, "#27272a" for light mode
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between items-center text-sm text-zinc-400 mt-1">
                      <span>{weather?.forecast?.forecastday[0]?.astro?.sunrise}</span>
                      <span>{weather?.forecast?.forecastday[0]?.astro?.sunset}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    {weather?.forecast?.forecastday[0]?.astro ? (
                      <>
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
                            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <ReferenceLine y={50} stroke="#6b7280" strokeWidth={1} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#ffffff"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between items-center text-sm text-zinc-400 mt-1">
                          <span>{weather?.forecast?.forecastday[0]?.astro?.sunrise}</span>
                          <span>{weather?.forecast?.forecastday[0]?.astro?.sunset}</span>
                        </div>
                      </>
                    ) : (
                      <Skeleton className="w-full h-12 rounded" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
    </div>
    {
      !isWeatherGlobeDrawerOpen && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          right: '79px',
          zIndex: 1000,
        }}>
          <Reminder />
        </div>
      )
    }
    <div style={{
      position: 'fixed',
      bottom: '50px',
      right: '70px',  
      zIndex: 1000,     
    }}>
        <WeatherGlobe />
    </div>
  </div>
  </ToastProvider>
  );
}

export default App;