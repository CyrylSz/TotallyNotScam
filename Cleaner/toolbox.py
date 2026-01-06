import os
import sys
import re
import io
import json
import zipfile
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
from pathlib import Path
from typing import List, Tuple
import customtkinter as ctk
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")
SETTINGS_FILE = "toolbox_settings.json"
class ConsoleRedirector:
    def __init__(self, text_widget):
        self.text_widget = text_widget
    def write(self, string):
        try:
            self.text_widget.after(0, self._safe_insert, string)
        except:
            pass
    def _safe_insert(self, string):
        try:
            self.text_widget.configure(state="normal")
            start_index = self.text_widget.index("end-1c")
            self.text_widget.insert("end", string)
            end_index = self.text_widget.index("end-1c")
            if "❌" in string or "BŁĄD" in string or "Error" in string:
                self.text_widget.tag_add("error", start_index, end_index)
            elif "✅" in string or "Sukces" in string:
                self.text_widget.tag_add("success", start_index, end_index)
            elif "⚠️" in string or "Warning" in string:
                self.text_widget.tag_add("warning", start_index, end_index)
            elif "📂" in string or "🔍" in string or "⚙️" in string:
                self.text_widget.tag_add("info", start_index, end_index)
            elif "ROOT:" in string or "Start" in string:
                self.text_widget.tag_add("header", start_index, end_index)
            self.text_widget.see("end")
            self.text_widget.configure(state="disabled")
        except:
            pass
    def flush(self):
        pass
class SettingsManager:
    def __init__(self):
        self.data = {
            "current_profile": "Default",
            "profiles": {
                "Default": {
                    "paths": [{"path": os.getcwd(), "active": True}],
                    "path_sync_mode": True,  
                    "tab_paths": {},         
                    "combiner_include": "*",
                    "combiner_exclude": ".",
                    "patcher_instructions": "",
                    "web_prompts": {"Domyślny Prompt": "Test prompt"},
                    "current_web_prompt": "Domyślny Prompt",
                    "tree_show_content": False
                }
            }
        }
        self.load()
    def load(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                    self.data.update(loaded)
            except Exception as e:
                print(f"⚠️ Błąd ładowania ustawień: {e}")
    def save(self):
        try:
            with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=4)
        except Exception as e:
            print(f"⚠️ Błąd zapisu ustawień: {e}")
    def get_current_profile_data(self):
        prof = self.data["current_profile"]
        if prof not in self.data["profiles"]:
            self.create_profile(prof)
        return self.data["profiles"][prof]
    def set_profile_data(self, key, value):
        prof = self.data["current_profile"]
        self.data["profiles"][prof][key] = value
    def create_profile(self, name):
        if name not in self.data["profiles"]:
            self.data["profiles"][name] = self.data["profiles"].get("Default", {}).copy()
        self.data["current_profile"] = name
        self.save()
    def delete_profile(self, name):
        if name in self.data["profiles"] and len(self.data["profiles"]) > 1:
            del self.data["profiles"][name]
            self.data["current_profile"] = list(self.data["profiles"].keys())[0]
            self.save()
            return True
        return False
    def get_profile_names(self):
        return list(self.data["profiles"].keys())
class FileCombinerLogic:
    def __init__(self, paths_list, include_rules, exclude_rules):
        self.paths_list = paths_list
        self.include_rules = [r.strip() for r in include_rules.splitlines() if r.strip() and not r.strip().startswith('#')]
        if not self.include_rules: self.include_rules = ['*']
        self.exclude_rules = [r.strip() for r in exclude_rules.splitlines() if r.strip() and not r.strip().startswith('#')]
    def matches_rule(self, path: Path, rule_list, base_root: Path, is_dir_check=False):
        for rule in rule_list:
            if rule == '*': 
                if is_dir_check: continue
                return True
            if rule == '.': 
                if path.name.startswith('.'): return True
            elif rule.startswith('*.'):
                if path.name.lower().endswith(rule[1:].lower()): return True
            else:
                normal_rule = rule.replace('\\', os.sep).replace('/', os.sep)
                if path.name.lower() == normal_rule.lower(): return True
                try:
                    rel = path.relative_to(base_root)
                    if str(rel).lower() == normal_rule.lower(): return True
                    if str(rel).lower().startswith(normal_rule.lower() + os.sep): return True
                except ValueError: pass
        return False
    def is_included(self, path: Path, base_root: Path):
        inc = self.matches_rule(path, self.include_rules, base_root)
        exc = self.matches_rule(path, self.exclude_rules, base_root)
        return inc and not exc
    def looks_binary(self, path):
        try:
            with open(path, 'rb') as f:
                chunk = f.read(4096)
                if b'\0' in chunk: return True
        except: pass
        return False
    def run(self):
        if not self.paths_list:
            print("❌ Brak ścieżek.")
            return
        main_root = Path(self.paths_list[0])
        print(f"📦 Start łączenia plików. Główny folder: {main_root}")
        collected_files = [] 
        for raw_path in self.paths_list:
            base_path = Path(raw_path)
            if not base_path.exists():
                print(f"⚠️ Ścieżka nie istnieje: {base_path}")
                continue
            print(f"   -> Skanowanie: {base_path}")
            for root, dirs, files in os.walk(base_path):
                root_path = Path(root)
                dirs[:] = [d for d in dirs if not self.matches_rule(root_path / d, self.exclude_rules, base_path, True)]
                for file in files:
                    file_path = root_path / file
                    if file_path.name in ['combiner_output.txt', 'output.txt', 'tree_output.txt']: continue
                    if self.is_included(file_path, base_path):
                        collected_files.append((file_path, base_path))
        if not collected_files:
            print("⚠️ Nie znaleziono plików pasujących do reguł.")
            return
        collected_files.sort(key=lambda x: str(x[0]))
        output_path = main_root / "combiner_output.txt"
        try:
            with open(output_path, 'w', encoding='utf-8') as out:
                for fp, origin_root in collected_files:
                    if self.looks_binary(fp): continue
                    try:
                        rel_path = fp.relative_to(origin_root)
                        prefix = f"[{origin_root.name}]/" if len(self.paths_list) > 1 else ""
                        header = f"{prefix}{str(rel_path).replace(os.sep, '/')}"
                        out.write(f"{header}\n```\n")
                        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                            out.write(f.read())
                        out.write("\n```\n\n")
                        print(f" + Dodano: {header}")
                    except Exception as e:
                        print(f" ! Błąd pliku {fp.name}: {e}")
            print(f"✅ Sukces! Utworzono: {output_path}")
            print(f"   Łącznie plików: {len(collected_files)}")
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
class PatcherLogic:
    def __init__(self, paths_list, instructions_text):
        self.paths_list = paths_list
        self.instructions_text = instructions_text
    def make_smart_fuzzy_regex(self, text):
        tokens = re.findall(r'\w+|[^\w\s]', text)
        escaped_tokens = [re.escape(t) for t in tokens]
        return r'\s*'.join(escaped_tokens)
    def run(self):
        content = re.sub(r'^```[a-zA-Z]*\n', '', self.instructions_text, flags=re.MULTILINE)
        content = re.sub(r'\n```$', '', content, flags=re.MULTILINE)
        pattern = re.compile(
            r'PLIK:\s*"(.*?)"\s*OPERACJA:\s*\[(.*?)\]\s*SZUKAJ:\s*?\n(.*?)\nTREŚĆ:\s*?\n(.*?)(?=\n\s*KROK|\Z)',
            re.DOTALL
        )
        matches = pattern.findall(content)
        if not matches:
            print("⚠️ Nie znaleziono instrukcji. Sprawdź format.")
            return
        print(f"🔍 Znaleziono {len(matches)} kroków.")
        for root_path_str in self.paths_list:
            app_dir = Path(root_path_str)
            if not app_dir.exists(): continue
            print(f"\n📂 Aplikowanie zmian w: {app_dir}")
            for i, (file_name_raw, operation, search_block, content_block) in enumerate(matches, 1):
                file_name = file_name_raw.strip()
                full_file_path = app_dir / file_name
                print(f"⚙️ Krok {i}: {file_name} -> {operation}")
                if not full_file_path.exists():
                    print(f"   ❌ Plik nie istnieje: {file_name}")
                    continue
                with open(full_file_path, 'r', encoding='utf-8') as f:
                    original_code = f.read()
                search_str = search_block.rstrip()
                replace_str = content_block.rstrip()
                found = False
                match_start, match_end = 0, 0
                if search_str in original_code:
                    print("   🔹 Znaleziono (Exact Match)")
                    match_start = original_code.find(search_str)
                    match_end = match_start + len(search_str)
                    found = True
                else:
                    print("   🔸 Próba Smart Match...")
                    fuzzy_pattern = self.make_smart_fuzzy_regex(search_str)
                    match = re.search(fuzzy_pattern, original_code, re.DOTALL)
                    if match:
                        print("   ✅ Znaleziono (Smart Match)")
                        match_start, match_end = match.span()
                        found = True
                if not found:
                    print(f"   ⚠️ NIE ZNALEZIONO fragmentu!")
                    continue
                new_code = original_code
                if operation == "ZASTĄP":
                    new_code = original_code[:match_start] + replace_str + original_code[match_end:]
                elif operation == "WSTAW_PO":
                    new_code = original_code[:match_end] + "\n" + replace_str + original_code[match_end:]
                elif operation == "WSTAW_PRZED":
                    new_code = original_code[:match_start] + replace_str + "\n" + original_code[match_start:]
                if new_code != original_code:
                    with open(full_file_path, 'w', encoding='utf-8') as f: f.write(new_code)
                    print(f"   ✅ Zapisano zmiany.")
                else:
                    print(f"   ⚠️ Kod identyczny - brak zmian.")
