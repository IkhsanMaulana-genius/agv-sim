import json
import asyncio
import logging
import threading
from queue import Queue
import time
from fastapi import FastAPI
from paho.mqtt.client import Client as MQTTClient
from agv_simulator import AGVSimulator, VDA5050Order, InstantAction, NodePosition
import dataclasses
from dotenv import load_dotenv
import os

app = FastAPI()
mqtt_client = MQTTClient()
agv_simulator = AGVSimulator()
# Load environment variables
load_dotenv()

MQTT_TOPIC_ORDER = "vda5050/order"
MQTT_TOPIC_STATE = "vda5050/state"
MQTT_TOPIC_INSTANT_ACTIONS = "vda5050/instantActions"
MQTT_TOPIC_ACK = "vda5050/ack"
MQTT_TOPIC_VISUALIZATION = "vda5050/visualization"
MQTT_TOPIC_FACTSHEET = "vda5050/factsheet"
MQTT_TOPIC_ERROR = "vda5050/error"

state_queue = Queue()
ack_queue = Queue()

def on_connect(client, userdata, flags, rc):
    client.subscribe(MQTT_TOPIC_ORDER)
    client.subscribe(MQTT_TOPIC_INSTANT_ACTIONS)
    client.subscribe(MQTT_TOPIC_ACK)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received message on topic {msg.topic}: {payload}")
        
        if msg.topic == MQTT_TOPIC_ACK:
            ack_queue.put(payload)
        elif msg.topic == MQTT_TOPIC_FACTSHEET:
            factsheet = agv_simulator.get_factsheet()
            mqtt_client.publish(MQTT_TOPIC_FACTSHEET, json.dumps(dataclasses.asdict(factsheet)), qos=1)
        elif msg.topic == MQTT_TOPIC_ORDER:
            payload["nodes"] = [NodePosition(**node) for node in payload.get("nodes", [])]
            order = VDA5050Order(**payload)
            state_queue.put(order)
            threading.Thread(target=process_order_sync, args=(order,), daemon=True).start()
        elif msg.topic == MQTT_TOPIC_INSTANT_ACTIONS:
            action = InstantAction(**payload)
            state = agv_simulator.process_instant_action(action)
            if state:
                mqtt_client.publish(MQTT_TOPIC_STATE, json.dumps(dataclasses.asdict(state)), qos=1)
    except Exception as e:
        print(f"Error processing MQTT message: {str(e)}")

def process_order_sync(order: VDA5050Order):
    try:
        for state in agv_simulator.process_order_sync(order):
            state_dict = dataclasses.asdict(state)
            print(f"Publishing state: {state_dict}")
            mqtt_client.publish(MQTT_TOPIC_STATE, json.dumps(state_dict), qos=1)
            
            try:
                ack = ack_queue.get(timeout=2)
                print(f"Received ack: {ack}")
            except Queue.Empty:
                print("Timeout waiting for acknowledgment")
                continue
            
            time.sleep(0.05)
    except Exception as e:
        print(f"Error in process_order_sync: {str(e)}")


# Publish visualization periodically
def publish_visualization():
    while True:
        if agv_simulator.state == "MOVING":  # Only publish when AGV is moving
            state = agv_simulator.publish_visualization()
            mqtt_client.publish(MQTT_TOPIC_VISUALIZATION, 
                              json.dumps(dataclasses.asdict(state)))
        time.sleep(1)

# Start visualization thread
threading.Thread(target=publish_visualization, daemon=True).start()

# Add this function to periodically publish factsheet
def publish_factsheet():
    while True:
        factsheet = agv_simulator.get_factsheet()
        mqtt_client.publish(MQTT_TOPIC_FACTSHEET, 
                          json.dumps(dataclasses.asdict(factsheet)), 
                          qos=1)
        time.sleep(5)  # Update every 5 seconds

# Add this to your existing MQTT setup
mqtt_client.subscribe(MQTT_TOPIC_FACTSHEET)

# Start factsheet publishing thread
threading.Thread(target=publish_factsheet, daemon=True).start()

mqtt_client.tls_set()
mqtt_client.username_pw_set(
    os.getenv('MQTT_USERNAME'),
    os.getenv('MQTT_PASSWORD')
)

try:
    mqtt_client.connect(
    os.getenv('MQTT_HOST'),
    int(os.getenv('MQTT_PORT'))
)
    print("Connected to MQTT broker")
except Exception as e:
    print(f"Failed to connect to MQTT broker: {e}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

threading.Thread(target=mqtt_client.loop_start, daemon=True).start()
