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
        print(f"BŁĄD: Brak pliku {CONFIG_FILE}. Utwórz go.")
        sys.exit(1)

def clean_css(text):
    """Usuwa komentarze CSS /* ... */ chroniąc stringi."""
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^_])*\')|(/\*[\s\S]*?\*/)'
    
    def replacement(match):
        if match.group(1): return match.group(1)
        return "" 

    return re.sub(pattern, replacement, text)

def clean_js(text):
    """Usuwa komentarze JS // oraz /* ... */ chroniąc stringi i template literals."""
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^_])?\'|`(?:\\[\s\S]|[^`])*`)|(/\*[\s\S]*?\*/|//[^\r\n]*)'

    def replacement(match):
        if match.group(1): return match.group(1)
        return ""

    return re.sub(pattern, replacement, text)

def clean_html(text):
    """
    Usuwa komentarze HTML.
    Regex jest budowany z kawałków, aby nie zepsuć wyświetlania tego kodu.
    """
    # Konstrukcja wzorca komentarza HTML: < ! - - ... - - >
    # Rozbijamy to, żeby edytor tekstu nie "zgłupiał" przy wyświetlaniu.
    comment_start = r'<' + r'!--'
    comment_end = r'--' + r'>'
    
    # Wzorzec: (Stringi) LUB (Komentarz HTML)
    # Wyłapuje stringi w cudzysłowach, żeby nie usunąć komentarza będącego treścią atrybutu.
    pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^_])*\')|(' + comment_start + r'[\s\S]*?' + comment_end + r')'

    def replacement(match):
        # Grupa 1 to String (zachowujemy), Grupa 2 to Komentarz (usuwamy)
        if match.group(1):
            return match.group(1) 
        return "" 

    return re.sub(pattern, replacement, text)

def process_file(filepath):
    """Przetwarza pojedynczy plik."""
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        new_content = content

        if ext == '.css':
            new_content = clean_css(content)
        elif ext == '.js':
            new_content = clean_js(content)
        elif ext in ['.html', '.htm', '.php']: # PHP często zawiera HTML
            new_content = clean_html(content)
        
        if new_content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"[WYCZYSZCZONO]: {filepath}")
            
    except Exception as e:
        print(f"[BŁĄD] {filepath}: {e}")

def main():
    target_dir = get_target_directory()
    print(f"Start czyszczenia w: {target_dir}")
    
    # Rozszerzenia do sprawdzenia
    extensions = {'.js', '.css', '.html', '.htm', '.php'}
    count = 0

    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in extensions:
                process_file(os.path.join(root, file))
                count += 1
                
    print(f"Zakończono. Przeskanowano plików: {count}")

if __name__ == "__main__":
    main()