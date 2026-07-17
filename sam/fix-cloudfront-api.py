import json
import subprocess
import sys
import tempfile
from pathlib import Path

DIST_ID = "E1NYGHHMBFZFPP"
PROFILE = "im5.pro"
FIXED_POLICY = "b689b0a8-53d0-40ab-baf2-68738e2966ac"  # AllViewerExceptHostHeader


def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr or result.stdout, file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout


raw = run([
    "aws", "cloudfront", "get-distribution-config",
    "--profile", PROFILE,
    "--id", DIST_ID,
    "--output", "json",
])
payload = json.loads(raw)
etag = payload["ETag"]
config = payload["DistributionConfig"]

updated = False
for behavior in config.get("CacheBehaviors", {}).get("Items", []):
    if behavior.get("PathPattern") == "/api/*":
        if behavior.get("OriginRequestPolicyId") != FIXED_POLICY:
            behavior["OriginRequestPolicyId"] = FIXED_POLICY
            updated = True
            print(f"Updated /api/* OriginRequestPolicyId -> {FIXED_POLICY}")

if not updated:
    print("CloudFront API behavior already uses correct origin request policy.")
else:
    config_path = Path(tempfile.gettempdir()) / "cf-distribution-config.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")
    run([
        "aws", "cloudfront", "update-distribution",
        "--profile", PROFILE,
        "--id", DIST_ID,
        "--if-match", etag,
        "--distribution-config", f"file://{config_path.as_posix()}",
    ])
    print("CloudFront distribution update submitted.")

run([
    "aws", "cloudfront", "create-invalidation",
    "--profile", PROFILE,
    "--distribution-id", DIST_ID,
    "--paths", "/api/*",
])
print("CloudFront invalidation created for /api/*")
