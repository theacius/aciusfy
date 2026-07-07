import process from "node:process";
import { createRequire } from "node:module";
import rpc from "discord-rpc";

const require = createRequire(import.meta.url);
const { Client } = rpc;
const { pid: getPid } = require("discord-rpc/src/util");

const API = (process.env.ACIUSFY_API_URL || "http://localhost:3000").replace(/\/$/, "");
const TOKEN = process.env.ACIUSFY_DISCORD_PRESENCE_TOKEN;
const CLIENT_ID = process.env.DISCORD_RPC_CLIENT_ID;
const ASSET_KEY = process.env.ACIUSFY_DISCORD_ASSET_KEY || "aciusfy";
const POLL_MS = Math.max(8000, Number(process.env.ACIUSFY_DISCORD_POLL_MS || 12000));

if (!TOKEN || !CLIENT_ID) {
  console.error("Hata oluştu.");
  process.exit(1);
}

const client = new Client({ transport: "ipc" });

function setListeningRichPresence(cli, j) {
  const pid = getPid();
  const details = String(j.details || "Aciusfy").slice(0, 128);
  const state = String(j.state || " ").slice(0, 128);
  const startSec = Number(j.startTimestamp) || Math.floor(Date.now() / 1000);
  const endSec =
    j.endTimestamp != null && Number.isFinite(Number(j.endTimestamp)) ? Number(j.endTimestamp) : undefined;
  const startMs = startSec * 1000;
  const endMs = endSec != null ? endSec * 1000 : undefined;

  const assetKey = String(j.smallImageKey || j.largeImageKey || ASSET_KEY).slice(0, 128);
  const cover =
    typeof j.coverImageUrl === "string" && /^https?:\/\//i.test(j.coverImageUrl.trim())
      ? j.coverImageUrl.trim()
      : null;
  const co = cover || assetKey;
  const largeImage = co.startsWith("http")
    ? co.slice(0, 2048)
    : co.slice(0, 512);
  const largeText = String(j.largeImageText || details).slice(0, 128);
  const smallText = String(j.smallImageText || "Aciusfy").slice(0, 128);
  const displayName = String(j.activityName || "Aciusfy").slice(0, 128);
  const activityType = Number(j.activityType) === 2 || j.activityType === undefined ? 2 : Number(j.activityType) || 2;

  const activity = {
    type: activityType,
    name: displayName,
    details,
    state,
    instance: false,
    assets: {
      large_image: largeImage,
      large_text: largeText,
      small_image: assetKey,
      small_text: smallText,
    },
  };
  if (startMs || endMs) {
    activity.timestamps = {};
    if (startMs) activity.timestamps.start = startMs;
    if (endMs) activity.timestamps.end = endMs;
  }

  return cli.request("SET_ACTIVITY", { pid, activity });
}

async function fetchPresence() {
  const r = await fetch(`${API}/api/me/discord-presence`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (r.status === 401) {
    await client.clearActivity();
    return;
  }
  const j = await r.json().catch(() => ({}));
  if (!j.active) {
    await client.clearActivity();
    return;
  }
  await setListeningRichPresence(client, j);
}

client.on("ready", () => {
  console.error(`[aciusfy-discord] Bagli. API: ${API}, ${POLL_MS}ms aralik.`);
  const run = () => fetchPresence().catch((e) => console.error("[aciusfy-discord]", e));
  run();
  setInterval(run, POLL_MS);
});

client.login({ clientId: CLIENT_ID }).catch(() => {
  console.error("Hata oluştu.");
  process.exit(1);
});
