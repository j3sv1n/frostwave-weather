import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import sunLogo from '/sun.svg';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Navigation } from "lucide-react";

const API_KEY = "b14c6b776f1b48988df112424252201";
const GEMINI_API_KEY = "AIzaSyBrgzi6QIRlj0daxOiX9xaq5XfE8nR5btE";
const WEATHER_URL = "https://api.weatherapi.com/v1/forecast.json";
const SEARCH_URL = "https://api.weatherapi.com/v1/search.json";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const AUDIUS_API_URL = "https://api.audius.co/v1";

function App() {
  const [location, setLocation] = useState("New York");
  const [weather, setWeather] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [musicUrl, setMusicUrl] = useState("");
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
    getUserLocation();
    fetchMusic();
    const savedFavorites = Cookies.get("favorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      () => fetchWeather(location)
    );
  };

  const fetchMusic = async () => {
    try {
      console.log("Fetching music from backend...");
      const response = await axios.get("http://localhost:5000/get-music");
      console.log("Full API Response:", response.data); // Log full response
      console.log("Fetched Music URL:", response.data.streamUrl);
      setMusicUrl(response.data.streamUrl);
    } catch (error) {
      console.error("Error fetching music:", error);
    }
  };       
    
  const fetchWeather = async (loc) => {
    try {
      const response = await axios.get(WEATHER_URL, {
        params: { key: API_KEY, q: loc, days: 7 }
      });
      setWeather(response.data);
      fetchAiSummary(response.data);
      fetchMusic(response.data.current.condition.text);

    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchAiSummary = async (weatherData) => {
    if (!weatherData) return;
    const prompt = `Summarize the current weather conditions in a friendly tone. Mention temperature, weather conditions, and give recommendations if necessary. Don't greet with the place name.\n\nLocation: ${weatherData.location.name}\nTemperature: ${weatherData.current.temp_c}°C\nCondition: ${weatherData.current.condition.text}`;

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
        setAiSummary("Could not generate AI summary. Invalid API response.");
      }
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      setAiSummary("Could not generate AI summary. Please try again later. Check your API key and network connection.");
    }
  };
  

  const fetchSearchResults = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(SEARCH_URL, {
        params: { key: API_KEY, q: query }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 space-y-6 flex flex-col h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-zinc-100">Frostwave</h1>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 text-lg text-zinc-400">
          <Navigation className="w-5 h-5 text-zinc-400" />
          <p>{weather?.location?.name}, {weather?.location?.region}</p>
        </div>
        <Popover>
          <PopoverTrigger>
            <Input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                fetchSearchResults(e.target.value);
              }}
              placeholder="Search location..."
            />
          </PopoverTrigger>
          <PopoverContent className="w-full">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <p 
                  key={result.id} 
                  className="cursor-pointer p-3 hover:bg-zinc-800 rounded"
                  onMouseDown={() => fetchWeather(result.name)}
                >
                  {result.name}, {result.region}
                </p>
              ))
            ) : (
              <p className="p-3 text-zinc-400">No results found</p>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {weather && (
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="flex items-center space-x-6">
            <img src={sunLogo} className="w-56 h-56 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110 hover:drop-shadow-glow" alt="Weather Icon" />
            <p className="text-8xl font-bold text-zinc-100">{weather.current.temp_c}°C</p>
          </div>
        </div>
      )}

      <div className="flex flex-row w-full mt-auto">
        <Card className="flex-1 p-4 bg-zinc-900 text-zinc-100 text-center mr-4">
          <CardContent>
            <p className="text-lg italic">{aiSummary || "Loading AI Summary..."}</p>
          </CardContent>
        </Card>

        <Card className="flex-1 p-4 bg-zinc-900 text-zinc-100">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">3-Day Forecast</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weather?.forecast?.forecastday.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</TableCell>
                    <TableCell className="flex items-center space-x-2">
                      <img src={sunLogo} className="w-8 h-8" alt="Weather Icon" />
                      <span>{day.day.avgtemp_c}°C</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
