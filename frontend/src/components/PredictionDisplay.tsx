import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface PredictionDisplayProps {
  word: string;
  confidence: number;
  onSpeak?: () => void;   // ← OPTIONAL bana diya
}

const PredictionDisplay = ({ word, confidence, onSpeak }: PredictionDisplayProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "bg-green-500";
    if (conf >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        {/* WORD TEXT */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Predicted Word</p>
          <h3 className="text-4xl font-bold text-primary">{word}</h3>
        </div>
        
        {/* CONFIDENCE + SPEAK BUTTON */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <Badge variant="secondary" className={`${getConfidenceColor(confidence)} text-white`}>
              {(confidence * 100).toFixed(1)}%
            </Badge>
          </div>

          {/* Speak button only if onSpeak exists */}
          {onSpeak && (
            <Button size="sm" variant="outline" onClick={onSpeak}>
              <Volume2 className="w-4 h-4 mr-2" />
              Speak
            </Button>
          )}
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getConfidenceColor(confidence)}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionDisplay;
