# DJ MIDI Capture - Help

## 1. Introduction

DJ MIDI Capture is a utility for DJs and live performers to continuously record MIDI data from their controllers.

It uses a "rolling buffer" to ensure you never miss a spontaneous idea, allowing you to save what you've *already* played, making it perfect for capturing unexpected moments of creativity.

## 2. Main UI Elements

* **Status Tiles:** At-a-glance view of your MIDI connection status, the number of events currently in the rolling buffer, buffer usage percentage, and the total number of captures in this session.

* **Active Inputs:** Lists all detected MIDI input devices.
    * ✅ A green checkmark indicates an active device that is sending data.
    * ⚫ A black circle indicates a connected but currently inactive device.
    * **Show Virtual:** Use this toggle to show or hide virtual MIDI ports (e.g., "Microsoft GS Wavetable Synth").

* **Controls:**
    * **Session / Track/Tag:** These fields are used to automatically name your saved `.mid` files.
    * **Pre-roll (ms):** How much time *before* the capture trigger is included in the recording (in milliseconds).
    * **Max capture (s):** The maximum duration of a recording (in seconds). This defines the size of your rolling buffer.

* **Live MIDI Monitor:**
    * **Last MIDI Event:** Displays the raw data of the very last MIDI message received.
    * **Trigger Status:** Shows the current state of the capture trigger (e.g., Ready, Fired, MIDI Storm).
    * **Activity LED:** Blinks green whenever a MIDI message is received.

* **Remote Drop:**
    * Shows the URL for the remote trigger feature. Open this URL on your phone (on the same Wi-Fi network) to get a "DROP" button.
    * Pressing this button on your phone will trigger a capture in the desktop app.

## 3. Key Features

* **Rolling Capture (Default Mode):** The app is always listening and recording MIDI into the buffer. When you press the `Capture` button or use the trigger, it saves the last `X` seconds of MIDI activity, where `X` is your `Max capture` setting.

* **Forward Capture (Checkbox):** If you check the "Forward mode" box, the behavior changes. Now, pressing `Capture` or using the trigger *starts* a new recording that will last for `X` seconds. This works like a traditional "record" button.

* **Hybrid Tempo Control:** The app features a sophisticated tempo detection system that combines automatic and manual control.
    *   **Automatic Mode:** When a MIDI clock signal is detected from a connected device, the app automatically calculates and displays the BPM. This mode has priority and will override any manual settings. The BPM input field will be disabled and highlighted to indicate it's in auto mode.
    *   **Manual Mode:** If no MIDI clock is present, or if you disable the feature, you can manually set the BPM using the input field or the provided presets. This serves as a reliable fallback.
    *   **Seamless Switching:** The system automatically switches back to manual mode a few seconds after the MIDI clock signal stops.

* **Trigger Note:** By default, a Note On message for **C4 (MIDI note 60)** on any channel will trigger a capture, just like pressing the `Capture` button.

## 4. Keyboard Shortcuts

* **N**: Triggers a capture (same as the `Capture` button).
* **C**: Clears the MIDI event buffer.
* **T**: Simulates a test MIDI event for triggering a capture.