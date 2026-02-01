"""
Download model weights at build/startup time.
Set MODEL_URL environment variable to your model file URL.
"""
import os
import urllib.request
from pathlib import Path


def download_file(url: str, dest: Path) -> None:
    """Download a file from URL to destination."""
    print(f"Downloading {url} to {dest}...")
    urllib.request.urlretrieve(url, dest)
    print(f"Downloaded successfully: {dest}")


def ensure_models() -> None:
    """Ensure all required model files exist."""
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(exist_ok=True)

    # Main Keypoint RCNN model
    keypoint_model = models_dir / "keypointsrcnn_weights.pt"
    if not keypoint_model.exists():
        model_url = os.getenv("MODEL_URL")
        if model_url:
            download_file(model_url, keypoint_model)
        else:
            print("Warning: keypointsrcnn_weights.pt not found and MODEL_URL not set")
            print("Set MODEL_URL environment variable to download the model")

    # MediaPipe models (should already be in repo)
    for task_file in ["pose_landmarker_lite.task", "pose_landmarker_full.task"]:
        task_path = models_dir / task_file
        if not task_path.exists():
            print(f"Warning: {task_file} not found")


if __name__ == "__main__":
    ensure_models()
