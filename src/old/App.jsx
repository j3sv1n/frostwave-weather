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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-zinc-100">Frostwave</h1>
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
              favorites.map((fav) => (
                <p 
                  key={fav} 
                  className="cursor-pointer p-3 hover:bg-zinc-800 rounded"
                  onMouseDown={() => fetchWeather(fav)}
                >
                  {fav}
                </p>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>
      {weather && (
        <Card className="text-center p-6 bg-zinc-900 text-zinc-100 max-w-md mx-auto flex flex-col items-center min-h-[200px]">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">{weather.location.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="flex justify-center items-center space-x-4 mt-4">
              <img src={sunLogo} className="w-12 h-12 object-contain shrink-0 fixed-size" alt="Weather Icon" />
              <p className="text-5xl font-bold">{weather.current.temp_c}°C</p>
            </div>
            <p className="text-lg mt-2">{weather.current.condition.text}</p>
            <Button className="mt-4" onClick={() => setFavorites([...favorites, location])}>Add to Favorites</Button>
          </CardContent>
        </Card>
      )}
      {musicUrl && (
        <audio src={musicUrl} autoPlay controls />
      )}
      {aiSummary && (
        <Card className="p-4 bg-zinc-800 text-zinc-100 max-w-md mx-auto text-center">
          <CardContent>
            <p className="text-lg italic">{aiSummary}</p>
          </CardContent>
        </Card>
      )}
      {weather && weather.forecast && (
        <div>
          <h3 className="text-xl font-semibold mb-2 text-zinc-100">Weekly Forecast</h3>
          <Table className="bg-zinc-900 text-zinc-100">
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Avg Temp (°C)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weather.forecast.forecastday.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</TableCell>
                  <TableCell>
                    <img src={sunLogo} className="w-8 mx-auto" alt="Weather Icon" />
                  </TableCell>
                  <TableCell>{day.day.avgtemp_c}°C</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant={"secondary"}>Secondary</Button>
        </div>
      )}
    </div>
  );
}

export default App;
