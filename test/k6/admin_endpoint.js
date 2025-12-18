import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";

const ADMIN_BASE_URL = __ENV.ADMIN_BASE_URL || "http://localhost:3000";
const DURATION = __ENV.DURATION || "20s";

function fetchAdminPage(path, label) {
  const res = http.get(`${ADMIN_BASE_URL}${path}`, { redirects: 10 });
  check(res, { [`${label} status <400`]: (r) => r.status < 400 });
  if (res.status >= 400) {
    console.error(`${label} failed: ${res.status} ${res.body}`);
  }
  return res;
}

export const options = {
  scenarios: {
    admin_auth: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_dashboard: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_announcement: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_config: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_dtr: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_session_log: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
    admin_user: {
      executor: "constant-vus",
      duration: DURATION,
      vus: 3,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const scen = scenario.name;

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
}