class CleanerLogic:
    def __init__(self, paths_list, config_dict):
        self.paths_list = paths_list
        self.rem_slash_slash = config_dict.get("slash_slash", True) 
        self.rem_hash = config_dict.get("hash", True)               
        self.rem_slash_star = config_dict.get("slash_star", True)
        self.rem_dash_dash = config_dict.get("dash_dash", True)   
        self.rem_html = config_dict.get("html", True)
        self.rem_py_doc = config_dict.get("py_doc", True)

    def read_file_content(self, filepath):
        encodings = ['utf-8', 'windows-1250', 'latin-1']
        for enc in encodings:
            try:
                with open(filepath, 'r', encoding=enc) as f:
                    return f.read(), enc
            except UnicodeDecodeError:
                continue
        with open(filepath, 'rb') as f:
            return f.read().decode('utf-8', errors='ignore'), 'utf-8'
    def remove_dash_comments(self, text):
        """Usuwa komentarze -- (SQL, Lua) szanując stringi."""
        # Grupa 1: Stringi (pojedyncze lub podwójne)
        # Grupa 2: Komentarz --
        pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(--.*)'
        
        def repl(match):
            if match.group(1): return match.group(1) # String
            if match.group(2): return "" if self.rem_dash_dash else match.group(2) # Komentarz
            return match.group(0)
            
        cleaned = re.sub(pattern, repl, text)
        return re.sub(r'^\s*[\r\n]+', '', cleaned, flags=re.MULTILINE)
    def remove_py_comments(self, text):
        """Usuwa komentarze Python (#) i Docstringi, chroniąc zmienne."""
        # Grupa 1: Potrójne cudzysłowy (Docstrings lub multiline strings)
        # Grupa 2: Magic Comments (zostawiamy)
        # Grupa 3: Hash comments (usuwamy)
        # Grupa 4: Zwykłe stringi (zostawiamy)
        pattern = r"(\"\"\"[\s\S]*?\"\"\"|'''[\s\S]*?''')|(#\s*!.*|#\s*-\*-.*)|(#.*)|(\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*')"
        
        def repl(match):
            # --- Grupa 1: Potrójne (Docstringi?) ---
            if match.group(1):
                if not self.rem_py_doc: return match.group(1) # Jeśli opcja wyłączona, zostaw
                
                # Analiza kontekstu: Czy to zmienna czy Docstring?
                start_pos = match.start()
                # Pobierz tekst przed dopasowaniem (bez białych znaków na końcu)
                preceding = text[:start_pos].rstrip()
                
                if not preceding:
                    return "" # Początek pliku -> Docstring modułu -> Usuń
                
                # Sprawdź ostatni znak przed stringiem
                last_char = preceding[-1]
                
                # Znaki wskazujące, że to WARTOŚĆ (zmienna, return, lista, dict) -> ZOSTAW
                if last_char in ['=', '(', '[', '{', ',', '+', '*', ':']: 
                    # Uwaga: ':' może być końcem def/class (wtedy docstring), ALE
                    # w Pythonie docstring jest w nowej linii z wcięciem.
                    # Jeśli ':' jest bezpośrednio przed (bez newline), to raczej rzadkie w docstringu,
                    # ale standardowo Docstring jest po ':\n    '.
                    # Sprawdźmy słowa kluczowe.
                    pass

                # Bardziej zaawansowane sprawdzanie słów kluczowych na końcu linii
                # Jeśli przed stringiem jest: return, yield, raise, print, =, (, [, {, , -> To zmienna
                if re.search(r'(=|\(|\[|\{|,|return|yield|raise|print)\s*$', preceding):
                    return match.group(1) # To jest kod/zmienna -> Zostaw
                
                # W przeciwnym razie zakładamy, że to Docstring (np. po class X: lub def Y():)
                return ""

            # --- Grupa 2: Magic Comments ---
            if match.group(2): return match.group(2)
            
            # --- Grupa 3: Hash Comments ---
            if match.group(3): return "" if self.rem_hash else match.group(3)
            
            # --- Grupa 4: Zwykłe Stringi ---
            if match.group(4): return match.group(4)
            
            return match.group(0)

        cleaned = re.sub(pattern, repl, text)
        return re.sub(r'^\s*[\r\n]+', '', cleaned, flags=re.MULTILINE)
    def clean_css_html_content(self, text, ext):
        if ext in ['.css', '.scss']:
            pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(/\*[\s\S]*?\*/)'
            def repl(match):
                if match.group(1): return match.group(1) 
                if match.group(2): return "" if self.rem_slash_star else match.group(2) 
                return match.group(0)
            return re.sub(pattern, repl, text)
        else: 
            pattern = r'("(?:\\[\s\S]|[^"])*"|\'(?:\\[\s\S]|[^\\\'])*\')|(/\*[\s\S]*?\*/)|()'
            def repl(match):
                if match.group(1): return match.group(1) 
                if match.group(2): return "" if self.rem_slash_star else match.group(2) 
                if match.group(3): return "" if self.rem_html else match.group(3) 
                return match.group(0)
            return re.sub(pattern, repl, text)
    def remove_js_comments_robust(self, text):
        output = []
        i = 0
        n = len(text)
        CODE, SLASH, BLOCK_COMMENT, LINE_COMMENT, STRING_DOUBLE, STRING_SINGLE, STRING_TEMPLATE, REGEX = 0, 1, 2, 3, 4, 5, 6, 7
        state = CODE
        last_token_type = 'OPERATOR'
        regex_preceders = {'(', ',', '=', ':', '[', '!', '&', '|', '?', '{', ';', 'return', 'throw', 'case', 'new', 'typeof', 'void', 'delete', 'await'}
        while i < n:
            char = text[i]
            if state == CODE:
                if char == '/': state = SLASH
                elif char == '"': state, last_token_type = STRING_DOUBLE, 'VALUE'; output.append(char)
                elif char == "'": state, last_token_type = STRING_SINGLE, 'VALUE'; output.append(char)
                elif char == '`': state, last_token_type = STRING_TEMPLATE, 'VALUE'; output.append(char)
                else:
                    output.append(char)
                    if not char.isspace():
                        if char in regex_preceders: last_token_type = 'OPERATOR'
                        elif char.isalnum() or char in ')]}_$': last_token_type = 'VALUE'
                        else: last_token_type = 'OPERATOR'
            elif state == SLASH:
                if char == '/': 
                    state = LINE_COMMENT
                    if not self.rem_slash_slash: output.append('/'); output.append(char)
                elif char == '*': 
                    state = BLOCK_COMMENT
                    if not self.rem_slash_star: output.append('/'); output.append(char)
                else:
                    is_regex = (last_token_type == 'OPERATOR')
                    output.append('/')
                    output.append(char)
                    if is_regex: state = REGEX
                    else: state, last_token_type = CODE, 'OPERATOR' 
            elif state == LINE_COMMENT:
                if not self.rem_slash_slash: output.append(char)
                if char == '\n': 
                    state, last_token_type = CODE, 'OPERATOR'
                    if self.rem_slash_slash: output.append('\n')
            elif state == BLOCK_COMMENT:
                if not self.rem_slash_star: output.append(char)
                if char == '*' and i + 1 < n and text[i+1] == '/': 
                    if not self.rem_slash_star: output.append('/')
                    state, i, last_token_type = CODE, i + 1, 'VALUE'
            elif state == STRING_DOUBLE:
                output.append(char)
                if char == '\\' and i + 1 < n: output.append(text[i+1]); i += 1
                elif char == '"': state = CODE
            elif state == STRING_SINGLE:
                output.append(char)
                if char == '\\' and i + 1 < n: output.append(text[i+1]); i += 1
                elif char == "'": state = CODE
            elif state == STRING_TEMPLATE:
                output.append(char)
                if char == '\\' and i + 1 < n: output.append(text[i+1]); i += 1
                elif char == '`': state = CODE
            elif state == REGEX:
                output.append(char)
                if char == '\\' and i + 1 < n: output.append(text[i+1]); i += 1
                elif char == '/': state, last_token_type = CODE, 'VALUE'
            i += 1
        if state == SLASH: output.append('/')
        cleaned_text = "".join(output)
        return re.sub(r'^\s*[\r\n]+', '', cleaned_text, flags=re.MULTILINE)
    def run(self):
        extensions = {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', 
                      '.css', '.scss', 
                      '.html', '.htm', 
                      '.php', '.py', 
                      '.sql', '.lua'}
        count = 0
        for path_str in self.paths_list:
            target_dir = Path(path_str)
            if not target_dir.exists(): continue
            print(f"Start czyszczenia w: {target_dir}")
            for root, dirs, files in os.walk(target_dir):
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in extensions:
                        filepath = os.path.join(root, file)
                        try:
                            content, encoding = self.read_file_content(filepath)
                            original = content
                            new_content = original
                            if ext in ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']:
                                new_content = self.remove_js_comments_robust(content)
                            elif ext == '.py':
                                new_content = self.remove_py_comments(content)
                            elif ext in ['.css', '.scss', '.html', '.htm']:
                                new_content = self.clean_css_html_content(content, ext)
                            elif ext in ['.sql', '.lua']:
                                new_content = self.remove_dash_comments(content)
                            elif ext == '.php':
                                temp = self.clean_css_html_content(content, '.html')
                                new_content = self.remove_js_comments_robust(temp)
                            if new_content != original:
                                with open(filepath, 'w', encoding=encoding) as f: f.write(new_content)
                                print(f"[WYCZYSZCZONO]: {filepath}")
                                count += 1
                        except Exception as e:
                            print(f"Błąd: {filepath} -> {e}")
        print(f"Zakończono. Zmodyfikowano plików: {count}")
