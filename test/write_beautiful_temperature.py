from influxdb_client import InfluxDBClient, Point, WritePrecision
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

# ✅ 从项目根目录加载 .env 文件
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# ✅ 获取环境变量
url = os.getenv("INFLUXDB_URL")
token = os.getenv("INFLUXDB_TOKEN")
org = os.getenv("INFLUXDB_ORG")
bucket = os.getenv("INFLUXDB_BUCKET")

# ✅ 连接客户端
client = InfluxDBClient(url=url, token=token, org=org)
from influxdb_client.client.write_api import SYNCHRONOUS
write_api = client.write_api(write_options=SYNCHRONOUS)

# ✅ 构造写入点 - 过去1小时，每5分钟1个点，共12个
base_time = datetime.utcnow() - timedelta(hours=1)
temperature_base = 19.0  # 起始温度

for i in range(12):
    timestamp = base_time + timedelta(minutes=i*5)
    temperature = temperature_base + random.uniform(-1.5, 1.5)  # 轻微波动
    point = (
        Point("weather")
        .tag("location", "adelaide")
        .field("temperature", round(temperature, 2))
        .time(timestamp, WritePrecision.NS)
    )
    print(f"Writing data point: time={timestamp}, temperature={temperature:.2f}°C")
    write_api.write(bucket=bucket, org=org, record=point)

print("✅ All data points written successfully.")
client.close()