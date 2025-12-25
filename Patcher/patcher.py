import os
import re

# 1. Pobieramy folder, w którym leży TEN skrypt (np. .../Projekt/Patcher)
script_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Określamy nazwę folderu docelowego (gdzie leży aplikacja)
TARGET_FOLDER_NAME = "App"

# 3. Budujemy ścieżkę do folderu App dynamicznie
#    os.path.dirname(script_dir) -> wychodzi piętro wyżej (do .../Projekt)
#    os.path.join(..., TARGET_FOLDER_NAME) -> wchodzi do App
app_dir = os.path.join(os.path.dirname(script_dir), TARGET_FOLDER_NAME)

INSTRUCTIONS_FILE = os.path.join(script_dir, "instrukcje.txt")

def apply_changes():
    print(f"📂 Folder patchera: {script_dir}")
    print(f"📂 Folder aplikacji (cel): {app_dir}")
    
    # Sprawdzenie czy folder App istnieje
    if not os.path.exists(app_dir):
        print(f"❌ BŁĄD: Nie znaleziono folderu docelowego '{TARGET_FOLDER_NAME}' obok folderu Patchera.")
        return

    try:
        with open(INSTRUCTIONS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Nie znaleziono pliku instrukcji: {INSTRUCTIONS_FILE}")
        return

    # Czyszczenie markdown
    content = re.sub(r'^```[a-zA-Z]*\n', '', content)
    content = re.sub(r'\n```$', '', content)

    # Regex (Tolerancyjny)
    pattern = re.compile(
        r'PLIK:\s*"(.*?)"\s*'
        r'OPERACJA:\s*\[(.*?)\]\s*'
        r'SZUKAJ:[ \t]*\n(.*?)\n'      
        r'TREŚĆ:[ \t]*\n(.*?)(?=\n\s*KROK|\Z)', 
        re.DOTALL
    )

    matches = pattern.findall(content)
    
    if not matches:
        print("⚠️ Nie znaleziono instrukcji. Sprawdź format pliku instrukcje.txt.")
        return

    print(f"🔍 Znaleziono {len(matches)} kroków.\n")

    for file_name_raw, operation, search_block, content_block in matches:
        # Usuwamy ewentualne spacje z nazwy pliku
        file_name = file_name_raw.strip()
        
        # Budujemy ścieżkę w oparciu o app_dir, a nie script_dir
        full_file_path = os.path.join(app_dir, file_name)
        # Normalizacja ścieżki (naprawia np. mieszane slashe / i \)
        full_file_path = os.path.normpath(full_file_path)
        
        print(f"⚙️  Przetwarzanie: {file_name} -> {operation}")
        
        if not os.path.exists(full_file_path):
            print(f"   ❌ BŁĄD: Plik nie istnieje pod ścieżką:")
            print(f"      👉 {full_file_path}")
            continue

        with open(full_file_path, 'r', encoding='utf-8') as f:
            original_code = f.read()

        search_str = search_block.strip('\n') 
        replace_str = content_block.strip('\n')

        # --- LOGIKA APLIKOWANIA ZMIAN ---
        if search_str not in original_code:
            print(f"   ⚠️  Nie znaleziono fragmentu 'SZUKAJ' w pliku.")
            debug_preview = search_str[:100].replace('\n', '\\n')
            print(f"      Szukano: '{debug_preview}...'") 
            continue

        new_code = original_code
        
        if operation == "ZASTĄP":
            new_code = original_code.replace(search_str, replace_str)
        elif operation == "WSTAW_PO":
            new_code = original_code.replace(search_str, search_str + "\n" + replace_str)
        elif operation == "WSTAW_PRZED":
            new_code = original_code.replace(search_str, replace_str + "\n" + search_str)
        else:
            print(f"   ❌ Nieznana operacja: {operation}")
            continue

        if new_code != original_code:
            with open(full_file_path, 'w', encoding='utf-8') as f:
                f.write(new_code)
            print(f"   ✅ Sukces! Zapisano zmiany.")
        else:
            print(f"   ⚠️  Brak zmian (kod identyczny lub już zmieniony).")

if __name__ == "__main__":
    apply_changes()