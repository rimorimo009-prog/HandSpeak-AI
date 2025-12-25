import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, RotateCcw } from "lucide-react";
import PredictionDisplay from "@/components/PredictionDisplay";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PredictApiResponse =
  | { ok: false; message?: string }
  | {
      ok: true;
      detected?: boolean;
      char?: string;
      confidence?: number;
      class_index?: number;
      top?: any;
      message?: string;
    };

const BACKEND_URL = "http://localhost:8000"; // ✅ backend port
const PREDICT_ENDPOINT = `${BACKEND_URL}/predict`;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to convert image to upload format."));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

async function predictFromBackend(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas);

  const formData = new FormData();
  formData.append("file", blob, "image.jpg"); // ✅ key MUST be "file"

  const res = await fetch(PREDICT_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as PredictApiResponse;

  if ("ok" in data && data.ok === false) {
    throw new Error(data.message || "Prediction failed on the backend.");
  }

  const detected = (data as any).detected;
  if (detected === false) {
    return { detected: false as const };
  }

  const char = (data as any).char;
  const confidence = Number((data as any).confidence ?? 0);
  const classIndex = (data as any).class_index;

  return {
    detected: true as const,
    word: char ?? (typeof classIndex === "number" ? `Class ${classIndex}` : "Unknown"),
    confidence,
  };
}

const StaticImage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ word: string; confidence: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setPrediction(null);
    };
    reader.readAsDataURL(file);
  };

  const predictFromImage = async () => {
    if (!image) return;

    setIsProcessing(true);

    const img = new Image();
    img.src = image;

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to process this image. Please try another image.",
        });
        setIsProcessing(false);
        return;
      }

      // Draw uploaded image on canvas
      ctx.drawImage(img, 0, 0);

      try {
        // Call backend /predict
        const result = await predictFromBackend(canvas);

        if (!result.detected) {
          toast({
            variant: "destructive",
            title: "No Hand Detected",
            description: "No hand was detected in this image. Please upload a clearer hand image.",
          });
          setPrediction(null);
          return;
        }

        const word = result.word;
        const confidence = result.confidence;

        setPrediction({ word, confidence });

        // Save to Supabase history (static prediction)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await supabase.from("predictions").insert({
            user_id: session.user.id,
            predicted_word: word,
            confidence,
            prediction_type: "static",
          });
        }

        toast({
          title: "Prediction Complete",
          description: `Detected: ${word}`,
        });
      } catch (error: any) {
        console.error("Static prediction error:", error);

        toast({
          variant: "destructive",
          title: "Prediction Failed",
          description: error?.message || "There was a problem predicting the sign. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load image. Please try again.",
      });
      setIsProcessing(false);
    };
  };

  const resetUpload = () => {
    setImage(null);
    setPrediction(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const speakWord = () => {
    if (prediction && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(prediction.word);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Static Image Detection</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Image Upload/Display */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image} alt="Uploaded" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-8">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No image uploaded</p>
                <p className="text-sm text-muted-foreground">Click below to upload an image</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-4 justify-center">
            {!image ? (
              <Button size="lg" onClick={() => fileInputRef.current?.click()} className="flex-1 max-w-xs">
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={predictFromImage} disabled={isProcessing} className="flex-1 max-w-xs">
                  {isProcessing ? "Processing..." : "Predict Sign"}
                </Button>
                <Button size="lg" variant="outline" onClick={resetUpload}>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Prediction Result */}
          {prediction && (
            <PredictionDisplay
              word={prediction.word}
              confidence={prediction.confidence}
              onSpeak={speakWord}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default StaticImage;
