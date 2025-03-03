import { defineStore } from "pinia";
import mqtt from "mqtt";

export const MQTT_TOPICS = {
  ORDER: "vda5050/order",
  STATE: "vda5050/state",
  INSTANT_ACTIONS: "vda5050/instantActions",
  ACK: "vda5050/ack",
};

export const useMqttStore = defineStore("mqtt", {
  state: () => ({
    mqttClient: null,
    connectionStatus: "disconnected",
    pauseDisplay: null,
    orderDisplay: null,
    lastReceivedState: null,
  }),

  actions: {
    connectMqtt() {
      const client = mqtt.connect(
        `wss://${import.meta.env.VITE_MQTT_HOST}:${
          import.meta.env.VITE_MQTT_PORT
        }/mqtt`,
        {
          username: import.meta.env.VITE_MQTT_USERNAME,
          password: import.meta.env.VITE_MQTT_PASSWORD,
        }
      );

      client.on("connect", () => {
        console.log("Connected to MQTT broker");
        this.connectionStatus = "Connected";
        client.subscribe(MQTT_TOPICS.STATE, { qos: 1 });
      });

      client.on("error", (err) => {
        console.log("Error connecting to MQTT broker:", err);
        this.connectionStatus = "Connection Failed";
      });

      client.on("message", (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());

          switch (topic) {
            case MQTT_TOPICS.STATE:
              console.log("AGV State Received:", data);

              this.lastReceivedState = {
                position: data.position,
                operatingMode: data.operatingMode,
                driving: data.driving,
                batteryState: data.batteryState,
              };

              client.publish(
                MQTT_TOPICS.ACK,
                JSON.stringify({
                  stateId: data.headerId,
                  timestamp: new Date().toISOString(),
                })
              );
              break;
            default:
              console.log("Unknown topic:", topic);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
          this.message = "Error parsing message";
        }
      });

      this.mqttClient = client;
    },

    disconnectMqtt() {
      if (this.mqttClient) {
        console.log("Disconnecting MQTT...");
        this.mqttClient.end();
        this.mqttClient = null;
      }
    },

    publishAction(topic, payload) {
      if (this.mqttClient) {
        this.mqttClient.publish(MQTT_TOPICS[topic], JSON.stringify(payload));
      } else {
        console.log("MQTT client not connected");
      }
    },

    subscribeAction(topic) {
      if (this.mqttClient) {
        this.mqttClient.subscribe(MQTT_TOPICS[topic], { qos: 1 });
      } else {
        console.log("MQTT client not connected");
      }
    },
  },
});
