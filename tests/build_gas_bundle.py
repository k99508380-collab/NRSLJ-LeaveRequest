#!/usr/bin/env python3
"""
Build script to bundle frontend CSS and JS into standalone-gas/GasApp.html
for native Google Apps Script HTML Service deployment.
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
OUTPUT_FILE = os.path.join(BASE_DIR, 'standalone-gas', 'GasApp.html')

css_files = [
    os.path.join(FRONTEND_DIR, 'css', 'variables.css'),
    os.path.join(FRONTEND_DIR, 'css', 'base.css'),
    os.path.join(FRONTEND_DIR, 'css', 'components.css'),
    os.path.join(FRONTEND_DIR, 'css', 'responsive.css')
]

js_files = [
    os.path.join(FRONTEND_DIR, 'js', 'config.js'),
    os.path.join(FRONTEND_DIR, 'js', 'api.js'),
    os.path.join(FRONTEND_DIR, 'js', 'state.js'),
    os.path.join(FRONTEND_DIR, 'js', 'components', 'toast.js'),
    os.path.join(FRONTEND_DIR, 'js', 'components', 'modal.js'),
    os.path.join(FRONTEND_DIR, 'js', 'components', 'header.js'),
    os.path.join(FRONTEND_DIR, 'js', 'components', 'sidebar.js'),
    os.path.join(FRONTEND_DIR, 'js', 'auth.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'authView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'employeeDashboard.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'leaveApplyView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'leaveHistoryView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'managerDashboard.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'adminDashboard.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'adminEmployeesView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'adminLeaveConfigView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'adminReportsView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'hospitalSettingsView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'auditLogsView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'views', 'diagnosticsView.js'),
    os.path.join(FRONTEND_DIR, 'js', 'app.js')
]

print("Reading CSS files...")
css_content = "\n".join([open(f, 'r', encoding='utf-8').read() for f in css_files])

print("Reading JS files...")
js_content = "\n".join([open(f, 'r', encoding='utf-8').read() for f in js_files])

# Read logo SVG
logo_path = os.path.join(FRONTEND_DIR, 'assets', 'logo.svg')
logo_svg = open(logo_path, 'r', encoding='utf-8').read().replace('\n', ' ')

bundle_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#0f2942">
  <title>NRSLJ Speciality Hospitals, Musiri &bull; Leave Management System</title>
  <style>
{css_content}
  </style>
</head>
<body>
  <div id="app-root">
    <header id="app-header" class="app-header"></header>
    <div class="app-container">
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
      <aside id="app-sidebar" class="app-sidebar"></aside>
      <main id="main-content" class="main-content">
        <div class="text-center" style="padding: 60px;">
          <span class="spinner" style="width: 32px; height: 32px;"></span>
          <p class="text-muted mt-md">Loading NRSLJ Hospital Leave Portal...</p>
        </div>
      </main>
    </div>
    <div id="toast-container" class="toast-container"></div>
  </div>

  <script>
{js_content}
  </script>
</body>
</html>
"""

with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
    out.write(bundle_html)

print(f"Successfully generated {OUTPUT_FILE} ({len(bundle_html):,} bytes)")
