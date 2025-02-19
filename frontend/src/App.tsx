import { useState, useEffect } from 'react';
import './App.css';

type AGVState = {
  position: { x: number; y: number };
  battery: number;
  state: 'IDLE' | 'MOVING' | 'PAUSED';
  timestamp: number;
};

type VisualizationData = {
  position: { x: number; y: number };
  state: 'IDLE' | 'MOVING' | 'PAUSED';
  currentOrder: {
    orderId: string;
    nodes: { nodeId: string; x: number; y: number }[];
  } | null;
};

type FactsheetData = {
  agvId: string;
  maxSpeed: number;
  batteryCapacity: number;
  loadCapacity: number;
  dimensions: { length: number; width: number; height: number };
};

type ErrorData = {
  timestamp: number;
  errorMessage: string;
};

export default function App() {
  const [agvState, setAgvState] = useState<AGVState>({
    position: { x: 0, y: 0 },
    battery: 100,
    state: 'IDLE',
    timestamp: Date.now(),
  });

  const [visualization, setVisualization] = useState<VisualizationData>({
    position: { x: 0, y: 0 },
    state: 'IDLE',
    currentOrder: null,
  });

  const [factsheet, setFactsheet] = useState<FactsheetData>({
    agvId: 'AGV001',
    maxSpeed: 1.0,
    batteryCapacity: 100.0,
    loadCapacity: 50.0,
    dimensions: { length: 1.5, width: 0.8, height: 1.2 },
  });

  const [error, setError] = useState<ErrorData | null>(null);
  const [coordinates, setCoordinates] = useState<string>('0,0\n5,5');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.position && data.battery && data.state) {
          setAgvState(data); // Update AGV state
        } else if (data.position && data.state && data.currentOrder !== undefined) {
          setVisualization(data); // Update visualization data
        } else if (data.timestamp && data.errorMessage) {
          setError(data); // Update error data
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setWsConnection(socket);

    return () => {
      socket.close();
    };
  }, []);

  // Fetch factsheet on component mount
  // useEffect(() => {
  //   fetch('http://localhost:8000/factsheet')
  //     .then((response) => response.json())
  //     .then((data) => setFactsheet(data))
  //     .catch((error) => console.error('Error fetching factsheet:', error));
  // }, []);

  const sendOrder = () => {
    if (!wsConnection) return;

    try {
      const nodes = coordinates
        .split('\n')
        .map((line, i) => {
          const [x, y] = line.split(',').map(Number);
          return { nodeId: `N${i + 1}`, x, y };
        });

      const order = {
        orderId: `ORDER-${Date.now()}`,
        nodes,
      };

      wsConnection.send(JSON.stringify(order));
    } catch (err) {
      console.error('Invalid coordinates format');
    }
  };

  const sendInstantAction = (actionType: 'PAUSE' | 'RESUME' | 'STOP') => {
    if (!wsConnection) return;

    const action = {
      actionId: `ACTION-${Date.now()}`,
      actionType,
    };

    wsConnection.send(JSON.stringify(action));
  };

  return (
    <div className="container">
      <h1>AGV Control Panel</h1>

      {error && (
        <div className="error">
          <h2>Error</h2>
          <p>{error.errorMessage}</p>
          <p>Timestamp: {new Date(error.timestamp).toLocaleString()}</p>
        </div>
      )}

      <div className="control-section">
        <div className="status-card">
          <h2>Current Status</h2>
          <div className="status-grid">
            <div>
              <label>Position:</label>
              <span>{agvState.position.x.toFixed(2)}, {agvState.position.y.toFixed(2)}</span>
            </div>
            <div>
              <label>Battery:</label>
              <span>{agvState.battery.toFixed(1)}%</span>
            </div>
            <div>
              <label>State:</label>
              <span className={`state ${agvState.state}`}>{agvState.state}</span>
            </div>
          </div>
        </div>

        <div className="visualization-card">
          <h2>Visualization</h2>
          <p>Current Order: {visualization.currentOrder?.orderId || 'None'}</p>
          <p>State: {visualization.state}</p>
          <p>Position: {visualization.position.x.toFixed(2)}, {visualization.position.y.toFixed(2)}</p>
        </div>

        <div className="factsheet-card">
          <h2>Factsheet</h2>
          <p>AGV ID: {factsheet.agvId}</p>
          <p>Max Speed: {factsheet.maxSpeed} m/s</p>
          <p>Battery Capacity: {factsheet.batteryCapacity}%</p>
          <p>Load Capacity: {factsheet.loadCapacity} kg</p>
          <p>Dimensions: {factsheet.dimensions.length}m (L) x {factsheet.dimensions.width}m (W) x {factsheet.dimensions.height}m (H)</p>
        </div>
        
        <div className="control-card">
          <h2>Send Path</h2>
          <textarea
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            placeholder="Enter coordinates (x,y per line)"
            rows={5}
          />
          <button onClick={sendOrder}>Send Path</button>
        </div>

        <div className="control-card">
          <h2>Instant Actions</h2>
          <button onClick={() => sendInstantAction('PAUSE')}>Pause</button>
          <button onClick={() => sendInstantAction('RESUME')}>Resume</button>
          <button onClick={() => sendInstantAction('STOP')}>Stop</button>
        </div>

      </div>
    </div>
  );
}