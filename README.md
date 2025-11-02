# DJ MIDI Capture v2.0

![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)

A cross-platform desktop tool for DJs, producers, and musicians to capture MIDI events from their controllers using a rolling buffer, without recording any audio.

---

## English

### About

DJ MIDI Capture is a utility designed for DJs, live performers, and music producers who want to record MIDI data from their hardware. While designed with DJs in mind, it's a universal tool for anyone wanting to quickly capture MIDI from a synthesizer, keyboard, or drum machine without launching a full Digital Audio Workstation (DAW). It uses a "rolling buffer" concept, meaning it's always listening. When you press the "Capture" button, it saves the last X seconds of MIDI activity, ensuring you never miss that perfect riff, chord progression, or creative moment.

This tool is perfect for:
- Analyzing your MIDI performance after a set.
- Recreating parts of your set in a DAW using the captured MIDI data.
- Sharing MIDI patterns and ideas.

### Features

- **Rolling MIDI Buffer**: The app is always listening. Capture the most recent MIDI events with a single click.
- **Customizable Capture**: Easily set the capture duration (in seconds) and a pre-roll buffer (in milliseconds) to fine-tune what you save.
- **Forward Capture Mode**: In addition to the rolling buffer, you can trigger a capture that records for a set duration *into the future*.
- **Remote Control ("Remote Drop")**: Control the capture process from your phone! The app hosts a local web page with a large "DROP" button, accessible via a QR code. It also includes presets for quick captures (15s, 30s, 45s, 1m).
- **Multiple Save Formats**: Save your captures as standard `.mid` files, detailed `.json` files, or both simultaneously.
- **Live Monitoring**: See MIDI events scroll by in a live timeline and monitor the last event received.
- **Device Management**: The app automatically detects connected MIDI devices. It also provides an option to show/hide virtual MIDI ports (like loopMIDI) for a cleaner interface.
- **Customizable UI**: 
  - **Themes**: Choose between Default Dark, Midnight Blue, and Light themes to match your preference.
  - **Fonts**: Select from the default System font, Roboto, or Roboto Mono for readability.
- **Cross-Platform**: Built with Electron to run on Windows, macOS (with universal builds for Intel & Apple Silicon), and Linux.

### Building from Source

If you prefer to build the application yourself, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/patrykmozeluk-cloud/DJ-MIDI.git
    cd DJ-MIDI
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Run the build command for your OS:**
    - For Windows: `npm run build:win`
    - For macOS: `npm run build:mac` (Note: Requires a macOS machine)
    - For Linux: `npm run build:linux`

The completed application will be in the `dist` folder.

### How to Use

1.  Launch the application.
2.  Your connected MIDI controllers will appear in the "Active Inputs" list.
3.  Play your set. The app will passively listen and fill the rolling buffer.
4.  After a moment you want to save, press the big **Capture** button or use the `N` key.
5.  The last X seconds of MIDI data (based on your settings) will be saved to your chosen folder (default is `Documents/DJ Captures`).

### License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**. See the [LICENSE](LICENSE) file for details.

- **Author**: Patryk Mozeluk
- **Contact**: patrykmozeluk@gmail.com

---

## Polski

### O Aplikacji

DJ MIDI Capture to narzędzie przeznaczone dla DJ-ów, artystów na żywo i producentów muzycznych, którzy chcą nagrywać dane MIDI ze swojego sprzętu. Choć zaprojektowane z myślą o DJ-ach, jest to uniwersalne narzędzie dla każdego, kto chce szybko przechwycić MIDI z syntezatora, klawiatury czy automatu perkusyjnego, bez uruchamiania pełnego programu DAW. Działa w oparciu o koncepcję "bufora kroczącego", co oznacza, że aplikacja ciągle nasłuchuje. Po naciśnięciu przycisku "Capture", zapisuje ostatnie X sekund aktywności MIDI, dzięki czemu nigdy nie przegapisz idealnego riffu, progresji akordów lub kreatywnego momentu.

