# AGV Simulator with VDA5050

A real-time AGV (Automated Guided Vehicle) simulator implementing the VDA5050 protocol with visualization capabilities. Features a Vue.js frontend for control and monitoring, and a Python FastAPI backend for AGV simulation logic.

## Features

- Real-time AGV position visualization on 2D map
- Transport order management through VDA5050
- Dynamic pause/resume control
- Battery level simulation
- Full VDA5050 protocol implementation
- Real-time status monitoring
- Comprehensive action logging

## Architecture

- Frontend: Vue.js 3 with Pinia state management
- Backend: Python FastAPI
- Protocol: MQTT over WebSocket
- MQTT Broker: HiveMQ Cloud
- Deployment: Docker containers

## Prerequisites

- Docker and Docker Compose installed
- Active HiveMQ Cloud account

## Environment Configuration

The project requires two environment files:

1. Frontend environment (`frontend/.env`):

```env
VITE_MQTT_HOST=<hivemq-host>
VITE_MQTT_PORT=<hivemq-port>
VITE_MQTT_USERNAME=<hivemq-username>
VITE_MQTT_PASSWORD=<hivemq-password>
```

2. Backend environment (`backend/.env`):

```env
MQTT_HOST=<hivemq-host>
MQTT_PORT=<hivemq-port>
MQTT_USERNAME=<hivemq-username>
MQTT_PASSWORD=<hivemq-password>
```

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/IkhsanMaulana-genius/agv-sim.git
```

```bash
cd agv-sim
```

2. Launch with Docker Compose:

```bash
docker-compose build
```

```bash
docker-compose up
```

3. Access the interfaces:

- Web UI: http://localhost:3000
- API: http://localhost:8000

## Project Structure

```
agv-sim/
├── frontend/          # Vue.js frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── store/    # Pinia state management
│   │   ├── views/
│   │   └── App.vue
│   ├── .env
│   └── Dockerfile
├── backend/           # FastAPI backend service
│   ├── agv_simulator.py
│   ├── main.py
│   ├── .env
│   └── Dockerfile
└── docker-compose.yml
```

## VDA5050 MQTT Topics

- Orders: `vda5050/order`
- AGV States: `vda5050/state`
- Instant Commands: `vda5050/instantActions`
- Order Acknowledgments: `vda5050/ack`

## Core Functionality

1. Transport Order Management:

   - Issue movement commands via UI
   - Automated path following
   - Order status tracking

2. AGV Control:

   - Real-time pause/resume
   - Position monitoring
   - Path visualization

3. System Monitoring:
   - Live coordinate tracking
   - Battery status
   - Operational mode display
   - Order execution history

## Local Development

Frontend setup:

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

Backend setup:

```bash
cd backend
```

```bash
pip install -r requirements.txt
```

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to your branch
5. Submit a pull request

## License
