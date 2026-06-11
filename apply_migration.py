#!/usr/bin/env python3
"""
Apply database migration for new features
"""
import sys
import os
import subprocess

# Change to backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'agrisync-360', 'backend')
os.chdir(backend_dir)

# Activate virtual environment and run migration
venv_python = os.path.join(backend_dir, 'venv', 'bin', 'python')

print("Applying database migration...")
result = subprocess.run([venv_python, '-m', 'flask', 'db', 'upgrade'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr)

print(f"Return code: {result.returncode}")
