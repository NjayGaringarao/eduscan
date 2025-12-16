export const regex = {
  username: /^[a-zA-Z0-9_!@#$%^&.,]{5,20}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,_])[A-Za-z\d!@#$%^&*.,_]{8,256}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  mobile: /^09\d{9}$/, // Format: 09XXXXXXXXX
  studentNumber: /^\d{2}-\d{1}-\d{1}-\d{4}$/, // Format: XX-X-X-XXXX
  employeeNumber: /^[a-zA-Z0-9-]+$/, // Format: Alphanumeric with dashes
  name: /^[a-zñ.]{2,}(?:\s+[a-zñ.]{2,})*$/i,
  address: /^([A-Za-z0-9,-]{1,}\s){1,}[A-Za-z0-9,-]{1,}$/,
};
