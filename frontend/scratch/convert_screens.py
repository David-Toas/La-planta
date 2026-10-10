import os
import re

MOCKUPS_DIR = r"C:\Users\Toas\Desktop\La Planta\html-mockups"
SRC_APP_DIR = r"C:\Users\Toas\Desktop\La Planta\src\app"

PAGES = [
    ("fleet.html", "fleet", "FleetPage", True),
    ("vehicle-details.html", "vehicle-details", "VehicleDetailsPage", True),
    ("checkout.html", "checkout", "CheckoutPage", True),
    ("guest-login.html", "guest-login", "GuestLoginPage", False),
    ("account.html", "account", "AccountPage", True),
    ("reservation-pass.html", "reservation-pass", "ReservationPassPage", True),
    ("live-tracking.html", "live-tracking", "LiveTrackingPage", True),
    ("admin-login.html", "admin-login", "AdminLoginPage", False),
    ("admin-command.html", "admin-command", "AdminCommandPage", False),
    ("handover-inspection.html", "handover-inspection", "HandoverInspectionPage", False),
]

def style_str_to_react(style_str):
    # style="background-image: url('...'); display: none;"
    styles = {}
    items = style_str.split(';')
    for item in items:
        if ':' in item:
            k, v = item.split(':', 1)
            k = k.strip()
            v = v.strip()
            # camelCase key
            camel_k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            styles[camel_k] = v
    # Format as JSX object literal
    props = []
    for k, v in styles.items():
        # escape double quotes if needed
        v_escaped = v.replace('"', '\\"')
        props.append(f'"{k}": "{v_escaped}"')
    return "{{" + ", ".join(props) + "}}"

def html_to_jsx(html):
    # Convert HTML comments to JSX comments
    html = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', html, flags=re.DOTALL)

    # Convert class to className
    html = re.sub(r'\bclass="', 'className="', html)

    # Convert for to htmlFor
    html = re.sub(r'\bfor="', 'htmlFor="', html)

    # Convert autocomplete, tabindex, autofocus
    html = re.sub(r'\bautocomplete="', 'autoComplete="', html)
    html = re.sub(r'\btabindex="', 'tabIndex="', html)
    html = re.sub(r'\bautofocus\b', 'autoFocus', html)
    html = re.sub(r'\breadonly\b', 'readOnly', html)

    # SVG properties
    html = re.sub(r'\bstroke-width="', 'strokeWidth="', html)
    html = re.sub(r'\bstroke-linecap="', 'strokeLinecap="', html)
    html = re.sub(r'\bstroke-linejoin="', 'strokeLinejoin="', html)
    html = re.sub(r'\bclip-rule="', 'clipRule="', html)
    html = re.sub(r'\bfill-rule="', 'fillRule="', html)
    html = re.sub(r'\bstroke-dasharray="', 'strokeDasharray="', html)
    html = re.sub(r'\bstroke-dashoffset="', 'strokeDashoffset="', html)

    # Convert style="..." to style={{ ... }}
    def replace_style(m):
        return f'style={style_str_to_react(m.group(1))}'
    html = re.sub(r'style="([^"]*)"', replace_style, html)

    # Self close tags: <input ...>, <img ...>, <hr ...>, <br ...>
    # Note: Don't double close if already closed
    def self_close(tag, text):
        pattern = rf'(<{tag}\b[^>]*?)(?<!/)>'
        return re.sub(pattern, r'\1 />', text)

    for tag in ['input', 'img', 'hr', 'br']:
        html = self_close(tag, html)

    # Convert links
    link_map = {
        'index.html': '/',
        'fleet.html': '/fleet',
        'vehicle-details.html': '/vehicle-details',
        'checkout.html': '/checkout',
        'guest-login.html': '/guest-login',
        'account.html': '/account',
        'reservation-pass.html': '/reservation-pass',
        'live-tracking.html': '/live-tracking',
        'admin-login.html': '/admin-login',
        'admin-command.html': '/admin-command',
        'handover-inspection.html': '/handover-inspection',
    }
    for old_link, new_link in link_map.items():
        html = html.replace(f'href="{old_link}"', f'href="{new_link}"')
        html = html.replace(f"href='{old_link}'", f"href='{new_link}'")

    # Replace onclick="window.location.href='...'"
    for old_link, new_link in link_map.items():
        html = html.replace(f"onclick=\"window.location.href='{old_link}'\"", f'onClick={{() => window.location.href="{new_link}"}}')
        html = html.replace(f"onclick='window.location.href=\"{old_link}\"'", f'onClick={{() => window.location.href="{new_link}"}}')
        html = html.replace(f"window.location.href = '{old_link}'", f'window.location.href = "{new_link}"')

    # Remove generic unescaped onclick/onsubmit/onchange placeholders from static HTML
    html = re.sub(r'\bonclick="([^"]*)"', r'onClick={() => {}}', html)
    html = re.sub(r'\bonchange="([^"]*)"', r'onChange={() => {}}', html)
    html = re.sub(r'\bonsubmit="([^"]*)"', r'onSubmit={(e) => e.preventDefault()}', html)

    return html

def convert_page(filename, route, component_name, has_nav_footer):
    filepath = os.path.join(MOCKUPS_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract main or body
    if has_nav_footer and '<main' in content:
        # Extract <main> ... </main>
        match = re.search(r'<main\b[^>]*>(.*?)</main>', content, flags=re.DOTALL)
        if match:
            inner_content = match.group(1)
        else:
            inner_content = content
    else:
        # For login or admin pages, extract from inside <body> ... </body>
        match = re.search(r'<body\b[^>]*>(.*?)</body>', content, flags=re.DOTALL)
        if match:
            inner_content = match.group(1)
            # Remove any trailing <script>...</script> tags
            inner_content = re.sub(r'<script\b[^>]*>.*?</script>', '', inner_content, flags=re.DOTALL)
        else:
            inner_content = content

    jsx_content = html_to_jsx(inner_content)

    out_dir = os.path.join(SRC_APP_DIR, route)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "page.tsx")

    imports = ['"use client";', '', 'import React, { useState, useEffect } from "react";', 'import Link from "next/link";']
    if has_nav_footer:
        imports.append('import { Navbar } from "@/components/navbar";')
        imports.append('import { Footer } from "@/components/footer";')

    code = "\n".join(imports) + f"""

export default function {component_name}() {{
  return (
    <div className="min-h-screen bg-surface flex flex-col">
"""
    if has_nav_footer:
        code += "      <Navbar />\n      <main className=\"flex-1 w-full pt-20\">\n"
        code += jsx_content
        code += "\n      </main>\n      <Footer />\n"
    else:
        code += jsx_content
        code += "\n"

    code += """    </div>
  );
}
"""

    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Successfully converted {filename} -> {out_file}")

for item in PAGES:
    convert_page(*item)
print("ALL SCREENS CONVERTED.")

