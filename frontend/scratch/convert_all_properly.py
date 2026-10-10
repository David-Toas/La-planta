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
    styles = {}
    items = style_str.split(';')
    for item in items:
        if ':' in item:
            k, v = item.split(':', 1)
            k = k.strip()
            v = v.strip()
            if not k or not v:
                continue
            # camelCase key
            camel_k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            styles[camel_k] = v
    props = []
    for k, v in styles.items():
        v_escaped = v.replace('"', '\\"')
        props.append(f'"{k}": "{v_escaped}"')
    return "{{" + ", ".join(props) + "}}"

def html_to_jsx(html):
    # Strip scripts and styles
    html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<style\b[^>]*>.*?</style>', '', html, flags=re.DOTALL)

    # Convert comments
    html = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', html, flags=re.DOTALL)

    # Attributes
    html = re.sub(r'\bclass="', 'className="', html)
    html = re.sub(r'\bfor="', 'htmlFor="', html)
    html = re.sub(r'\bautocomplete="', 'autoComplete="', html)
    html = re.sub(r'\bautofocus\b', 'autoFocus', html)
    html = re.sub(r'\breadonly\b', 'readOnly', html)
    html = re.sub(r'\bcontenteditable="', 'contentEditable="', html)
    html = re.sub(r'\bspellcheck="', 'spellCheck="', html)
    html = re.sub(r'\bcrossorigin="', 'crossOrigin="', html)
    html = re.sub(r'\bnovalidate\b', 'noValidate', html)

    # Numeric JSX attributes
    html = re.sub(r'\bminlength="(\d+)"', r'minLength={\1}', html)
    html = re.sub(r'\bminLength="(\d+)"', r'minLength={\1}', html)
    html = re.sub(r'\bmaxlength="(\d+)"', r'maxLength={\1}', html)
    html = re.sub(r'\bmaxLength="(\d+)"', r'maxLength={\1}', html)
    html = re.sub(r'\btabindex="(-?\d+)"', r'tabIndex={\1}', html)
    html = re.sub(r'\btabIndex="(-?\d+)"', r'tabIndex={\1}', html)
    html = re.sub(r'\brows="(\d+)"', r'rows={\1}', html)
    html = re.sub(r'\bcols="(\d+)"', r'cols={\1}', html)

    # Boolean HTML attributes
    html = re.sub(r'\brequired=""', 'required', html)
    html = re.sub(r'\bchecked=""', 'defaultChecked', html)
    html = re.sub(r'\bdisabled=""', 'disabled', html)
    html = re.sub(r'\breadonly=""', 'readOnly', html)
    html = re.sub(r'\breadOnly=""', 'readOnly', html)
    html = re.sub(r'\bselected=""', '', html)

    # Convert value="..." to defaultValue="..." on inputs (except buttons)
    def fix_input_value(m):
        tag = m.group(0)
        if 'type="button"' in tag or 'type="submit"' in tag:
            return tag
        return re.sub(r'\bvalue="', 'defaultValue="', tag)
    html = re.sub(r'<input\b[^>]*>', fix_input_value, html)

    # SVG props
    html = re.sub(r'\bstroke-width="', 'strokeWidth="', html)
    html = re.sub(r'\bstroke-linecap="', 'strokeLinecap="', html)
    html = re.sub(r'\bstroke-linejoin="', 'strokeLinejoin="', html)
    html = re.sub(r'\bclip-rule="', 'clipRule="', html)
    html = re.sub(r'\bfill-rule="', 'fillRule="', html)
    html = re.sub(r'\bstroke-dasharray="', 'strokeDasharray="', html)
    html = re.sub(r'\bstroke-dashoffset="', 'strokeDashoffset="', html)

    # Style
    html = re.sub(r'style="([^"]*)"', lambda m: f'style={style_str_to_react(m.group(1))}', html)

    # Self-closing tags
    def self_close(tag, text):
        pattern = rf'(<{tag}\b[^>]*?)(?<!/)>'
        return re.sub(pattern, r'\1 />', text)

    for tag in ['input', 'img', 'hr', 'br']:
        html = self_close(tag, html)

    # Link mapping
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

    # Clean legacy onclick / onsubmit / onchange
    html = re.sub(r'\bonclick="[^"]*"', r'onClick={() => {}}', html)
    html = re.sub(r'\bonchange="[^"]*"', r'onChange={() => {}}', html)
    html = re.sub(r'\bonsubmit="[^"]*"', r'onSubmit={(e) => e.preventDefault()}', html)

    return html

def convert_page(filename, route, component_name, has_nav_footer):
    filepath = os.path.join(MOCKUPS_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if has_nav_footer:
        if '</header>' in content and '<footer' in content:
            inner = content.split('</header>', 1)[1].split('<footer', 1)[0]
        elif '<main' in content:
            # find first <main and last </main>
            start = content.find('<main')
            end = content.rfind('</main>')
            if start != -1 and end != -1:
                inner = content[start:end+7]
            else:
                inner = content
        else:
            inner = content
    else:
        # Full body content
        if '<body' in content:
            inner = content.split('<body', 1)[1].split('>', 1)[1]
        else:
            inner = content

    if '</body>' in inner:
        inner = inner.split('</body>', 1)[0]

    # Convert to JSX
    jsx_content = html_to_jsx(inner)

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
        code += "      <Navbar />\n"
        code += jsx_content
        code += "\n      <Footer />\n"
    else:
        code += jsx_content
        code += "\n"

    code += """    </div>
  );
}
"""

    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Converted {filename} -> {out_file}")

for item in PAGES:
    convert_page(*item)
print("ALL DONE PROPERLY.")

