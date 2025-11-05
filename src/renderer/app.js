"use strict";

    // ---- v1.1 MIDI Constants (Working Format) ----
    const TPQN = 480;

    // ---- v1.4 State & Features ----
    const S = {
      manualBPM: 120,
      midiAccess: null,
      events: [],
      captureCount: 0,
      lastEventTs: 0,
      lastCaptureTs: 0,

      // rolling buffer
      bufferMaxMs: 90000,
      maxCaptureSeconds: 30,
      preRollMs: 3000,

      // forward capture
      forwardActive: false,
      forwardStartTs: 0,
      forwardUntilTs: 0,
      forwardTimer: null,

      // device tracking
      deviceActivity: new Map(),
      deviceNames: new Map(),
      deviceCounter: 1,
      renderInterval: null,

      // guards - ZWIĘKSZONE Z 50/s NA 150/s
      stormWindowMs: 1000,
      stormLimit: 150,  // ← ZMIANA: 50 → 150 eventów na sekundę
      eventTimestamps: [],
      freezeDueStorm: false,
      freezeBuffer: false,

      // filters
      ignoreRealtime: true,
      showVirtualPorts: false,
      hintWindow: [],

      // remote info
      remoteInfo: null,
      currentRemoteURL: null,

      // trigger
      triggerNote: 60,
      triggerChannel: 0,

      // v1.6 Tempo Control
      autoBPM: null,
      isAutoBPMActive: false,
      autoBPMTimeout: null,
      clockPulseTimestamps: [],
      manualBPM: 120, // Keep track of manual BPM separately
      enableAutoBPM: true, // A setting to disable this feature

                // debounce
                          reinitTimer: null,
          theme: 'default-dark',
                    font: 'system',
                    lang: 'en',
              };
          
              const T = (en, pl) => (S.lang === 'pl' ? pl : en);

    let globalCounter = 0;

    // ---- UI Helpers ----
    const el = {
      midiStatus: document.getElementById("midi-status"),
      bufferCount: document.getElementById("buffer-count"),
      bufferUsageBar: document.getElementById("buffer-usage-bar"),
      bufferUsageText: document.getElementById("buffer-usage-text"),
      captureCount: document.getElementById("capture-count"),
      devices: document.getElementById("midi-devices"),
      btnRefreshPorts: document.getElementById("btn-refresh-ports"),

      sessionName: document.getElementById("session-name"),
      trackTag: document.getElementById("track-tag"),
      preRoll: document.getElementById("pre-roll"),
      maxCap: document.getElementById("max-cap"),
      bpmInput: document.getElementById("bpm-input"),
      bpmPresets: document.getElementById("bpm-presets"),
      forwardMode: document.getElementById("forward-mode"),
      ignoreRT: document.getElementById("ignore-rt"),
      enableAutoBPM: document.getElementById("enable-auto-bpm"),

      btnCapture: document.getElementById("btn-capture"),
      btnClear: document.getElementById("btn-clear"),
      saveMidi: document.getElementById("save-midi"),
      saveJson: document.getElementById("save-json"),
      saveBoth: document.getElementById("save-both"),
      btnTestSound: document.getElementById("btn-test-sound"),
      btnTestTrigger: document.getElementById("btn-test-trigger"),
      btnMonitorClear: document.getElementById("btn-monitor-clear"),
      toggleVirtualPorts: document.getElementById("toggle-virtual-ports"),

      liveEvent: document.getElementById("live-event"),
      trigger: document.getElementById("trigger-display"),
      led: document.getElementById("led"),
      timeline: document.getElementById("timeline"),

      savePath: document.getElementById("save-path"),
      remoteUrl: document.getElementById("remote-url"),
      btnRemoteDrop: document.getElementById("btn-remote-drop"),
      btnCopyUrl: document.getElementById("btn-copy-url"),

      toast: document.getElementById("toast"),
      appVersion: document.getElementById("app-version"),
    };

    // ---- v1.1 MIDI File Writer (Working Version) ----
    function encodeVLQ(value) {
      const bytes = [];
      bytes.unshift(value & 0x7F);
      value >>= 7;
      while (value > 0) {
        bytes.unshift((value & 0x7F) | 0x80);
        value >>= 7;
      }
      return bytes;
    }

    function createMIDIFile(events, bpm, markerText = null) {
      if (!events.length) return new Uint8Array();

      const microPerQN = Math.round(60000000 / bpm);

      // Header (SMF Type 0, 1 track, TPQN)
      const header = new Uint8Array([
        0x4D, 0x54, 0x68, 0x64,
        0x00, 0x00, 0x00, 0x06,
        0x00, 0x00,
        0x00, 0x01,
        (TPQN >> 8) & 255, TPQN & 255
      ]);

      const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
      const t0 = sorted[0].timestamp;

      const track = [];
      // Tempo meta
      track.push(0x00, 0xFF, 0x51, 0x03, (microPerQN >> 16) & 255, (microPerQN >> 8) & 255, microPerQN & 255);
      // Time signature 4/4
      track.push(0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
      // Marker meta
      if (markerText && markerText.length) {
        const bytes = new TextEncoder().encode(markerText);
        track.push(0x00, 0xFF, 0x06, bytes.length, ...bytes);
      }

      // ---- NEW: Add Program Change to select Grand Piano ----
      track.push(0x00, 0xC0, 0x00); // Delta 0, Program Change on Ch 0, Program 0 (Acoustic Grand Piano)

      let lastTicks = 0;
      for (const ev of sorted) {
        const ms = Math.max(0, ev.timestamp - t0);
        const ticks = Math.round(ms * (TPQN * bpm) / 60000);
        const delta = Math.max(0, ticks - lastTicks);
        lastTicks = ticks;

        track.push(...encodeVLQ(delta));

        const status = ev.data[0] >>> 0;
        if (status >= 0x80 && status <= 0xEF) {
          track.push(...ev.data);
        }
      }

      // End of track
      track.push(0x00, 0xFF, 0x2F, 0x00);

      const len = track.length;
      const trkHeader = new Uint8Array([0x4D, 0x54, 0x72, 0x6B, (len >> 24) & 255, (len >> 16) & 255, (len >> 8) & 255, len & 255]);
      const out = new Uint8Array(header.length + trkHeader.length + track.length);
      out.set(header, 0);
      out.set(trkHeader, header.length);
      out.set(track, header.length + trkHeader.length);
      return out;
    }

    // ---- Helpers ----
    function showToast(msg, kind = "ok", timeout = 2500) {
      el.toast.textContent = msg;
      el.toast.classList.remove("ok", "warn", "err");
      el.toast.classList.add(kind);
      el.toast.classList.add("show");
      setTimeout(() => el.toast.classList.remove("show"), timeout);
    }

    function deviceKey(input) {
      return (input.id ?? (input.name + "|" + (input.manufacturer || "")));
    }

    function applyFont(fontName) {
      document.body.classList.forEach(c => {
        if (c.startsWith('font-')) {
          document.body.classList.remove(c);
        }
      });
      document.body.classList.add(`font-${fontName}`);
    }

    function applyTheme(themeName) {
      document.body.classList.forEach(c => {
        if (c.startsWith('theme-')) {
          document.body.classList.remove(c);
        }
      });
      document.body.classList.add(`theme-${themeName}`);
    }

    function resolveDeviceName(input) {
      const name = input?.name?.trim();
      const manu = input?.manufacturer?.trim();
      if (name) {
        return manu ? `${name} (${manu})` : name;
      }
      const n = S.deviceCounter++;
      return `MIDI Device #${n}`;
    }

    // ---- v1.6 Tempo Control ----
    function updateTempoUI() {
      if (S.isAutoBPMActive && S.autoBPM) {
        el.bpmInput.value = Math.round(S.autoBPM);
        el.bpmInput.disabled = true;
        el.bpmPresets.disabled = true;
        el.bpmInput.classList.add('auto');
      } else {
        el.bpmInput.disabled = false;
        el.bpmPresets.disabled = false;
        el.bpmInput.classList.remove('auto');
        el.bpmInput.value = S.manualBPM;
      }
    }

    // ---- v1.4 Settings with Validation ----
    function getSettings() {
      const rawPreRoll = parseInt(el.preRoll.value || "0", 10);
      const rawMaxCap = parseInt(el.maxCap.value || "30", 10);
      const rawBPM = parseInt(el.bpmInput.value || "120", 10);

      // Validation and limits
      S.preRollMs = Math.max(0, Math.min(rawPreRoll, 10000)); // Max 10 seconds
      S.maxCaptureSeconds = Math.max(1, Math.min(rawMaxCap, 300)); // Max 5 minutes
      S.manualBPM = Math.max(40, Math.min(rawBPM, 300)); // Clamp BPM between 40 and 300

      // Notify user if value was corrected
      if (rawPreRoll > 10000) {
        el.preRoll.value = 10000;
        showToast("Pre-roll limited to 10,000ms", "warn", 2000);
      }
      if (rawMaxCap > 300) {
        el.maxCap.value = 300;
        showToast("Max capture limited to 300s", "warn", 2000);
      }
      if (rawBPM < 40 || rawBPM > 300) {
        el.bpmInput.value = S.manualBPM;
        showToast(`BPM limited to 40-300 range`, "warn", 2000);
      }
      
      // This is the final BPM used for saving, respecting the auto/manual mode
      S.bpm = S.isAutoBPMActive && S.autoBPM ? S.autoBPM : S.manualBPM;
      updateTempoUI();
    }

    // ---- MIDI Initialization ----
    async function initMIDI() {
      console.log("[DEBUG] initMIDI: Starting MIDI re-initialization...");
      try {
        // ---- Cleanup for re-initialization ----
        if (S.midiAccess) {
          console.log("[DEBUG] initMIDI: Cleaning up old MIDI connections...");
          S.midiAccess.onstatechange = null;
          
          for (const input of S.midiAccess.inputs.values()) {
            const name = (S.deviceNames.get(deviceKey(input)) || input.name || '').toLowerCase();
            const isVirtual = VIRTUAL_PORT_FRAGMENTS.some(frag => name.includes(frag));

            // If we are hiding virtual ports, and this is a virtual port, close it.
            if (isVirtual && !S.showVirtualPorts) {
              input.close();
            }
            
            // Always detach the listener for a clean slate
            input.onmidimessage = null;
          }
        }
        // ---- End Cleanup ----

        if (!navigator.requestMIDIAccess) {
          el.midiStatus.textContent = "⌘ No Web MIDI";
          console.error("[DEBUG] initMIDI: navigator.requestMIDIAccess is not available.");
          return;
        }

        console.log("[DEBUG] initMIDI: Calling navigator.requestMIDIAccess()...");
        const access = await navigator.requestMIDIAccess();
        S.midiAccess = access;
        console.log("[DEBUG] initMIDI: MIDI access granted.", access);

        setupMidiTriggers();

        // Clear old device states before re-populating
        const connectedKeys = new Set();

        for (const input of access.inputs.values()) {
          input.onmidimessage = (msg) => onMIDIMessage(msg, input);
          const key = deviceKey(input);
          connectedKeys.add(key);
          if (!S.deviceNames.has(key)) S.deviceNames.set(key, resolveDeviceName(input));
        }

        // Purge disconnected device names
        for (const key of S.deviceNames.keys()) {
          if (!connectedKeys.has(key)) {
            S.deviceNames.delete(key);
            S.deviceActivity.delete(key);
          }
        }

        renderMidiDevices();

        S.renderInterval = setInterval(() => renderMidiDevices(), 800);
        console.log("[DEBUG] initMIDI: Initialization complete.");
      } catch (e) {
        console.error("⌘ MIDI Error in initMIDI:", e);
        el.midiStatus.textContent = "⌘ Error";
      }
    }

    const VIRTUAL_PORT_FRAGMENTS = ["microsoft gs", "wavetable", "virtual", "loopmidi", "iac driver"];

    function renderMidiDevices() {
      if (!S.midiAccess) {
        el.devices.innerHTML = "—";
        el.midiStatus.textContent = "⏳ Init…";
        return;
      }

      const visibleDevices = [];
      for (const input of S.midiAccess.inputs.values()) {
        const key = deviceKey(input);
        if (!S.deviceNames.has(key)) S.deviceNames.set(key, resolveDeviceName(input));
        const name = S.deviceNames.get(key);
        const lowerCaseName = name.toLowerCase();

        const isVirtual = VIRTUAL_PORT_FRAGMENTS.some(frag => lowerCaseName.includes(frag));
        if (isVirtual && !S.showVirtualPorts) {
          continue;
        }

        const last = S.deviceActivity.get(key) || 0;
        const active = (performance.now() - last) < 1500;
        visibleDevices.push(active ? `✅ ${name}` : `⚫ ${name}`);
      }

      // Update UI based on visible devices
      el.devices.innerHTML = visibleDevices.length ? visibleDevices.join("<br>") : "—";
      el.midiStatus.textContent = visibleDevices.length > 0 ? "✅ Connected" : "⚠️ No devices";

      const hasVisibleDevices = visibleDevices.length > 0;
      const testRow = document.getElementById("monitor-test-row");
      if (testRow) {
        testRow.style.display = hasVisibleDevices ? 'none' : 'flex';
      }
    }

    function setupMidiTriggers() {
      S.triggerNote = 60;
      S.triggerChannel = 0;
    }

    // ---- Event Handling ----
    function onMIDIMessage(message, inputRef) {
      const ts = performance.now();
      const [status, note, velocity] = message.data;

      // ---- MIDI Storm Guard ----
      const now = ts;
      S.eventTimestamps.push(now);
      // Keep timestamps from the last second
      S.eventTimestamps = S.eventTimestamps.filter(t => now - t < S.stormWindowMs);
      if (S.eventTimestamps.length > S.stormLimit) {
        if (!S.freezeDueStorm) {
          S.freezeDueStorm = true;
          console.warn(`MIDI storm detected (> ${S.stormLimit} events/sec). Freezing input.`);
          setTriggerStatus("MIDI storm!", "err");
        }
        return; // Drop event
      } else if (S.freezeDueStorm) {
        S.freezeDueStorm = false;
        console.log("MIDI input restored.");
        setTriggerStatus("Ready", "ready");
      }
      // ---- End Guard ----

      // ---- v1.6 Auto BPM Detection ----
      if (S.enableAutoBPM) {
        // MIDI Clock message
        if (status === 0xF8) {
          const now = performance.now();
          if (S.lastClockTime > 0) {
            const diff = now - S.lastClockTime;
            S.clockPulseTimestamps.push(diff);
            if (S.clockPulseTimestamps.length > 24) { // Keep a rolling window of 24 pulses (1 beat)
              S.clockPulseTimestamps.shift();
            }
            
            // Calculate average time between pulses
            const avgDiff = S.clockPulseTimestamps.reduce((a, b) => a + b, 0) / S.clockPulseTimestamps.length;
            
            if (avgDiff > 0) {
              // 24 pulses per quarter note
              const calculatedBPM = 60000 / (avgDiff * 24);
              // Smooth the BPM value
              S.autoBPM = S.autoBPM ? (S.autoBPM * 0.95) + (calculatedBPM * 0.05) : calculatedBPM;
            }
          }
          S.lastClockTime = now;
          S.isAutoBPMActive = true;

          // Reset the timeout to switch back to manual
          clearTimeout(S.autoBPMTimeout);
          S.autoBPMTimeout = setTimeout(() => {
            S.isAutoBPMActive = false;
            S.autoBPM = null;
            S.clockPulseTimestamps = [];
            S.lastClockTime = 0;
            updateTempoUI();
            showToast("MIDI clock stopped. Switched to manual BPM.", "ok", 1500);
          }, 2000); // 2-second timeout

          updateTempoUI();
        }
        
        // MIDI Start message
        if (status === 0xFA) {
          S.isAutoBPMActive = true;
          S.lastClockTime = 0;
          S.clockPulseTimestamps = [];
          showToast("MIDI clock detected. Switched to auto BPM.", "ok", 1500);
        }

        // MIDI Stop message
        if (status === 0xFC) {
          S.isAutoBPMActive = false;
          S.autoBPM = null;
          S.clockPulseTimestamps = [];
          S.lastClockTime = 0;
          clearTimeout(S.autoBPMTimeout);
          updateTempoUI();
          showToast("MIDI clock stopped. Switched to manual BPM.", "ok", 1500);
        }
      }

      if (S.ignoreRealtime && status >= 0xF8) return;

      const channel = status & 0x0f;
      const command = status & 0xf0;

      S.lastEventTs = ts;

      const key = inputRef ? deviceKey(inputRef) : "Unknown";
      S.deviceActivity.set(key, ts);

      const event = {
        timestamp: ts,
        data: Array.from(message.data),
        channel, command, note, velocity,
        source: inputRef?.name || S.deviceNames.get(key) || "Unknown"
      };
      S.events.push(event);

      // ---- Play sound on Note On ----
      if (command === 0x90 && velocity > 0) {
        playNote(note, velocity);
      }

      // ---- Rolling Buffer Trim ----
      const bufferStartTs = ts - S.bufferMaxMs;
      const firstValidIndex = S.events.findIndex(e => e.timestamp >= bufferStartTs);
      if (firstValidIndex > 0) {
        S.events.splice(0, firstValidIndex);
      }
      // ---- End Trim ----

      updateLiveUI(event);
      updateTimelineUI(event);
      updateStatsUI();

      checkTrigger(command, note, velocity, channel);
    }

    function checkTrigger(command, note, velocity, channel) {
      const isNoteOn = (command === 0x90 && velocity > 0);
      if (isNoteOn && channel === S.triggerChannel && note === S.triggerNote) {
        if (el.forwardMode.checked) {
          startForwardCapture();
        } else {
          captureRolling();
        }
      }
    }

    // ---- UI Updates ----
    function updateLiveUI(e) {
      const type = (e.command === 0x90 || e.command === 0x80) ? 'note' : (e.command === 0xB0 ? 'cc' : 'other');
      const colorClass = type === 'note' ? 'midi-note' : (type === 'cc' ? 'midi-cc' : 'midi-other');
      el.liveEvent.innerHTML = `<span class="${colorClass}">${e.source}</span> :: [${e.data.join(", ")}] ch=${e.channel}`;
      el.led.classList.add("active");
      clearTimeout(updateLiveUI._t);
      updateLiveUI._t = setTimeout(() => el.led.classList.remove("active"), 180);
    }

    function updateTimelineUI(event) {
      // Performance: Append new element, remove old one. Avoid innerHTML.
      const item = document.createElement('div');
      const type = (event.command === 0x90 || event.command === 0x80) ? 'note' : (event.command === 0xB0 ? 'cc' : 'other');
      const colorClass = type === 'note' ? 'midi-note' : (type === 'cc' ? 'midi-cc' : 'other');
      item.className = `timeline-item ${colorClass}`;

      item.innerHTML = `<span>${type.toUpperCase()}</span> :: ${event.source} :: data=[${event.data.join(", ")}]`;

      // Check if user is scrolled to bottom before adding new item
      const isScrolledToBottom = el.timeline.scrollHeight - el.timeline.scrollTop <= el.timeline.clientHeight + 1;

      el.timeline.appendChild(item);

      while (el.timeline.children.length > 40) {
        el.timeline.removeChild(el.timeline.firstChild);
      }

      // Only auto-scroll if user was already at the bottom
      if (isScrolledToBottom) {
        el.timeline.scrollTop = el.timeline.scrollHeight;
      }
    }

    function updateStatsUI() {
      el.bufferCount.textContent = S.events.length;
      
      // Assuming 1000 events is a good benchmark for 100% usage for UI purposes
      const pct = Math.min(100, Math.round((S.events.length / 1000) * 100));
      
      if (el.bufferUsageBar && el.bufferUsageText) {
        el.bufferUsageBar.style.width = `${pct}%`;
        el.bufferUsageText.textContent = `${pct}%`;

        // Update color based on percentage
        el.bufferUsageBar.classList.remove('warn', 'err');
        if (pct > 80) {
          el.bufferUsageBar.classList.add('err');
        } else if (pct > 50) {
          el.bufferUsageBar.classList.add('warn');
        }
      }
    }

    function setTriggerStatus(text, state = "ready") {
      el.trigger.textContent = text;
      if (state === "fired") { el.trigger.style.borderColor = "#265e3f"; }
      else if (state === "active") { el.trigger.style.borderColor = "#775f00"; }
      else if (state === "err") { el.trigger.style.borderColor = "#7a2a2a"; }
      else { el.trigger.style.borderColor = "#444"; }
    }



    // ---- Capture Logic ----
    function captureRolling() {
      getSettings();
      if (!S.events.length) {
        showToast("No events to capture", "warn", 1200);
        return;
      }
      const triggerTs = performance.now();
      const maxDurationMs = S.maxCaptureSeconds * 1000;
      const preRollMs = S.preRollMs;
      const startTime = triggerTs - (maxDurationMs + preRollMs);
      const relevantEvents = S.events.filter(e => e.timestamp >= startTime && e.timestamp <= triggerTs);
      console.log(`[DEBUG] Rolling Capture: Found ${relevantEvents.length} events in the capture window.`);
      doSave(relevantEvents, "rolling");
    }

    function startForwardCapture() {
      if (S.forwardActive) return;
      getSettings();
      S.forwardActive = true;
      S.forwardStartTs = performance.now();
      S.forwardUntilTs = S.forwardStartTs + S.maxCaptureSeconds * 1000;
      setTriggerStatus("Forward capture…", "active");
      if (S.forwardTimer) clearTimeout(S.forwardTimer);
      S.forwardTimer = setTimeout(() => {
        S.forwardActive = false;
        finalizeForwardCapture();
      }, S.maxCaptureSeconds * 1000 + 50);
    }

    function finalizeForwardCapture() {
      const startWithPre = Math.max(0, S.forwardStartTs - S.preRollMs);
      const windowEvents = S.events.filter(e => e.timestamp >= startWithPre && e.timestamp <= S.forwardUntilTs);
      if (!windowEvents.length) {
        showToast("No events in forward window", "warn", 1500);
        setTriggerStatus("No events in forward window", "active");
        return;
      }
      doSave(windowEvents, "forward");
    }

    function clearAll() {
      S.events = [];
      S.forwardActive = false;
      if (S.forwardTimer) { clearTimeout(S.forwardTimer); S.forwardTimer = null; }
      S.forwardStartTs = 0; S.forwardUntilTs = 0;
      S.lastEventTs = 0; S.lastCaptureTs = 0;
      S.eventTimestamps.length = 0;
      S.freezeDueStorm = false;
      S.freezeBuffer = false;
      el.liveEvent.textContent = "—";
      setTriggerStatus("Ready", "ready");
      el.bufferUsageText.textContent = "0%";
      el.timeline.innerHTML = ''; // Clear timeline manually
      updateStatsUI();
      showToast("Buffer cleared", "ok", 900);
      console.log("🧹 Buffer cleared");
    }

    // ---- Saving ----
    function buildFileName({ mode, lenSec, format = 'midi' }) {
      const date = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;

      const sessionName = (el.sessionName.value || "Session").trim();
      const trackTag = (el.trackTag.value || "Track").trim();

      const session = sessionName.replace(/\s+/g, "-");
      const track = trackTag.replace(/\s+/g, "-");
      const ext = (format === 'json') ? '.json' : '.mid';
      return `${stamp}__${session}__${track}__${mode}_${lenSec}s${ext}`;
    }

    async function saveBinary(filename, bytes) {
      if (window.electron?.saveFile) {
        try {
          const res = await window.electron.saveFile({ filename, bytes });
          return !!(res && res.ok);
        } catch (e) {
          console.error("saveFile error", e);
          return false;
        }
      }
      // Browser fallback
      const blob = new Blob([bytes], { type: "audio/midi" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
      return true;
    }

    async function saveJson(filename, data) {
      if (window.electron?.saveFile) {
        try {
          const res = await window.electron.saveFile({ filename, bytes: new TextEncoder().encode(JSON.stringify(data, null, 2)) });
          return !!(res && res.ok);
        } catch (e) {
          console.error("saveJson error", e);
          return false;
        }
      }
      // Browser fallback
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
      return true;
    }

    async function doSave(events, mode) {
      if (!events || events.length === 0) {
        showToast("Save aborted: No events to save", "err", 2000);
        return;
      }

      getSettings(); // Ensure S.bpm is current before saving

      const lenSec = Math.max(1, Math.round((events[events.length - 1].timestamp - events[0].timestamp) / 1000));
      const session = (el.sessionName.value || "Session").trim();
      const track = (el.trackTag.value || "Unknown_ID").trim();
      const marker = `Session:${session} | Track:${track} | Mode:${mode} | Len:${lenSec}s`;

      let midiSaved = false;
      let jsonSaved = false;

      // Save MIDI file if format is 'midi' or 'both'
      if (S.saveFormat === 'midi' || S.saveFormat === 'both') {
        const midiFilename = buildFileName({ mode, lenSec, format: 'midi' });
        const midiData = createMIDIFile(events, S.bpm, marker);
        midiSaved = await saveBinary(midiFilename, midiData);
        if (midiSaved) {
          console.log(`✅ Saved ${events.length} events as ${midiFilename}`);
        } else {
          console.error(`⌘ Failed to save MIDI file: ${midiFilename}`);
        }
      }

      // Save JSON file if format is 'json' or 'both'
      if (S.saveFormat === 'json' || S.saveFormat === 'both') {
        const jsonFilename = buildFileName({ mode, lenSec, format: 'json' });
        const jsonData = {
          metadata: {
            session: session,
            track: track,
            mode: mode,
            lengthSeconds: lenSec,
            bpm: S.bpm,
            timestamp: new Date().toISOString(),
            appVersion: el.appVersion?.textContent?.replace('v', '') || 'unknown'
          },
          events: events.map(e => ({ // Map events to a more JSON-friendly format
            timestamp: e.timestamp,
            data: Array.from(e.data), // Convert Uint8Array to regular array
            channel: e.channel,
            command: e.command,
            note: e.note,
            velocity: e.velocity,
            source: e.source
          }))
        };
        jsonSaved = await saveJson(jsonFilename, jsonData);
        if (jsonSaved) {
          console.log(`✅ Saved JSON data as ${jsonFilename}`);
        } else {
          console.error(`⌘ Failed to save JSON file: ${jsonFilename}`);
        }
      }

      const overallSuccess = midiSaved || jsonSaved;
      S.captureCount += overallSuccess ? 1 : 0;
      el.captureCount.textContent = S.captureCount;
      S.lastCaptureTs = performance.now();
      globalCounter++;

      if (overallSuccess) {
        setTriggerStatus(`Saved: ${midiSaved ? 'MIDI' : ''}${midiSaved && jsonSaved ? ' & ' : ''}${jsonSaved ? 'JSON' : ''}`, "fired");
        showToast(`✅ Saved: ${midiSaved ? 'MIDI' : ''}${midiSaved && jsonSaved ? ' & ' : ''}${jsonSaved ? 'JSON' : ''}`, "ok", 2500);
      } else {
        setTriggerStatus("Save failed", "err");
        showToast("⌘ Save failed (see log)", "err", 2500);
      }
    }

    // ---- Audio Feedback ----
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playNote(note, velocity) {
      if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      try {
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        const gain = Math.max(0.0001, Math.min(1, velocity / 127));

        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        o.connect(g);
        g.connect(audioCtx.destination);

        g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(gain * 0.3, audioCtx.currentTime + 0.02); // Quick attack
        o.start();
        o.stop(audioCtx.currentTime + 0.15); // Short plink
      } catch (e) {
        console.warn("Audio playback failed", e);
      }
    }

    // ---- Test Functions ----
    function beep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        o.start(); o.stop(ctx.currentTime + 0.12);
        o.onended = () => ctx.close();
      } catch { }
    }

    function simulateTestBurst() {
      const dev = "TEST";
      const base = performance.now();
      const seq = [
        { dt: 0, data: [0x90, 36, 100] },
        { dt: 80, data: [0x90, 40, 100] },
        { dt: 80, data: [0x90, 43, 100] },
        { dt: 120, data: [0x80, 36, 0] },
        { dt: 10, data: [0x80, 40, 0] },
        { dt: 10, data: [0x80, 43, 0] }
      ];
      seq.forEach(step => {
        const t = base + step.dt;
        S.events.push({
          timestamp: t,
          data: new Uint8Array(step.data),
          channel: step.data[0] & 0x0f,
          command: step.data[0] & 0xf0,
          note: step.data[1],
          velocity: step.data[2],
          source: dev
        });
      });
      updateStatsUI();
      el.led.classList.add("active");
      setTimeout(() => el.led.classList.remove("active"), 200);
    }

    // ---- Remote Control Functions (v1.4) ----
    async function initRemoteInfo() {
      try {
        const info = await window.electron?.getRemoteInfo?.();
        if (info?.url) {
          S.remoteInfo = info;
          S.currentRemoteURL = info.url;
          updateRemoteUI(info.url);
        } else {
          el.remoteUrl.textContent = "Drop URL: (starting...)";
        }
      } catch (e) {
        console.error("Failed to get remote info:", e);
        el.remoteUrl.textContent = "Drop URL: (error)";
      }

      window.electron?.onRemoteInfo?.((data) => {
        if (data?.url) {
          S.remoteInfo = data;
          S.currentRemoteURL = data.url;
          updateRemoteUI(data.url);
          console.log("🔄 Remote info updated:", data.url);
        }
      });

      window.electron?.onRemoteTrigger?.(() => {
        console.log("🔥 Remote trigger received");
        if (el.forwardMode.checked) {
          startForwardCapture();
          setTriggerStatus("Forward capture…", "active");
        } else {
          captureRolling();
        }
        showToast("📱 Remote capture", "ok", 900);
      });
    
      // ---- DODAJ TEN BLOK ----
      window.electron?.onRemoteSetPreset?.((data) => {
        if (data.maxCapture !== undefined && el.maxCap) {
          console.log(`REMOTE PRESET: Ustawiam max capture na ${data.maxCapture}s, pre-roll na ${data.preRollMs}ms`);
          el.maxCap.value = data.maxCapture; 
          el.preRoll.value = data.preRollMs; // Set preRollMs
          getSettings(); // Odczytuje nową wartość i aktualizuje stan S
          showToast(T(`📱 Preset ${data.maxCapture}s applied`, `📱 Preset ${data.maxCapture}s zastosowany`), "ok", 1500);
          
          // Odznacz aktywne presety na desktopie, jeśli jakieś były
          document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        }
      });
      // ---- KONIEC BLOKU ----
    }

    function updateRemoteUI(url) {
      if (!url) {
        el.remoteUrl.textContent = "Drop URL: (not available)";
        return;
      }
      try {
        const u = new URL(url);
        const shortUrl = `${u.hostname}:${u.port}`;
        el.remoteUrl.textContent = `Drop URL: ${shortUrl}`;
      } catch {
        el.remoteUrl.textContent = `Drop URL: ${url}`;
      }
    }

    async function copyUrlToClipboard(url) {
      try {
        await navigator.clipboard.writeText(url);
        showToast("URL copied to clipboard", "ok", 1000);
      } catch (e) {
        console.error("Copy failed:", e);
        showToast("Copy failed", "warn", 1200);
      }
    }

    // ---- UI Bindings ----
    function bindUI() {
      // Scrollbar visibility logic
      document.body.addEventListener('mouseenter', () => document.body.classList.add('show-scrollbar'));
      document.body.addEventListener('mouseleave', () => document.body.classList.remove('show-scrollbar'));

      el.btnCapture.addEventListener("click", () => {
        if (el.forwardMode.checked) startForwardCapture(); else captureRolling();
      });
      el.btnClear.addEventListener("click", clearAll);
      el.btnTestSound.addEventListener("click", beep);



      el.btnTestTrigger.addEventListener("click", () => {
        const msg = { data: new Uint8Array([0x90, 60, 100]) };
        onMIDIMessage(msg, { name: "Test Device", manufacturer: "Sim" });
      });
      el.btnMonitorClear.addEventListener("click", () => {
        el.timeline.innerHTML = ""; el.liveEvent.textContent = "—"; el.bufferCount.textContent = "0";
      });

      // Preset buttons handler
      const presetGroup = document.querySelector('.preset-buttons');
      if (presetGroup) {
        presetGroup.addEventListener('click', (e) => {
          const btn = e.target.closest('.preset-btn');
          if (!btn) return;
          document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          el.preRoll.value = btn.dataset.preroll;
          el.maxCap.value = btn.dataset.maxcap;
          getSettings(); // Update internal state immediately
          showToast(`Preset ${btn.dataset.maxcap}s applied`, 'ok', 1000);
        });
      }

      // Clear preset active states when user manually changes values
      el.preRoll.addEventListener('input', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      });

      el.maxCap.addEventListener('input', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      });

      // Save Format radio buttons
      const saveFormatRadios = document.querySelectorAll('input[name="save-format"]');
      saveFormatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          window.electron?.setSettings?.({ saveFormat: radio.value });
          showToast(`Save format set to ${radio.value}`, 'ok', 1000);
        });
      });

      el.bpmInput.addEventListener('change', getSettings);

      if (el.bpmPresets) {
        el.bpmPresets.addEventListener('change', () => {
          const selectedBPM = el.bpmPresets.value;
          if (selectedBPM) { // Only update if a valid BPM is selected, not the "Presets" placeholder
            el.bpmInput.value = selectedBPM;
            getSettings(); // Update the internal state and apply validation
          }
          el.bpmPresets.value = ""; // Reset dropdown to "Presets" after selection
        });
      }

      // v1.6 Auto BPM checkbox
      if (el.enableAutoBPM) {
        el.enableAutoBPM.checked = S.enableAutoBPM;
        el.enableAutoBPM.addEventListener("change", () => {
          S.enableAutoBPM = el.enableAutoBPM.checked;
          if (!S.enableAutoBPM) {
            // If we disable auto mode, immediately switch to manual
            S.isAutoBPMActive = false;
            clearTimeout(S.autoBPMTimeout);
            updateTempoUI();
          }
          showToast(`Auto BPM detection ${S.enableAutoBPM ? 'enabled' : 'disabled'}`, 'ok', 1000);
        });
      }

      // Remote Drop button
      el.btnRemoteDrop.addEventListener("click", async () => {
        try {
          console.log("🚀 Remote Drop button clicked");
          const result = await window.electron?.openRemoteDrop?.();
          if (result?.ok) {
            console.log("✅ Remote Drop opened successfully:", result.url);
            showToast("Remote Drop opened", "ok", 1000);
          } else {
            console.error("⌘ Remote Drop failed:", result?.error);
            showToast("Remote Drop failed", "err", 1500);
          }
        } catch (e) {
          console.error("⌘ Remote Drop error:", e);
          showToast("Remote Drop error", "err", 1500);
        }
      });

      // Copy URL button
      el.btnCopyUrl.addEventListener("click", async () => {
        if (S.currentRemoteURL) {
          await copyUrlToClipboard(S.currentRemoteURL);
        } else {
          showToast("No URL available", "warn", 1000);
        }
      });

      // Keyboard shortcuts with input focus check
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;

        // Check if user is focused on input or select element
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.tagName === 'TEXTAREA'
        );

        if (isInputFocused) return; // Skip shortcuts if input is focused

        if (e.key.toLowerCase() === "n") {
          el.btnCapture.click();
        }
        else if (e.key.toLowerCase() === "c") {
          el.btnClear.click();
        }
        else if (e.key.toLowerCase() === "t") {
          // Only allow T shortcut if test buttons are visible
          const testRow = document.getElementById("monitor-test-row");
          if (testRow && testRow.style.display !== 'none') {
            el.btnTestTrigger.click();
          }
        }
      });

      // Ignore realtime checkbox state
      if (el.ignoreRT) {
        el.ignoreRT.checked = S.ignoreRealtime;
        el.ignoreRT.addEventListener("change", () => {
          S.ignoreRealtime = el.ignoreRT.checked;
        });
      }

      // Bind the new toggle for virtual ports
      if (el.toggleVirtualPorts) {
        el.toggleVirtualPorts.addEventListener("change", () => {
          // The main process will hear this, save the config, and send back an 'settings:update' event,
          // which will trigger the initMIDI() call.
          window.electron?.setSettings?.({ showVirtualPorts: el.toggleVirtualPorts.checked });
        });
      }

      // Listen for menu events from v1.4
      window.electron?.onMenuChooseFolder?.(async () => {
        try {
          const newPath = await window.electron.chooseSaveFolder();
          if (newPath) {
            refreshSavePath();
            showToast("Save folder updated", "ok", 1000);
          }
        } catch (e) {
          console.error("Choose folder error:", e);
        }
      });

      window.electron?.onSettingsUpdate?.((patch) => {
        console.log("Settings updated:", patch);
        if (patch.saveDir !== undefined) {
          refreshSavePath();
        }
        if (patch.ignoreRealtime !== undefined) {
          S.ignoreRealtime = patch.ignoreRealtime;
          if (el.ignoreRT) el.ignoreRT.checked = S.ignoreRealtime;
        }
        if (patch.showVirtualPorts !== undefined) {
          S.showVirtualPorts = patch.showVirtualPorts;
          if (el.toggleVirtualPorts) el.toggleVirtualPorts.checked = S.showVirtualPorts;
          initMIDI(); // Re-scan devices with the new filter
        }
        if (patch.saveFormat !== undefined) {
          S.saveFormat = patch.saveFormat;
          if (el.saveMidi) el.saveMidi.checked = (S.saveFormat === 'midi');
          if (el.saveJson) el.saveJson.checked = (S.saveFormat === 'json');
          if (el.saveBoth) el.saveBoth.checked = (S.saveFormat === 'both');
        }
        if (patch.theme !== undefined) {
          S.theme = patch.theme;
          applyTheme(S.theme);
        }
        if (patch.font !== undefined) {
          S.font = patch.font;
          applyFont(S.font);
        }
      });

      window.electron?.onMenuSetLang?.((lang) => {
        S.lang = lang;
        console.log(`Language set to: ${lang}`);
      });

      window.electron?.onSettingsPreset?.((preset) => {
        console.log("Preset applied from menu:", preset);
        if (preset.preRoll !== undefined) {
          el.preRoll.value = preset.preRoll;
          S.preRollMs = preset.preRoll;
        }
        if (preset.maxCapture !== undefined) {
          el.maxCap.value = preset.maxCapture;
          S.maxCaptureSeconds = preset.maxCapture;
        }
        showToast(`Preset applied: ${preset.preRoll}ms pre + ${preset.maxCapture}s`, "ok", 1500);
      });
    }

    // ---- Save path management ----
    async function refreshSavePath() {
      try {
        const dir = await window.electron?.getSaveFolder?.();
        const text = dir || "(Desktop/DJ Captures)";
        el.savePath.textContent = "💾 Saving to: " + text;
      } catch {
        el.savePath.textContent = "💾 Saving to: (Downloads)";
      }
    }

    // ---- Startup ----
    (async function start() {
      window.electron?.onDiagnosticLog?.((msg) => { console.log(msg); });
      bindUI();
      initMIDI();
      initRemoteInfo();
      refreshSavePath();

      // Set initial state of the virtual ports toggle
      try {
        const settings = await window.electron?.getSettings?.();
        if (settings) {
          S.showVirtualPorts = !!settings.showVirtualPorts;
          if (el.toggleVirtualPorts) el.toggleVirtualPorts.checked = S.showVirtualPorts;
          S.saveFormat = settings.saveFormat || 'midi'; // Initialize saveFormat
          // Set initial state of radio buttons
          if (el.saveMidi) el.saveMidi.checked = (S.saveFormat === 'midi');
          if (el.saveJson) el.saveJson.checked = (S.saveFormat === 'json');
          if (el.saveBoth) el.saveBoth.checked = (S.saveFormat === 'both');
          S.theme = settings.theme || 'default-dark';
          applyTheme(S.theme);
          S.font = settings.font || 'system';
          applyFont(S.font);
          S.lang = settings.lang || 'en';
        }
      } catch (e) {
        console.error("Failed to get initial settings for virtual ports toggle or save format", e);
      }
      el.preRoll.value = S.preRollMs;
      el.maxCap.value = S.maxCaptureSeconds;
      el.bpmInput.value = S.manualBPM;

      let version;
      try {
        version = await window.electron?.getVersion?.();
        if (version) {
          document.title = `DJ MIDI Capture v${version}`;
          if (el.appVersion) el.appVersion.textContent = `v${version}`;
        }
      } catch (e) {
        // ignore
      }

      console.log(`🎵 DJ MIDI Capture v${version || 'unknown'} initialized - Buffer limit increased to 150 events/s`);
    })();