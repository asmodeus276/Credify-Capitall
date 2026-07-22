import os
import re

def get_html_files():
    html_files = []
    for root, dirs, files in os.walk('.'):
        for f in files:
            if f.endswith('.html'):
                rel_path = os.path.relpath(os.path.join(root, f), '.')
                # Normalize path separators to forward slashes
                rel_path = rel_path.replace('\\', '/')
                html_files.append(rel_path)
    return html_files

def find_links(file_path):
    links = set()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Find all href="..." or href='...'
            matches = re.findall(r'href=["\']([^"\']+\.html(?:#[^"\']*)?)["\']', content)
            
            # Get the directory of the file to resolve relative links correctly
            file_dir = os.path.dirname(file_path)
            
            for m in matches:
                # Remove anchor
                clean_link = m.split('#')[0]
                if clean_link and not clean_link.startswith(('http://', 'https://', '//')):
                    # Resolve relative path
                    if file_dir and not clean_link.startswith(('../', '/')):
                        resolved_link = f"{file_dir}/{clean_link}"
                    elif clean_link.startswith('../'):
                        # Simplistic resolver for one level up
                        resolved_link = clean_link[3:]
                    else:
                        resolved_link = clean_link
                        
                    # Clean double slashes
                    resolved_link = resolved_link.replace('//', '/')
                    links.add(resolved_link)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return links

def main():
    existing_files = set(get_html_files())
    all_referenced = {}
    
    for f in existing_files:
        links = find_links(f)
        for link in links:
            if link not in all_referenced:
                all_referenced[link] = []
            all_referenced[link].append(f)
            
    print("--- SCAN RESULTS ---")
    missing_links = {}
    for ref, source_files in all_referenced.items():
        if ref not in existing_files:
            # Filter out non-local links like mailto:
            if not ref.startswith(('mailto:', 'tel:', 'javascript:')):
                missing_links[ref] = source_files
            
    import json
    with open('missing_pages.json', 'w') as jf:
        json.dump({k: sorted(list(v)) for k, v in missing_links.items()}, jf, indent=2)
    print(f"Successfully wrote {len(missing_links)} missing pages to missing_pages.json")

if __name__ == "__main__":
    main()