class FolderTreeLogic:
    def __init__(self, paths_list, show_content=False):
        self.paths_list = paths_list
        self.show_content = show_content
        self.output_io = io.StringIO()
        self.content_collector = [] if show_content else None
    def generate_tree_dir(self, path: Path, base_path: Path, prefix: str = ""):
        try:
            items = sorted([p for p in path.iterdir() if not p.name.startswith('.')], key=lambda x: x.name.lower())
            for i, item in enumerate(items):
                is_last_item = (i == len(items) - 1)
                connector = "└── " if is_last_item else "├── "
                print(prefix + connector + item.name, file=self.output_io)
                extension = "    " if is_last_item else "│   "
                try: relative = str(item.relative_to(base_path))
                except: relative = item.name
                if item.is_dir():
                    self.generate_tree_dir(item, base_path, prefix + extension)
                elif self.show_content:
                    try:
                        with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                            self.content_collector.append((relative, f.read()))
                    except: pass
        except Exception as e:
            print(prefix + f"└── [Błąd: {e}]", file=self.output_io)
    def run(self):
        for path_str in self.paths_list:
            root_path = Path(path_str)
            if not root_path.exists(): continue
            print(f"\nROOT: {root_path.name}", file=self.output_io)
            self.generate_tree_dir(root_path, root_path)
        final_output = self.output_io.getvalue()
        if self.paths_list:
            out_file = Path(self.paths_list[0]) / "tree_output.txt"
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(final_output)
                if self.content_collector:
                    for p, c in self.content_collector:
                        f.write(f"\n\n{p}:\n```\n{c}\n```\n")
            print(final_output)
            print(f"✅ Wynik zapisano w: {out_file}")
