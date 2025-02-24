import React, { useState, useEffect } from "react";
import mqtt, { MqttClient } from "mqtt";
import "./App.css";
import { VDA5050Order, AGVState, InstantAction, ActionType, Visualization, Factsheet, ErrorMessage } from "./type";

const MQTT_TOPIC_ORDER = "vda5050/order";
const MQTT_TOPIC_STATE = "vda5050/state";
const MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions";
const MQTT_TOPIC_ACK = "vda5050/ack";
const MQTT_TOPIC_VISUALIZATION = "vda5050/visualization";
const MQTT_TOPIC_FACTSHEET = "vda5050/factsheet";
const MQTT_TOPIC_ERROR = "vda5050/error";

const initialState: AGVState = {
  headerId: 1,
  timestamp: new Date().toISOString(),
  version: "2.0.0",
  manufacturer: "AGVSimulator",
  serialNumber: "AGV001",
  orderId: "",
  orderUpdateId: 0,
  lastNodeId: "",
  lastNodeSequenceId: 0,
  driving: false,
  position: { x: 0, y: 0, theta: 0 },
  batteryState: { batteryCharge: 100, charging: false },
  operatingMode: "AUTOMATIC",
  actionStates: []
};

const App: React.FC = () => {
  const [agvState, setAgvState] = useState<AGVState>(initialState);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [message, setMessage] = useState<string>("");
  const [coordinates, setCoordinates] = useState<string>("");
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [factsheetData, setFactsheetData] = useState<Factsheet>({
    headerId: 1,
    timestamp: new Date().toISOString(),
    model: "AGV-Simulator-2024",
    protocol: "VDA5050 2.0",
    capabilities: ["movement", "pause", "resume", "stop"],
    maxSpeed: 2.0,
    maxRotationSpeed: 1.0,
    dimensions: {
      length: 1.2,
      width: 0.8,
      height: 0.5
    }
  });
  const [errors, setErrors] = useState<ErrorMessage[]>([]);


  useEffect(() => {
    if (mqttClient) {
      // Request factsheet when component mounts
      mqttClient.publish(MQTT_TOPIC_FACTSHEET, JSON.stringify({
        requestId: Date.now(),
        timestamp: new Date().toISOString()
      }));
    }
  }, [mqttClient]);

  useEffect(() => {
    const mqttClient = mqtt.connect(
      `wss://${process.env.REACT_APP_MQTT_HOST}:${process.env.REACT_APP_MQTT_PORT}/mqtt`,
      {
        username: process.env.REACT_APP_MQTT_USERNAME,
        password: process.env.REACT_APP_MQTT_PASSWORD,
      }
    );

    mqttClient.subscribe(MQTT_TOPIC_VISUALIZATION);
    mqttClient.subscribe(MQTT_TOPIC_FACTSHEET);
    mqttClient.subscribe(MQTT_TOPIC_ERROR);

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      setMessage("Connected to MQTT broker successfully");
      setConnectionStatus("Connected");
      mqttClient.subscribe(MQTT_TOPIC_STATE, { qos: 1 });
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT connection error:", err);
      setConnectionStatus("Connection Failed");
      setMessage("Failed to connect to MQTT broker");
    });
    
    mqttClient.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
    
        switch (topic) {
          case MQTT_TOPIC_STATE:
            const state: AGVState = payload;
            if (state.operatingMode === "STOPPED") {
              setAgvState(initialState);
            } else {
              setAgvState(state);
            }
            console.log("AGV State Received:", state);
            setMessage("AGV state updated successfully");
            
            mqttClient.publish(MQTT_TOPIC_ACK, JSON.stringify({
              stateId: state.headerId,
              timestamp: new Date().toISOString()
            }));
            break;
    
          case MQTT_TOPIC_VISUALIZATION:
            const vizData: Visualization = payload;
            setVisualization(vizData);
            console.log("Visualization data received:", vizData);
            break;
    
          case MQTT_TOPIC_FACTSHEET:
            // setFactsheetData(payload);
            // console.log("Factsheet received:", payload);
            // break;
            const factsheet: Factsheet = payload;
            setFactsheetData(factsheet);
            // Remove or comment out this line
            // console.log("Factsheet received:", factsheet);
            break;
          case MQTT_TOPIC_ERROR:
            const error: ErrorMessage = payload;
            setErrors(prev => [...prev, error]);
            setMessage(`Error: ${error.errorDescription}`);
            console.log("Error received:", error);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        setMessage("Error parsing message");
      }
    });

    
    setMqttClient(mqttClient);

    return () => {
      console.log("Disconnecting MQTT...");
      mqttClient.end();
    };
  }, []);



  const validateCoordinates = (input: string): boolean => {
    const [x, y] = input.split(",").map(Number);
    return !isNaN(x) && !isNaN(y);
  };

  const sendOrder = () => {
    if (!mqttClient) {
      setMessage("MQTT client not connected");
      return;
    }

    if (!validateCoordinates(coordinates)) {
      setMessage('Invalid coordinates. Use format: "x, y"');
      return;
    }

    const [x, y] = coordinates.split(",").map(Number);
    const order: VDA5050Order = {
      headerId: 1,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      manufacturer: "AGVSimulator",
      serialNumber: "AGV001",
      orderId: `ORDER-${Date.now()}`,
      orderUpdateId: 1,
      nodes: [{ nodeId: "N1", x, y }],
    };

    mqttClient.publish(MQTT_TOPIC_ORDER, JSON.stringify(order));
  };

  const sendInstantAction = (actionType: ActionType) => {
    if (!mqttClient) {
      setMessage("MQTT client not connected");
      return;
    }

    if (actionType === ActionType.PAUSE && agvState) {
      setAgvState({
        ...agvState,
        driving: false
      });
    }

    const action: InstantAction = {
      headerId: 1,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      manufacturer: "AGVSimulator",
      serialNumber: "AGV001",
      actionId: `ACTION-${Date.now()}`,
      actionType,
    };

    mqttClient.publish(MQTT_TOPIC_INSTANT_ACTIONS, JSON.stringify(action));
  };

  const VisualizationPanel = ({ visualization }: { visualization: Visualization | null }) => (
    <div className="visualization-panel">
      <h2>AGV Visualization</h2>
      <div className="agv-canvas">
        {visualization && (
          <div 
            className="agv-marker"
            style={{
              left: `${visualization.agvPosition.x}%`,
              top: `${visualization.agvPosition.y}%`,
              transform: `rotate(${visualization.agvPosition.orientation}deg)`
            }}
          >
            🚛
          </div>
        )}
        <div className="grid-lines"></div>
      </div>
    </div>
  );
  
