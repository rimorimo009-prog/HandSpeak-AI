export type PredictResponse = {
  ok: boolean;
  word?: string;          // if backend returns 'word'
  confidence?: number;

  class_index?: number;   // if backend returns 'class_index'
  message?: string;
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const indexToLabel = (idx: number) => {
  // A-Z mapping (0->A, 1->B ... 25->Z)
  const code = "A".charCodeAt(0) + idx;
  if (code < 65 || code > 90) return "Unknown";
  return String.fromCharCode(code);
};

export async function predictSign(imageBlob: Blob): Promise<{ word: string; confidence: number }> {
  const form = new FormData();
  form.append("file", imageBlob, "frame.jpg");

  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const data = (await res.json()) as PredictResponse;

  if (!data.ok) {
    throw new Error(data.message || "Prediction failed");
  }

  // ✅ Option A: backend returns { word, confidence }
  if (data.word && typeof data.confidence === "number") {
    return { word: data.word, confidence: data.confidence };
  }

  // ✅ Option B: your current server.py returns { class_index, confidence }
  if (typeof data.class_index === "number" && typeof data.confidence === "number") {
    return { word: indexToLabel(data.class_index), confidence: data.confidence };
  }

  throw new Error("Invalid response from backend");
}
