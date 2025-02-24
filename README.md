# AGV Simulator with VDA5050

A real-time AGV (Automated Guided Vehicle) simulator implementing the VDA5050 protocol with visualization capabilities. Features a React frontend for control and monitoring, and a Python backend for AGV simulation logic.

## Features

- Real-time AGV position visualization
- Battery state simulation
- VDA5050 protocol implementation
- Interactive control panel
- Error monitoring and reporting
- Factsheet information display

## Architecture

- Frontend: React application with MQTT client
- Backend: Python FastAPI with AGV simulation logic
- Communication: MQTT protocol over WebSocket

## Environment Setup

### Frontend Environment (.env)
```env
REACT_APP_MQTT_HOST=d5452ceae5134e97ab158e11cde16dcc.s1.eu.hivemq.cloud
REACT_APP_MQTT_PORT=8884
REACT_APP_MQTT_USERNAME=test-user
REACT_APP_MQTT_PASSWORD=Strongpass@333333
```
### Backend Environment (.env)
```env
MQTT_HOST=d5452ceae5134e97ab158e11cde16dcc.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=test-user
MQTT_PASSWORD=Strongpass@333333
```

## Installation
1. Clone the repository:
```
git clone https://github.com/IkhsanMaulana-genius/agv-sim.git
cd agv-sim
```
2. Frontend Setup:
```
cd frontend
npm install
npm start
```
3. Backend Setup:
```
cd backend
pip install -r requirements.txt
python main.py
```

## MQTT Topics and Message Formats
1. Order Messages (vda5050/order)
- Send movement commands to the AGV:
```
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "version": "2.0.0",
  "manufacturer": "AGVSimulator",
  "serialNumber": "AGV001",
  "orderId": "ORDER-123",
  "orderUpdateId": 1,
  "nodes": [
    {
      "nodeId": "N1",
      "x": 100,
      "y": 100
    }
  ]
}
```
2. Status Messages (vda5050/status)
- Receive status updates from the AGV:
`````
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "version": "2.0.0",
  "manufacturer": "AGVSimulator",
  "serialNumber": "AGV001",
  "orderId": "ORDER-123",
  "orderUpdateId": 1,
  "lastNodeId": "N1",
  "lastNodeSequenceId": 1,
  "driving": true,
  "position": {
    "x": 50,
    "y": 50,
    "theta": 0
  },
  "batteryState": {
    "batteryCharge": 100,
    "charging": false
  },
  "operatingMode": "AUTOMATIC",
  "actionStates": []
}
`````
3. Instant Actions (vda5050/instantActions)
- Send immediate commands to the AGV:
```
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "version": "2.0.0",
  "manufacturer": "AGVSimulator",
  "serialNumber": "AGV001",
  "actionId": "ACTION-123",
  "actionType": "PAUSE"  // PAUSE, RESUME, or STOP
}
```
4. Visualization Updates (vda5050/visualization)
- Receive AGV position visualization data:
```
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "agvPosition": {
    "x": 50,
    "y": 50,
    "orientation": 0
  },
  "customData": {
    "state": "MOVING",
    "isMoving": true
  }
}
```

5. Factsheet Information (vda5050/factsheet)
- Receive AGV specifications:
```
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "model": "AGV-Simulator-2024",
  "protocol": "VDA5050 2.0",
  "capabilities": ["movement", "pause", "resume", "stop"],
  "maxSpeed": 2.0,
  "maxRotationSpeed": 1.0,
  "dimensions": {
    "length": 1.2,
    "width": 0.8,
    "height": 0.5
  }
}
```
6. Error Messages (vda5050/error)
- Receive error notifications:
```
{
  "headerId": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "errorType": "PROTOCOL",  // PROTOCOL, HARDWARE, or SOFTWARE
  "errorLevel": "WARNING",  // WARNING or FATAL
  "errorDescription": "Error description",
  "errorCode": 1001
}
```

## Usage
1. Start the frontend and backend services
2. Access the web interface at http://localhost:3000
3. Use the control panel to:
    - Send movement orders using coordinates
    - Monitor AGV position and state
    - Control AGV using instant actions (Pause, Resume, Stop)
    - View real-time visualization
    - Monitor errors and system status

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
