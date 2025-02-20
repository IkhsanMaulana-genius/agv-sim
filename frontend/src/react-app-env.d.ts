/// <reference types="react-scripts" />
declare namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_MQTT_HOST: string;
      REACT_APP_MQTT_PORT: string;
      REACT_APP_MQTT_USERNAME: string;
      REACT_APP_MQTT_PASSWORD: string;
    }
  }