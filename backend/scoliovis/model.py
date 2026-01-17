import os
import torch
from torchvision.models.detection import keypointrcnn_resnet50_fpn
from torchvision.models.detection.keypoint_rcnn import KeypointRCNN
from torchvision.models.detection.anchor_utils import AnchorGenerator
from typing import Dict, List, Any, Optional
from PIL import Image

from .preprocessing import preprocess_for_model, resize_if_needed


class SpineModel:
    """
    Singleton class for loading and running the Keypoint RCNN model
    for vertebrae detection.
    """
    _instance: Optional["SpineModel"] = None
    _model: Optional[KeypointRCNN] = None
    _device: Optional[torch.device] = None
    _loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self, weights_path: str = "models/keypointsrcnn_weights.pt") -> None:
        """Load the pre-trained model weights."""
        if self._loaded:
            return

        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self._device}")

        # Check if weights exist
        if not os.path.exists(weights_path):
            raise FileNotFoundError(
                f"Model weights not found at {weights_path}. "
                "Please download from https://github.com/Blankeos/scoliovis-training/releases"
            )

        # Create custom anchor generator to match checkpoint
        # The checkpoint was trained with 7 anchors per location
        # This uses 7 aspect ratios across 5 feature map levels
        anchor_generator = AnchorGenerator(
            sizes=((32,), (64,), (128,), (256,), (512,)),
            aspect_ratios=((0.25, 0.5, 0.75, 1.0, 1.33, 2.0, 4.0),) * 5
        )

        # Create model with custom configuration
        # ScolioVis uses 4 keypoints per vertebra (4 corners)
        self._model = keypointrcnn_resnet50_fpn(
            weights=None,
            num_classes=2,  # background + vertebra
            num_keypoints=4,  # 4 corners per vertebra
            rpn_anchor_generator=anchor_generator
        )

        # Load pre-trained weights
        checkpoint = torch.load(weights_path, map_location=self._device, weights_only=False)
        self._model.load_state_dict(checkpoint)

        self._model.to(self._device)
        self._model.eval()
        self._loaded = True
        print("Model loaded successfully!")

    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded

    @torch.no_grad()
    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Run inference on an image.

        Args:
            image: PIL Image in RGB format

        Returns:
            Dictionary with boxes, scores, keypoints
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        # Resize if too large
        image = resize_if_needed(image)

        # Preprocess
        tensor = preprocess_for_model(image)
        tensor = tensor.to(self._device)

        # Run inference
        outputs = self._model([tensor])

        # Extract first (and only) image results
        result = outputs[0]

        return {
            "boxes": result["boxes"],
            "scores": result["scores"],
            "keypoints": result["keypoints"]
        }


# Global model instance
_model_instance: Optional[SpineModel] = None


def get_model() -> SpineModel:
    """Get the global model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = SpineModel()
    return _model_instance


def load_model(weights_path: str = "models/keypointsrcnn_weights.pt") -> SpineModel:
    """Load the model and return the instance."""
    model = get_model()
    model.load(weights_path)
    return model
