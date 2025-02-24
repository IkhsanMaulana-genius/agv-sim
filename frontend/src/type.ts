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

export type Visualization = {
  headerId: number;
  timestamp: string;
  agvPosition: {
    x: number;
    y: number;
    orientation: number;
  };
  customData: Record<string, any>;
};

export type Factsheet = {
  headerId: number;
  timestamp: string;
  model: string;
  protocol: string;
  capabilities: string[];
  maxSpeed: number;
  maxRotationSpeed: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
};

export type ErrorMessage = {
  headerId: number;
  timestamp: string;
  errorType: 'PROTOCOL' | 'HARDWARE' | 'SOFTWARE';
  errorLevel: 'WARNING' | 'FATAL';
  errorDescription: string;
  errorCode: number;
};