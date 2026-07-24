"""Validate generated data invariants and local site references."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlsplit


SITE_ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = SITE_ROOT / "data" / "mapping-visualizations.js"
MODULE_PREFIX = "export const mappingVisualizations = "


def read_payload():
    source = DATA_FILE.read_text(encoding="utf-8").strip()
    assert source.startswith(MODULE_PREFIX), "Unexpected data module prefix"
    assert source.endswith(";"), "Unexpected data module suffix"
    return json.loads(source[len(MODULE_PREFIX) : -1])


def validate_payload(payload):
    meta = payload["meta"]
    assert meta["projects"] == 740
    assert meta["mapCoordinateGroups"] == 578
    assert meta["mapSharedProjects"] == 257
    assert meta["mapSharedGroups"] == 95
    assert meta["mapLargestStack"] == 12
    assert meta["leadershipKnown"] == 136
    assert meta["leadershipUnknown"] == 604
    assert meta["unknownStartDecade"] == 133

    type_topic = payload["typeTopic"]
    assert len(type_topic["types"]) == 11
    assert len(type_topic["topics"]) == 34
    assert len(type_topic["matrix"]) == 11
    assert all(len(row) == 34 for row in type_topic["matrix"])

    topics = payload["topicCooccurrence"]
    assert len(topics["topics"]) == 34
    assert len(topics["matrix"]) == 34
    assert all(len(row) == 34 for row in topics["matrix"])
    for row in range(34):
        assert topics["matrix"][row][row] == topics["topics"][row]["count"]
        for column in range(34):
            assert topics["matrix"][row][column] == topics["matrix"][column][row]

    ecosystem = payload["organizationContributor"]
    assert len(ecosystem["organizations"]) == 18
    assert len(ecosystem["contributors"]) == 11
    assert len(ecosystem["matrix"]) == 18
    assert all(len(row) == 11 for row in ecosystem["matrix"])

    era = payload["eraModalityDecade"]
    assert len(era["eras"]) == 9
    assert len(era["decades"]) == 9
    assert era["modalities"] == ["Digital", "Mixed", "Physical"]
    assert len(era["matrix"]) == 9
    assert all(len(row) == 9 for row in era["matrix"])
    assert all(len(cell) == 3 for row in era["matrix"] for cell in row)

    transparency = payload["fundingLeadership"]
    assert transparency["leadershipUnknown"] == 604
    assert transparency["leadershipKnown"] == 136
    assert len(transparency["funding"]) == 13
    leadership_tags = {
        item["name"]: item["count"] for item in transparency["leadershipTags"]
    }
    assert leadership_tags["Data Not Available"] == 604


def validate_local_references():
    html_files = list(SITE_ROOT.rglob("*.html"))
    missing = []
    for html_file in html_files:
        source = html_file.read_text(encoding="utf-8")
        for attribute, value in re.findall(
            r"""(?:href|src)=(["'])(.*?)\1""", source, flags=re.IGNORECASE
        ):
            del attribute
            if value.startswith(("http://", "https://", "#", "mailto:")):
                continue
            relative = urlsplit(value).path
            target = (html_file.parent / relative).resolve()
            if relative.endswith("/"):
                target = target / "index.html"
            if not target.exists():
                missing.append(f"{html_file.relative_to(SITE_ROOT)} -> {value}")
    assert not missing, "Missing local references:\n" + "\n".join(missing)

    index = (SITE_ROOT / "index.html").read_text(encoding="utf-8")
    expected_slugs = [
        "portfolio-health-growth",
        "clustered-project-map",
        "project-type-topic-heatmap",
        "topic-cooccurrence-matrix",
        "organization-contributor-ecosystem",
        "era-modality-decade-matrix",
        "funding-leadership-transparency",
    ]
    for slug in expected_slugs:
        assert f"visualizations/{slug}/" in index

    for page in (SITE_ROOT / "visualizations").glob("*/index.html"):
        source = page.read_text(encoding="utf-8")
        assert "https://sites.lib.jmu.edu/mappingbdh/" in source


def main():
    payload = read_payload()
    validate_payload(payload)
    validate_local_references()
    print(
        json.dumps(
            {
                "status": "ok",
                "projects": payload["meta"]["projects"],
                "visualizations": 7,
                "sharedCoordinateProjects": payload["meta"]["mapSharedProjects"],
                "unknownLeadership": payload["meta"]["leadershipUnknown"],
            }
        )
    )


if __name__ == "__main__":
    main()
