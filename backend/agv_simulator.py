import asyncio
import time
from dataclasses import dataclass, asdict
from typing import List, Literal, Optional, AsyncGenerator

@dataclass
class NodePosition:
    nodeId: str
    x: float
    y: float

@dataclass
class VDA5050Order:
    headerId: int
    timestamp: str
    orderId: str
    orderUpdateId: int
    nodes: List[NodePosition]
    version: str = "2.0.0"
    manufacturer: str = "AGVSimulator"
    serialNumber: str = "AGV001"

@dataclass
class AGVState:
    headerId: int
    timestamp: str
    orderId: str
    orderUpdateId: int
    lastNodeId: str
    lastNodeSequenceId: int
    driving: bool
    position: dict
    batteryState: dict
    operatingMode: Literal["AUTOMATIC", "MANUAL", "SERVICE", "STOPPED"]
    actionStates: List[dict]
    version: str = "2.0.0"
    manufacturer: str = "AGVSimulator"
    serialNumber: str = "AGV001"

@dataclass
class InstantAction:
    headerId: int
    timestamp: str
    actionId: str
    actionType: Literal["PAUSE", "RESUME", "STOP"]
    version: str = "2.0.0"
    manufacturer: str = "AGVSimulator"
    serialNumber: str = "AGV001"

@dataclass
class Visualization:
    headerId: int
    timestamp: str
    agvPosition: dict
    customData: dict

@dataclass
class Factsheet:
    headerId: int
    timestamp: str
    model: str
    protocol: str
    capabilities: List[str]
    maxSpeed: float
    maxRotationSpeed: float
    dimensions: dict

@dataclass
class ErrorMessage:
    headerId: int
    timestamp: str
    errorType: Literal["PROTOCOL", "HARDWARE", "SOFTWARE"]
    errorLevel: Literal["WARNING", "FATAL"]
    errorDescription: str
    errorCode: int

class AGVSimulator:
    def __init__(self):
        self.position = {"x": 0.0, "y": 0.0}
        self.battery = 100.0
        self.state = "IDLE"
        self.current_order = None
        self.speed = 1.0
        self._is_paused = False
        self._is_stopped = False
        self._current_target = None

    def _move_towards(self, target: tuple[float, float]) -> bool:
        dx = target[0] - self.position["x"]
        dy = target[1] - self.position["y"]
        distance = (dx**2 + dy**2)**0.5

        # Stricter target reached check with exact positioning
        if distance < 0.05:  # Reduced threshold for more precision
            self.position["x"] = target[0]
            self.position["y"] = target[1]
            self.state = "IDLE"
            return True

        # Ensure we don't overshoot the target
        step_size = min(self.speed * 0.5, distance)
        self.position["x"] += (dx / distance) * step_size
        self.position["y"] += (dy / distance) * step_size
        return False
    

    def process_order_sync(self, order: VDA5050Order):
        self.current_order = order
        self.state = "MOVING"
        self._is_stopped = False
        self._is_paused = False

        for node in order.nodes:
            if self._is_stopped:
                break

            self._current_target = (node.x, node.y)
            
            while not self._is_stopped:
                if self._is_paused:
                    yield self._get_state(order)
                    while self._is_paused and not self._is_stopped:
                        time.sleep(0.1)
                    continue

                target_reached = self._move_towards(self._current_target)
                self.battery = max(0, self.battery - 0.01)
                
                if target_reached:
                    final_state = self._get_state(order)
                    final_state.driving = False  # Ensure driving is False when stopped
                    yield final_state
                    return  # Exit immediately after reaching target
                
                yield self._get_state(order)
                
    def process_instant_action(self, action: InstantAction):
        if action.actionType == "STOP":
            self._is_stopped = True
            self._is_paused = False
            self.state = "IDLE"
            self.position = {"x": 0.0, "y": 0.0}
            self.battery = 100.0
            self._current_target = None
            
            reset_state = self._get_state(self.current_order)
            reset_state.operatingMode = "STOPPED"
            return reset_state
        elif action.actionType == "PAUSE":
            self._is_paused = True
            self.state = "PAUSED"
        elif action.actionType == "RESUME":
            self._is_paused = False
            self.state = "MOVING"

    def _get_state(self, order: VDA5050Order) -> AGVState:
        return AGVState(
            headerId=1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            orderId=order.orderId,
            orderUpdateId=order.orderUpdateId,
            lastNodeId="N1",
            lastNodeSequenceId=1,
            driving=self.state == "MOVING",
            position={"x": self.position["x"], "y": self.position["y"], "theta": 0.0},
            batteryState={"batteryCharge": self.battery, "charging": False},
            operatingMode="AUTOMATIC",
            actionStates=[],
        )

    def publish_visualization(self):
        return Visualization(
            headerId=1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            agvPosition={
                "x": self.position["x"],
                "y": self.position["y"],
                "orientation": 0.0
            },
            customData={"state": self.state, "isMoving": self.state == "MOVING"}
        )

    def get_factsheet(self):
        return Factsheet(
            headerId=1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            model="AGV-Simulator-2024",
            protocol="VDA5050 2.0",
            capabilities=["movement", "pause", "resume", "stop"],
            maxSpeed=2.0,
            maxRotationSpeed=1.0,
            dimensions={"length": 1.2, "width": 0.8, "height": 0.5}
        )

    def report_error(self, error_type: str, description: str):
        return ErrorMessage(
            headerId=1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            errorType=error_type,
            errorLevel="WARNING",
            errorDescription=description,
            errorCode=1001
        )