import React, { useState, useEffect } from "react";
import mqtt, { MqttClient } from "mqtt";
import "./App.css";
import { VDA5050Order, AGVState, InstantAction, ActionType } from "./type";

const MQTT_TOPIC_ORDER = "vda5050/order";
const MQTT_TOPIC_STATE = "vda5050/state";
const MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions";
const MQTT_TOPIC_ACK = "vda5050/ack";

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

  useEffect(() => {
    const mqttClient = mqtt.connect(
      `wss://${process.env.REACT_APP_MQTT_HOST}:${process.env.REACT_APP_MQTT_PORT}/mqtt`,
      {
        username: process.env.REACT_APP_MQTT_USERNAME,
        password: process.env.REACT_APP_MQTT_PASSWORD,
      }
    );

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      setConnectionStatus("Connected");
      mqttClient.subscribe(MQTT_TOPIC_STATE, { qos: 1 });
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT connection error:", err);
      setConnectionStatus("Connection Failed");
      setMessage("Failed to connect to MQTT broker");
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC_STATE) {
        try {
          const state: AGVState = JSON.parse(message.toString());
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
        
        } catch (error) {
          console.error("Error parsing AGV state:", error);
          setMessage("Error parsing AGV state");
        }
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

      {/* Message Feedback */}
      {/* {message && <div className="message">{message}</div>} */}

      <div
        className={`message ${
          message.includes("success") ? "success" : "error"
        }`}
      >
        {message}
      </div>

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
