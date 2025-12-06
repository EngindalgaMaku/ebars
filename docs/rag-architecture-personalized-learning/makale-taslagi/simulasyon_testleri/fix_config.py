#!/usr/bin/env python3
import json

with open("simulation_config.json", "r", encoding="utf-8") as f:
    config = json.load(f)

config["api_base_url"] = "http://api-gateway:8000"

with open("simulation_config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("Config fixed: api_base_url = http://api-gateway:8000")

