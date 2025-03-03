import json
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
load_dotenv()

# MQTT Topics as constants
MQTT_TOPICS = {
    'ORDER': 'vda5050/order',
    'STATE': 'vda5050/state',
    'INSTANT_ACTIONS': 'vda5050/instantActions',
    'ACK': 'vda5050/ack'
}

queues = {
    'state': Queue(),
    'ack': Queue()
}

def handle_mqtt_message(client, topic: str, payload: dict):
    if topic == MQTT_TOPICS['ACK']:
        queues['ack'].put(payload)
    elif topic == MQTT_TOPICS['ORDER']:
        nodes = [NodePosition(**node) for node in payload.get('nodes', [])]
        order = VDA5050Order(**{**payload, 'nodes': nodes})
        queues['state'].put(order)
        threading.Thread(target=process_order_sync, args=(order,), daemon=True).start()
    elif topic == MQTT_TOPICS['INSTANT_ACTIONS']:
        action = InstantAction(**payload)
        if state := agv_simulator.process_instant_action(action):
            publish_state(state)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        handle_mqtt_message(client, msg.topic, payload)
    except Exception as e:
        print(f"Error processing MQTT message: {str(e)}")

def publish_state(state):
    mqtt_client.publish(
        MQTT_TOPICS['STATE'],
        json.dumps(dataclasses.asdict(state)),
        qos=1
    )

def process_order_sync(order: VDA5050Order):
    try:
        for state in agv_simulator.process_order_sync(order):
            publish_state(state)
            try:
                queues['ack'].get(timeout=2)
            except Queue.Empty:
                continue
            time.sleep(0.05)
    except Exception as e:
        print(f"Error in process_order_sync: {str(e)}")

def setup_mqtt():
    mqtt_client.tls_set()
    mqtt_client.username_pw_set(
        os.getenv('MQTT_USERNAME'),
        os.getenv('MQTT_PASSWORD')
    )
    mqtt_client.on_connect = lambda client, userdata, flags, rc: [
        client.subscribe(topic) for topic in MQTT_TOPICS.values()
    ]
    mqtt_client.on_message = on_message

    try:
        mqtt_client.connect(
            os.getenv('MQTT_HOST'),
            int(os.getenv('MQTT_PORT'))
        )
        print("Connected to MQTT broker")
    except Exception as e:
        print(f"Failed to connect to MQTT broker: {e}")

    threading.Thread(target=mqtt_client.loop_start, daemon=True).start()

setup_mqtt()
