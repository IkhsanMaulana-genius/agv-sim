import time
import json
from fastapi import FastAPI, WebSocket
from paho.mqtt.client import Client as MQTTClient
from agv_simulator import AGVSimulator, VDA5050Order, InstantAction
import asyncio
from dataclasses import asdict
from typing import Literal

# Initialize FastAPI app
app = FastAPI()

# WebSocket clients
websocket_clients = []

# Initialize MQTT client and AGV simulator
mqtt_client = MQTTClient()
agv_simulator = AGVSimulator()

# MQTT topics
MQTT_TOPIC_ORDER = "vda5050/order"
MQTT_TOPIC_STATE = "vda5050/state"
MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions"
MQTT_TOPIC_VISUALIZATION = "vda5050/visualization"
MQTT_TOPIC_FACTSHEET = "vda5050/factsheet"
MQTT_TOPIC_ERROR = "vda5050/error"

# Callback to handle MQTT connections
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe(MQTT_TOPIC_ORDER)
    client.subscribe(MQTT_TOPIC_INSTANT_ACTIONS)

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            order = json.loads(data)
            print(f"Received order: {order}")
            agv_simulator.process_order(VDA5050Order(**order))
            await websocket.send_text(json.dumps(agv_simulator.get_state()))
    except Exception as e:
        print(f"Error in WebSocket: {e}")
    finally:
        websocket_clients.remove(websocket)
        await websocket.close()

# Function to broadcast AGV state to all connected clients
def broadcast_state_to_clients(state):
    for websocket in websocket_clients:
        try:
            asyncio.create_task(websocket.send_text(json.dumps(state)))
        except Exception as e:
            print(f"Error sending WebSocket message: {e}")

# Callback to handle MQTT messages
def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        if msg.topic == MQTT_TOPIC_ORDER:
            agv_simulator.process_order(VDA5050Order(**payload))
            broadcast_state_to_clients(agv_simulator.get_state())
        elif msg.topic == MQTT_TOPIC_INSTANT_ACTIONS:
            agv_simulator.process_instant_action(InstantAction(**payload))
            broadcast_state_to_clients(agv_simulator.get_state())
    except Exception as e:
        print(f"Error processing MQTT message: {e}")
        publish_error(str(e))

# Publish AGV state periodically
def publish_state():
    while True:
        state = agv_simulator.get_state()
        mqtt_client.publish(MQTT_TOPIC_STATE, json.dumps(state))
        time.sleep(5)

# Publish AGV visualization data periodically
def publish_visualization():
    while True:
        visualization = agv_simulator.get_visualization()
        mqtt_client.publish(MQTT_TOPIC_VISUALIZATION, json.dumps(visualization))
        time.sleep(10)

# Publish AGV factsheet (static data)
def publish_factsheet():
    factsheet = agv_simulator.get_factsheet()
    mqtt_client.publish(MQTT_TOPIC_FACTSHEET, json.dumps(factsheet))

# Publish AGV errors
def publish_error(error_message: str):
    error = {
        "timestamp": time.time(),
        "errorMessage": error_message
    }
    mqtt_client.publish(MQTT_TOPIC_ERROR, json.dumps(error))

# Set up MQTT client
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect("localhost", 1883, 60)
mqtt_client.loop_start()

# Start publishing state, visualization, and factsheet in the background
import threading
threading.Thread(target=publish_state, daemon=True).start()
threading.Thread(target=publish_visualization, daemon=True).start()
threading.Thread(target=publish_factsheet, daemon=True).start()