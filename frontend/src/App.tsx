import React, { useState, useEffect } from "react";
import mqtt, { MqttClient } from "mqtt";
import "./App.css";
import { VDA5050Order, AGVState, InstantAction, ActionType } from "./type";

// MQTT Topics
const MQTT_TOPIC_ORDER = "vda5050/order";
const MQTT_TOPIC_STATE = "vda5050/state";
const MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions";

const App: React.FC = () => {
  const [agvState, setAgvState] = useState<AGVState | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");
  const [message, setMessage] = useState<string>("");
  const [coordinates, setCoordinates] = useState<string>("");
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);

  // Connect to MQTT broker on mount
  useEffect(() => {
    const mqttClient = mqtt.connect(
      `wss://${process.env.REACT_APP_MQTT_HOST}:${process.env.REACT_APP_MQTT_PORT}/mqtt`,
      {
        username: process.env.REACT_APP_MQTT_USERNAME,
        password: process.env.REACT_APP_MQTT_PASSWORD,
        //  reconnectPeriod: 5000, // Reconnect every 5 seconds
      }
    );

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      setConnectionStatus("Connected");
      mqttClient.subscribe(MQTT_TOPIC_STATE, (err) => {
        if (err) {
          console.error("Subscription error:", err);
          setMessage("Failed to subscribe to state topic");
        } else {
          console.log("Subscribed to topic:", MQTT_TOPIC_STATE);
        }
      });
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
          setAgvState(state);
          console.log("AGV State Received:", state);
          setMessage("AGV state updated successfully");
        
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

  // Function to send an order
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

    mqttClient.publish(MQTT_TOPIC_ORDER, JSON.stringify(order), (err) => {
      if (err) {
        console.error("Failed to publish order:", err);
        setMessage("Failed to send order");
      } else {
        console.log("Order sent:", order);
        setMessage("Order sent successfully");
      }
    });
  };

  // Function to send an instant action
  const sendInstantAction = (actionType: ActionType) => {
    if (!mqttClient) {
      setMessage("MQTT client not connected");
      return;
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

    mqttClient.publish(
      MQTT_TOPIC_INSTANT_ACTIONS,
      JSON.stringify(action),
      (err) => {
        if (err) {
          console.error(`Failed to send ${actionType} action:`, err);
          setMessage(`Failed to send ${actionType} action`);
        } else {
          console.log(`${actionType} action sent:`, action);
          setMessage(`${actionType} action sent successfully`);
        }
      }
    );
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
