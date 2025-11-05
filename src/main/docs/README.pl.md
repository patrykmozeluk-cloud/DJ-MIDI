# DJ MIDI Capture - Pomoc

## 1. Wprowadzenie

DJ MIDI Capture to narzędzie dla DJ-ów i artystów na żywo, służące do ciągłego nagrywania danych MIDI z ich kontrolerów.

Używa "bufora kroczącego" (rolling buffer), aby zapewnić, że nigdy nie przegapisz spontanicznego pomysłu, pozwalając Ci zapisać to, co *już* zagrałeś. Jest to idealne do przechwytywania nieoczekiwanych momentów kreatywności.

## 2. Główne Elementy Interfejsu

- **Kafelki Statusu**: Szybki podgląd statusu połączenia MIDI, liczby zdarzeń w buforze, użycia bufora i całkowitej liczby zapisów w tej sesji.

- **Aktywne Wejścia (Active Inputs)**: Lista wszystkich wykrytych wejściowych urządzeń MIDI.
  - ✅ Zielony ptaszek oznacza aktywne urządzenie, które wysyła dane.
  - ⚫ Czarna kropka oznacza podłączone, ale obecnie nieaktywne urządzenie.
  - **Show Virtual**: Użyj tego przełącznika, aby pokazać lub ukryć wirtualne porty MIDI (np. "Microsoft GS Wavetable Synth").

- **Kontrolki (Controls)**:
  - **Session / Track/Tag**: Te pola służą do automatycznego nazywania zapisanych plików `.mid`.
  - **Pre-roll (ms)**: Ile czasu *przed* wyzwoleniem zapisu ma być dołączone do nagrania (w milisekundach).
  - **Max capture (s)**: Maksymalna długość nagrania (w sekundach). Definiuje to rozmiar Twojego bufora kroczącego.

- **Monitor na Żywo (Live MIDI Monitor)**:
  - **Last MIDI Event**: Wyświetla surowe dane ostatniego otrzymanego komunikatu MIDI.
  - **Trigger Status**: Pokazuje aktualny stan wyzwalacza zapisu (np. Gotowy, Zapisano, Burza MIDI).
  - **Activity LED**: Miga na zielono za każdym razem, gdy odbierany jest komunikat MIDI.

- **Remote Drop**:
  - Pokazuje adres URL dla funkcji zdalnego wyzwalania. Otwórz ten adres na swoim telefonie (w tej samej sieci Wi-Fi), aby uzyskać przycisk "DROP".
  - Naciśnięcie tego przycisku na telefonie wyzwoli zapis w aplikacji na komputerze.

## 3. Kluczowe Funkcje

- **Rolling Capture (tryb domyślny)**: Aplikacja cały czas nasłuchuje i nagrywa MIDI do bufora. Kiedy naciskasz przycisk `Capture` lub używasz nuty-wyzwalacza, zapisuje ostatnie `X` sekund aktywności MIDI, gdzie `X` to Twoje ustawienie `Max capture`.

- **Forward Capture (checkbox)**: Jeśli zaznaczysz pole "Forward mode", zachowanie się zmienia. Teraz naciśnięcie `Capture` lub użycie wyzwalacza *rozpoczyna* nowe nagranie, które potrwa `X` sekund. Działa to jak tradycyjny przycisk "record".

- **Nuta-Wyzwalacz (Trigger Note)**: Domyślnie, komunikat Note On dla **C4 (nuta MIDI 60)** na dowolnym kanale wyzwoli zapis, tak samo jak naciśnięcie przycisku `Capture`.

## 4. Skróty Klawiszowe

- **N**: Wyzwala zapis (tak samo jak przycisk `Capture`).
- **C**: Czyści bufor zdarzeń MIDI.
- **T**: Symuluje testowe zdarzenie MIDI w celu wyzwolenia zapisu.
