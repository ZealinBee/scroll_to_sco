import base64
import io
import numpy as np
from PIL import Image
import torch
from torchvision import transforms


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode a base64 encoded image string to PIL Image."""
    # Handle data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))

    # Convert to RGB if necessary
    if image.mode != "RGB":
        image = image.convert("RGB")

    return image


def preprocess_for_model(image: Image.Image) -> torch.Tensor:
    """
    Preprocess image for Keypoint RCNN model.
    - Convert to tensor
    - Normalize to 0-1 range
    - Keep original size (model handles variable sizes)
    """
    transform = transforms.Compose([
        transforms.ToTensor(),  # Converts to [0, 1] range and [C, H, W] format
    ])

    tensor = transform(image)
    return tensor


def resize_if_needed(image: Image.Image, max_size: int = 1333) -> Image.Image:
    """
    Resize image if larger than max_size while maintaining aspect ratio.
    Keypoint RCNN works best with images around 800-1333 pixels.
    """
    width, height = image.size

    if max(width, height) > max_size:
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))

        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    return image


def image_to_numpy(image: Image.Image) -> np.ndarray:
    """Convert PIL Image to numpy array (RGB)."""
    return np.array(image)


def numpy_to_pil(array: np.ndarray) -> Image.Image:
    """Convert numpy array to PIL Image."""
    return Image.fromarray(array.astype(np.uint8))