To narzędzie jest idealne do:
- Analizowania swoich zagrań MIDI po secie.
- Odtwarzania fragmentów seta w programie DAW przy użyciu przechwyconych danych MIDI.
- Dzielenia się patternami i pomysłami MIDI.

### Funkcje

- **Kroczący Bufor MIDI**: Aplikacja ciągle nasłuchuje. Przechwytuj najnowsze zdarzenia MIDI jednym kliknięciem.
- **Konfigurowalny Przechwyt**: Łatwo ustaw czas trwania przechwytywania (w sekundach) i bufor pre-roll (w milisekundach), aby precyzyjnie dostosować to, co zapisujesz.
- **Tryb Nagrywania w Przód**: Oprócz bufora kroczącego, możesz wyzwolić nagrywanie, które rejestruje zdarzenia przez określony czas *w przyszłość*.
- **Zdalne Sterowanie ("Remote Drop")**: Steruj przechwytywaniem za pomocą telefonu! Aplikacja udostępnia lokalną stronę internetową z dużym przyciskiem "DROP", dostępną przez kod QR. Zawiera również presety do szybkich zrzutów (15s, 30s, 45s, 1m).
- **Wiele Formatów Zapisu**: Zapisuj swoje nagrania jako standardowe pliki `.mid`, szczegółowe pliki `.json` lub oba jednocześnie.
- **Monitoring na Żywo**: Obserwuj przewijające się zdarzenia MIDI na osi czasu i monitoruj ostatnie odebrane zdarzenie.
- **Zarządzanie Urządzeniami**: Aplikacja automatycznie wykrywa podłączone urządzenia MIDI. Zapewnia również opcję pokazywania/ukrywania wirtualnych portów MIDI (np. loopMIDI) dla czystszego interfejsu.
- **Personalizacja Interfejsu**:
  - **Motywy**: Wybieraj między motywami Domyślny Ciemny, Nocny Niebieski i Jasny, aby dopasować wygląd do swoich preferencji.
  - **Czcionki**: Wybierz domyślną czcionkę systemową, Roboto lub Roboto Mono dla lepszej czytelności.
- **Wieloplatformowość**: Zbudowana przy użyciu Electron, działa na systemach Windows, macOS (z uniwersalnymi buildami dla procesorów Intel i Apple Silicon) oraz Linux.

### Budowanie ze Źródła

Jeśli wolisz samodzielnie zbudować aplikację, postępuj zgodnie z poniższymi krokami:

1.  **Sklonuj repozytorium:**
    ```sh
    git clone https://github.com/patrykmozeluk-cloud/DJ-MIDI.git
    cd DJ-MIDI
    ```
2.  **Zainstaluj zależności:**
    ```sh
    npm install
    ```
3.  **Uruchom komendę budowania dla swojego systemu:**
    - Dla Windows: `npm run build:win`
    - Dla macOS: `npm run build:mac` (Uwaga: Wymaga komputera z systemem macOS)
    - Dla Linux: `npm run build:linux`

Gotowa aplikacja znajdzie się w folderze `dist`.

### Jak Używać

1.  Uruchom aplikację.
2.  Twoje podłączone kontrolery MIDI pojawią się na liście "Active Inputs".
3.  Graj swojego seta. Aplikacja będzie pasywnie nasłuchiwać i wypełniać bufor kroczący.
4.  Po chwili, którą chcesz zapisać, naciśnij duży przycisk **Capture** lub użyj klawisza `N`.
5.  Ostatnie X sekund danych MIDI (zgodnie z Twoimi ustawieniami) zostanie zapisane w wybranym folderze (domyślnie `Dokumenty/DJ Captures`).

### Licencja

Ten projekt jest objęty licencją **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. Zobacz plik [LICENSE](LICENSE), aby uzyskać szczegółowe informacje.

- **Autor**: Patryk Mozeluk
- **Kontakt**: patrykmozeluk@gmail.com
