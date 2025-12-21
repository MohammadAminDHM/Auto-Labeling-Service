from enum import Enum

class TaskType(str, Enum):
    # --- Core Vision ---
    DETECTION = "detection"
    OPEN_VOCAB_DETECTION = "open_vocab_detection"
    OCR = "ocr"
    OCR_WITH_REGION = "ocr_with_region"

    # --- RexOmni-specific ---
    VISUAL_PROMPTING = "visual_prompting"
    KEYPOINT = "keypoint"

    # --- Captioning ---
    CAPTION = "caption"
    CAPTION_DETAILED = "caption_detailed"
    CAPTION_MORE_DETAILED = "caption_more_detailed"

    # --- Grounding ---
    CAPTION_GROUNDING = "caption_grounding"
    CAPTION_GROUNDING_DETAILED = "caption_grounding_detailed"
    CAPTION_GROUNDING_MORE_DETAILED = "caption_grounding_more_detailed"
    CAPTION_TO_PHRASE_GROUNDING = "caption_to_phrase_grounding"

    # --- Segmentation ---
    REFERRING_EXPRESSION_SEGMENTATION = "referring_expression_segmentation"
    REGION_SEGMENTATION = "region_segmentation"

    # --- Region Reasoning ---
    REGION_CATEGORY = "region_category"
    REGION_DESCRIPTION = "region_description"
    REGION_PROPOSAL = "region_proposal"
    DENSE_REGION_CAPTION = "dense_region_caption"
