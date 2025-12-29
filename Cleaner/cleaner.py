import os
import re
import sys

# Konfiguracja
CONFIG_FILE = 'sciezka.txt'

def get_target_directory():
    """Wczytuje ścieżkę do folderu z pliku tekstowego."""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, CONFIG_FILE)
        
        with open(config_path, 'r', encoding='utf-8') as f:
            target_path = f.read().strip()
            
        if not os.path.isdir(target_path):
            print(f"BŁĄD: Ścieżka nie istnieje: {target_path}")
            sys.exit(1)
        return target_path
    except FileNotFoundError:
        print(f"BŁĄD: Brak pliku {CONFIG_FILE}. Utwórz go i wpisz ścieżkę do folderu.")
        sys.exit(1)

def read_file_content(filepath):
    """Wczytuje plik próbując różnych kodowań."""
    encodings = ['utf-8', 'windows-1250', 'latin-1']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read(), enc
        except UnicodeDecodeError:
            continue
    # Fallback
    with open(filepath, 'rb') as f:
        return f.read().decode('utf-8', errors='ignore'), 'utf-8'

def remove_js_comments_robust(text):
    """
    Zaawansowany parser usuwający komentarze z JS/TS.
    Obsługuje poprawnie:
    - Stringi: "...", '...', `...`
    - Komentarze: //..., /*...*/
    - Regex Literals: /.../ (np. replace(/'/g, '')) - TO BYŁ PROBLEM
    """
    output = []
    i = 0
    n = len(text)
    
    # Stany parsera
    CODE = 0
    SLASH = 1          # Widziano jeden '/'
    BLOCK_COMMENT = 2
    LINE_COMMENT = 3
    STRING_DOUBLE = 4  # "
    STRING_SINGLE = 5  # '
    STRING_TEMPLATE = 6 # `
    REGEX = 7
    
    state = CODE
    
    # Zmienne pomocnicze do wykrywania czy '/' to dzielenie czy regex
    last_token_type = 'OPERATOR' # Zakładamy start jako operator, żeby /regex/ na początku działał
    
    # Znaki, po których '/' oznacza zazwyczaj regex, a nie dzielenie
    regex_preceders = {
        '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', ';',
        'return', 'throw', 'case', 'new', 'typeof', 'void', 'delete', 'await'
    }

    while i < n:
        char = text[i]
        
        if state == CODE:
            if char == '/':
                state = SLASH
            elif char == '"':
                state = STRING_DOUBLE
                output.append(char)
                last_token_type = 'VALUE'
            elif char == "'":
                state = STRING_SINGLE
                output.append(char)
                last_token_type = 'VALUE'
            elif char == '`':
                state = STRING_TEMPLATE
                output.append(char)
                last_token_type = 'VALUE'
            else:
                output.append(char)
                # Prosta heurystyka tokenów (pomijamy białe znaki przy aktualizacji last_token)
                if not char.isspace():
                    if char in regex_preceders:
                        last_token_type = 'OPERATOR'
                    elif char.isalnum() or char in ')]}_$':
                        last_token_type = 'VALUE'
                    else:
                        last_token_type = 'OPERATOR'
                        
        elif state == SLASH:
            if char == '/':
                state = LINE_COMMENT
                # Nie dodajemy drugiego slasha do outputu
            elif char == '*':
                state = BLOCK_COMMENT
                # Nie dodajemy gwiazdki
            else:
                # To nie był komentarz, to był slash (dzielenie) lub początek regexa
                # Decyzja: Dzielenie czy Regex?
                is_regex = (last_token_type == 'OPERATOR')
                
                if is_regex:
                    state = REGEX
                    output.append('/') # Dodajemy zaległy slash
                    output.append(char)
                else:
                    state = CODE
                    output.append('/') # Dodajemy zaległy slash
                    output.append(char)
                    last_token_type = 'OPERATOR' # Dzielenie to operator
        
        elif state == LINE_COMMENT:
            if char == '\n':
                state = CODE
                output.append('\n') # Zachowujemy nową linię, by nie skleić kodu
                last_token_type = 'OPERATOR' # Traktujemy nową linię bezpiecznie
                
        elif state == BLOCK_COMMENT:
            if char == '*' and i + 1 < n and text[i+1] == '/':
                state = CODE
                i += 1 # Pomiń '/'
                last_token_type = 'VALUE' # Traktujemy blok jako separator
                
        elif state == STRING_DOUBLE:
            output.append(char)
            if char == '\\':
                if i + 1 < n:
                    output.append(text[i+1])
                    i += 1
            elif char == '"':
                state = CODE
                
        elif state == STRING_SINGLE:
            output.append(char)
            if char == '\\':
                if i + 1 < n:
                    output.append(text[i+1])
                    i += 1
            elif char == "'":
                state = CODE

        elif state == STRING_TEMPLATE:
            output.append(char)
            if char == '\\':
                if i + 1 < n:
                    output.append(text[i+1])
                    i += 1
            elif char == '`':
                state = CODE
                
        elif state == REGEX:
            output.append(char)
            if char == '\\':
                if i + 1 < n:
                    output.append(text[i+1])
                    i += 1
            elif char == '/':
                state = CODE
                last_token_type = 'VALUE' # Koniec regexa to wartość
                
        i += 1

    # Jeśli plik kończy się w trakcie stanu SLASH, dopisz go
    if state == SLASH:
        output.append('/')

    cleaned_text = "".join(output)
    
    # Kosmetyka: Usuwanie pustych linii
    cleaned_text = re.sub(r'^\s*[\r\n]+', '', cleaned_text, flags=re.MULTILINE)
    
    return cleaned_text

def clean_css_html_content(text, ext):
    """Standardowy regex dla CSS i HTML (tam nie ma problemu z regex literals)."""
    if ext == '.css':
        pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(/\*[\s\S]*?\*/)'
    else: # HTML / PHP
        pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|()'
        
    def replacement(match):
        if match.group(1): return match.group(1)
        return ""
    return re.sub(pattern, replacement, text)

def process_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        content, encoding = read_file_content(filepath)
        original = content
        
        if ext in ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']:
            # Używamy pancernego parsera dla JS
            new_content = remove_js_comments_robust(content)
        elif ext in ['.css', '.scss', '.html', '.htm', '.php']:
            # Używamy regexa dla reszty
            new_content = clean_css_html_content(content, ext)
        else:
            return

        if new_content != original:
            with open(filepath, 'w', encoding=encoding) as f:
                f.write(new_content)
            print(f"[WYCZYSZCZONO]: {filepath}")
            
    except Exception as e:
        print(f"[BŁĄD] {filepath}: {e}")

def main():
    target_dir = get_target_directory()
    print(f"Start GŁĘBOKIEGO czyszczenia w: {target_dir}")
    print("-" * 40)
    
    extensions = {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.html', '.htm', '.php'}
    count = 0

    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in extensions:
                process_file(os.path.join(root, file))
                count += 1
                
    print("-" * 40)
    print(f"Zakończono. Przeskanowano plików: {count}")

if __name__ == "__main__":
    main()