#!/bin/bash
cd /home/stevemburu/Development/Agrisync360/agrisync-360/backend
source venv/bin/activate
flask db migrate -m "Add new features: AI chat, community, greenhouse, yields, farm ops"
flask db upgrade
