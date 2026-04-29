#!/usr/bin/env python3
import requests
import redis
import psycopg2
import sys

print('\n=== AgriSync 360 Pre-flight Checks ===\n')
issues = []

# Check 1: Flask server
try:
    r = requests.get('http://localhost:5000/api/health', timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f'✅ Flask server: running')
        db_status = data.get('data',{}).get('checks',{}).get('database','unknown')
        redis_status = data.get('data',{}).get('checks',{}).get('redis','unknown')
        print(f'✅ Database via health: {db_status}')
        print(f'✅ Redis via health: {redis_status}')
    else:
        print(f'❌ Flask server: HTTP {r.status_code}')
        issues.append('Flask server not healthy')
except Exception as e:
    print(f'❌ Flask server: NOT RUNNING — {e}')
    issues.append('Flask server down')
    print('\n⛔ Cannot proceed — start Flask first:')
    print('   python run.py')
    sys.exit(1)

# Check 2: Redis directly
try:
    rc = redis.Redis(host='localhost', port=6379)
    rc.ping()
    print('✅ Redis: connected')
except Exception as e:
    print(f'❌ Redis: {e}')
    issues.append('Redis not running')

# Check 3: Database directly
try:
    conn = psycopg2.connect(
        'postgresql://agrisync_user:agrisync_pass@localhost/agrisync_db'
    )
    cur = conn.cursor()
    cur.execute('''
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema=\'public\' ORDER BY table_name
    ''')
    tables = [r[0] for r in cur.fetchall()]
    print(f'✅ PostgreSQL: {len(tables)} tables found')
    print(f'   Tables: {", ".join(tables)}')
    conn.close()
except Exception as e:
    print(f'❌ PostgreSQL: {e}')
    issues.append('PostgreSQL connection failed')

if issues:
    print(f'\n⚠️  {len(issues)} issue(s) found before testing:')
    for i in issues:
        print(f'   - {i}')
    print('\nFix these before proceeding.')
else:
    print('\n✅ All pre-flight checks passed. Starting verification...\n')
