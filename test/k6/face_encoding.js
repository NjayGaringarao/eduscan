import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";

// Configuration via env variables
const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const SERVICE_PASSWORD = __ENV.SERVICE_PASSWORD || "";
const REGISTERED_IMAGE =
  __ENV.REGISTERED_IMAGE || "test/data/registered_face.jpg";
const UNKNOWN_IMAGE = __ENV.UNKNOWN_IMAGE || "test/data/unknown_face.jpg";
// Default to test/data to keep test assets scoped to test
const RATE = __ENV.RATE ? Number(__ENV.RATE) : 3; // requests per second
const DURATION = __ENV.DURATION || "20s";

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
    encode_registered: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    encode_unknown: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
  },
  thresholds: {
    "http_req_duration{scenario:encode_registered}": ["p(95)<2000"],
    http_req_failed: ["rate<0.10"],
  },
};

function postFaceEncoding(imageData) {
  if (imageData.error) {
    console.error(`enc: ${imageData.error}`);
    return { status: 0, body: imageData.error };
  }
  const url = `${BASE_URL}/api/face-encoding`;
  const headers = { "X-Service-Password": SERVICE_PASSWORD };
  const filename = imageData.path.split("/").pop();
  const formData = {
    image: http.file(imageData.bytes, filename, "image/jpeg"),
  };
  return http.post(url, formData, { headers });
}

export default function () {
  const scen = scenario.name;

  if (scen === "encode_registered") {
    const res = postFaceEncoding(registeredImageData);
    check(res, { "encode registered status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `encode_registered failure: status=${res.status} body=${res.body}`
      );
    }
  } else if (scen === "encode_unknown") {
    const res = postFaceEncoding(unknownImageData);
    check(res, { "encode unknown status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `encode_unknown failure: status=${res.status} body=${res.body}`
      );
    }
  } else {
    // Unknown scenario: perform a safe registered encode
    const res = postFaceEncoding(registeredImageData);
    check(res, { "encode registered status 200": (r) => r.status === 200 });
    if (res.status !== 200) {
      console.error(
        `default encode_registered failure: status=${res.status} body=${res.body}`
      );
    }
  }
}
