Aplikacje BusApp 
Version 1.0.1a


Żeby zainstalować aplikacje trzeba rozpakować plik Zip w otworzyć w folderze busapp CMD i wpisac "npm install"

jak się zainstaluje zrestartować CMD  i wpisac "npm start" lub klikac plik uruchom w folderze z plikami 

pojawi się ip i bramka które trzeba wpisac do przeglądarki ale uwaga! urządzenie z którego się wchodzi musi być w tej samej sieci internetowej co komputer/ urządzenie hostujace 

żeby zmieniac i dodawać linie trzeba odpalić plik lines w folderze i pododawać linie 

żeby ustawić dane ogłoszenia dla danej linii trzeba otworzyć plik app.js w public i w danych linijkach pozmieniać kod 
"const LINE_SOUND_MAP = {
  "NAZWA Z DUZYMI LITERAMI JAK W LINES ": [
    "sounds/NAZWA_PLIKU_KTORY_DODALES/AS_W_FOLDERZE_SOUNDS.mp3",
  ],
  "DEFAULT": [
    "sounds/braklini.mp3"
  ]
};"