const FactsheetPanel = ({ factsheet }: { factsheet: Factsheet | null }) => (
  <div className="factsheet-panel">
    <h2>AGV Factsheet</h2>
    {factsheet && factsheet.capabilities && (
      <div className="factsheet-details">
        <p><strong>Model:</strong> {factsheet.model}</p>
        <p><strong>Protocol:</strong> {factsheet.protocol}</p>
        <p><strong>Max Speed:</strong> {factsheet.maxSpeed} m/s</p>
        <p><strong>Dimensions:</strong> 
          {factsheet.dimensions?.length}m × 
          {factsheet.dimensions?.width}m × 
          {factsheet.dimensions?.height}m
        </p>
        <div className="capabilities">
          <strong>Capabilities:</strong>
          <ul>
            {factsheet.capabilities.map((cap, idx) => (
              <li key={idx}>{cap}</li>
            ))}
          </ul>
        </div>
      </div>
    )}
  </div>
);
  
  const ErrorPanel = ({ errors }: { errors: ErrorMessage[] }) => (
    <div className="error-panel">
      <h2>Error Log</h2>
      <div className="error-list">
        {errors.map((error, idx) => (
          <div key={idx} className={`error-item ${error.errorLevel.toLowerCase()}`}>
            <span className="error-type">{error.errorType}</span>
            <span className="error-description">{error.errorDescription}</span>
            <span className="error-code">Code: {error.errorCode}</span>
          </div>
        ))}
      </div>
    </div>
  );

  

  return (
    <div className="container">
      <h1>AGV Control Panel</h1>

      {/* Connection Status */}
      <div className="status-indicator">
        <span>Connection Status: </span>
        <span
          className={`status ${
            connectionStatus === "Connected" ? "connected" : "disconnected"
          }`}
        >
          {connectionStatus}
        </span>
      </div>

      {/* Message Display */}
      <div
        className={`message ${
          message.includes("success") ? "success" : "error"
        }`}
      >
        {message}
      </div>

      <div className="main-content">
      <div className="left-panel">
        <VisualizationPanel visualization={visualization} />
      </div>
      
      <div className="right-panel">
         {/* AGV State */}
      <div className="agv-state">
        <h2>AGV State</h2>
        {agvState ? (
          <div className="state-details">
            <div>
              <strong>Position:</strong> (
              <span className="dynamic-value">
                {agvState.position.x.toFixed(2)}
              </span>
              ,
              <span className="dynamic-value">
                {agvState.position.y.toFixed(2)}
              </span>
              )
            </div>
            <div>
              <strong>Battery:</strong>
              <span className="dynamic-value">
                {agvState.batteryState.batteryCharge.toFixed(2)}
              </span>
              %
            </div>
            <div>
              <strong>State:</strong>
              <span className="dynamic-value">
                {agvState?.driving ? (
                  <div className="loading-spinner">Moving...</div>
                ) : (
                  <div>AGV is idle</div>
                )}
              </span>
            </div>
          </div>
        ) : (
          <p>No AGV state data available</p>
        )}
      </div>
        
        <FactsheetPanel factsheet={factsheetData} />
        
        <ErrorPanel errors={errors} />
      </div>
    </div>

     

      {/* Input for Coordinates */}
      <div className="input-section">
        <label>Enter Target Coordinates (x, y):</label>
        <input
          type="text"
          value={coordinates}
          onChange={(e) => setCoordinates(e.target.value)}
          placeholder="e.g., 5, 5"
        />
      </div>

      {/* Control Buttons */}
      <div className="control-buttons">
        <button onClick={sendOrder}>
          Send Order
        </button>
        <button onClick={() => sendInstantAction(ActionType.PAUSE)}>
          ⏸ Pause
        </button>
        <button onClick={() => sendInstantAction(ActionType.RESUME)}>
          {" "}
          ▶ Resume
        </button>
        <button onClick={() => sendInstantAction(ActionType.STOP)}>
          ⏹ Stop
        </button>
      </div>
    </div>
  );
};

export default App;
