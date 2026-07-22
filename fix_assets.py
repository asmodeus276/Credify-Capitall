import os
import re

print("Starting asset fixing script...")

logo_pattern = re.compile(r'<img[^>]*logo-mark\.png[^>]*>', re.IGNORECASE | re.DOTALL)
favicon_pattern = re.compile(r'href=["\']\s*(?:\.\./)*img/icons/favicon\.ico\s*["\']', re.IGNORECASE)

fixed_files = 0

for root, dirs, files in os.walk('.'):
    # Skip build artifact and dependency directories
    if 'node_modules' in root or '.git' in root:
        continue
    
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Determine directory depth of the current file
                # root is '.' for root level, './blogs' for depth 1, etc.
                rel_parts = os.path.normpath(root).split(os.sep)
                if rel_parts == ['.'] or rel_parts == ['']:
                    depth = 0
                else:
                    depth = len(rel_parts)
                    if rel_parts[0] == '.':
                        depth -= 1
                
                # Calculate relative path to img/
                if depth == 0:
                    img_base = "img/"
                else:
                    img_base = "../" * depth + "img/"
                
                new_logo_tag = f'<img src="{img_base}logo-mark.png" alt="Credify Capital Logo" class="w-16 h-16 md:w-20 md:h-20 object-contain" />'
                new_favicon_href = f'href="{img_base}favicon.ico"'
                
                # Check if we need to modify the file
                has_logo = logo_pattern.search(content)
                has_favicon = favicon_pattern.search(content)
                
                if has_logo or has_favicon:
                    modified_content = content
                    if has_logo:
                        modified_content = logo_pattern.sub(new_logo_tag, modified_content)
                    if has_favicon:
                        modified_content = favicon_pattern.sub(new_favicon_href, modified_content)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(modified_content)
                    
                    fixed_files += 1
                    print(f"Fixed: {filepath} (Depth: {depth}, Image base: {img_base})")
                    
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

print(f"Done! Successfully fixed {fixed_files} HTML files.")
