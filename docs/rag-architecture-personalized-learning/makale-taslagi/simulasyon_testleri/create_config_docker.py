#!/usr/bin/env python3
import json

config = {
    "session_id": "9544afbf28f939feee9d75fe89ec1ca6",
    "session_name": "Bilişim Teknolojilerinin Temelleri 9. Sınıf",
    "api_base_url": "http://api-gateway:8000",
    "users": {
        "agent_a": {
            "user_id": "sim_agent_a",
            "username": "sim_agent_a",
            "password": "123456"
        },
        "agent_b": {
            "user_id": "sim_agent_b",
            "username": "sim_agent_b",
            "password": "123456"
        },
        "agent_c": {
            "user_id": "sim_agent_c",
            "username": "sim_agent_c",
            "password": "123456"
        }
    }
}

with open("simulation_config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("Config created with api-gateway:8000")

