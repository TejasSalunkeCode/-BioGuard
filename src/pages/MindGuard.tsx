import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

const MindGuard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-950/20 rounded-2xl mb-4">
            <Brain className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">MindGuard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mental health self-check and wellness resources
          </p>
        </div>

        <Card className="p-8 shadow-card animate-slide-up text-center">
          <p className="text-muted-foreground">Coming soon - Mental health assessment and support resources</p>
        </Card>
      </div>
    </div>
  );
};

export default MindGuard;
