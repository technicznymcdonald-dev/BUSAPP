# Tablica kierunkowa autobusu — sterowanie przez LAN

Prosta apka: uruchamiasz serwer na komputerze w domowej sieci WiFi,
a każde inne urządzenie (telefon, tablet, drugi komputer) łączy się
przez przeglądarkę pod adresem IP tego komputera. Każde urządzenie
widzi listę linii do kliknięcia ORAZ wyświetlacz — kliknięcie linii
na jednym urządzeniu natychmiast aktualizuje wyświetlacz na wszystkich
pozostałych.

## Wymagania

- Zainstalowany [Node.js](https://nodejs.org) (wersja 18+) na komputerze,
  który ma być serwerem.
- Wszystkie urządzenia (komputer + telefony) podłączone do **tej samej
  sieci WiFi**.

## Instalacja i uruchomienie

1. Rozpakuj folder `bus-display-app` gdziekolwiek na komputerze.
2. Otwórz terminal / wiersz poleceń w tym folderze.
3. Zainstaluj zależności:

   ```
   npm install
   ```

4. Uruchom serwer:

   ```
   npm start
   ```

5. W konsoli pojawi się coś w stylu:

   ```
   http://192.168.1.23:3000
   ```

   To jest adres, który wpisujesz w przeglądarce na KAŻDYM urządzeniu
   (włącznie z samym komputerem, jeśli chcesz).

6. Na telefonie: otwórz przeglądarkę (Chrome/Safari) i wpisz dokładnie
   ten adres z konsoli. Zrób to na drugim telefonie/urządzeniu też.

## Jak używać

- Na dole ekranu jest lista linii — klik w linię ustawia ją jako
  aktualnie wyświetlaną na WSZYSTKICH podłączonych urządzeniach.
- Na górze jest sam wyświetlacz (czarne tło, pomarańczowy tekst jak
  dioda LED).
- Przycisk **⛶** w prawym górnym rogu wyświetlacza włącza tryb
  pełnoekranowy samego wyświetlacza (przydatne, jeśli dane urządzenie
  ma być tylko "tablicą", a nie sterownikiem).
- Przycisk **Wygaś** czyści wyświetlacz.
- Formularz na dole pozwala dodawać nowe linie (zapisują się trwale
  do pliku `lines.json`, więc zostaną po restarcie serwera).
- Krzyżyk przy linii na liście usuwa ją.

## Jeśli telefon nie może się połączyć

- Upewnij się, że telefon i komputer są w TEJ SAMEJ sieci WiFi
  (nie osobno na WiFi i danych komórkowych).
- Zapora sieciowa (firewall) na komputerze może blokować port 3000 —
  jeśli połączenie nie działa, zezwól na niego w ustawieniach zapory
  (Windows: "Zapora Windows Defender" → zezwól aplikacji Node.js na
  komunikację w sieciach prywatnych).
- Adres IP komputera może się zmienić po restarcie routera — zawsze
  sprawdzaj aktualny adres wypisywany w konsoli po `npm start`.

## Zmiana portu

Domyślny port to 3000. Żeby zmienić, uruchom np.:

```
PORT=8080 npm start
```

(na Windows w PowerShell: `$env:PORT=8080; npm start`)
