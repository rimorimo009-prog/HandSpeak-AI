export type PredictResponse = {
  ok: boolean;
  detected: boolean;
  char: string;
  confidence: number;
  top?: unknown;
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

export async function predictImageBlob(blob: Blob): Promise<PredictResponse> {
  const form = new FormData();
  // backend expects field name "file"
  form.append("file", blob, "frame.jpg");

  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error("Canvas toBlob failed"));
      else resolve(b);
    }, type, quality);
  });
}
