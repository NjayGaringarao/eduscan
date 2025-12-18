import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const ADMIN_BASE_URL = __ENV.ADMIN_BASE_URL || "http://localhost:3000";
const SERVICE_PASSWORD = __ENV.SERVICE_PASSWORD || "";
const REGISTERED_IMAGE =
  __ENV.REGISTERED_IMAGE || "test/data/registered_face.jpg";
const UNKNOWN_IMAGE = __ENV.UNKNOWN_IMAGE || "test/data/unknown_face.jpg";
const RATE = __ENV.RATE ? Number(__ENV.RATE) : 4; // requests per second
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

function fetchAdminPage(path, label) {
  const res = http.get(`${ADMIN_BASE_URL}${path}`, { redirects: 10 });
  check(res, { [`${label} status <400`]: (r) => r.status < 400 });
  if (res.status >= 400) {
    console.error(`${label} failed: ${res.status} ${res.body}`);
  }
  return res;
}

export let options = {
  scenarios: {
    face_match_registered: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 2)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    face_match_unknown: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    encode_registered: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 2)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    encode_unknown: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    admin_auth: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 3)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 10,
    },
    admin_dashboard: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 3)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    admin_announcement: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 8,
    },
    admin_config: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 8,
    },
    admin_dtr: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    admin_session_log: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 8,
    },
    admin_user: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    admin_user_create: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 8,
    },
    admin_user_edit: {
      executor: "constant-arrival-rate",
      rate: Math.max(1, Math.floor(RATE / 4)),
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 8,
    },
  },
  thresholds: {
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

  if (scen.startsWith("face_match")) {
    if (scen === "face_match_registered") {
      const res = postFaceMatch(registeredImageData);
      check(res, { "fm registered status 200": (r) => r.status === 200 });
      if (res.status !== 200)
        console.error(`fm registered failed: ${res.status} ${res.body}`);
    } else if (scen === "face_match_unknown") {
      const res = postFaceMatch(unknownImageData);
      check(res, { "fm unknown status 200": (r) => r.status === 200 });
      if (res.status !== 200)
        console.error(`fm unknown failed: ${res.status} ${res.body}`);
    }
  } else if (scen.startsWith("encode")) {
    if (scen === "encode_registered") {
      const res = postFaceEncoding(registeredImageData);
      check(res, { "enc registered status 200": (r) => r.status === 200 });
      if (res.status !== 200)
        console.error(`enc registered failed: ${res.status} ${res.body}`);
    } else if (scen === "encode_unknown") {
      const res = postFaceEncoding(unknownImageData);
      check(res, { "enc unknown status 200": (r) => r.status === 200 });
      if (res.status !== 200)
        console.error(`enc unknown failed: ${res.status} ${res.body}`);
    }
  } else if (scen.startsWith("admin_")) {
    if (scen === "admin_auth") {
      fetchAdminPage("/auth", "admin auth");
    } else if (scen === "admin_dashboard") {
      fetchAdminPage("/dashboard", "admin dashboard");
    } else if (scen === "admin_announcement") {
      fetchAdminPage("/announcement", "admin announcement");
    } else if (scen === "admin_config") {
      fetchAdminPage("/config", "admin config");
    } else if (scen === "admin_dtr") {
      fetchAdminPage("/dtr", "admin dtr");
    } else if (scen === "admin_session_log") {
      fetchAdminPage("/session_log", "admin session_log");
    } else if (scen === "admin_user") {
      fetchAdminPage("/user", "admin user list");
    } else if (scen === "admin_user_create") {
      fetchAdminPage("/user/create", "admin user create");
    } else if (scen === "admin_user_edit") {
      fetchAdminPage("/user/edit/123", "admin user edit");
    }
  } else {
    // unknown scenario: run a single registered face-match request
    const res = postFaceMatch(registeredImageData);
    check(res, { "fm default status 200": (r) => r.status === 200 });
    if (res.status !== 200)
      console.error(`default fm failed: ${res.status} ${res.body}`);
  }
}
