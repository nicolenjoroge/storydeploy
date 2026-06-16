
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
import json
from fastapi.middleware.cors import CORSMiddleware
import os, uuid
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
import shutil
import time
import gc


app = FastAPI()



# ✅ CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
#     allow_headers=["*"]
# )

# Serve frontend assets (CSS/JS/images)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve JSON data folder (optional but useful)
app.mount("/data", StaticFiles(directory="data"), name="data")

DATA_FILE = "data/story.json"
API_BASE = os.getenv("API_BASE", "")



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("data", exist_ok=True)
os.makedirs("static", exist_ok=True)

# ---------------------------------------
# ✅ Utils
# ---------------------------------------
def read_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def write_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------
# ✅ GET FULL CONTENT
# ---------------------------------------
# @app.get("/")
# def get_all():
#     return read_data()

@app.get("/")
def home():
    return FileResponse("templates/index.html")

@app.get("/cmsportal")
def page2():
    return FileResponse("templates/cmsportal.html")

# ---------------------------------------
# ✅ GET MEDIA(IMAGES/VIDEOS)
# ---------------------------------------

# Track active stream connections by filename
active_streams: dict[str, bool] = {}
# Store open file handles by filename
open_handles: dict[str, object] = {}

@app.get("/stream/{filename}")
async def stream_media(filename: str, request: Request):
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        raise HTTPException(404, "File not found")

    file_size = os.path.getsize(path)
    ext = filename.rsplit(".", 1)[-1].lower()
    media_types = {
        "mp4": "video/mp4", "webm": "video/webm",
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png", "webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    range_header = request.headers.get("range")

    active_streams[filename] = True

    if range_header:
        start, end = range_header.replace("bytes=", "").split("-")
        start = int(start)
        end = int(end) if end else file_size - 1
        chunk_size = end - start + 1

        def iter_range():
            f = open(path, "rb")
            open_handles[filename] = f          # ← store handle
            try:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    if not active_streams.get(filename, True):
                        break
                    data = f.read(min(1024 * 1024, remaining))
                    if not data:
                        break
                    remaining -= len(data)
                    yield data
            finally:
                f.close()
                open_handles.pop(filename, None)  # ← remove handle
                active_streams.pop(filename, None)

        return StreamingResponse(
            iter_range(), status_code=206, media_type=media_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
            }
        )

    def iter_file():
        f = open(path, "rb")
        open_handles[filename] = f              # ← store handle
        try:
            while chunk := f.read(1024 * 1024):
                if not active_streams.get(filename, True):
                    break
                yield chunk
        finally:
            f.close()
            open_handles.pop(filename, None)    # ← remove handle
            active_streams.pop(filename, None)

    return StreamingResponse(
        iter_file(), media_type=media_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        }
    )


# ---------------------------------------
# MEDIA RESET 
# ---------------------------------------
@app.head("/stream/{filename}")
async def check_media(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return Response(status_code=200)


# ---------------------------------------
# UPLOAD MEDIA 
# ---------------------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    
    print(f"UPLOAD: writing to {path}")  # ← confirm this is the upload endpoint
    
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/stream/{filename}"}

# ---------------------------------------
# ✅ DELETE MEDIA FROM STORAGE
# ---------------------------------------


@app.delete("/media/{filename}")
def delete_upload(filename: str):
    filename = os.path.basename(filename)
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {"message": "File not found, nothing to delete"}

    # Signal stream to stop
    active_streams[filename] = False

    # Force-close any open file handle
    handle = open_handles.pop(filename, None)
    if handle:
        try:
            handle.close()
            print(f"Force-closed handle for {filename}")
        except Exception as e:
            print(f"Handle close error: {e}")

    # Run garbage collector to flush any remaining references
    gc.collect()

    # Retry delete
    for attempt in range(20):
        try:
            os.remove(path)
            active_streams.pop(filename, None)
            print(f"Deleted {filename} on attempt {attempt + 1}")
            return {"message": "File deleted"}
        except PermissionError:
            print(f"Still locked attempt {attempt + 1}, waiting...")
            time.sleep(0.5)

    raise HTTPException(423, "File could not be released. Try again.")


# ---------------------------------------
# ✅ UPDATE ALL ITEMS 
# ---------------------------------------
@app.put("/")
def update_all(data: dict):
    write_data(data)
    return {"message": "All data updated"}


# ---------------------------------------
# ✅ DELETE ITEM
# ---------------------------------------
@app.delete("/{section}/{list_name}/{index}")
def delete_item(section: str, list_name: str, index: int):
    data = read_data()

    section_key = f"section_{section}"

    try:
        data[section_key][list_name].pop(index)
    except (KeyError, IndexError):
        raise HTTPException(400, "Invalid section/list/index")

    write_data(data)

    return {"message": "Item deleted successfully"}

# ---------------------------------------
# ✅ UPDATE WHOLE SECTION
# ---------------------------------------
# @app.put("/section/{section_id}")
# def update_section(section_id: str, payload: dict):
#     data = read_data()

#     key = f"section_{section_id}"

#     if key not in data:
#         raise HTTPException(404, "Section not found")

#     data[key] = payload
#     write_data(data)

#     return {"message": f"{key} updated successfully"}


# ---------------------------------------
# ✅ ADD ITEM (SECTION 3, 4, 5)
# ---------------------------------------
@app.post("/{section}/{list_name}")
def add_item(section: str, list_name: str, item: dict):
    data = read_data()

    section_key = f"section_{section}"

    if section_key not in data:
        raise HTTPException(404, "Section not found")

    if list_name not in data:
        raise HTTPException(400, "List not found")

    data[section_key][list_name].append(item)

    write_data(data)

    return {"message": "Item added successfully"}



# ---------------------------------------
# ACCESS IMAGES
# ---------------------------------------
# app.mount(
#     "/uploads",
#     StaticFiles(directory="uploads"),
#     name = "uploads"
# )


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "main:app",
#         host="127.0.0.1",
#         port=8000,
#         timeout_keep_alive=300,        # keep connection alive for 5 mins
#         h11_max_incomplete_event_size=500 * 1024 * 1024,  # 500MB
#     )

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=int(os.environ.get("PORT", 8000)),
#         timeout_keep_alive=300,        # keep connection alive for 5 mins
#         h11_max_incomplete_event_size=500 * 1024 * 1024,
#     )