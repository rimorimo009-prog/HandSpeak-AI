import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, RotateCcw } from "lucide-react";
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
        if (!blob) reject(new Error("Failed to convert canvas to image."));
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
  formData.append("file", blob, "frame.jpg"); // ✅ key MUST be "file"

  const res = await fetch(PREDICT_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as PredictApiResponse;

  // Case 1: ok false
  if ("ok" in data && data.ok === false) {
    throw new Error(data.message || "Prediction failed on the backend.");
  }

  // Case 2: ok true but detected false (hand not found)
  const detected = (data as any).detected;
  if (detected === false) {
    return { detected: false as const };
  }

  // Case 3: ok true and detected true (preferred response shape from app.py)
  const char = (data as any).char;
  const confidence = Number((data as any).confidence ?? 0);

  // If your backend is server.py style (class_index only), fallback
  const classIndex = (data as any).class_index;

  return {
    detected: true as const,
    word: char ?? (typeof classIndex === "number" ? `Class ${classIndex}` : "Unknown"),
    confidence,
  };
}

const RealtimeDetection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [prediction, setPrediction] = useState<{ word: string; confidence: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access the camera. Please check permissions and try again.",
      });
    }
  };

  const captureAndPredict = async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    // 1) Capture current frame from video into canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);

    try {
      // 2) Call backend /predict
      const result = await predictFromBackend(canvas);

      if (!result.detected) {
        toast({
          variant: "destructive",
          title: "No Hand Detected",
          description: "Please keep your hand clearly visible in the frame and try again.",
        });
        setPrediction(null);
        return;
      }

      const word = result.word;
      const confidence = result.confidence;

      setPrediction({ word, confidence });

      // 3) Save to Supabase history
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.from("predictions").insert({
          user_id: session.user.id,
          predicted_word: word,
          confidence,
          prediction_type: "realtime",
        });
      }

      // 4) Toast
      toast({
        title: "Prediction Complete",
        description: `Detected: ${word}`,
      });
    } catch (error: any) {
      console.error("Prediction error:", error);

      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: error?.message || "There was a problem predicting the sign. Please try again.",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const resetPrediction = () => setPrediction(null);

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
          <h1 className="text-xl font-bold">Real-Time Detection</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Camera View */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white">Loading camera...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={captureAndPredict}
              disabled={isCapturing || !stream}
              className="flex-1 max-w-xs"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isCapturing ? "Processing..." : "Capture & Predict"}
            </Button>

            {prediction && (
              <Button size="lg" variant="outline" onClick={resetPrediction}>
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
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

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default RealtimeDetection;
