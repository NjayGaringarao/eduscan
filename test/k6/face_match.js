import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";

// Configuration via env variables
const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const SERVICE_PASSWORD = __ENV.SERVICE_PASSWORD || "";
// Default to test/data to keep test assets scoped to test
const REGISTERED_IMAGE =
  __ENV.REGISTERED_IMAGE || "test/data/registered_face.jpg";
const UNKNOWN_IMAGE = __ENV.UNKNOWN_IMAGE || "test/data/unknown_face.jpg";
const RATE = __ENV.RATE ? Number(__ENV.RATE) : 5; // requests per second
const DURATION = __ENV.DURATION || "30s";

// Helper: open file at init time (must be called in global scope)
function openImageFile(imagePath) {
  const hasExt = /\.[^./]+$/.test(imagePath);
  const base = imagePath.replace(/^.*\//, "");
  const candidates = [];

  if (imagePath.startsWith("/")) candidates.push(imagePath);
  else if (imagePath.startsWith("test/")) candidates.push(imagePath);
  else
    candidates.push(imagePath, `test/${imagePath}`, `test/data/${imagePath}`);

  if (!hasExt) {
    candidates.push(`test/data/${base}.jpg`, `test/data/${base}.jpeg`);
  }

  const seen = new Set();
  const uniq = [];
  for (const p of candidates) {
    if (!seen.has(p)) {
      seen.add(p);
      uniq.push(p);
    }
  }

  let fileBytes = null;
  let usedPath = null;
  for (const p of uniq) {
    try {
      fileBytes = open(p, "b");
      usedPath = p;
      break;
    } catch (err) {}
  }

  if (!fileBytes) {
    console.error(`INIT: file not found; tried: ${uniq.join(", ")}`);
    return { error: `file ${imagePath} not found`, tried: uniq };
  }
  console.log(`INIT: opened ${usedPath} (${fileBytes.length} bytes)`);
  return { bytes: fileBytes, path: usedPath };
}

// Open images at init time (global scope)
const registeredImageData = openImageFile(REGISTERED_IMAGE);
const unknownImageData = openImageFile(UNKNOWN_IMAGE);

export let options = {
  scenarios: {
    registered_match: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 1,
    },
    unknown_match: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 1,
    },
  },
  thresholds: {
    "http_req_duration{scenario:registered_match}": ["p(95)<5000"],
    http_req_failed: ["rate<0.10"],
  },
};

function postFaceMatch(imageData) {
  if (imageData.error) {
    console.error(`fm: ${imageData.error}`);
    return { status: 0, body: imageData.error };
  }
  const url = `${BASE_URL}/api/face-match`;
  const headers = { "X-Service-Password": SERVICE_PASSWORD };
  const filename = imageData.path.split("/").pop();
  const formData = {
    image: http.file(imageData.bytes, filename, "image/jpeg"),
  };
  return http.post(url, formData, { headers });
}

export default function () {
  // k6 runs this function for each scenario separately; use the scenario.name to decide behavior
  const scen = scenario.name;

  if (scen === "registered_match") {
    const res = postFaceMatch(registeredImageData);
    check(res, { "registered status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `registered_match failure: status=${res.status} body=${res.body}`
      );
    }
  } else if (scen === "unknown_match") {
    const res = postFaceMatch(unknownImageData);
    check(res, { "unknown status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `unknown_match failure: status=${res.status} body=${res.body}`
      );
    }
  } else {
    // Unknown scenario: make a single registered_match request as a safe default
    const res = postFaceMatch(registeredImageData);
    check(res, { "registered status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `default registered_match failure: status=${res.status} body=${res.body}`
      );
    }
  }
}
