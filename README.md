# DJ MIDI Capture v1.5.0

**A cross-platform desktop tool for DJs, producers, and musicians to capture MIDI events from their controllers using a rolling buffer, without recording any audio.**

---

## English

### About

DJ MIDI Capture is a utility designed for DJs, live performers, and music producers who want to record MIDI data from their hardware. While designed with DJs in mind, it's a universal tool for anyone wanting to quickly capture MIDI from a synthesizer, keyboard, or drum machine without launching a full Digital Audio Workstation (DAW). It uses a "rolling buffer" concept, meaning it's always listening. When you press the "Capture" button, it saves the last X seconds of MIDI activity, ensuring you never miss that perfect riff, chord progression, or creative moment.

This tool is perfect for:
* Analyzing your MIDI performance after a set.
* Recreating parts of your set in a DAW using the captured MIDI data.
* Sharing MIDI patterns and ideas.

### Features

* **Rolling MIDI Buffer:** The app is always listening. Capture the most recent MIDI events with a single click.
* **Customizable Capture:** Easily set the capture duration (in seconds) and a pre-roll buffer (in milliseconds) to fine-tune what you save.
* **Forward Capture Mode:** In addition to the rolling buffer, you can trigger a capture that records for a set duration into the future.
* **Tempo Detection:** Automatically detects and displays the tempo (BPM) of the incoming MIDI clock signal, allowing for better synchronization and analysis of captured MIDI data.
* **Remote Control ("Remote Drop"):** Control the capture process from your phone! The app hosts a local web page with a large "DROP" button, accessible via a QR code. It also includes presets for quick captures (15s, 30s, 45s, 1m).
* **Multiple Save Formats:** Save your captures as standard `.mid` files, detailed `.json` files, or both simultaneously.
* **Live Monitoring:** See MIDI events scroll by in a live timeline and monitor the last event received.
* **Device Management:** The app automatically detects connected MIDI devices. It also provides an option to show/hide virtual MIDI ports (like loopMIDI) for a cleaner interface.
* **Customizable UI:**
    * **Themes:** Choose between Default Dark, Midnight Blue, and Light themes to match your preference.
    * **Fonts:** Select from the default System font, Roboto, or Roboto Mono for readability.
* **Cross-Platform:** Built with Electron to run on Windows, macOS (with universal builds for Intel & Apple Silicon), and Linux.

### Building from Source

