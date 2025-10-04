import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Activity, Apple, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FitnessResult {
  bmi: number;
  status: string;
  dietPlan: string[];
  workoutPlan: string[];
}

const FitGuard = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [result, setResult] = useState<FitnessResult | null>(null);

  const calculateBMI = () => {
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    
    let status = "";
    if (bmi < 18.5) status = "Underweight";
    else if (bmi < 25) status = "Normal";
    else if (bmi < 30) status = "Overweight";
    else status = "Obese";

    setResult({
      bmi: parseFloat(bmi.toFixed(1)),
      status,
      dietPlan: [
        "Increase protein intake (lean meats, fish, legumes)",
        "Eat 5-6 small meals throughout the day",
        "Include plenty of vegetables and fruits",
        "Stay hydrated - drink 8-10 glasses of water daily",
        "Limit processed foods and added sugars"
      ],
      workoutPlan: [
        "Cardio: 30 minutes, 5 days a week (walking, jogging, cycling)",
        "Strength training: 3 days a week (bodyweight exercises, weights)",
        "Flexibility: Daily stretching routine (10-15 minutes)",
        "Rest: 2 days of active recovery per week"
      ]
    });
  };

  const getBMIColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-200";
      case "Underweight":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200";
      case "Overweight":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-200";
      case "Obese":
        return "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-950/20 rounded-2xl mb-4">
            <Dumbbell className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">FitGuard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate your BMI and get personalized diet and workout plans
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-card animate-slide-up">
          <h3 className="text-lg font-semibold mb-6">Enter Your Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={calculateBMI}
            disabled={!height || !weight || !age || !gender}
            className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
          >
            Calculate & Generate Plan
          </Button>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-scale-in">
            {/* BMI Result */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Your BMI Score</h3>
                  <p className="text-4xl font-bold text-primary">{result.bmi}</p>
                </div>
                <Badge className={`text-base px-4 py-2 ${getBMIColor(result.status)}`}>
                  {result.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>BMI = Weight (kg) / Height² (m²)</span>
              </div>
            </Card>

            {/* Diet Plan */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Apple className="h-5 w-5 text-green-500" />
                Personalized Diet Plan
              </h3>
              <ul className="space-y-3">
                {result.dietPlan.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 dark:bg-green-950/20 text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Workout Plan */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                Personalized Workout Plan
              </h3>
              <ul className="space-y-3">
                {result.workoutPlan.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/20 text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitGuard;