class PathRowFrame(ctk.CTkFrame):
    """Pojedynczy wiersz w menedżerze ścieżek (Checkbox + Label + Edit + Del)."""
    def __init__(self, parent, path_data, update_callback, delete_callback, edit_callback):
        super().__init__(parent, fg_color="transparent")
        self.path_data = path_data
        self.update_callback = update_callback
        self.delete_callback = delete_callback
        self.edit_callback = edit_callback
        self.pack(fill="x", pady=2)
        self.var = ctk.BooleanVar(value=path_data.get("active", True))
        self.chk = ctk.CTkCheckBox(self, text="", width=24, variable=self.var, command=self._on_toggle)
        self.chk.pack(side="left", padx=(5, 0))
        self.lbl = ctk.CTkEntry(self, fg_color="transparent", border_width=0)
        self.lbl.insert(0, path_data["path"])
        self.lbl.configure(state="readonly")
        self.lbl.pack(side="left", fill="x", expand=True, padx=5)
        btn_edit = ctk.CTkButton(self, text="✎", width=30, fg_color="gray50", command=self._on_edit)
        btn_edit.pack(side="left", padx=2)
        btn_del = ctk.CTkButton(self, text="✖", width=30, fg_color="#C0392B", command=lambda: delete_callback(self))
        btn_del.pack(side="left", padx=(2, 5))
    def _on_toggle(self):
        self.path_data["active"] = self.var.get()
        self.update_callback()
    def _on_edit(self):
        self.edit_callback(self, self.path_data)
class DevToolboxApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.settings = SettingsManager()
        self.title("Web Vibe Coding Tools")
        self.geometry("1200x800")
        self.grid_rowconfigure(0, weight=0) 
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self._build_header()
        self._build_body()
        sys.stdout = ConsoleRedirector(self.console_text)
        sys.stderr = ConsoleRedirector(self.console_text)
        self.load_profile_to_ui()
        self.show_tool("file_combiner")
    def _build_header(self):
        """Pasek górny: Logo | Profil | Path Manager (Combobox-like)"""
        self.header_frame = ctk.CTkFrame(self, height=80, corner_radius=0, fg_color=("gray85", "gray15"))
        self.header_frame.grid(row=0, column=0, columnspan=2, sticky="ew")
        self.header_frame.grid_propagate(False) 
        logo = ctk.CTkLabel(self.header_frame, text="    DEV TOOLS    ", font=ctk.CTkFont(size=22, weight="bold"))
        logo.pack(side="left", padx=20, anchor="n", pady=25)
        ctk.CTkFrame(self.header_frame, width=2, height=40, fg_color="gray50").pack(side="left", padx=10, pady=20)
        path_container = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        path_container.pack(side="left", fill="x", expand=True, padx=10, pady=5)
        top_row = ctk.CTkFrame(path_container, fg_color="transparent")
        top_row.pack(fill="x")
        ctk.CTkLabel(top_row, text="Foldery Robocze:", font=("Arial", 12, "bold")).pack(side="left")
        self.sync_switch_var = ctk.StringVar(value="on")
        self.sync_switch = ctk.CTkSwitch(top_row, text="Tryb: Współdzielone", 
                                         onvalue="on", offvalue="off",
                                         command=self._on_sync_switch_change,
                                         font=("Arial", 11))
        self.sync_switch.pack(side="left", padx=20)
        ctrl_row = ctk.CTkFrame(path_container, fg_color="transparent")
        ctrl_row.pack(fill="x", pady=(2, 0))
        self.paths_dropdown_btn = ctk.CTkButton(ctrl_row, text="▼ Rozwiń listę ścieżek (0)", 
                                                fg_color=("gray75", "gray25"), 
                                                text_color=("black", "white"),
                                                anchor="w",
                                                command=self._toggle_paths_list)
        self.paths_dropdown_btn.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(ctrl_row, text="➕", width=40, command=self.add_path_dialog).pack(side="left")
        self.paths_popup_window = None 
        self.is_paths_expanded = False
    def _toggle_paths_list(self):
        if self.is_paths_expanded:
            self._close_paths_popup()
        else:
            self._open_paths_popup()
    def _open_paths_popup(self):
        if self.paths_popup_window: return
        root_x = self.paths_dropdown_btn.winfo_rootx()
        root_y = self.paths_dropdown_btn.winfo_rooty() + self.paths_dropdown_btn.winfo_height() + 5
        width = self.paths_dropdown_btn.winfo_width()
        self.paths_popup_window = ctk.CTkToplevel(self)
        self.paths_popup_window.geometry(f"{width}x250+{root_x}+{root_y}")
        self.paths_popup_window.overrideredirect(True) 
        self.paths_popup_window.attributes('-topmost', True)
        self.paths_popup_window.configure(fg_color=("gray90", "#181818"))
        self.paths_scroll = ctk.CTkScrollableFrame(self.paths_popup_window, fg_color="transparent")
        self.paths_scroll.pack(fill="both", expand=True, padx=5, pady=5)
        self._render_path_list_items()
        ctk.CTkButton(self.paths_popup_window, text="▲ Zwiń", height=20, fg_color="transparent", 
                      border_width=1, text_color="gray", command=self._toggle_paths_list).pack(fill="x", pady=2)
        self.is_paths_expanded = True
        self.paths_dropdown_btn.configure(text="▲ Zwiń listę")
    def _close_paths_popup(self):
        if self.paths_popup_window:
            self.paths_popup_window.destroy()
            self.paths_popup_window = None
        self.is_paths_expanded = False
        self._update_dropdown_label()
    def _render_path_list_items(self):
        for widget in self.paths_scroll.winfo_children(): widget.destroy()
        current_data = self._get_active_data_list()
        if not current_data:
            ctk.CTkLabel(self.paths_scroll, text="(Brak folderów)").pack(pady=10)
        for item in current_data:
            PathRowFrame(self.paths_scroll, item, 
                         update_callback=self._save_paths_state,
                         delete_callback=self._delete_path_row,
                         edit_callback=self._edit_path_row)
    def _update_dropdown_label(self):
        data = self._get_active_data_list()
        active_count = sum(1 for x in data if x.get("active", True))
        total = len(data)
        txt = f"▼ Foldery: {active_count} aktywne (z {total})"
        self.paths_dropdown_btn.configure(text=txt)
    def _get_active_data_list(self):
        """Zwraca referencję do listy (Globalnej lub Lokalnej) w zależności od trybu."""
        prof_data = self.settings.get_current_profile_data()
        mode_global = prof_data.get("path_sync_mode", True)
        if mode_global:
            if isinstance(prof_data["paths"], str):
                raw = prof_data["paths"].split(';')
                prof_data["paths"] = [{"path": p.strip(), "active": True} for p in raw if p.strip()]
            return prof_data["paths"]
        else:
            current_tool = getattr(self, "current_tool", "file_combiner")
            tab_paths = prof_data.get("tab_paths", {})
            if current_tool not in tab_paths:
                tab_paths[current_tool] = [] 
                self.settings.set_profile_data("tab_paths", tab_paths)
            return tab_paths[current_tool]
    def _save_paths_state(self):
        """Zapisuje zmiany w liście (active/zmiany nazw) do profilu."""
        self._update_dropdown_label()
        if self.is_paths_expanded:
            self._render_path_list_items()
        self.settings.save()
    def _delete_path_row(self, row_widget):
        data_list = self._get_active_data_list()
        if row_widget.path_data in data_list:
            data_list.remove(row_widget.path_data)
            row_widget.destroy()
            self._save_paths_state()
    def _edit_path_row(self, row_widget, path_data):
        dialog = ctk.CTkInputDialog(text="Edytuj ścieżkę:", title="Edycja")
        new_path = dialog.get_input()
        if new_path:
            path_data["path"] = new_path
            self._save_paths_state()
    def _on_sync_switch_change(self):
        new_state = self.sync_switch.get() 
        prof_data = self.settings.get_current_profile_data()
        current_mode = prof_data.get("path_sync_mode", True)
        target_mode_is_global = (new_state == "on")
        if current_mode == target_mode_is_global:
            return 
        if target_mode_is_global:
            ans = messagebox.askyesno("Zmiana trybu", 
                                      "Włączenie trybu Współdzielonego (Global) NADPISZE ustawienia ścieżek we wszystkich innych zakładkach listą z obecnej zakładki.\n\nCzy kontynuować?")
            if not ans:
                self.sync_switch_var.set("off") 
                self.sync_switch.deselect() 
                return
            current_list = self._get_active_data_list() 
            self.settings.set_profile_data("path_sync_mode", True)
            import copy
            self.settings.set_profile_data("paths", copy.deepcopy(current_list))
            self.sync_switch.configure(text="Tryb: Współdzielone")
        else:
            global_list = prof_data["paths"]
            tab_paths = {}
            import copy
            for tool in ["file_combiner", "folder_tree", "file_patcher", "code_cleaner"]:
                tab_paths[tool] = copy.deepcopy(global_list)
            self.settings.set_profile_data("tab_paths", tab_paths)
            self.settings.set_profile_data("path_sync_mode", False)
            self.sync_switch.configure(text="Tryb: Niezależny")
        self.settings.save()
        self._update_dropdown_label()
        if self.is_paths_expanded: self._render_path_list_items()
    def _build_body(self):
        """Główna sekcja: Sidebar (Col 0) + Prawy Panel (Col 1)"""
        self.sidebar = ctk.CTkFrame(self, width=240, corner_radius=0)
        self.sidebar.grid(row=1, column=0, sticky="nsew") 
        self.sidebar.grid_propagate(False)
        nav_container = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        nav_container.pack(fill="x", pady=20, padx=10, side="top")
        self.nav_buttons = {}
        tools = [("file_combiner", "File Combiner"), ("folder_tree", "Folder Tree"), 
                 ("file_patcher", "File Patcher"), ("code_cleaner", "Code Cleaner")]
        for key, name in tools:
            btn = ctk.CTkButton(nav_container, text=name, height=50, 
                                font=ctk.CTkFont(size=14, weight="bold"),
                                fg_color="transparent", border_width=2, border_color="gray40",
                                anchor="w", command=lambda k=key: self.show_tool(k))
            btn.pack(pady=8, fill="x")
            self.nav_buttons[key] = btn
        spacer = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        spacer.pack(fill="both", expand=True)
        self.profile_frame = ctk.CTkFrame(self.sidebar, fg_color=("gray90", "gray20"))
        self.profile_frame.pack(side="bottom", fill="x", padx=10, pady=20)
        ctk.CTkLabel(self.profile_frame, text="PROFIL USTAWIEŃ", font=("Arial", 11, "bold")).pack(pady=5)
        self.profile_combo = ctk.CTkComboBox(self.profile_frame, values=self.settings.get_profile_names(), command=self.change_profile)
        self.profile_combo.pack(padx=10, pady=5, fill="x")
        btns_row = ctk.CTkFrame(self.profile_frame, fg_color="transparent")
        btns_row.pack(pady=5)
        ctk.CTkButton(btns_row, text="Zapisz", width=60, height=25, fg_color="green", command=self.save_current_ui_to_profile).pack(side="left", padx=2)
        ctk.CTkButton(btns_row, text="Nowy", width=60, height=25, command=self.new_profile_dialog).pack(side="left", padx=2)
        ctk.CTkButton(btns_row, text="Usuń", width=60, height=25, fg_color="red", command=self.delete_profile).pack(side="left", padx=2)
        self.right_panel = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.right_panel.grid(row=1, column=1, sticky="nsew") 
        self.right_panel.grid_columnconfigure(0, weight=1)
        self.right_panel.grid_rowconfigure(0, weight=1) 
        self.right_panel.grid_rowconfigure(1, weight=0) 
        self.content_container = ctk.CTkFrame(self.right_panel, fg_color="transparent")
        self.content_container.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.content_container.grid_rowconfigure(0, weight=1)
        self.content_container.grid_columnconfigure(0, weight=1)
        self.frames = {}
        self.frames["file_combiner"] = self._create_combiner_frame(self.content_container)
        self.frames["folder_tree"] = self._create_tree_frame(self.content_container)
        self.frames["file_patcher"] = self._create_patcher_frame(self.content_container)
        self.frames["code_cleaner"] = self._create_cleaner_frame(self.content_container)
        self.console_frame = ctk.CTkFrame(self.right_panel, height=150, corner_radius=0, fg_color=("gray85", "gray15"))
        self.console_frame.grid(row=1, column=0, sticky="ew", padx=0, pady=0)
        self.console_frame.grid_propagate(False)
        ctk.CTkLabel(self.console_frame, text="  Terminal Output  ", 
                     fg_color="gray30", 
                     text_color="white",
                     corner_radius=6).pack(anchor="w", padx=10, pady=(5,0))
        self.console_text = ctk.CTkTextbox(self.console_frame, font=("Consolas", 12), fg_color="#0d1117", text_color="#c9d1d9")
        self.console_text.pack(fill="both", expand=True, padx=10, pady=5)
        self.console_text.tag_config("error", foreground="#ff7b72")   
        self.console_text.tag_config("success", foreground="#3fb950") 
        self.console_text.tag_config("warning", foreground="#d29922") 
        self.console_text.tag_config("info", foreground="#58a6ff")    
        self.console_text.tag_config("header", foreground="#d2a8ff")  
        self.console_text.configure(state="disabled")
    def _create_combiner_frame(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.grid_columnconfigure(0, weight=1)
        frame.grid_columnconfigure(1, weight=1)
        frame.grid_rowconfigure(2, weight=1)
        HELP_INCLUDE = """[1] INCLUDE (Biała Lista)
------------------------------------------
Określa, które pliki mają trafić do wyniku końcowego.
Jeśli to pole jest puste, program domyślnie przyjmuje '*', czyli bierze WSZYSTKO.
MOŻLIWOŚCI I PRZYKŁADY:
• *
  (Bierz wszystko - domyślne zachowanie).
• *.rozszerzenie
  (Np. *.py, *.js - Bierz wszystkie pliki tego typu).
• nazwa_folderu
  (Np. src - Bierz CAŁĄ zawartość folderu 'src', 
  niezależnie jak głęboko są pliki).
• ścieżka/do/pliku
  (Np. config/settings.py - Bierz ten konkretny plik).
• nazwa_pliku
  (Np. main.cpp - Znajdź i weź ten plik, gdziekolwiek jest).
"""
        HELP_EXCLUDE = """[2] EXCLUDE (Czarna Lista)
------------------------------------------
Określa, co ma zostać BEZWZGLĘDNIE pominięte.
Ma wyższy priorytet niż Include.
MOŻLIWOŚCI I NIEOCZYWISTE PRZYKŁADY:
• .
  (Sama kropka - Wyklucza WSZYSTKIE elementy ukryte/systemowe, 
  czyli takie, które zaczynają się od kropki.
  Działa to jak skrót na: .git, .idea, .vscode, .env itd.).
• nazwa_folderu
  (Np. node_modules - Wyklucza folder ORAZ całą jego zawartość.
  To drastycznie przyspiesza działanie programu).
• *.rozszerzenie
  (Np. *.exe, *.log - Ignoruj pliki binarne lub śmieciowe).
• ścieżka/względna
  (Np. tests/temp - Wyklucz tylko ten konkretny folder, 
  ale zostaw inne foldery o nazwie 'temp' w innych miejscach).
"""
        ctk.CTkLabel(frame, text="File Combiner", font=("Arial", 24, "bold")).grid(row=0, column=0, columnspan=2, sticky="w", pady=10)
        head_inc = ctk.CTkFrame(frame, fg_color="transparent")
        head_inc.grid(row=1, column=0, sticky="ew", pady=(10, 5), padx=(0, 10))
        ctk.CTkLabel(head_inc, text="Include", font=("Arial", 16, "bold")).pack(side="left")
        ctk.CTkButton(head_inc, text="See examples", width=90, height=24, 
                      font=("Arial", 11), fg_color="gray40", hover_color="gray50",
                      command=lambda: self.open_help_window("Pomoc: Include", HELP_INCLUDE)).pack(side="left", padx=10)
        head_exc = ctk.CTkFrame(frame, fg_color="transparent")
        head_exc.grid(row=1, column=1, sticky="ew", pady=(10, 5), padx=(10, 0))
        ctk.CTkLabel(head_exc, text="Exclude", font=("Arial", 16, "bold")).pack(side="left")
        ctk.CTkButton(head_exc, text="See examples", width=90, height=24,
                      font=("Arial", 11), fg_color="gray40", hover_color="gray50",
                      command=lambda: self.open_help_window("Pomoc: Exclude", HELP_EXCLUDE)).pack(side="left", padx=10)
        self.comb_inc = ctk.CTkTextbox(frame)
        self.comb_inc.grid(row=2, column=0, sticky="nsew", padx=(0, 10))
        self.comb_exc = ctk.CTkTextbox(frame)
        self.comb_exc.grid(row=2, column=1, sticky="nsew", padx=(10, 0))
        btn = ctk.CTkButton(frame, text="POŁĄCZ PLIKI", height=50, fg_color="#2CC985", text_color="black", 
                            font=("Arial", 16, "bold"), command=self.run_combiner)
        btn.grid(row=3, column=0, columnspan=2, sticky="ew", pady=20)
        return frame
    def _create_tree_frame(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        ctk.CTkLabel(frame, text="Folder Tree Generator", font=("Arial", 24, "bold")).pack(anchor="w", pady=10)
        self.tree_chk_var = ctk.BooleanVar()
        chk = ctk.CTkCheckBox(frame, text="Dołącz zawartość plików do raportu", variable=self.tree_chk_var, font=("Arial", 14))
        chk.pack(anchor="w", pady=20)
        ctk.CTkButton(frame, text="GENERUJ DRZEWO", height=50, fg_color="#3B8ED0", font=("Arial", 16, "bold"), command=self.run_tree).pack(fill="x", pady=20)
        return frame
    def _create_patcher_frame(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", pady=(10, 5))
        ctk.CTkLabel(header, text="File Patcher", font=("Arial", 24, "bold")).pack(side="left")
        ctk.CTkLabel(header, text="⚠️ Uwaga: Zapisz pliki na wszelki wypadek!", font=("Arial", 11), text_color="#E67E22").pack(side="right", anchor="e")
        self.patcher_tabs = ctk.CTkTabview(frame, width=400, height=300)
        self.patcher_tabs.pack(fill="both", expand=True)
        self.patcher_tabs._segmented_button.configure(font=("Arial", 16, "bold"), height=40)
        self.patcher_tabs._segmented_button.grid_configure(sticky="w", padx=0)
        tab_patch = self.patcher_tabs.add("Aplikuj Patch")
        tab_patch.grid_rowconfigure(0, weight=1)
        tab_patch.grid_columnconfigure(0, weight=1)
        self.patcher_txt = ctk.CTkTextbox(tab_patch, font=("Consolas", 12))
        self.patcher_txt.grid(row=0, column=0, sticky="nsew")
        ctk.CTkButton(tab_patch, text="APLIKUJ PATCH", height=50, fg_color="#E04F5F", font=("Arial", 16, "bold"), command=self.run_patcher).grid(row=2, column=0, sticky="ew", pady=20)
        tab_prompt = self.patcher_tabs.add("Web Prompt")
        tab_prompt.grid_rowconfigure(1, weight=1)
        tab_prompt.grid_columnconfigure(0, weight=1)
        ctrl_frame = ctk.CTkFrame(tab_prompt, fg_color="transparent")
        ctrl_frame.grid(row=0, column=0, sticky="ew", pady=10)
        self.prompt_combo = ctk.CTkComboBox(ctrl_frame, values=["Domyślny Prompt"], command=self._switch_prompt)
        self.prompt_combo.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(ctrl_frame, text="+", width=40, command=self._add_prompt).pack(side="left", padx=5)
        ctk.CTkButton(ctrl_frame, text="-", width=40, fg_color="red", command=self._del_prompt).pack(side="left", padx=5)
        self.web_prompt_txt = ctk.CTkTextbox(tab_prompt, font=("Arial", 12))
        self.web_prompt_txt.grid(row=1, column=0, sticky="nsew")
        return frame
    def _switch_prompt(self, choice):
        if hasattr(self, 'current_prompt_key') and self.current_prompt_key:
            txt = self.web_prompt_txt.get("1.0", "end")
            data = self.settings.get_current_profile_data()
            prompts = data.get("web_prompts", {})
            prompts[self.current_prompt_key] = txt
            self.settings.set_profile_data("web_prompts", prompts)
        self.current_prompt_key = choice
        data = self.settings.get_current_profile_data()
        prompts = data.get("web_prompts", {})
        self.web_prompt_txt.delete("1.0", "end")
        self.web_prompt_txt.insert("1.0", prompts.get(choice, ""))
    def _add_prompt(self):
        dialog = ctk.CTkInputDialog(text="Nazwa promptu:", title="Nowy Prompt")
        name = dialog.get_input()
        if name:
            data = self.settings.get_current_profile_data()
            prompts = data.get("web_prompts", {})
            if name not in prompts:
                prompts[name] = ""
                self.settings.set_profile_data("web_prompts", prompts)
                self.prompt_combo.configure(values=list(prompts.keys()))
                self.prompt_combo.set(name)
                self._switch_prompt(name)
    def _del_prompt(self):
        current = self.prompt_combo.get()
        data = self.settings.get_current_profile_data()
        prompts = data.get("web_prompts", {})
        if len(prompts) > 1 and current in prompts:
            del prompts[current]
            self.settings.set_profile_data("web_prompts", prompts)
            new_keys = list(prompts.keys())
            self.prompt_combo.configure(values=new_keys)
            self.prompt_combo.set(new_keys[0])
            self._switch_prompt(new_keys[0])
    def _create_cleaner_frame(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", pady=(10, 5))
        ctk.CTkLabel(header, text="Code Cleaner", font=("Arial", 24, "bold")).pack(side="left")
        ctk.CTkLabel(header, text="⚠️ Uwaga: Zapisz pliki na wszelki wypadek!", font=("Arial", 11), text_color="#E67E22").pack(side="right", anchor="e")
        ctk.CTkLabel(frame, text="Wybierz rodzaje komentarzy do usunięcia:", font=("Arial", 13)).pack(anchor="w", pady=(0, 10))
        opts_frame = ctk.CTkFrame(frame, fg_color="transparent")
        opts_frame.pack(fill="x", pady=5)
        opts_frame.grid_columnconfigure(0, weight=1)
        opts_frame.grid_columnconfigure(1, weight=1)
        ctk.CTkLabel(opts_frame, text="Liniowe (Line)", font=("Arial", 12, "bold"), text_color="gray70").grid(row=0, column=0, sticky="w", padx=10, pady=5)
        ctk.CTkLabel(opts_frame, text="Blokowe (Block)", font=("Arial", 12, "bold"), text_color="gray70").grid(row=0, column=1, sticky="w", padx=10, pady=5)
        self.clean_slash_slash = ctk.BooleanVar(value=True)
        self.clean_hash = ctk.BooleanVar(value=True)
        self.clean_slash_star = ctk.BooleanVar(value=True)
        self.clean_html = ctk.BooleanVar(value=True)
        sw_kwargs = {"font": ("Consolas", 11), "switch_height": 14, "switch_width": 32}
        col1 = ctk.CTkFrame(opts_frame, fg_color="transparent")
        col1.grid(row=1, column=0, sticky="nsew")
        ctk.CTkSwitch(col1, text="C/JS/PHP   ( // ... )", variable=self.clean_slash_slash, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        ctk.CTkSwitch(col1, text="Python/Shell ( # ... )", variable=self.clean_hash, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        # Nowy switch dla SQL/Lua
        self.clean_dash_dash = ctk.BooleanVar(value=True)
        ctk.CTkSwitch(col1, text="SQL/Lua    ( -- ... )", variable=self.clean_dash_dash, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        col2 = ctk.CTkFrame(opts_frame, fg_color="transparent")
        col2.grid(row=1, column=1, sticky="nsew")
        ctk.CTkSwitch(col2, text="JS/CSS/PHP ( /* ... */ )", variable=self.clean_slash_star, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        ctk.CTkSwitch(col2, text="HTML/XML   ( < !-- ... -- > )", variable=self.clean_html, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        self.clean_py_doc = ctk.BooleanVar(value=True)
        ctk.CTkSwitch(col2, text='Py Docstring ( """ ... """ )', variable=self.clean_py_doc, **sw_kwargs).pack(anchor="w", pady=4, padx=10)
        ctk.CTkFrame(frame, height=20, fg_color="transparent").pack()
        ctk.CTkButton(frame, text="URUCHOM CZYSZCZENIE", height=45, fg_color="#F39C12", text_color="black", font=("Arial", 15, "bold"), command=self.run_cleaner).pack(fill="x", pady=10)
        return frame
    def open_help_window(self, title, content):
        """Tworzy wycentrowane okno z instrukcją."""
        top = ctk.CTkToplevel(self)
        top.title(title)
        w, h = 700, 600
        ws = self.winfo_screenwidth()
        hs = self.winfo_screenheight()
        x = (ws/2) - (w/2)
        y = (hs/2) - (h/2)
        top.geometry('%dx%d+%d+%d' % (w, h, x, y))
        top.attributes('-topmost', True)
        top.after(100, lambda: top.attributes('-topmost', False)) 
        textbox = ctk.CTkTextbox(top, font=("Consolas", 13), wrap="word")
        textbox.pack(fill="both", expand=True, padx=10, pady=10)
        textbox.insert("1.0", content)
        textbox.configure(state="disabled") 
    def show_tool(self, tool_name):
        self.current_tool = tool_name 
        for f in self.frames.values():
            f.grid_remove()
        self.frames[tool_name].grid(row=0, column=0, sticky="nsew")
        for key, btn in self.nav_buttons.items():
            if key == tool_name:
                btn.configure(fg_color=("gray75", "gray25"))
            else:
                btn.configure(fg_color="transparent")
        self._refresh_path_ui_for_tool()
    def _refresh_path_ui_for_tool(self):
        prof_data = self.settings.get_current_profile_data()
        mode_global = prof_data.get("path_sync_mode", True)
        self.sync_switch_var.set("on" if mode_global else "off")
        self.sync_switch.configure(text="Tryb: Współdzielone" if mode_global else "Tryb: Niezależny")
        if self.is_paths_expanded:
            self._close_paths_popup()
        self._update_dropdown_label()
    def get_paths(self):
        """Pobiera listę ścieżek, które są AKTYWNE (Checkbox=True)."""
        data = self._get_active_data_list()
        return [item["path"] for item in data if item.get("active", True)]
    def add_path_dialog(self):
        p = filedialog.askdirectory()
        if p:
            data_list = self._get_active_data_list()
            if not any(x["path"] == p for x in data_list):
                data_list.append({"path": p, "active": True})
                self._save_paths_state()
            else:
                print(f"⚠️ Ścieżka już na liście: {p}")
    def run_combiner(self):
        threading.Thread(target=lambda: FileCombinerLogic(
            self.get_paths(), 
            self.comb_inc.get("1.0", "end"), 
            self.comb_exc.get("1.0", "end")
        ).run()).start()
    def run_tree(self):
        threading.Thread(target=lambda: FolderTreeLogic(
            self.get_paths(), 
            self.tree_chk_var.get()
        ).run()).start()
    def run_patcher(self):
        threading.Thread(target=lambda: PatcherLogic(
            self.get_paths(), 
            self.patcher_txt.get("1.0", "end")
        ).run()).start()
    def run_cleaner(self):
        paths = self.get_paths()
        if not paths:
            messagebox.showerror("Błąd", "Wybierz folder!")
            return
        cfg = {
            "slash_slash": self.clean_slash_slash.get(),
            "hash": self.clean_hash.get(),
            "slash_star": self.clean_slash_star.get(),
            "dash_dash": self.clean_dash_dash.get(),
            "html": self.clean_html.get(),
            "py_doc": self.clean_py_doc.get()
        }
        if messagebox.askyesno("Potwierdź", "Czy na pewno wyczyścić pliki zgodnie z ustawieniami?"):
            threading.Thread(target=lambda: CleanerLogic(paths, cfg).run()).start()
    def load_profile_to_ui(self):
        data = self.settings.get_current_profile_data()
        self._refresh_path_ui_for_tool()
        self.comb_inc.delete("1.0", "end")
        self.comb_inc.insert("1.0", data.get("combiner_include", "*"))
        self.comb_exc.delete("1.0", "end")
        self.comb_exc.insert("1.0", data.get("combiner_exclude", ""))
        self.patcher_txt.delete("1.0", "end")
        self.patcher_txt.insert("1.0", data.get("patcher_instructions", ""))
        prompts = data.get("web_prompts", {"Domyślny Prompt": "Test prompt"})
        current = data.get("current_web_prompt", "Domyślny Prompt")
        if current not in prompts: current = list(prompts.keys())[0]
        self.prompt_combo.configure(values=list(prompts.keys()))
        self.prompt_combo.set(current)
        self.current_prompt_key = current 
        self.web_prompt_txt.delete("1.0", "end")
        self.web_prompt_txt.insert("1.0", prompts.get(current, ""))
        self.tree_chk_var.set(data.get("tree_show_content", False))
        self.profile_combo.set(self.settings.data["current_profile"])
    def save_current_ui_to_profile(self):
        self.settings.set_profile_data("combiner_include", self.comb_inc.get("1.0", "end").strip())
        self.settings.set_profile_data("combiner_exclude", self.comb_exc.get("1.0", "end").strip())
        self.settings.set_profile_data("patcher_instructions", self.patcher_txt.get("1.0", "end"))
        if hasattr(self, 'current_prompt_key'):
            curr_txt = self.web_prompt_txt.get("1.0", "end")
            data = self.settings.get_current_profile_data()
            prompts = data.get("web_prompts", {})
            prompts[self.current_prompt_key] = curr_txt
            self.settings.set_profile_data("web_prompts", prompts)
            self.settings.set_profile_data("current_web_prompt", self.current_prompt_key)
        self.settings.set_profile_data("tree_show_content", self.tree_chk_var.get())
        self.settings.save()
        print("💾 Zapisano profil.")
    def change_profile(self, new_profile_name):
        self.save_current_ui_to_profile()
        self.settings.data["current_profile"] = new_profile_name
        self.settings.save()
        self.load_profile_to_ui()
        print(f"📂 Przełączono na profil: {new_profile_name}")
    def new_profile_dialog(self):
        dialog = ctk.CTkInputDialog(text="Nazwa nowego profilu:", title="Nowy Profil")
        name = dialog.get_input()
        if name:
            self.save_current_ui_to_profile() 
            self.settings.create_profile(name)
            self.profile_combo.configure(values=self.settings.get_profile_names())
            self.load_profile_to_ui()
    def delete_profile(self):
        current = self.settings.data["current_profile"]
        if messagebox.askyesno("Usuń", f"Usunąć profil '{current}'?"):
            if self.settings.delete_profile(current):
                self.profile_combo.configure(values=self.settings.get_profile_names())
                self.load_profile_to_ui()
            else:
                messagebox.showerror("Błąd", "Nie można usunąć ostatniego profilu.")
if __name__ == "__main__":
    app = DevToolboxApp()
    app.mainloop()