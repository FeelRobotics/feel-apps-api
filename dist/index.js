"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  apps: () => Apps_exports,
  destroy: () => destroy2,
  init: () => init7,
  initMobile: () => initMobile,
  initSlider: () => initSlider,
  setServers: () => setServers,
  subs: () => Subs_exports
});
module.exports = __toCommonJS(index_exports);

// src/apps/Apps.ts
var Apps_exports = {};
__export(Apps_exports, {
  data: () => PubnubRoomConnection_exports,
  destroy: () => destroy,
  getMobileAppLaunchUrl: () => getMobileAppLaunchUrl,
  init: () => init6,
  playSubtitle: () => playSubtitle,
  setServerUrl: () => setServerUrl,
  status: () => Status_exports
});

// src/apps/Status.ts
var Status_exports = {};
__export(Status_exports, {
  disconnect: () => disconnect,
  init: () => init,
  subscribe: () => subscribe,
  unsubscribe: () => unsubscribe
});
var statusCallbacks = [];
var _socket = null;
var settings = null;
var onDevicesChangedCallback = null;
var isOnline = false;
var userDevices = [];
var userDeviceDescriptions = [];
function emitStatus() {
  const event = {
    online: isOnline,
    devices: userDevices,
    deviceDescriptions: userDeviceDescriptions
  };
  statusCallbacks.forEach((cb) => cb(event));
}
function notifyDevicesChanged() {
  onDevicesChangedCallback == null ? void 0 : onDevicesChangedCallback(isOnline ? userDevices : []);
}
async function fetchUserDevices() {
  var _a;
  if (!settings) return;
  const url = `${settings.apiUrl}/jslib-api/v1/user/${settings.userId}/devices?partner_token=${settings.partnerToken}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    const result = await response.json();
    let devices2 = [];
    if (typeof result.devices === "string") {
      devices2 = JSON.parse(result.devices);
    } else if (Array.isArray(result.devices)) {
      devices2 = result.devices;
    }
    userDevices = devices2;
    userDeviceDescriptions = (_a = result.device_descriptions) != null ? _a : [];
    emitStatus();
    notifyDevicesChanged();
  } catch (err) {
    console.log(err);
  }
}
function onMessage(payload) {
  if (payload.message_type === "sharing:device_connected") {
    console.log("Status: mobile app connected");
    isOnline = true;
    emitStatus();
    notifyDevicesChanged();
    void fetchUserDevices();
  } else if (payload.message_type === "sharing:device_disconnected") {
    console.log("Status: mobile app disconnected");
    isOnline = false;
    emitStatus();
    notifyDevicesChanged();
  }
}
function subscribe(callback) {
  statusCallbacks.push(callback);
}
function unsubscribe(callback) {
  const idx = statusCallbacks.indexOf(callback);
  if (idx !== -1) statusCallbacks.splice(idx, 1);
}
function disconnect() {
  if (_socket) {
    _socket.off("message", onMessage);
    _socket = null;
  }
}
function init(socket, newSettings, onDevicesChanged2) {
  _socket = socket;
  settings = newSettings;
  onDevicesChangedCallback = onDevicesChanged2;
  isOnline = false;
  emitStatus();
  notifyDevicesChanged();
  socket.on("message", onMessage);
  void fetchUserDevices();
}

// src/apps/PubnubRoomConnection.ts
var PubnubRoomConnection_exports = {};
__export(PubnubRoomConnection_exports, {
  connect: () => connect,
  disconnect: () => disconnect2,
  send: () => send,
  subscribe: () => subscribe2,
  unsubscribe: () => unsubscribe2
});

// src/apps/PubnubMessageQueue.ts
var sendingInProgress = {};
var queues = {};
function push(channel, message) {
  if (!queues[channel]) queues[channel] = [];
  queues[channel].push(message);
}
function isSendingInProgress(channel) {
  var _a;
  return (_a = sendingInProgress[channel]) != null ? _a : false;
}
function startSending(channel) {
  sendingInProgress[channel] = true;
}
function endSending(channel) {
  sendingInProgress[channel] = false;
}
function getMessages(channel) {
  var _a;
  return (_a = queues[channel]) != null ? _a : [];
}
function reset(channel) {
  queues[channel] = [];
}
function isEmpty(channel) {
  var _a;
  return ((_a = queues[channel]) != null ? _a : []).length === 0;
}

// src/apps/PercentArrayFilter.ts
function filterIntermediateValues(values) {
  if (values.length <= 1) return values;
  const result = [values[0]];
  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const current = values[i];
    const next = values[i + 1];
    const monotone = prev.value <= current.value && current.value <= next.value || prev.value >= current.value && current.value >= next.value;
    if (!monotone) result.push(current);
  }
  result.push(values[values.length - 1]);
  return result;
}

// src/apps/SubtitleChunkUtils.ts
function getNextSubtitles(subtitles2, positionMsec, durationMsec) {
  let firstIndex = -1;
  let lastIndex = -1;
  for (let i = 0; i < subtitles2.length; i++) {
    const time = subtitles2[i].time;
    if (time <= positionMsec) firstIndex = i;
    if (time <= positionMsec + durationMsec) lastIndex = i;
  }
  return firstIndex >= 0 && lastIndex >= 0 ? subtitles2.slice(firstIndex, lastIndex + 1) : [];
}

// src/apps/SubtitleChunkPlayer.ts
var CHUNK_SIZE_MSEC = 7e4;
var TIME_BETWEEN_CHUNKS_MSEC = 6e4;
var lastMessageTime = null;
function sendStop(socket, roomId2) {
  const data = { room: roomId2, type: "stop", ver: 3 };
  console.log("room:stop", data);
  socket.emit("message", { room: roomId2, message_type: "room:stop", data });
}
function sendPlay(nextSubtitles, socket, roomId2) {
  var _a;
  const data = {
    room: roomId2,
    src: (_a = socket.id) != null ? _a : "",
    subtitles: nextSubtitles,
    type: "play",
    serverTime: Date.now(),
    ver: 3
  };
  console.log("room:play", data);
  socket.emit("message", { room: roomId2, message_type: "room:play", data });
}
function play(positionMsec, subtitles2, socket, roomId2) {
  if (!subtitles2 || subtitles2.length === 0) {
    sendStop(socket, roomId2);
    lastMessageTime = null;
    return;
  }
  if (lastMessageTime !== null && lastMessageTime + TIME_BETWEEN_CHUNKS_MSEC > positionMsec) {
    return;
  }
  lastMessageTime = positionMsec;
  const nextSubtitles = getNextSubtitles(subtitles2, positionMsec, CHUNK_SIZE_MSEC);
  sendPlay(nextSubtitles, socket, roomId2);
}
function reset2() {
  lastMessageTime = null;
}

// src/apps/PubnubRoomConnection.ts
var dataCallbacks = [];
var _socket2 = null;
var roomId = null;
var hereNowTimeout = null;
var clientMessageHandlerVersion = 3;
function emitData(percent, deviceName) {
  dataCallbacks.forEach((cb) => cb(percent, deviceName));
}
function onMessage2(payload) {
  if (!roomId) return;
  const { message_type, data } = payload;
  if (message_type === "room:device_data") {
    const d = data;
    if (d.src === (_socket2 == null ? void 0 : _socket2.id)) return;
    if (Array.isArray(d.values)) {
      for (const val of d.values) {
        emitData(val.value, d.from);
      }
    } else if (Array.isArray(d.percents)) {
      for (const p of d.percents) {
        emitData(p);
      }
    }
    return;
  }
  if (message_type === "webshare:presence") {
    const d = data;
    if (d.action === "join") {
      reset2();
    }
    return;
  }
}
function sendQueue() {
  var _a;
  if (!_socket2 || !roomId) return;
  startSending(roomId);
  const messages = getMessages(roomId);
  const filtered = filterIntermediateValues(messages);
  const data = {
    room: roomId,
    src: (_a = _socket2.id) != null ? _a : "",
    percents: filtered.map((m) => m.value),
    values: filtered.map((m) => {
      var _a2;
      return { to: (_a2 = m.to) != null ? _a2 : "", value: m.value };
    }),
    ver: 2
  };
  console.log("Sending room:device_data to FEC:", data);
  reset(roomId);
  const roomSnapshot = roomId;
  _socket2.emit(
    "message",
    { room: roomSnapshot, message_type: "room:device_data", data },
    () => {
      endSending(roomSnapshot);
      if (!isEmpty(roomSnapshot)) {
        sendQueue();
      }
    }
  );
}
function connect(socket, drsRoomName) {
  _socket2 = socket;
  roomId = drsRoomName;
  socket.emit("room:join", drsRoomName, () => {
    console.log("Joined FEC room:", drsRoomName);
  });
  socket.on("message", onMessage2);
  console.log("RoomConnection: listening on room", drsRoomName);
}
function disconnect2() {
  if (!_socket2 || !roomId) return;
  _socket2.emit("room:leave", roomId);
  _socket2.off("message", onMessage2);
  if (hereNowTimeout) clearTimeout(hereNowTimeout);
  roomId = null;
}
function send(percentValue, deviceId, positionMsec, subtitles2) {
  if (!_socket2 || !roomId) return;
  if (subtitles2 && clientMessageHandlerVersion >= 3) {
    play(positionMsec, subtitles2, _socket2, roomId);
  } else {
    const value = {
      value: percentValue,
      to: deviceId != null ? deviceId : ""
    };
    push(roomId, value);
    if (!isSendingInProgress(roomId)) {
      sendQueue();
    }
  }
}
function subscribe2(callback) {
  dataCallbacks.push(callback);
}
function unsubscribe2(callback) {
  const idx = dataCallbacks.indexOf(callback);
  if (idx !== -1) dataCallbacks.splice(idx, 1);
}

// src/subs/Subs.ts
var Subs_exports = {};
__export(Subs_exports, {
  devicesChanged: () => devicesChanged2,
  init: () => init5,
  load: () => load,
  offSubtitleEvent: () => offSubtitleEvent,
  onSubtitleEvent: () => onSubtitleEvent,
  play: () => play4,
  setClientId: () => setClientId2,
  stop: () => stop2,
  timeupdate: () => timeupdate2
});

// src/subs/PlayerLogic.ts
var videoStartTimeMillis = 0;
var nextSubtitleTimeout = null;
var subtitles = [];
function findNextSubtitle(pos) {
  for (const subtitle of subtitles) {
    if (subtitle.time > pos) return subtitle;
  }
  return null;
}
function play2(pos, onSubtitle2) {
  videoStartTimeMillis = Date.now() - pos;
  if (nextSubtitleTimeout) clearTimeout(nextSubtitleTimeout);
  nextSubtitleTimeout = null;
  const next = findNextSubtitle(pos);
  if (!next) return;
  const timeout = next.time - pos;
  nextSubtitleTimeout = setTimeout(() => {
    const now = Date.now();
    const newPos = now - videoStartTimeMillis;
    onSubtitle2(next, newPos, subtitles);
    play2(newPos, onSubtitle2);
  }, timeout);
}
function timeupdate(pos, onSubtitle2) {
  if (!nextSubtitleTimeout) return;
  play2(pos, onSubtitle2);
}
function stop() {
  if (nextSubtitleTimeout) clearTimeout(nextSubtitleTimeout);
  nextSubtitleTimeout = null;
}
function setSubtitles(subtitleMap) {
  subtitles = Object.entries(subtitleMap).map(([time, subtitle]) => ({ time: Number(time) * 1e3, subtitle })).sort((a, b) => a.time - b.time);
}
function getCurrentVideoPosition() {
  return Date.now() - videoStartTimeMillis;
}

// src/subs/Loader.ts
var settings2 = { apiUrl: "", apptoken: "", clientId: "" };
function init2(newSettings) {
  settings2 = newSettings;
}
function setClientId(clientId) {
  settings2 = __spreadProps(__spreadValues({}, settings2), { clientId });
}
async function loadSubtitlesInfo(videoId, subtitlesId, externalUserId, channel) {
  const id = parseInt(String(subtitlesId), 10);
  const params = new URLSearchParams();
  params.set("apptoken", settings2.apptoken);
  if (externalUserId) params.set("external_user_id", externalUserId);
  if (channel) params.set("channel", channel);
  if (settings2.clientId) params.set("pubnub_uuid", settings2.clientId);
  const url = `${settings2.apiUrl}/videos/${encodeURIComponent(videoId)}/subtitles/${id}?${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load subtitles: ${response.statusText}`);
  return response.json();
}

// src/subs/Logger.ts
var settings3 = { apiUrl: "", apptoken: "", clientId: "" };
var sessionId = null;
var devices = [];
var intervalStarted = false;
function init3(newSettings) {
  settings3 = newSettings;
}
function setSessionId(id) {
  sessionId = parseInt(String(id), 10);
}
function startInterval(currentTimeMsec) {
  intervalStarted = true;
  writeIntervalStart(currentTimeMsec);
}
function endInterval() {
  intervalStarted = false;
  writeIntervalEnd();
}
function devicesChanged(newDevices, currentTimeMsec) {
  const same = newDevices.length === devices.length && newDevices.every((d, i) => d === devices[i]);
  if (same) return;
  devices = newDevices;
  if (intervalStarted) writeIntervalStart(currentTimeMsec);
}
function writeIntervalStart(intervalStartMsec) {
  if (sessionId === null) return;
  const url = `${settings3.apiUrl}/sessions/${sessionId}/start?apptoken=${settings3.apptoken}`;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: intervalStartMsec / 1e3, devices })
  }).catch(console.error);
}
function writeIntervalEnd() {
  if (sessionId === null) return;
  const url = `${settings3.apiUrl}/sessions/${sessionId}/end?apptoken=${settings3.apptoken}`;
  fetch(url, { method: "POST" }).catch(console.error);
}

// src/subs/Parser.ts
function parse(subtitleString) {
  const corrected = subtitleString.replace(/\s/g, "").replace(/(['"])?([a-zA-Z0-9_.]+)(['"])?:/g, '"$2": ');
  return JSON.parse(corrected);
}

// src/FecSocket.ts
var import_socket = require("socket.io-client");
var _socket3 = null;
function initSocket(fecUrl, token) {
  _socket3 = (0, import_socket.io)(`${fecUrl}/pubnub`, {
    auth: { token },
    transports: ["websocket"]
  });
  _socket3.on("connect", () => {
    console.log("FecSocket connected, id:", _socket3.id);
  });
  _socket3.on("connect_error", (err) => {
    console.error("FecSocket connection error:", err.message);
  });
  _socket3.on("disconnect", (reason) => {
    console.log("FecSocket disconnected:", reason);
  });
  return _socket3;
}
function getSocket() {
  if (!_socket3) throw new Error("FecSocket not initialized \u2014 call initSocket() first");
  return _socket3;
}
function destroySocket() {
  _socket3 == null ? void 0 : _socket3.disconnect();
  _socket3 = null;
}

// src/subs/BillingPubnub.ts
var joined = false;
function play3() {
  var _a;
  if (joined) return;
  let socket;
  try {
    socket = getSocket();
  } catch (e) {
    return;
  }
  const channelId = "billing." + ((_a = socket.id) != null ? _a : "");
  console.log("BillingPubnub play(), joining FEC room:", channelId);
  socket.emit("room:join", channelId);
  joined = true;
}

// src/apps/AppsSettings.ts
var settingsProd = {
  apiUrl: "https://api.feel-app.com",
  subtitlesUrl: "https://api.pibds.com/api/v1",
  partnerToken: "",
  userId: "",
  // TODO: confirm production FEC URL
  fecUrl: "https://fec.feel-app.com"
};
var settingsStaging = {
  apiUrl: "https://stg-api.feel-app.com",
  subtitlesUrl: "https://api-subtitles.feel-app.com/api/v1",
  partnerToken: "",
  userId: "",
  // TODO: confirm staging FEC URL
  fecUrl: "https://stg-fec.feel-app.com"
};
var settingsDev = {
  apiUrl: "http://0.0.0.0:5000",
  subtitlesUrl: "",
  partnerToken: "",
  userId: "",
  fecUrl: "http://0.0.0.0:8000"
};
var env = "prod";
var settings4 = env === "dev" ? settingsDev : env === "staging" ? settingsStaging : settingsProd;
var AppsSettings_default = settings4;

// src/DeviceWatch.ts
var connectCallbacks = [];
var deviceWasConnected = false;
function emitConnect() {
  deviceWasConnected = true;
  connectCallbacks.forEach((cb) => cb());
}
function init4(feelAppsToken, userId) {
  console.log("DeviceWatch.init");
  if (AppsSettings_default.partnerToken || AppsSettings_default.userId) {
    throw new Error(
      "Error: $feel library has been already initialized. Please call $feel.destroy() before initializing it again."
    );
  }
  AppsSettings_default.partnerToken = feelAppsToken;
  AppsSettings_default.userId = userId;
  const socket = initSocket(AppsSettings_default.fecUrl, feelAppsToken);
  let handled = false;
  socket.on("message", (payload) => {
    if (handled) return;
    if (payload.message_type === "sharing:device_connected") {
      console.log("DeviceWatch: mobile app connected via FEC");
      handled = true;
      emitConnect();
    }
  });
  socket.on("connect", () => {
    console.log("DeviceWatch: FEC socket connected as user", userId);
  });
}
function onDeviceConnected(callback) {
  connectCallbacks.push(callback);
}
function wasDeviceConnected() {
  return deviceWasConnected;
}

// src/subs/Subs.ts
var subtitleCallbacks = [];
var initialized = false;
var onSubtitle = null;
var watchDogTimeout = null;
var buffering = false;
var playing = false;
var previousPos = 0;
var SEEK_DISTANCE = 2;
function emitSubtitleEvent(percentValue) {
  subtitleCallbacks.forEach((cb) => cb(percentValue));
}
var subtitleCallback = (subtitleObj, positionMsec, subtitles2) => {
  const percentValue = subtitleObj.subtitle * 25;
  emitSubtitleEvent(percentValue);
  onSubtitle == null ? void 0 : onSubtitle(percentValue, positionMsec, subtitles2);
};
function resetDevice() {
  subtitleCallback({ time: 0, subtitle: 0 }, 0, []);
}
function handleVideoSeekEvent(currentPosSec) {
  if (Math.abs(currentPosSec - previousPos) > SEEK_DISTANCE) {
    const wasPlaying = playing;
    stop2();
    if (wasPlaying) play4(currentPosSec);
    previousPos = currentPosSec;
    return true;
  }
  previousPos = currentPosSec;
  return false;
}
function checkInitialized() {
  if (!initialized) {
    throw new Error("Please call $feel.init before loading/playing subtitles");
  }
}
function play4(currentPosSec) {
  if (wasDeviceConnected()) {
    checkInitialized();
    const posMsec = Math.floor(currentPosSec * 1e3);
    play2(posMsec, subtitleCallback);
    startInterval(posMsec);
    play3();
  }
  playing = true;
}
function timeupdate2(currentPosSec) {
  if (!wasDeviceConnected()) return;
  checkInitialized();
  if (handleVideoSeekEvent(currentPosSec)) return;
  const posMsec = Math.floor(currentPosSec * 1e3);
  if (buffering) {
    buffering = false;
    play2(posMsec, subtitleCallback);
  } else {
    timeupdate(posMsec, subtitleCallback);
  }
  if (watchDogTimeout) clearTimeout(watchDogTimeout);
  if (playing) {
    watchDogTimeout = setTimeout(() => {
      stop();
      buffering = true;
    }, 1e3);
  }
}
function stop2() {
  if (wasDeviceConnected()) {
    checkInitialized();
    stop();
    resetDevice();
    endInterval();
    if (watchDogTimeout) clearTimeout(watchDogTimeout);
  }
  playing = false;
}
async function load(videoId, subtitlesId, externalUserId, channel = "") {
  console.log("Subs.load");
  return new Promise((resolve, reject) => {
    onDeviceConnected(async () => {
      checkInitialized();
      try {
        const subtitlesData = await loadSubtitlesInfo(videoId, subtitlesId, externalUserId, channel);
        setSessionId(subtitlesData.session_id);
        const subtitleMap = parse(subtitlesData.text);
        setSubtitles(subtitleMap);
        if (playing) play2(0, subtitleCallback);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}
function devicesChanged2(devices2) {
  const posMsec = getCurrentVideoPosition();
  devicesChanged(devices2, posMsec);
}
function init5(settings5, onPlaySubtitle) {
  console.log("Subs.init");
  init2(settings5);
  init3(settings5);
  onSubtitle = onPlaySubtitle;
  initialized = true;
}
function setClientId2(clientId) {
  setClientId(clientId);
}
function onSubtitleEvent(callback) {
  subtitleCallbacks.push(callback);
}
function offSubtitleEvent(callback) {
  const idx = subtitleCallbacks.indexOf(callback);
  if (idx !== -1) subtitleCallbacks.splice(idx, 1);
}

// src/apps/Apps.ts
async function getUserConnectionInfo() {
  const url = `${AppsSettings_default.apiUrl}/internal-api/v1/user/${AppsSettings_default.userId}/drs?partner_token=${AppsSettings_default.partnerToken}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DRS request failed: ${response.statusText}`);
  return response.json();
}
function setServerUrl(url) {
  AppsSettings_default.apiUrl = url;
}
function init6(onDevicesChanged2) {
  var _a;
  console.log("App.init");
  const socket = getSocket();
  setClientId2((_a = socket.id) != null ? _a : "");
  init(socket, AppsSettings_default, onDevicesChanged2);
  getUserConnectionInfo().then((drsInfo) => {
    const drsRoomName = drsInfo.drs_room.drs_id;
    connect(socket, drsRoomName);
  }).catch((err) => console.log(err));
}
function destroy() {
  disconnect2();
  disconnect();
  AppsSettings_default.partnerToken = "";
  AppsSettings_default.userId = "";
}
function playSubtitle(percentValue, positionMsec, subtitles2) {
  send(percentValue, null, positionMsec, subtitles2);
}
function getMobileAppLaunchUrl(requestToken) {
  return "feelapp://authorize?token=" + encodeURIComponent(requestToken);
}

// src/MobileApi.ts
function playSubtitle2(percentValue) {
  console.log("subtitle percent value: ", percentValue);
  window.parent.postMessage({ what: "write", percent: percentValue }, "*");
}

// src/index.ts
var SUBS_API_URL = "https://api-subtitles.feel-app.com/api/v1";
function setServers(servers) {
  if (servers.apps) setServerUrl(servers.apps);
  if (servers.subs) SUBS_API_URL = servers.subs;
}
function init7(feelSubsToken, feelAppsToken, userId) {
  console.log("feel.init");
  init4(feelAppsToken, userId);
  onDeviceConnected(() => {
    var _a;
    const socket = getSocket();
    const clientId = (_a = socket.id) != null ? _a : "";
    init5({ apiUrl: SUBS_API_URL, apptoken: feelSubsToken, clientId }, playSubtitle);
    init6(onDevicesChanged);
  });
}
function onDevicesChanged(devices2) {
  devicesChanged2(devices2);
}
function initMobile(feelSubsToken) {
  init5(
    { apiUrl: SUBS_API_URL, apptoken: feelSubsToken, clientId: "" },
    playSubtitle2
  );
}
function initSlider(feelAppsToken, userId) {
  init4(feelAppsToken, userId);
  onDeviceConnected(() => {
    init6(null);
  });
}
function destroy2() {
  destroy();
  destroySocket();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apps,
  destroy,
  init,
  initMobile,
  initSlider,
  setServers,
  subs
});
//# sourceMappingURL=index.js.map