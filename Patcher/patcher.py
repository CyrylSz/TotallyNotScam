import os
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
TARGET_FOLDER_NAME = "App"
app_dir = os.path.join(os.path.dirname(script_dir), TARGET_FOLDER_NAME)
INSTRUCTIONS_FILE = os.path.join(script_dir, "instrukcje.txt")

def normalize_whitespace(text):
    """Zamienia każdy ciąg białych znaków na pojedynczą spację dla celów porównania."""
    return ' '.join(text.split())

def make_fuzzy_regex(text):
    """Tworzy regex, który dopasowuje tekst ignorując różnice w białych znakach."""
    # Escape'ujemy specjalne znaki regexa
    escaped = re.escape(text)
    # Zamieniamy escape'owane spacje na \s+ (dowolny ciąg białych znaków)
    # Uwaga: re.escape w Pythonie 3.7+ może nie escape'ować spacji, ale bezpieczniej jest podzielić string
    parts = text.split()
    # Łączymy części wymagając co najmniej jednego białego znaku między słowami, 
    # a opcjonalnych białych znaków na początku i końcu
    pattern = r'\s*'.join(map(re.escape, parts))
    return pattern

def apply_changes():
    print(f"📂 Folder patchera: {script_dir}")
    print(f"📂 Folder aplikacji (cel): {app_dir}")
    
    if not os.path.exists(app_dir):
        print(f"❌ BŁĄD: Nie znaleziono folderu '{TARGET_FOLDER_NAME}'.")
        return

    try:
        with open(INSTRUCTIONS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Brak pliku: {INSTRUCTIONS_FILE}")
        return

    # Usuń bloki markdown ```text ... ```
    content = re.sub(r'^```[a-zA-Z]*\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'\n```$', '', content, flags=re.MULTILINE)

    pattern = re.compile(
        r'PLIK:\s*"(.*?)"\s*'
        r'OPERACJA:\s*\[(.*?)\]\s*'
        r'SZUKAJ:[ \t]*\n(.*?)\n'      
        r'TREŚĆ:[ \t]*\n(.*?)(?=\n\s*KROK|\Z)', 
        re.DOTALL
    )

    matches = pattern.findall(content)
    print(f"🔍 Znaleziono {len(matches)} kroków.\n")

    for file_name_raw, operation, search_block, content_block in matches:
        file_name = file_name_raw.strip()
        full_file_path = os.path.join(app_dir, file_name)
        full_file_path = os.path.normpath(full_file_path)
        
        print(f"⚙️  Przetwarzanie: {file_name} -> {operation}")
        
        if not os.path.exists(full_file_path):
            print(f"   ❌ Plik nie istnieje: {full_file_path}")
            continue

        with open(full_file_path, 'r', encoding='utf-8') as f:
            original_code = f.read()

        # Normalizacja inputów (usuwamy zbędne nowe linie na końcach bloków instrukcji)
        search_str = search_block.rstrip()
        replace_str = content_block.rstrip()

        # 1. Próba dokładnego dopasowania (najszybsza i najbezpieczniejsza)
        if search_str in original_code:
            print("   🔹 Tryb: Dokładne dopasowanie (Exact match)")
            if operation == "ZASTĄP":
                new_code = original_code.replace(search_str, replace_str)
            elif operation == "WSTAW_PO":
                new_code = original_code.replace(search_str, search_str + "\n" + replace_str)
            elif operation == "WSTAW_PRZED":
                new_code = original_code.replace(search_str, replace_str + "\n" + search_str)
        
        # 2. Próba dopasowania "Fuzzy" (Regex) - ignoruje spacje/taby/entery
        else:
            print("   🔸 Tryb: Inteligentne dopasowanie (Fuzzy match)...")
            fuzzy_pattern = make_fuzzy_regex(search_str)
            
            # Szukamy pierwszego dopasowania
            match = re.search(fuzzy_pattern, original_code, re.DOTALL)
            
            if match:
                print("   ✅ Znaleziono fragment mimo różnic w formatowaniu!")
                start, end = match.span()
                matched_text = original_code[start:end]
                
                if operation == "ZASTĄP":
                    new_code = original_code[:start] + replace_str + original_code[end:]
                elif operation == "WSTAW_PO":
                    new_code = original_code[:end] + "\n" + replace_str + original_code[end:]
                elif operation == "WSTAW_PRZED":
                    new_code = original_code[:start] + replace_str + "\n" + original_code[start:]
            else:
                print(f"   ⚠️  Nie znaleziono fragmentu 'SZUKAJ' nawet w trybie inteligentnym.")
                print(f"      Szukano (uproszczone): {normalize_whitespace(search_str)[:60]}...")
                continue

        if new_code != original_code:
            with open(full_file_path, 'w', encoding='utf-8') as f:
                f.write(new_code)
            print(f"   ✅ Zapisano zmiany.")
        else:
            print(f"   ⚠️  Brak zmian w pliku.")

if __name__ == "__main__":
    apply_changes()