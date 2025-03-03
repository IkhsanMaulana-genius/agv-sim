from dataclasses import dataclass
from typing import List, Literal, Generator
import time

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
    version: str = "2.1.0"
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
    operatingMode: Literal["MOVE", "PAUSE", "STOPPED"]
    actionStates: List[dict]
    version: str = "2.1.0"
    manufacturer: str = "AGVSimulator"
    serialNumber: str = "AGV001"

@dataclass
class InstantAction:
    headerId: int
    timestamp: str
    actionId: str
    actionType: Literal["PAUSE", "RESUME", "STOP"]
    version: str = "2.1.0"
    manufacturer: str = "AGVSimulator"
    serialNumber: str = "AGV001"

class AGVSimulator:
    SPEED = 10
    BATTERY_DRAIN_RATE = 0.01
    UPDATE_INTERVAL = 0.1

    def __init__(self):
        self.position = {"x": 0.0, "y": 20.0}
        self.battery = 100.0
        self.state = "IDLE"
        self._paused_position = None
        self._is_paused = False
        self._is_stopped = False

    def _move_towards(self, target_x: float) -> bool:
        current_x = self.position["x"]
        
        # Handle end position
        if target_x == 60 and current_x >= 60:
            self.position.update({"x": 60, "y": 20})
            return True

        dx = target_x - current_x
        if abs(dx) < 0.05:
            self.position["x"] = target_x  # Snap to exact position
            return True

        step = min(self.SPEED * self.UPDATE_INTERVAL, abs(dx))
        self.position["x"] += step if dx > 0 else -step
        return False


    def process_order_sync(self, order: VDA5050Order) -> Generator[AGVState, None, None]:
        # Only reset position if not paused
        if not self._is_paused:
            self.position = {"x": 0.0, "y": 20.0}
        
        self.state = "MOVING"
        self._is_stopped = False
        self._is_paused = False

        # Track current target node
        current_node_index = 0
        while current_node_index < len(order.nodes):
            node = order.nodes[current_node_index]
            
            if self._is_stopped:
                break

            while not self._is_stopped:
                if self._is_paused:
                    self._paused_position = dict(self.position)
                    yield self._create_state(order)
                    time.sleep(self.UPDATE_INTERVAL)
                    continue

                if self._move_towards(node.x):
                    current_node_index += 1
                    break

                self.battery = max(0, self.battery - self.BATTERY_DRAIN_RATE)
                yield self._create_state(order)
                time.sleep(self.UPDATE_INTERVAL)

        final_state = self._create_state(order)
        final_state.driving = False
        yield final_state

    def process_instant_action(self, action: InstantAction) -> None:
        if action.actionType == "PAUSE":
            self._is_paused = True
            self.state = "PAUSE"
            self._paused_position = dict(self.position)
        elif action.actionType == "RESUME":
            self._is_paused = False
            self.state = "MOVE"
            if self._paused_position:
                self.position = dict(self._paused_position)


    def _create_state(self, order: VDA5050Order) -> AGVState:
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
            operatingMode=self.state,
            actionStates=[],
        )
