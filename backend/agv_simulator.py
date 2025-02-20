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
    operatingMode: Literal["AUTOMATIC", "MANUAL", "SERVICE"]
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


class AGVSimulator:
    def __init__(self):
        self.position = {"x": 0.0, "y": 0.0}
        self.battery = 100.0
        self.state: Literal["IDLE", "MOVING", "PAUSED"] = "IDLE"
        self.current_order: Optional[VDA5050Order] = None
        self.speed = 0.3  # units per second
        self._is_paused = False
        self._is_stopped = False
        self._current_target: Optional[tuple[float, float]] = None

    async def process_order(self, order: VDA5050Order) -> AsyncGenerator[AGVState, None]:
        """Process an order and yield state updates in real time."""
        self.current_order = order
        self.state = "MOVING"
        self._is_stopped = False
        self._is_paused = False  # Ensure pause state is reset when a new order starts

        yield self._get_state(order)  # Initial state update

        for node in order.nodes:
            if self._is_stopped:
                break  # Stop processing if AGV is stopped

            self._current_target = (node.x, node.y)  # Set the current target

            while not self._is_stopped:
                # Handle pause state
                if self._is_paused:
                    self.state = "PAUSED"
                    yield self._get_state(order)  # Yield state updates while paused
                    await asyncio.sleep(0.1)  # Yield control back to the event loop
                    continue  # Skip the rest of the loop while paused

                if not self._move_towards(self._current_target):
                    break  # Move to the next node if target is reached

                self.battery = max(0, self.battery - 0.01)
                yield self._get_state(order)  # Yield state updates

        if not self._is_stopped:
            self.state = "IDLE"
            yield self._get_state(order)  # Final update when movement is complete    

    def _move_towards(self, target: tuple[float, float]) -> bool:
        """Move AGV step-by-step towards the target."""
        dx = target[0] - self.position["x"]
        dy = target[1] - self.position["y"]
        distance = (dx**2 + dy**2)**0.5  # Calculate distance to the target

        if distance < 0.1:
            return False  # Target reached

        # Move incrementally toward the target
        self.position["x"] += dx / distance * 0.1
        self.position["y"] += dy / distance * 0.1
        return True

    def process_instant_action(self, action: InstantAction):
        """Process actions to pause, resume, or stop the AGV."""
        if action.actionType == "PAUSE":
            print("pause-----------------------")
            self._is_paused = True
            self.state = "PAUSED"
        elif action.actionType == "RESUME":
            self._is_paused = False
            self.state = "MOVING"
        elif action.actionType == "STOP":
            self._is_stopped = True
            self._is_paused = False
            self.state = "IDLE"
            self.position = {"x": 0.0, "y": 0.0}  # Reset position when stopped
            self._current_target = None  # Clear current target

    def _get_state(self, order: VDA5050Order) -> AGVState:
        """Generate a VDA5050-compliant AGV state."""
        return AGVState(
            headerId=1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            orderId=order.orderId,
            orderUpdateId=order.orderUpdateId,
            lastNodeId="N1",  # Replace with actual last node ID
            lastNodeSequenceId=1,
            driving=self.state == "MOVING",
            position={"x": self.position["x"], "y": self.position["y"], "theta": 0.0},
            batteryState={"batteryCharge": self.battery, "charging": False},
            operatingMode="AUTOMATIC",
            actionStates=[],
        )