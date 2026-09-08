# SSH Intrusion Monitor App

A React Native security dashboard for monitoring SSH authentication events detected by the Raspberry Pi SSH Intrusion Monitor.

The app displays security events in real time, allowing suspicious login activity and potential brute-force attacks to be monitored from a mobile device.

## Features

- Real-time security event monitoring
- Live updates with Socket.io
- High and medium severity classification
- Severity-based event filtering
- Paginated event history
- Pull-to-refresh
- Failed login attempt counts
- Source IP and username visibility

## Architecture

```text
Raspberry Pi
     ↓
Python SSH Monitor
     ↓
Express API
     ↓
MongoDB
     ↓
Socket.io
     ↓
React Native Dashboard
```

## Event Types

The dashboard displays two types of security events:

- `ssh_failed_login` — Individual failed SSH authentication attempt
- `possible_brute_force` — Multiple failed attempts detected from the same IP within the detection window

Events are classified by severity:

- `medium` — Failed SSH login
- `high` — Potential brute-force attack

## Real-Time Monitoring

The app connects to the backend using Socket.io and listens for:

```text
security_event
```

When the Raspberry Pi detects new SSH activity, the event is processed by the API and automatically appears on the dashboard without requiring a manual refresh.

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Socket.io Client

## Setup

Install dependencies:

```bash
pnpm install
```

Configure the API address:

```ts
const API_URL = "http://YOUR_API_IP:3001";
```

Start the Expo development server:

```bash
pnpm start
```

The mobile device and API server must be reachable over the same network when using a local API address.

<img width="345" height="768" alt="Image" src="https://github.com/user-attachments/assets/7e7b7985-c940-489d-a5a6-b4e124659d2f" />

## Related Repositories

This application is the visualization layer of the SSH Intrusion Detection & Monitoring System.

- [Raspberry Pi Monitor](https://github.com/jmejiamu/raspberry-pi-ssh-monitor) — Monitors Linux authentication logs and detects suspicious SSH activity.
- [Backend API](https://github.com/jmejiamu/ssh-intrusion-monitor-api) — Validates, stores, and streams security events to the dashboard.