If you prefer to build the application yourself, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/patrykmozeluk-cloud/DJ-MIDI.git](https://github.com/patrykmozeluk-cloud/DJ-MIDI.git)
    cd DJ-MIDI
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the build command for your OS:**
    * **For Windows:** `npm run build:win`
    * **For macOS:** `npm run build:mac` (Note: Requires a macOS machine)
    * **For Linux:** `npm run build:linux`

The completed application will be in the `dist` folder.

### How to Use

1.  Launch the application.
2.  Your connected MIDI controllers will appear in the "Active Inputs" list.
3.  Play your set. The app will passively listen and fill the rolling buffer.
4.  After a moment you want to save, press the big **Capture** button or use the `N` key.
5.  The last X seconds of MIDI data (based on your settings) will be saved to your chosen folder (default is `Documents/DJ Captures`).

### Troubleshooting

**Firewall Configuration (Windows)**

If you are unable to connect to the Remote Drop server from your phone, even if the application is running, your Windows Firewall might be blocking the connection. Follow these steps to configure your firewall:

1.  **Open Windows Defender Firewall with Advanced Security:**
    * Press `Win + R`, type `wf.msc`, and press `Enter`.
    * Alternatively, search for "Windows Defender Firewall with Advanced Security" in the Start menu.
2.  **Create a New Inbound Rule:**
    * In the left pane, click `Inbound Rules`.
    * In the right pane, click `New Rule...`.
3.  **Select Rule Type:**
    * Choose `Program` and click `Next`.
4.  **Select Program:**
    * Select `This program path`.
    * Click `Browse...` and navigate to the `DJ MIDI Capture.exe` executable. This is typically found in the application's installation directory (e.g., `C:\Program Files\DJ MIDI Capture\DJ MIDI Capture.exe` or similar, depending on your installation path).
    * Click `Next`.
5.  **Allow the Connection:**
    * Select `Allow the connection` and click `Next`.
6.  **Select Profiles:**
    * Ensure all profiles (Domain, `Private`, `Public`) are checked. Click `Next`.
7.  **Name the Rule:**
    * Enter a name for the rule, e.g., `DJ MIDI Capture - Allow Connections`.
    * You can add a description, e.g., `Allows incoming connections for the DJ MIDI Capture remote server..`
    * Click `Finish`.

After completing these steps, Windows Firewall should allow connections to the DJ MIDI Capture application, enabling your phone to connect to the remote server.

### Licence **MIT**

* **Author:** Patryk Mozeluk
* **Contact:** [patrykmozeluk@gmail.com](mailto:patrykmozeluk@gmail.com)

---

## Polski

### O Aplikacji

DJ MIDI Capture to narzędzie przeznaczone dla DJ-ów, artystów na żywo i producentów muzycznych, którzy chcą nagrywać dane MIDI ze swojego sprzętu. Choć zaprojektowane z myślą o DJ-ach, jest to uniwersalne narzędzie dla każdego, kto chce szybko przechwycić MIDI z syntezatora, klawiatury czy automatu perkusyjnego, bez uruchamiania pełnego programu DAW. Działa w oparciu o koncepcję "bufora kroczącego", co oznacza, że aplikacja ciągle nasłuchuje. Po naciśnięciu przycisku "Capture", zapisuje ostatnie X sekund aktywności MIDI, dzięki czemu nigdy nie przegapisz idealnego riffu, progresji akordów lub kreatywnego momentu.

To narzędzie jest idealne do:
* Analizowania swoich zagrań MIDI po secie.
* Odtwarzania fragmentów seta w programie DAW przy użyciu przechwyconych danych MIDI.
* Dzielenia się patternami i pomysłami MIDI.

### Funkcje

* **Kroczący Bufor MIDI:** Aplikacja ciągle nasłuchuje. Przechwytuj najnowsze zdarzenia MIDI jednym kliknięciem.
* **Konfigurowalny Przechwyt:** Łatwo ustaw czas trwania przechwytywania (w sekundach) i bufor pre-roll (w milisekundach), aby precyzyjnie dostosować to, co zapisujesz.
* **Tryb Nagrywania w Przód:** Oprócz bufora kroczącego, możesz wyzwolić nagrywanie, które rejestruje zdarzenia przez określony czas w przyszłość.
* **Wykrywanie tempa:** Automatycznie wykrywa i wyświetla tempo (BPM) przychodzącego sygnału zegara MIDI, co pozwala na lepszą synchronizację i analizę przechwyconych danych MIDI.
* **Zdalne Sterowanie ("Remote Drop"):** Steruj przechwytywaniem za pomocą telefonu! Aplikacja udostępnia lokalną stronę internetową z dużym przyciskiem "DROP", dostępną przez kod QR. Zawiera również presety do szybkich zrzutów (15s, 30s, 45s, 1m).
* **Wiele Formatów Zapisu:** Zapisuj swoje nagrania jako standardowe pliki `.mid`, szczegółowe pliki `.json` lub oba jednocześnie.
* **Monitoring na Żywo:** Obserwuj przewijające się zdarzenia MIDI na osi czasu i monitoruj ostatnie odebrane zdarzenie.
* **Zarządzanie Urządzeniami:** Aplikacja automatycznie wykrywa podłączone urządzenia MIDI. Zapewnia również opcję pokazywania/ukrywania wirtualnych portów MIDI (np. loopMIDI) dla czystszego interfejsu.
* **Personalizacja Interfejsu:**
    * **Motywy:** Wybieraj między motywami Domyślny Ciemny, Nocny Niebieski i Jasny, aby dopasować wygląd do swoich preferencji.
    * **Czcionki:** Wybierz domyślną czcionkę systemową, Roboto lub Roboto Mono dla lepszej czytelności.
* **Wieloplatformowość:** Zbudowana przy użyciu Electron, działa na systemach Windows, macOS (z uniwersalnymi buildami dla procesorów Intel i Apple Silicon) oraz Linux.

### Budowanie ze Źródła

Jeśli wolisz samodzielnie zbudować aplikację, postępuj zgodnie z poniższymi krokami:

1.  **Sklonuj repozytorium:**
    ```bash
    git clone [https://github.com/patrykmozeluk-cloud/DJ-MIDI.git](https://github.com/patrykmozeluk-cloud/DJ-MIDI.git)
    cd DJ-MIDI
    ```

2.  **Zainstaluj zależności:**
    ```bash
    npm install
    ```

3.  **Uruchom komendę budowania dla swojego systemu:**
    * **Dla Windows:** `npm run build:win`
    * **Dla macOS:** `npm run build:mac` (Uwaga: Wymaga komputera z systemem macOS)
    * **Dla Linux:** `npm run build:linux`

Gotowa aplikacja znajdzie się w folderze `dist`.

### Jak Używać

1.  Uruchom aplikację.
2.  Twoje podłączone kontrolery MIDI pojawią się na liście "Active Inputs".
3.  Graj swojego seta. Aplikacja będzie pasywnie nasłuchiwać i wypełniać bufor kroczący.
4.  Po chwili, którą chcesz zapisać, naciśnij duży przycisk **Capture** lub użyj klawisza `N`.
5.  Ostatnie X sekund danych MIDI (zgodnie z Twoimi ustawieniami) zostanie zapisane w wybranym folderze (domyślnie `Dokumenty/DJ Captures`).

### Rozwiązywanie problemów

**Konfiguracja Zapory Sieciowej (Windows)**

Jeśli nie możesz połączyć się z serwerem Remote Drop z telefonu, nawet jeśli aplikacja jest uruchomiona, Twoja Zapora Systemu Windows może blokować połączenie. Wykonaj poniższe kroki, aby skonfigurować zaporę:

1.  **Otwórz Zaporę Windows Defender z zabezpieczeniami zaawansowanymi:**
    * Naciśnij `Win + R`, wpisz `wf.msc` i naciśnij `Enter`.
    * Alternatywnie, wyszukaj "Zapora Windows Defender z zabezpieczeniami zaawansowanymi" w menu Start.
2.  **Utwórz nową regułę dla ruchu przychodzącego:**
    * W lewym panelu kliknij `Reguły przychodzące`.
    * W prawym panelu kliknij `Nowa reguła...`.
3.  **Wybierz typ reguły:**
    * Wybierz `Program` i kliknij `Dalej`.
4.  **Wybierz program:**
    * Wybierz `Ścieżka programu`.
    * Kliknij `Przeglądaj...` i znajdź plik wykonywalny `DJ MIDI Capture.exe`. Zazwyczaj znajduje się on w katalogu instalacyjnym aplikacji (np. `C:\Program Files\DJ MIDI Capture\DJ MIDI Capture.exe` lub podobnym, w zależności od miejsca instalacji).
    * Kliknij `Dalej`.
5.  **Zezwól na połączenie:**
    * Wybierz `Zezwalaj na połączenie` i kliknij `Dalej`.
6.  **Wybierz profile:**
    * Upewnij się, że zaznaczone są wszystkie profile (Domena, `Prywatny`, `Publiczny`). Kliknij `Dalej`.
7.  **Nadaj nazwę regule:**
    * Wpisz nazwę dla reguły, np. `DJ MIDI Capture - Zezwól na połączenia`.
    * Możesz dodać opis, np. `Zezwala na połączenia przychodzące dla serwera zdalnego DJ MIDI Capture..`
    * Kliknij `Zakończ`.

Po wykonaniu tych kroków, Zapora Windows Defender powinna zezwolić na połączenia z aplikacją DJ MIDI Capture, umożliwiając Twojemu telefonowi połączenie się z serwerem zdalnym.

**Konfiguracja Zapory Sieciowej (macOS)**

Na macOS domyślna zapora sieciowa (Firewall) jest zazwyczaj mniej restrykcyjna niż na Windows, ale może blokować połączenia przychodzące dla nieznanych aplikacji.

1.  **Sprawdź status zapory:**
    * Przejdź do `Preferencje Systemowe` (System Preferences) > `Ochrona i Prywatność` (Security & Privacy) > `Zapora Sieciowa` (Firewall).
    * Upewnij się, że zapora jest włączona.
2.  **Zezwól na połączenia dla aplikacji:**
    * Kliknij ikonę kłódki w lewym dolnym rogu i wprowadź hasło administratora, aby odblokować ustawienia.
    * Kliknij `Opcje Zapory Sieciowej...` (Firewall Options...).
    * Na liście poszukaj `DJ MIDI Capture`. Jeśli go nie ma, kliknij przycisk `+` i dodaj aplikację `DJ MIDI Capture` (znajdującą się zazwyczaj w folderze `Aplikacje`).
    * Upewnij się, że obok `DJ MIDI Capture` jest ustawiona opcja `Zezwalaj na połączenia przychodzące` (Allow incoming connections).
    * Kliknij `OK` i ponownie ikonę kłódki, aby zablokować ustawienia.

**Konfiguracja Zapory Sieciowej (Linux)**

Na Linuxie istnieje wiele różnych dystrybucji i narzędzi do zarządzania zaporą sieciową. Najpopularniejsze to `ufw` (Uncomplicated Firewall) dla systemów opartych na Debianie/Ubuntu oraz `firewalld` dla systemów opartych na Red Hat/Fedora.

* **Dla systemów używających `ufw` (np. Ubuntu, Debian):**
    1.  Sprawdź status `ufw`:
        ```bash
        sudo ufw status
        ```
    2.  Jeśli zapora jest nieaktywna, nie ma potrzeby dalszej konfiguracji. Jeśli jest aktywna, przejdź do kroku 3.
    3.  Zezwól na połączenia dla portu aplikacji: Aplikacja "Remote Drop" używa określonego portu (domyślnie 3000, ale może być dynamiczny). Musisz zezwolić na ruch przychodzący na tym porcie.
        ```bash
        sudo ufw allow <numer_portu>/tcp
        ```
        Zastąp `<numer_portu>` faktycznym portem używanym przez funkcję "Remote Drop".
    4.  Przeładuj `ufw`:
        ```bash
        sudo ufw reload
        ```

* **Dla systemów używających `firewalld` (np. Fedora, CentOS):**
    1.  Sprawdź status `firewalld`:
        ```bash
        sudo firewall-cmd --state
        ```
    2.  Jeśli zapora jest nieaktywna, nie ma potrzeby dalszej konfiguracji. Jeśli jest aktywna, przejdź do kroku 3.
    3.  Zezwól na połączenia dla portu aplikacji:
        ```bash
        sudo firewall-cmd --zone=public --add-port=<numer_portu>/tcp --permanent
        ```
        Zastąp `<numer_portu>` faktycznym portem używanym przez funkcję "Remote Drop".
    4.  Przeładuj `firewalld`:
        ```bash
        sudo firewall-cmd --reload
        ```

Ważna uwaga: Dokładne kroki mogą się różnić w zależności od konkretnej dystrybucji Linuxa i używanego narzędzia do zarządzania zaporą. Zawsze zaleca się sprawdzenie dokumentacji dla swojej dystrybucji.

### Licencja

Ten projekt jest objęty licencją **MIT**

* **Autor:** Patryk Mozeluk
* **Kontakt:** [patrykmozeluk@gmail.com](mailto:patrykmozeluk@gmail.com)
