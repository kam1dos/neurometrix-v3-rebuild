#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List
from xml.etree import ElementTree as ET
from zipfile import ZipFile

SPREADSHEET_NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert the clinical protocol workbook into a JS data module.",
    )
    parser.add_argument("input", type=Path, help="Path to the source .xlsx workbook")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/protocolsDatabase.js"),
        help="Output JS module path",
    )
    return parser.parse_args()


def column_letters(cell_ref: str) -> str:
    return "".join(char for char in cell_ref if char.isalpha())


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return re.sub(r"_+", "_", slug)


def normalize_match_key(value: str) -> str:
    value = normalize_text(value).lower()
    value = (
        value.replace("™", "")
        .replace("®", "")
        .replace("(r)", "")
        .replace("(tm)", "")
    )
    return re.sub(r"[^a-z0-9]+", "", value)


def split_list_field(value: str) -> List[str]:
    return [item.strip() for item in re.split(r";\s*", normalize_text(value)) if item.strip()]


def read_shared_strings(archive: ZipFile) -> List[str]:
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values: List[str] = []
    for item in root.findall("a:si", SPREADSHEET_NS):
        values.append(
            "".join(node.text or "" for node in item.iterfind(".//a:t", SPREADSHEET_NS))
        )
    return values


def read_sheet_rows(archive: ZipFile, sheet_path: str, shared_strings: List[str]) -> List[Dict[str, str]]:
    root = ET.fromstring(archive.read(sheet_path))
    rows = root.findall(".//a:sheetData/a:row", SPREADSHEET_NS)
    parsed_rows: List[Dict[str, str]] = []

    for row in rows:
        values: Dict[str, str] = {}
        for cell in row.findall("a:c", SPREADSHEET_NS):
            reference = cell.attrib.get("r", "")
            column = column_letters(reference)
            cell_type = cell.attrib.get("t")
            value = cell.findtext("a:v", default="", namespaces=SPREADSHEET_NS)

            if cell_type == "s" and value != "":
                value = shared_strings[int(value)]

            values[column] = normalize_text(value)

        parsed_rows.append(values)

    return parsed_rows


def dose_candidates(value: str) -> List[str]:
    return [item.strip() for item in re.split(r";\s*", normalize_text(value)) if item.strip()]


def match_dose(
    product: str,
    candidates: List[str],
    used_indices: set[int],
    dosage_summary: str,
) -> str:
    product_key = normalize_match_key(product)

    for index, candidate in enumerate(candidates):
        if index in used_indices:
            continue

        left_side = candidate.split(":", 1)[0]
        left_key = normalize_match_key(left_side)
        candidate_key = normalize_match_key(candidate)

        if left_key and (product_key.startswith(left_key) or left_key.startswith(product_key)):
            used_indices.add(index)
            return candidate

        if product_key and product_key in candidate_key:
            used_indices.add(index)
            return candidate

    for index, candidate in enumerate(candidates):
        if index not in used_indices:
            used_indices.add(index)
            return candidate

    return normalize_text(dosage_summary)


def build_supplements(products_value: str, dosage_value: str, highlights_value: str) -> List[Dict[str, str]]:
    products = [item.strip() for item in re.split(r",\s*", normalize_text(products_value)) if item.strip()]
    candidates = dose_candidates(dosage_value)
    used_indices: set[int] = set()
    highlights = normalize_text(highlights_value)
    supplements = []

    for product in products:
        dose = match_dose(product, candidates, used_indices, dosage_value) or normalize_text(dosage_value)
        supplements.append(
            {
                "name": product,
                "dose": dose,
                "notes": highlights,
            }
        )

    return supplements


def build_source_reference_map(rows: Iterable[Dict[str, str]]) -> Dict[str, str]:
    references: Dict[str, str] = {}
    for row in rows:
        index = normalize_text(row.get("A", ""))
        reference = normalize_text(row.get("B", ""))
        if index and reference and index.lower() != "index":
            references[index] = reference
    return references


def main() -> None:
    args = parse_args()

    with ZipFile(args.input) as archive:
        shared_strings = read_shared_strings(archive)
        condition_rows = read_sheet_rows(archive, "xl/worksheets/sheet1.xml", shared_strings)
        source_rows = read_sheet_rows(archive, "xl/worksheets/sheet2.xml", shared_strings)

    headers = condition_rows[0]
    data_rows = condition_rows[1:]
    sources_by_index = build_source_reference_map(source_rows[1:])

    conditions = []

    for row in data_rows:
        raw_source_ids = [item.strip() for item in row.get("H", "").split(",") if item.strip()]
        source_files = [sources_by_index[source_id] for source_id in raw_source_ids if source_id in sources_by_index]
        protocol_name = normalize_text(row.get("A", ""))
        biomarkers = split_list_field(row.get("B", ""))
        dietary = split_list_field(row.get("C", ""))
        lifestyle = split_list_field(row.get("D", ""))
        formula_highlights = split_list_field(row.get("G", ""))
        dosage_summary = normalize_text(row.get("F", ""))

        conditions.append(
            {
                "id": slugify(protocol_name),
                "name": protocol_name,
                "keyDiagnosticBiomarkers": biomarkers,
                "dietaryRecommendations": dietary,
                "lifestyleInterventions": lifestyle,
                "formulaHighlights": formula_highlights,
                "recommendedDosageSummary": dosage_summary,
                "sourceReferenceIds": raw_source_ids,
                "sourceReferences": source_files,
                "supplements": build_supplements(
                    row.get("E", ""),
                    dosage_summary,
                    row.get("G", ""),
                ),
            }
        )

    payload = {
        "sourceWorkbook": str(args.input),
        "columnHeaders": {
            "A": headers.get("A", ""),
            "B": headers.get("B", ""),
            "C": headers.get("C", ""),
            "D": headers.get("D", ""),
            "E": headers.get("E", ""),
            "F": headers.get("F", ""),
            "G": headers.get("G", ""),
            "H": headers.get("H", ""),
        },
        "conditionCount": len(conditions),
        "protocolsDatabase": conditions,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "// Generated by scripts/import_protocols_from_xlsx.py\n"
        f"export const sourceWorkbook = {json.dumps(payload['sourceWorkbook'])};\n"
        f"export const protocolColumnHeaders = {json.dumps(payload['columnHeaders'], indent=2)};\n"
        f"export const protocolCount = {payload['conditionCount']};\n"
        f"export const protocolsDatabase = {json.dumps(payload['protocolsDatabase'], indent=2)};\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(conditions)} protocols to {args.output}")


if __name__ == "__main__":
    main()
