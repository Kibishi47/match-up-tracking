#!/usr/bin/env bash
set -e

# Detect active IP on macOS (active default interface / en0) or Linux
IP=$(ipconfig getifaddr $(route get default 2>/dev/null | grep interface | awk '{print $2}') 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

if [ -z "$IP" ]; then
  echo "Error: Could not detect active host IP address." >&2
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

node -e '
const fs = require("fs");
const ip = process.argv[1];
let content = fs.readFileSync(".env", "utf8");
if (/^HOST_IP=.*/m.test(content)) {
  content = content.replace(/^HOST_IP=.*/m, "HOST_IP=" + ip);
} else {
  content += (content.endsWith("\n") ? "" : "\n") + "HOST_IP=" + ip + "\n";
}
fs.writeFileSync(".env", content);
console.log("Updated HOST_IP=" + ip + " in .env");
' "$IP"
