#!/usr/bin/env python3

import requests
import time

def main():
  while True:
    requests.get("https://definitelynotharmony.dev/api/heartbeat", timeout=5)
    print(f"Heartbeat sent")
    time.sleep(30)

if __name__ == "__main__":
    main()
