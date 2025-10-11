#!/usr/bin/env python3
"""
Simple health check for all services
"""

import requests
import time

def check_service(name, url, timeout=5):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"[OK] {name}: Running")
            return True
        else:
            print(f"[FAIL] {name}: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] {name}: Not responding ({e})")
        return False

def main():
    print("Health Check - AI Yield Agent\n")
    
    services = [
        ("Frontend", "http://localhost:3001"),
        ("Backend API", "http://localhost:3002/health"),
        ("AI Agent", "http://localhost:3003/docs")
    ]
    
    results = []
    for name, url in services:
        results.append(check_service(name, url))
        time.sleep(1)
    
    print(f"\nStatus: {sum(results)}/{len(results)} services running")
    
    if all(results):
        print("All services are healthy!")
    else:
        print("Some services need attention")

if __name__ == "__main__":
    main()