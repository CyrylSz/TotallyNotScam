import os
import sys
from pathlib import Path
import zipfile
import io

# --- FUNKCJE GENERUJĄCE DRZEWO (BEZ ZMIAN) ---

def generate_tree_dir(
    path: Path,
    base_path: Path,
    prefix: str = "",
    is_last: bool = True,
    output_file=None,
    content_collector=None
):
    """Rekurencyjnie generuje drzewo dla katalogu i zbiera zawartość plików."""
    try:
        items = sorted([p for p in path.iterdir() if not p.name.startswith('.')], key=lambda x: x.name.lower())
        
        for i, item in enumerate(items):
            is_last_item = (i == len(items) - 1)
            connector = "└── " if is_last_item else "├── "
            print(prefix + connector + item.name, file=output_file)
            
            extension = "    " if is_last_item else "│   "
            
            try:
                relative_path = str(item.relative_to(base_path))
            except ValueError:
                relative_path = item.name

            if item.is_dir():
                generate_tree_dir(
                    item, base_path, prefix + extension, is_last_item,
                    output_file, content_collector
                )
            
            elif item.suffix.lower() == '.zip':
                generate_tree_zip(
                    item, prefix + extension, output_file,
                    content_collector, path_prefix=relative_path
                )
            
            elif content_collector is not None:
                try:
                    with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    content_collector.append((relative_path, content))
                except Exception as e:
                    content_collector.append((relative_path, f"[Błąd odczytu: {e}]"))
                
    except PermissionError:
        print(prefix + "└── [Brak uprawnień]", file=output_file)
    except Exception as e:
        print(prefix + f"└── [Błąd: {e}]", file=output_file)


def generate_tree_zip(
    zip_source,
    prefix: str = "",
    output_file=None,
    content_collector=None,
    path_prefix: str = None
):
    """Generuje drzewo dla pliku ZIP i zbiera zawartość plików."""
    try:
        with zipfile.ZipFile(zip_source, 'r') as zf:
            namelist = sorted(zf.namelist())
            tree = {}
            for name in namelist:
                parts = name.strip('/').split('/')
                current = tree
                for part in parts:
                    if part:
                        if part not in current:
                            current[part] = {}
                        current = current[part]

            def recurse(node, current_prefix, path_list, is_last=True):
                items = sorted(node.keys())
                for i, key in enumerate(items):
                    is_last_item = (i == len(items) - 1)
                    connector = "└── " if is_last_item else "├── "
                    print(current_prefix + connector + key, file=output_file)
                    
                    subnode = node[key]
                    extension = "    " if is_last_item else "│   "
                    
                    current_path_list = path_list + [key]
                    full_path_in_zip = '/'.join(current_path_list)
                    
                    display_path = f"{path_prefix}/{full_path_in_zip}" if path_prefix else full_path_in_zip

                    if key.lower().endswith('.zip') and not subnode:
                        try:
                            with zf.open(full_path_in_zip) as nested_zip_file:
                                nested_zip_data = nested_zip_file.read()
                            nested_zip_io = io.BytesIO(nested_zip_data)
                            generate_tree_zip(
                                nested_zip_io, current_prefix + extension, output_file,
                                content_collector, path_prefix=display_path
                            )
                        except Exception as e:
                            print(current_prefix + extension + "└── [Błąd odczytu zagnieżdżonego ZIP: " + str(e) + "]", file=output_file)

                    elif subnode:
                        recurse(subnode, current_prefix + extension, current_path_list, is_last_item)
                    
                    elif content_collector is not None:
                        try:
                            with zf.open(full_path_in_zip) as f:
                                content = f.read().decode('utf-8', errors='ignore')
                            content_collector.append((display_path, content))
                        except Exception as e:
                            content_collector.append((display_path, f"[Błąd odczytu: {e}]"))

            recurse(tree, prefix, [])
            
    except zipfile.BadZipFile:
        print(prefix + "└── [Nieprawidłowy plik ZIP]", file=output_file)
    except Exception as e:
        print(prefix + f"└── [Błąd: {e}]", file=output_file)

# --- GŁÓWNA LOGIKA ---

def main():
    # Ustawienie kodowania dla Windows
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    script_dir = Path(__file__).parent
    settings_file = script_dir / "settings.txt"
    
    input_str = None
    show_content = False
    source_is_settings = False

    # 1. SPRAWDZANIE ARGUMENTÓW WIERSZA POLECEŃ (PRIORYTET)
    if len(sys.argv) >= 2:
        input_str = sys.argv[1]
        if len(sys.argv) == 3 and sys.argv[2] == '1':
            show_content = True
    
    # 2. SPRAWDZANIE SETTINGS.TXT (JEŚLI BRAK ARGUMENTÓW)
    elif settings_file.exists():
        print(f"📄 Odczytywanie konfiguracji z: {settings_file.name}")
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    # Parsowanie klucz=wartość
                    if line.upper().startswith("PATH="):
                        input_str = line[5:].strip().strip('"').strip("'")
                        source_is_settings = True
                    elif line.upper().startswith("CONTENT="):
                        val = line[8:].strip().upper()
                        show_content = val in ['1', 'TRUE', 'YES', 'TAK']
        except Exception as e:
            print(f"⚠️ Błąd odczytu settings.txt: {e}")

    # 3. WALIDACJA DANYCH WEJŚCIOWYCH
    if not input_str:
        print("\n❌ BŁĄD: Nie podano ścieżki.")
        print(f"   Utwórz plik 'settings.txt' w folderze {script_dir.name}")
        print("   lub uruchom z terminala: python FolderTree.py \"ścieżka\" [1]")
        input("Naciśnij Enter, aby zamknąć...")
        sys.exit(1)

    # Rozwiązywanie ścieżki
    # Jeśli ścieżka pochodzi z settings.txt, traktujemy ją jako względną do skryptu
    if source_is_settings:
        input_path = (script_dir / input_str).resolve()
    else:
        input_path = Path(input_str).resolve()

    if not input_path.exists():
        print(f"❌ Błąd: Ścieżka nie istnieje:\n    {input_path}")
        # Dajemy czas na przeczytanie błędu przy kliknięciu dwukrotnym
        if source_is_settings:
            input("Naciśnij Enter, aby zamknąć...")
        sys.exit(1)

    output_file_path = script_dir / "output.txt"
    content_collector = [] if show_content else None

    # --- GENEROWANIE ---
    print(f"🚀 Generowanie drzewa dla: {input_path}")
    
    with open(output_file_path, "w", encoding="utf-8") as f:
        print(f"{input_path.name}", file=f)
        
        if input_path.is_dir():
            generate_tree_dir(
                input_path,
                base_path=input_path,
                output_file=f,
                content_collector=content_collector
            )
        elif input_path.suffix.lower() == '.zip':
            generate_tree_zip(
                input_path,
                output_file=f,
                content_collector=content_collector,
                path_prefix=None
            )
        else:
            print(f"❌ Błąd: Nieobsługiwany typ pliku: {input_path}")
            sys.exit(1)

        # Zapis zawartości plików
        if content_collector is not None:
            content_collector.sort(key=lambda x: x[0].lower())
            for path_str, content in content_collector:
                path_str_posix = path_str.replace(os.path.sep, '/')
                f.write(f"\n\n{path_str_posix}:\n")
                f.write("```\n")
                f.write(content)
                f.write("\n```\n")

    print(f"✅ Gotowe! Wynik zapisano w: {output_file_path.name}")
    if show_content:
        print("   (Zawiera treść plików)")

if __name__ == "__main__":
    main()