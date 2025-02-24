export type NodePosition = {
  nodeId: string;
  x: number;
  y: number;
};

export type VDA5050Order = {
  headerId: number;
  timestamp: string;
  version: string;
  manufacturer: string;
  serialNumber: string;
  orderId: string;
  orderUpdateId: number;
  nodes: NodePosition[];
};

export type AGVState = {
  headerId: number;
  timestamp: string;
  version: string;
  manufacturer: string;
  serialNumber: string;
  orderId: string;
  orderUpdateId: number;
  lastNodeId: string;
  lastNodeSequenceId: number;
  driving: boolean;
  position: { x: number; y: number; theta: number };
  batteryState: { batteryCharge: number; charging: boolean };
  operatingMode: 'AUTOMATIC' | 'MANUAL' | 'SERVICE' | 'STOPPED';
  actionStates: any[];
};

export type InstantAction = {
  headerId: number;
  timestamp: string;
  version: string;
  manufacturer: string;
  serialNumber: string;
  actionId: string;
  actionType: 'PAUSE' | 'RESUME' | 'STOP';
};

export enum ActionType {
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  STOP = 'STOP',
}
