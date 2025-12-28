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

def clean_css(text):
    """
    Usuwa komentarze CSS /* ... */.
    Chroni stringi w cudzysłowach i apostrofach.
    """
    # Poprawiono błąd [^_] na [^']
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^_])*\')|(/\*[\s\S]*?\*/)'
    # Lepsza wersja regexa dla stringów (bezpieczniejsza):
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(/\*[\s\S]*?\*/)'
    
    def replacement(match):
        if match.group(1): return match.group(1) # Zachowaj string
        return "" # Usuń komentarz

    return re.sub(pattern, replacement, text)

def clean_js_scss(text):
    """
    Usuwa komentarze typu JS oraz SCSS:
    1. Blokowe /* ... */
    2. Liniowe // ...
    Chroni stringi ", ', oraz backticks `.
    """
    # Wzorzec: (Stringi " ' `) LUB (Komentarze blokowe lub liniowe)
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\'|`(?:\\[\s\S]|[^`])*`)|(/\*[\s\S]*?\*/|//[^\r\n]*)'

    def replacement(match):
        if match.group(1): return match.group(1) # Zachowaj string
        return "" # Usuń komentarz (zamień na pusty ciąg, usuwa też nową linię dla // jeśli jest na końcu)

    return re.sub(pattern, replacement, text)

def clean_html(text):
    """
    Usuwa komentarze HTML .
    Chroni stringi w atrybutach, aby nie usunąć komentarza będącego częścią tekstu.
    """
    # Konstrukcja wzorca komentarza HTML: comment_start = r'<' + r'!--'
    comment_end = r'--' + r'>'
    
    # Wzorzec: (Stringi " ') LUB (Komentarz HTML)
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(' + comment_start + r'[\s\S]*?' + comment_end + r')'

    def replacement(match):
        if match.group(1): return match.group(1) # Zachowaj string
        return "" # Usuń komentarz

    return re.sub(pattern, replacement, text)

def process_file(filepath):
    """Przetwarza pojedynczy plik zależnie od rozszerzenia."""
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        new_content = content

        # CSS - tylko /* */
        if ext == '.css':
            new_content = clean_css(content)
            
        # JS i SCSS - obsługa // oraz /* */
        elif ext in ['.js', '.scss']: 
            new_content = clean_js_scss(content)
            
        # HTML i PHP - obsługa elif ext in ['.html', '.htm', '.php']:
            new_content = clean_html(content)
        
        if new_content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"[WYCZYSZCZONO]: {filepath}")
            
    except Exception as e:
        print(f"[BŁĄD] {filepath}: {e}")

def main():
    target_dir = get_target_directory()
    print(f"Start agresywnego czyszczenia w: {target_dir}")
    
    # Dodano .scss do listy
    extensions = {'.js', '.css', '.html', '.htm', '.php', '.scss'}
    count = 0

    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in extensions:
                process_file(os.path.join(root, file))
                count += 1
                
    print(f"Zakończono. Przeskanowano plików: {count}")

if __name__ == "__main__":
    main()