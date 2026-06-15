#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <time.h>
#include "DHTesp.h"

#define DHT_PIN 15
#define PIR_PIN 14
#define LED_PIN 2

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Use HiveMQ Cloud for Wokwi, or change these to a reachable local Mosquitto
// broker if the ESP32 runs on the same network as the backend.
const char* MQTT_HOST = "81f59d91884b46bd8222524e21e28932.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "aelfadl";
const char* MQTT_PASSWORD = "CHANGE_ME";

// These values must match the backend device registry exactly.
const char* DEVICE_ID = "esp32-wokwi-01";
const char* DEVICE_API_KEY = "CHANGE_ME_DEVICE_API_KEY";
const char* FARM_ID = "farm-01";
const char* COOP_ID = "coop-01";
const char* DEVICE_TYPE = "esp32";
const char* FIRMWARE_VERSION = "wokwi-1.0.0";

WiFiClientSecure wifiClient;
PubSubClient mqtt(wifiClient);
DHTesp dhtSensor;
char mqttTopic[128];

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL_MS = 5000;
unsigned long messageCounter = 0;

void connectWiFi() {
  Serial.print("Connecting to WiFi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");

  struct tm timeinfo;
  unsigned long startedAt = millis();
  while (!getLocalTime(&timeinfo) && millis() - startedAt < 10000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  if (getLocalTime(&timeinfo)) {
    Serial.println("Time synced");
  } else {
    Serial.println("Time sync failed, using fallback timestamp");
  }
}

void connectMQTT() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);

  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT broker... ");

    bool connected = mqtt.connect(
      DEVICE_ID,
      MQTT_USER,
      MQTT_PASSWORD
    );

    if (connected) {
      Serial.println("connected");
    } else {
      Serial.print("failed, mqtt state=");
      Serial.println(mqtt.state());
      delay(3000);
    }
  }
}

void utcTimestamp(char* buffer, size_t bufferSize) {
  struct tm timeinfo;

  if (getLocalTime(&timeinfo)) {
    strftime(buffer, bufferSize, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return;
  }

  snprintf(buffer, bufferSize, "2026-05-17T12:00:00Z");
}

void publishReading() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();

  if (isnan(data.temperature) || isnan(data.humidity)) {
    Serial.println("DHT22 read failed");
    return;
  }

  int motion = digitalRead(PIR_PIN);
  digitalWrite(LED_PIN, motion == HIGH ? HIGH : LOW);

  messageCounter++;

  time_t now;
  time(&now);

  char messageId[80];
  snprintf(
    messageId,
    sizeof(messageId),
    "%s-%ld-%lu",
    DEVICE_ID,
    now,
    messageCounter
  );

  char timestamp[32];
  utcTimestamp(timestamp, sizeof(timestamp));

  long wifiRssi = WiFi.RSSI();

  char payload[900];
  snprintf(
    payload,
    sizeof(payload),
    "{"
      "\"schema_version\":\"1.0\","
      "\"message_id\":\"%s\","
      "\"device\":{"
        "\"device_id\":\"%s\","
        "\"device_type\":\"%s\","
        "\"firmware_version\":\"%s\""
      "},"
      "\"location\":{"
        "\"farm_id\":\"%s\","
        "\"coop_id\":\"%s\""
      "},"
      "\"timestamp\":\"%s\","
      "\"data\":{"
        "\"temperature_c\":%.2f,"
        "\"humidity_percent\":%.2f,"
        "\"motion\":%d"
      "},"
      "\"metadata\":{"
        "\"wifi_rssi\":%ld,"
        "\"source\":\"wokwi-esp32\","
        "\"api_key\":\"%s\""
      "}"
    "}",
    messageId,
    DEVICE_ID,
    DEVICE_TYPE,
    FIRMWARE_VERSION,
    FARM_ID,
    COOP_ID,
    timestamp,
    data.temperature,
    data.humidity,
    motion,
    wifiRssi,
    DEVICE_API_KEY
  );

  bool ok = mqtt.publish(mqttTopic, payload, false);

  if (ok) {
    Serial.print("Published: ");
    Serial.println(payload);
  } else {
    Serial.println("Publish failed");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);

  snprintf(mqttTopic, sizeof(mqttTopic), "poultry/%s/%s/readings", FARM_ID, COOP_ID);

  connectWiFi();
  syncTime();

  // Demo only. For production, install the broker CA certificate instead.
  wifiClient.setInsecure();

  connectMQTT();
}

void loop() {
  if (!mqtt.connected()) {
    connectMQTT();
  }

  mqtt.loop();

  if (millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = millis();
    publishReading();
  }
}
