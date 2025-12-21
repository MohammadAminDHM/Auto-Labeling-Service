#!/usr/bin/env python3
from PIL import Image
from inference.florence.florence_service import Florence2InferenceService

IMAGE_PATH = r"C:\Users\Home\Pictures\Camera Roll\WIN_20251018_11_54_49_Pro.jpg"

def main():
    service = Florence2InferenceService()
    image = Image.open(IMAGE_PATH).convert("RGB")

    task_key_map = {
        "object_detection": "<OD>",
        "open_vocabulary_detection": "<OPEN_VOCABULARY_DETECTION>",
        "segmentation": "<REGION_TO_SEGMENTATION>",
        "referring_expression_segmentation": "<REFERRING_EXPRESSION_SEGMENTATION>",
        "dense_region_caption": "<DENSE_REGION_CAPTION>",
        "region_proposal": "<REGION_PROPOSAL>",
        "caption": "<CAPTION>",
        "detailed_caption": "<DETAILED_CAPTION>",
        "more_detailed_caption": "<MORE_DETAILED_CAPTION>",
        "caption_to_phrase_grounding": "<CAPTION_TO_PHRASE_GROUNDING>",
        "region_to_category": "<REGION_TO_CATEGORY>",
        "region_to_description": "<REGION_TO_DESCRIPTION>",
        "ocr": "<OCR>",
        "ocr_with_region": "<OCR_WITH_REGION>"
    }

    def get_results(res_dict, key):
        return res_dict["results"].get(key, {})

    # -----------------------------
    # Object Detection
    # -----------------------------
    print("\n--- Object Detection ---")
    od_results = service.run_task(image, "Object Detection")
    print(get_results(od_results, task_key_map["object_detection"]))

    # -----------------------------
    # Open Vocabulary Detection
    # -----------------------------
    print("\n--- Open Vocabulary Detection ---")
    ovd_input = "person"
    ovd_results = service.run_task(image, "Open Vocabulary Detection", text_input=ovd_input)
    print(get_results(ovd_results, task_key_map["open_vocabulary_detection"]))

    # -----------------------------
    # Referring Expression Segmentation
    # -----------------------------
    print("\n--- Referring Expression Segmentation ---")
    res_input = "person holding a cup"
    res_results = service.run_task(image, "Referring Expression Segmentation", text_input=res_input)
    polygons_res = get_results(res_results, task_key_map["referring_expression_segmentation"])
    print(f"Polygons: {len(polygons_res.get('polygons', []))}")

    # -----------------------------
    # Region to Segmentation
    # -----------------------------
    print("\n--- Region to Segmentation ---")
    rts_input = "person"
    rts_results = service.run_task(image, "Region to Segmentation", text_input=rts_input)
    polygons_rts = get_results(rts_results, task_key_map["segmentation"])
    print(f"Polygons: {len(polygons_rts.get('polygons', []))}")

    # -----------------------------
    # OCR
    # -----------------------------
    print("\n--- OCR ---")
    ocr_results = service.run_task(image, "OCR")
    print(get_results(ocr_results, task_key_map["ocr"]))

    print("\n--- OCR with Region ---")
    ocr_region_results = service.run_task(image, "OCR with Region")
    print(get_results(ocr_region_results, task_key_map["ocr_with_region"]))

    # -----------------------------
    # Captioning
    # -----------------------------
    print("\n--- Caption ---")
    cap_results = service.run_task(image, "Caption")
    print(get_results(cap_results, task_key_map["caption"]))

    print("\n--- Detailed Caption ---")
    det_cap_results = service.run_task(image, "Detailed Caption")
    print(get_results(det_cap_results, task_key_map["detailed_caption"]))

    print("\n--- More Detailed Caption ---")
    more_det_cap_results = service.run_task(image, "More Detailed Caption")
    print(get_results(more_det_cap_results, task_key_map["more_detailed_caption"]))

    # -----------------------------
    # Dense Region Caption
    # -----------------------------
    print("\n--- Dense Region Caption ---")
    drc_results = service.run_task(image, "Dense Region Caption")
    print(get_results(drc_results, task_key_map["dense_region_caption"]))

    # -----------------------------
    # Region Proposal
    # -----------------------------
    print("\n--- Region Proposal ---")
    rp_results = service.run_task(image, "Region Proposal")
    print(get_results(rp_results, task_key_map["region_proposal"]))

    # -----------------------------
    # Region to Category / Description
    # -----------------------------
    print("\n--- Region to Category ---")
    rtc_input = "person"
    rtc_results = service.run_task(image, "Region to Category", text_input=rtc_input)
    print(get_results(rtc_results, task_key_map["region_to_category"]))

    print("\n--- Region to Description ---")
    rtd_input = "person"
    rtd_results = service.run_task(image, "Region to Description", text_input=rtd_input)
    print(get_results(rtd_results, task_key_map["region_to_description"]))

    # -----------------------------
    # Caption to Phrase Grounding
    # -----------------------------
    print("\n--- Caption to Phrase Grounding ---")
    grounding_input = "person holding a cup"
    cpg_results = service.run_task(image, "Caption to Phrase Grounding", text_input=grounding_input)
    print(get_results(cpg_results, task_key_map["caption_to_phrase_grounding"]))

if __name__ == "__main__":
    main()
