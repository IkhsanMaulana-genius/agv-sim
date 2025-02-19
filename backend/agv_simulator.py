import time
from dataclasses import dataclass, asdict
from typing import List, Literal, Optional

@dataclass
class NodePosition:
    nodeId: str
    x: float
    y: float

@dataclass
class VDA5050Order:
    orderId: str
    nodes: List[NodePosition]

@dataclass
class InstantAction:
    actionId: str
    actionType: Literal["PAUSE", "RESUME", "STOP"]

class AGVSimulator:
    def __init__(self):
        self.position = {"x": 0.0, "y": 0.0}
        self.battery = 100.0
        self.state: Literal["IDLE", "MOVING", "PAUSED"] = "IDLE"
        self.current_order: Optional[VDA5050Order] = None
        self.speed = 0.5  # units per second

    def process_order(self, order: VDA5050Order):
        self.current_order = order
        self.state = "MOVING"
        
        for node in order.nodes:
            target = (node.x, node.y)
            while self._move_towards(target):
                time.sleep(0.1)
                self.battery = max(0, self.battery - 0.01)
                
        self.state = "IDLE"

    def _move_towards(self, target: tuple[float, float]) -> bool:
        dx = target[0] - self.position["x"]
        dy = target[1] - self.position["y"]
        distance = (dx**2 + dy**2)**0.5
        
        if distance < 0.1:
            return False
            
        self.position["x"] += dx/distance * self.speed * 0.1
        self.position["y"] += dy/distance * self.speed * 0.1
        return True

    def process_instant_action(self, action: InstantAction):
        if action.actionType == "PAUSE":
            self.state = "PAUSED"
        elif action.actionType == "RESUME":
            self.state = "MOVING"
        elif action.actionType == "STOP":
            self.state = "IDLE"

    def get_state(self):
        return {
            "position": self.position,
            "battery": self.battery,
            "state": self.state,
            "timestamp": time.time()
        }

    def get_visualization(self):
        return {
            "position": self.position,
            "state": self.state,
            "currentOrder": asdict(self.current_order) if self.current_order else None
        }

    def get_factsheet(self):
        return {
            "agvId": "AGV001",
            "maxSpeed": 1.0,
            "batteryCapacity": 100.0,
            "loadCapacity": 50.0,
            "dimensions": {"length": 1.5, "width": 0.8, "height": 1.2}
        }