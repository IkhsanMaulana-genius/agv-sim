import json
import asyncio
import logging
import threading
from fastapi import FastAPI
from paho.mqtt.client import Client as MQTTClient
from agv_simulator import AGVSimulator, VDA5050Order, InstantAction, NodePosition
import dataclasses

app = FastAPI()
mqtt_client = MQTTClient()
agv_simulator = AGVSimulator()

# MQTT Topics
MQTT_TOPIC_ORDER = "vda5050/order"
MQTT_TOPIC_STATE = "vda5050/state"
MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions"

# Enable logging
logging.basicConfig(level=logging.DEBUG)

def on_connect(client, userdata, flags, rc):
    client.subscribe(MQTT_TOPIC_ORDER)
    client.subscribe(MQTT_TOPIC_INSTANT_ACTIONS)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received message on topic {msg.topic}: {payload}")  # Debug print

        if msg.topic == MQTT_TOPIC_ORDER:
            # Convert raw dictionaries to NodePosition objects
            payload["nodes"] = [NodePosition(**node) for node in payload.get("nodes", [])]

            order = VDA5050Order(**payload)  # Now it works
            asyncio.run(handle_order(order))
        elif msg.topic == MQTT_TOPIC_INSTANT_ACTIONS:
            action = InstantAction(**payload)
            agv_simulator.process_instant_action(action)
    except Exception as e:
        print(f"Error processing MQTT message: {e}")



async def handle_order(order: VDA5050Order):
    async for state in agv_simulator.process_order(order):
        mqtt_client.publish(MQTT_TOPIC_STATE, json.dumps(dataclasses.asdict(state)))
       

# Setup MQTT with TLS
mqtt_client.tls_set()
mqtt_client.username_pw_set("test-user", "Strongpass@333333")  # Replace with your credentials

try:
    mqtt_client.connect("d5452ceae5134e97ab158e11cde16dcc.s1.eu.hivemq.cloud", 8883)
    print("Connected to MQTT broker")
except Exception as e:
    print(f"Failed to connect to MQTT broker: {e}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

threading.Thread(target=mqtt_client.loop_start, daemon=True).start()
