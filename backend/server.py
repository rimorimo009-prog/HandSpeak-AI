import io
import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from cvzone.HandTrackingModule import HandDetector
from PIL import Image

# ---------- Config ----------
MODEL_PATH = "cnn8grps_rad1_model.h5"
WHITE_PATH = "white.jpg"
IMG_SIZE = 400
OFFSET = 29

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load once ----------
model = load_model(MODEL_PATH)
hd = HandDetector(maxHands=1)
hd2 = HandDetector(maxHands=1)

@app.get("/health")
def health():
    return {"status": "ok"}

def build_skeleton_image(frame_bgr):
    frame_bgr = cv2.flip(frame_bgr, 1)

    hands = hd.findHands(frame_bgr, draw=False, flipType=True)
    if not hands or not hands[0]:
        return None, None

    hand = hands[0][0]
    x, y, w, h = hand["bbox"]

    y1 = max(0, y - OFFSET)
    y2 = min(frame_bgr.shape[0], y + h + OFFSET)
    x1 = max(0, x - OFFSET)
    x2 = min(frame_bgr.shape[1], x + w + OFFSET)

    crop = frame_bgr[y1:y2, x1:x2]
    if crop.size == 0:
        return None, None

    white = cv2.imread(WHITE_PATH)
    if white is None:
        raise RuntimeError("white.jpg not found in backend folder")

    white = cv2.resize(white, (IMG_SIZE, IMG_SIZE))
    white[:] = 255

    handz = hd2.findHands(crop, draw=False, flipType=True)
    if not handz or not handz[0]:
        return None, None

    pts = handz[0][0]["lmList"]

    # shift into white canvas
    osx = ((IMG_SIZE - w) // 2) - 15
    osy = ((IMG_SIZE - h) // 2) - 15

    # draw skeleton lines (same as your code)
    for t in range(0, 4):
        cv2.line(white, (pts[t][0] + osx, pts[t][1] + osy), (pts[t+1][0] + osx, pts[t+1][1] + osy), (0,255,0), 3)
    for t in range(5, 8):
        cv2.line(white, (pts[t][0] + osx, pts[t][1] + osy), (pts[t+1][0] + osx, pts[t+1][1] + osy), (0,255,0), 3)
    for t in range(9, 12):
        cv2.line(white, (pts[t][0] + osx, pts[t][1] + osy), (pts[t+1][0] + osx, pts[t+1][1] + osy), (0,255,0), 3)
    for t in range(13, 16):
        cv2.line(white, (pts[t][0] + osx, pts[t][1] + osy), (pts[t+1][0] + osx, pts[t+1][1] + osy), (0,255,0), 3)
    for t in range(17, 20):
        cv2.line(white, (pts[t][0] + osx, pts[t][1] + osy), (pts[t+1][0] + osx, pts[t+1][1] + osy), (0,255,0), 3)

    cv2.line(white, (pts[5][0] + osx, pts[5][1] + osy), (pts[9][0] + osx, pts[9][1] + osy), (0,255,0), 3)
    cv2.line(white, (pts[9][0] + osx, pts[9][1] + osy), (pts[13][0] + osx, pts[13][1] + osy), (0,255,0), 3)
    cv2.line(white, (pts[13][0] + osx, pts[13][1] + osy), (pts[17][0] + osx, pts[17][1] + osy), (0,255,0), 3)
    cv2.line(white, (pts[0][0] + osx, pts[0][1] + osy), (pts[5][0] + osx, pts[5][1] + osy), (0,255,0), 3)
    cv2.line(white, (pts[0][0] + osx, pts[0][1] + osy), (pts[17][0] + osx, pts[17][1] + osy), (0,255,0), 3)

    for i in range(21):
        cv2.circle(white, (pts[i][0] + osx, pts[i][1] + osy), 2, (0,0,255), 1)

    return white, pts

def predict_letter(white_img):
    # same as your model usage
    x = white_img.reshape(1, 400, 400, 3)
    prob = np.array(model.predict(x, verbose=0)[0], dtype="float32")
    top = int(np.argmax(prob))
    conf = float(np.max(prob))
    return top, conf

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")
    frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    white, pts = build_skeleton_image(frame)
    if white is None:
        return {"ok": False, "message": "No hand detected"}

    cls, conf = predict_letter(white)

    # NOTE: Your big rule-based mapping (A/B/C...) is long.
    # For web API, first return class index. Then we add full mapping next.
    return {
        "ok": True,
        "class_index": cls,
        "confidence": conf
    }
