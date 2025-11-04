 # DJ MIDI Capture - Pomoc
    2
    3 ## 1. Wprowadzenie
    4
    5 DJ MIDI Capture to narzędzie dla DJ-ów i artystów na żywo, służące do ciągłego nagrywania danych MIDI z
      ich kontrolerów.
    6
    7 Używa "bufora kroczącego" (rolling buffer), aby zapewnić, że nigdy nie przegapisz spontanicznego pomysłu,
      pozwalając Ci zapisać to, co *już* zagrałeś. Jest to idealne do przechwytywania nieoczekiwanych momentów
      kreatywności.
    8
    9 ## 2. Główne Elementy Interfejsu
   10
   11 - **Kafelki Statusu**: Szybki podgląd statusu połączenia MIDI, liczby zdarzeń w buforze, użycia bufora i
      całkowitej liczby zapisów w tej sesji.
   12
   13 - **Aktywne Wejścia (Active Inputs)**: Lista wszystkich wykrytych wejściowych urządzeń MIDI.
   14   - ✅ Zielony ptaszek oznacza aktywne urządzenie, które wysyła dane.
   15   - ⚫ Czarna kropka oznacza podłączone, ale obecnie nieaktywne urządzenie.
   16   - **Show Virtual**: Użyj tego przełącznika, aby pokazać lub ukryć wirtualne porty MIDI (np. "Microsoft
      GS Wavetable Synth").
   17
   18 - **Kontrolki (Controls)**:
   19   - **Session / Track/Tag**: Te pola służą do automatycznego nazywania zapisanych plików `.mid`.
   20   - **Pre-roll (ms)**: Ile czasu *przed* wyzwoleniem zapisu ma być dołączone do nagrania (w
      milisekundach).
   21   - **Max capture (s)**: Maksymalna długość nagrania (w sekundach). Definiuje to rozmiar Twojego bufora
      kroczącego.
   22
   23 - **Monitor na Żywo (Live MIDI Monitor)**:
   24   - **Last MIDI Event**: Wyświetla surowe dane ostatniego otrzymanego komunikatu MIDI.
   25   - **Trigger Status**: Pokazuje aktualny stan wyzwalacza zapisu (np. Gotowy, Zapisano, Burza MIDI).
   26   - **Activity LED**: Miga na zielono za każdym razem, gdy odbierany jest komunikat MIDI.
   27
   28 - **Remote Drop**:
   29   - Pokazuje adres URL dla funkcji zdalnego wyzwalania. Otwórz ten adres na swoim telefonie (w tej samej
      sieci Wi-Fi), aby uzyskać przycisk "DROP".
   30   - Naciśnięcie tego przycisku na telefonie wyzwoli zapis w aplikacji na komputerze.
   31
   32 ## 3. Kluczowe Funkcje
   33
   34 - **Rolling Capture (tryb domyślny)**: Aplikacja cały czas nasłuchuje i nagrywa MIDI do bufora. Kiedy
      naciskasz przycisk `Capture` lub używasz nuty-wyzwalacza, zapisuje ostatnie `X` sekund aktywności MIDI,
      gdzie `X` to Twoje ustawienie `Max capture`.
   35
   36 - **Forward Capture (checkbox)**: Jeśli zaznaczysz pole "Forward mode", zachowanie się zmienia. Teraz
      naciśnięcie `Capture` lub użycie wyzwalacza *rozpoczyna* nowe nagranie, które potrwa `X` sekund. Działa to
      jak tradycyjny przycisk "record".
   37
   38 - **Wykrywanie tempa:** Automatycznie wykrywa i wyświetla tempo (BPM) przychodzącego sygnału zegara MIDI,
      co pozwala na lepszą synchronizację i analizę przechwyconych danych MIDI.
   39
   40 - **Nuta-Wyzwalacz (Trigger Note)**: Domyślnie, komunikat Note On dla **C4 (nuta MIDI 60)** na dowolnym
      kanale wyzwoli zapis, tak samo jak naciśnięcie przycisku `Capture`.
   41
   42 ## 4. Skróty Klawiszowe
   43
   44 - **N**: Wyzwala zapis (tak samo jak przycisk `Capture`).
   45 - **C**: Czyści bufor zdarzeń MIDI.
   46 - **T**: Symuluje testowe zdarzenie MIDI w celu wyzwolenia zapisu.
