from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

LOG_FILE = "update_logs.txt"

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    username: str = Form(...),
    user_id: str = Form(...)
):
    # Define file paths based on type and extension
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'file'
    file_paths = {
        "earthquake": f"earthquake.{ext}",
        "landslide": f"landslide.{ext}",
        "flooding": f"flooding.{ext}",
        "population": f"population.{ext}"
    }

    file_path = file_paths.get(type, f"{type}.{ext}")

    # Save the file, overwriting if exists
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Log the upload
    import datetime
    log_entry = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] User: {username} (ID: {user_id}) uploaded '{file.filename}' as type '{type}'\n"
    with open(LOG_FILE, "a") as log_f:
        log_f.write(log_entry)

    return {"message": f"File {file.filename} uploaded successfully as {file_path}"}

@app.get("/update-logs")
def get_update_logs():
    if Path(LOG_FILE).exists():
        with open(LOG_FILE, "r") as f:
            logs = f.read()
        return {"logs": logs}  # return the full text
    return {"logs": ""}