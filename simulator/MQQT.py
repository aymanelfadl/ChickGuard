import ssl
import paho.mqtt.client as mqtt

MQTT_HOST = "81f59d91884b46bd8222524e21e28932.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "aelfadl"
MQTT_PASSWORD = "Aelfadl2003."

TOPIC = "poultry/+/+/readings"

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("MQTT connected:", reason_code)
    client.subscribe(TOPIC, qos=1)
    print("Subscribed to:", TOPIC)

def on_message(client, userdata, msg):
    print("Received topic:", msg.topic)
    print("Payload:", msg.payload.decode("utf-8"))

def on_disconnect(client, userdata, reason_code, properties=None):
    print("MQTT disconnected:", reason_code)

client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    client_id="backend-test-subscriber-01"
)

client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

client.tls_set(
    cert_reqs=ssl.CERT_REQUIRED,
    tls_version=ssl.PROTOCOL_TLS_CLIENT
)

client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

print("Connecting to HiveMQ...")
client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)

client.loop_forever()