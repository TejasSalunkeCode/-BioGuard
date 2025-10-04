import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { PredictionSettings as Settings } from "@/lib/healthPredictionTypes";
import { getPredictionSettings, savePredictionSettings } from "@/lib/healthPredictionEngine";
import { getCityCoordinates } from "@/lib/weatherApi";
import { toast } from "sonner";
import { Settings as SettingsIcon, MapPin, Bell, Cloud, TrendingUp, Save } from "lucide-react";

interface PredictionSettingsProps {
  onSettingsChange?: () => void;
}

const PredictionSettings = ({ onSettingsChange }: PredictionSettingsProps) => {
  const [settings, setSettings] = useState<Settings>(getPredictionSettings());
  const [cityInput, setCityInput] = useState(settings.location?.city || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleSave = () => {
    savePredictionSettings(settings);
    toast.success("Prediction settings saved!");
    onSettingsChange?.();
  };

  const handleCityLookup = async () => {
    if (!cityInput.trim()) {
      toast.error("Please enter a city name");
      return;
    }

    setIsLoadingLocation(true);
    try {
      const coords = await getCityCoordinates(cityInput);
      setSettings({
        ...settings,
        location: {
          lat: coords.lat,
          lon: coords.lon,
          city: cityInput,
        },
      });
      toast.success(`Location set to ${cityInput}`);
    } catch (error) {
      toast.error("City not found. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAutoLocation = () => {
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings({
          ...settings,
          location: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: "Current Location",
          },
        });
        setCityInput("Current Location");
        toast.success("Location updated to current position");
        setIsLoadingLocation(false);
      },
      (error) => {
        toast.error("Could not get location. Please enter city manually.");
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Prediction Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure health prediction features
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enable Predictions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="enabled" className="font-medium">Enable Predictions</Label>
              <p className="text-sm text-muted-foreground">
                Generate AI-powered health predictions
              </p>
            </div>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts for high-risk predictions
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={settings.notificationsEnabled}
                onCheckedChange={(notificationsEnabled) =>
                  setSettings({ ...settings, notificationsEnabled })
                }
              />
            </div>

            {/* Weather Integration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="weather" className="font-medium">Weather Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Include weather patterns in predictions
                  </p>
                </div>
              </div>
              <Switch
                id="weather"
                checked={settings.weatherIntegration}
                onCheckedChange={(weatherIntegration) =>
                  setSettings({ ...settings, weatherIntegration })
                }
              />
            </div>

            {/* Location (only if weather enabled) */}
            {settings.weatherIntegration && (
              <div className="space-y-3 pl-8 animate-slide-down">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city name..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCityLookup()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleCityLookup}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? "Loading..." : "Set"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoLocation}
                  disabled={isLoadingLocation}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
                {settings.location && (
                  <p className="text-xs text-muted-foreground">
                    Current: {settings.location.city || `${settings.location.lat.toFixed(2)}, ${settings.location.lon.toFixed(2)}`}
                  </p>
                )}
              </div>
            )}

            {/* Minimum Confidence */}
            <div className="space-y-3">
              <Label>
                Minimum Confidence: {Math.round(settings.minConfidence * 100)}%
              </Label>
              <p className="text-sm text-muted-foreground">
                Only show predictions with confidence above this threshold
              </p>
              <Slider
                value={[settings.minConfidence * 100]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, minConfidence: value / 100 })
                }
                min={40}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>40% (More predictions)</span>
                <span>90% (Only high confidence)</span>
              </div>
            </div>

            {/* Days to Predict */}
            <div className="space-y-3">
              <Label>
                Prediction Window: {settings.daysToPredict} days
              </Label>
              <p className="text-sm text-muted-foreground">
                How many days ahead to generate predictions
              </p>
              <Slider
                value={[settings.daysToPredict]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, daysToPredict: value })
                }
                min={1}
                max={7}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>

        {/* Info */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">How Predictions Work:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Analyzes patterns in your journal entries</li>
            <li>Detects day-of-week and monthly cycles</li>
            <li>Correlates symptoms with weather changes</li>
            <li>Provides preventive recommendations</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default PredictionSettings;
