import os
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
TARGET_FOLDER_NAME = ""
app_dir = (
    os.path.dirname(script_dir)
    if TARGET_FOLDER_NAME == ""
    else os.path.join(os.path.dirname(script_dir), TARGET_FOLDER_NAME)
)
INSTRUCTIONS_FILE = os.path.join(script_dir, "instrukcje.txt")

def make_smart_fuzzy_regex(text):
    """
    Tworzy zaawansowany regex.
    Dzieli tekst na słowa ORAZ znaki interpunkcyjne.
    Pozwala na dowolną ilość białych znaków pomiędzy nimi.
    """
    # Znajdź wszystko co jest słowem (\w+) LUB nie jest białym znakiem ([^\w\s])
    # To rozdzieli np. 'class="foo"' na ['class', '=', '"', 'foo', '"']
    tokens = re.findall(r'\w+|[^\w\s]', text)
    
    # Escape'uj każdy token, żeby znaki specjalne (np. ?, *, +) były traktowane literalnie
    escaped_tokens = [re.escape(t) for t in tokens]
    
    # Połącz tokeny, pozwalając na 0 lub więcej białych znaków (\s*) pomiędzy nimi
    pattern = r'\s*'.join(escaped_tokens)
    return pattern

def apply_changes():
    print(f"📂 Folder patchera: {script_dir}")
    print(f"📂 Folder aplikacji: {app_dir}\n")
    
    if not os.path.exists(app_dir):
        print(f"❌ BŁĄD KRYTYCZNY: Nie znaleziono folderu '{TARGET_FOLDER_NAME}' obok patchera.")
        return

    try:
        with open(INSTRUCTIONS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Brak pliku z instrukcjami: {INSTRUCTIONS_FILE}")
        return

    # Usuń bloki markdown ```text ... ``` jeśli AI je dodało
    content = re.sub(r'^```[a-zA-Z]*\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'\n```$', '', content, flags=re.MULTILINE)

    # Ulepszony Regex do parsowania instrukcji (bardziej tolerancyjny na entery)
    pattern = re.compile(
        r'PLIK:\s*"(.*?)"\s*'
        r'OPERACJA:\s*\[(.*?)\]\s*'
        r'SZUKAJ:\s*?\n(.*?)\n'      # Capture content after SZUKAJ:\n
        r'TREŚĆ:\s*?\n(.*?)(?=\n\s*KROK|\Z)', # Capture until next KROK or EOF
        re.DOTALL
    )

    matches = pattern.findall(content)
    
    if not matches:
        print("⚠️ Nie znaleziono żadnych kroków w pliku instrukcje.txt. Sprawdź formatowanie.")
        return

    print(f"🔍 Znaleziono {len(matches)} kroków do wykonania.\n")

    for i, (file_name_raw, operation, search_block, content_block) in enumerate(matches, 1):
        file_name = file_name_raw.strip()
        full_file_path = os.path.join(app_dir, file_name)
        full_file_path = os.path.normpath(full_file_path)
        
        print(f"⚙️  Krok {i}: {file_name} -> {operation}")
        
        if not os.path.exists(full_file_path):
            print(f"   ❌ Błąd: Plik nie istnieje: {full_file_path}")
            continue

        with open(full_file_path, 'r', encoding='utf-8') as f:
            original_code = f.read()

        # Usuwamy białe znaki tylko z końców bloków, zachowując wcięcia w środku
        search_str = search_block.rstrip() 
        replace_str = content_block.rstrip()

        # --- LOGIKA APLIKOWANIA ZMIAN ---
        
        # 1. Próba dokładna (Exact Match)
        if search_str in original_code:
            print("   🔹 Znaleziono (Dokładne dopasowanie)")
            match_start = original_code.find(search_str)
            match_end = match_start + len(search_str)
            found = True
        else:
            # 2. Próba inteligentna (Smart Fuzzy Match)
            print("   🔸 Próba dopasowania inteligentnego (ignorowanie spacji)...")
            fuzzy_pattern = make_smart_fuzzy_regex(search_str)
            
            match = re.search(fuzzy_pattern, original_code, re.DOTALL)
            if match:
                print("   ✅ Znaleziono fragment (Smart Match)!")
                match_start, match_end = match.span()
                found = True
            else:
                found = False

        if not found:
            print(f"   ⚠️ NIE ZNALEZIONO fragmentu w pliku!")
            print(f"      Sprawdź czy w sekcji SZUKAJ nie brakuje komentarzy lub linii, które są w pliku.")
            debug_str = ' '.join(search_str.split())[:100]
            print(f"      Szukano: '{debug_str}...'")
            continue

        # Wykonanie operacji na znalezionych indeksach
        new_code_content = original_code
        
        if operation == "ZASTĄP":
            new_code_content = original_code[:match_start] + replace_str + original_code[match_end:]
        elif operation == "WSTAW_PO":
            new_code_content = original_code[:match_end] + "\n" + replace_str + original_code[match_end:]
        elif operation == "WSTAW_PRZED":
            new_code_content = original_code[:match_start] + replace_str + "\n" + original_code[match_start:]
        else:
            print(f"   ❌ Nieznana operacja: {operation}")
            continue

        # Zapisz tylko jeśli były zmiany
        if new_code_content != original_code:
            with open(full_file_path, 'w', encoding='utf-8') as f:
                f.write(new_code_content)
            print(f"   ✅ Sukces! Zapisano zmiany.")
        else:
            print(f"   ⚠️ Brak zmian (kod jest już identyczny).")

if __name__ == "__main__":
    apply_changes()