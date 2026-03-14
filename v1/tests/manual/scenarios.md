# Manual test scenarios

1. Uruchom aplikację (`npm start`), wejdź na `https://chatgpt.com`, zaloguj się ręcznie.
2. Otwórz czat i kliknij **Dodaj bieżący czat do kolejki**.
3. Dodaj drugi czat do kolejki.
4. Zaznacz 2 czaty, ustaw formaty HTML + PDF i kliknij **Zapisz zaznaczone**.
5. Sprawdź `output_chat_store`:
   - każdy czat ma osobny folder `YYYY-MM-DD_HH-mm-ss__slug-title`
   - istnieje `manifest.json`
   - istnieją pliki dla wybranych formatów.
6. Zamknij aplikację, uruchom ponownie i potwierdź, że kolejka i ustawienia przetrwały restart.
