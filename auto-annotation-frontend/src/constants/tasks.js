// src/constants/tasks.js

export const FLORENCE_TASKS = {
  dense_region_caption: [],
  caption_grounding_detailed: ["text_input"],
  caption_grounding: ["text_input"],
  caption_to_phrase_grounding: ["text_input"],
  region_segmentation: [],
  referring_expression_segmentation: ["text_input"],
  caption: ["text_input"],
  ocr_with_region: [],
  ocr: [],
  caption_grounding_more_detailed: ["text_input"],
  region_category: ["text_input"],
  region_description: ["text_input"],
  region_proposal: [],
  detection: ["categories"],
  caption_detailed: ["text_input"],
  open_vocab_detection: ["categories"],
  caption_more_detailed: ["text_input"],
};

export const REXOMNI_TASKS = {
  detection: [],
  visual_prompt: ["text_input"],
  keypoints: [],
  ocr: [],
};

export function getTasksForModel(model) {
  if (model === "rexomni") return REXOMNI_TASKS;
  return FLORENCE_TASKS;
}
