# backend/app.py
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from cvzone.HandTrackingModule import HandDetector

from asl_rules import predict_with_rules  # your rules file

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend connect easy (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "cnn8grps_rad1_model.h5"
OFFSET = 29

# Load once
model = load_model(MODEL_PATH)

# Detectors (same settings as final_pred.py)
hd = HandDetector(maxHands=1)
hd2 = HandDetector(maxHands=1)

# White background (same size)
WHITE_BG = np.ones((400, 400, 3), dtype=np.uint8) * 255


@app.get("/health")
def health():
    return {"status": "ok"}


def draw_skeleton_on_white(pts, w, h):
    """
    EXACT same skeleton drawing as final_pred.py.
    pts: 21 landmarks
    w,h: bbox size used for centering
    """
    white = WHITE_BG.copy()

    os_ = ((400 - w) // 2) - 15
    os1_ = ((400 - h) // 2) - 15

    # Lines
    for t in range(0, 4):
        cv2.line(white, (pts[t][0] + os_, pts[t][1] + os1_), (pts[t + 1][0] + os_, pts[t + 1][1] + os1_), (0, 255, 0), 3)
    for t in range(5, 8):
        cv2.line(white, (pts[t][0] + os_, pts[t][1] + os1_), (pts[t + 1][0] + os_, pts[t + 1][1] + os1_), (0, 255, 0), 3)
    for t in range(9, 12):
        cv2.line(white, (pts[t][0] + os_, pts[t][1] + os1_), (pts[t + 1][0] + os_, pts[t + 1][1] + os1_), (0, 255, 0), 3)
    for t in range(13, 16):
        cv2.line(white, (pts[t][0] + os_, pts[t][1] + os1_), (pts[t + 1][0] + os_, pts[t + 1][1] + os1_), (0, 255, 0), 3)
    for t in range(17, 20):
        cv2.line(white, (pts[t][0] + os_, pts[t][1] + os1_), (pts[t + 1][0] + os_, pts[t + 1][1] + os1_), (0, 255, 0), 3)

    cv2.line(white, (pts[5][0] + os_, pts[5][1] + os1_), (pts[9][0] + os_, pts[9][1] + os1_), (0, 255, 0), 3)
    cv2.line(white, (pts[9][0] + os_, pts[9][1] + os1_), (pts[13][0] + os_, pts[13][1] + os1_), (0, 255, 0), 3)
    cv2.line(white, (pts[13][0] + os_, pts[13][1] + os1_), (pts[17][0] + os_, pts[17][1] + os1_), (0, 255, 0), 3)
    cv2.line(white, (pts[0][0] + os_, pts[0][1] + os1_), (pts[5][0] + os_, pts[5][1] + os1_), (0, 255, 0), 3)
    cv2.line(white, (pts[0][0] + os_, pts[0][1] + os1_), (pts[17][0] + os_, pts[17][1] + os1_), (0, 255, 0), 3)

    for i in range(21):
        cv2.circle(white, (pts[i][0] + os_, pts[i][1] + os1_), 2, (0, 0, 255), 1)

    return white


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {"ok": False, "detected": False, "char": "", "confidence": 0}

    # ✅ VERY IMPORTANT (SAME AS final_pred.py)
    img = cv2.flip(img, 1)

    # detect on full image (like final_pred.py uses hd)
    hands = hd.findHands(img, draw=False, flipType=True)
    if not hands or not hands[0]:
        return {"ok": True, "detected": False, "char": "", "confidence": 0}

    hand = hands[0][0]
    x, y, w, h = hand["bbox"]

    # crop with OFFSET (very important)
    y1 = max(0, y - OFFSET)
    y2 = min(img.shape[0], y + h + OFFSET)
    x1 = max(0, x - OFFSET)
    x2 = min(img.shape[1], x + w + OFFSET)
    crop = img[y1:y2, x1:x2]

    if crop.size == 0:
        return {"ok": True, "detected": False, "char": "", "confidence": 0}

    # detect again on crop (like final_pred.py uses hd2)
    hands2 = hd2.findHands(crop, draw=False, flipType=True)
    if not hands2 or not hands2[0]:
        return {"ok": True, "detected": False, "char": "", "confidence": 0}

    hand2 = hands2[0][0]
    pts = hand2["lmList"]  # rules need this

    # ✅ IMPORTANT for better consistency:
    # Use bbox from crop-hand for centering (fixes many "cropped image" wrong cases)
    w2, h2 = hand2["bbox"][2], hand2["bbox"][3]

    # Build CNN input: 400x400 skeleton
    white = draw_skeleton_on_white(pts, w2, h2)

    # CNN + rules
    final_char, conf, top = predict_with_rules(model, white, pts)

    detected = True
    if isinstance(final_char, str) and final_char.strip() == "":
        detected = False

    return {
        "ok": True,
        "detected": detected,
        "char": final_char if detected else "",
        "confidence": float(conf),
        "top": top
    }
