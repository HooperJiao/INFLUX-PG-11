import os
from datetime import datetime
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from dotenv import load_dotenv

# ✅ 从项目根目录加载 .env 文件
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# ✅ 获取环境变量
url = os.getenv("INFLUXDB_URL")
token = os.getenv("INFLUXDB_TOKEN")
org = os.getenv("INFLUXDB_ORG")
bucket = os.getenv("INFLUXDB_BUCKET")


# ✅ 初始化客户端并写入数据
client = InfluxDBClient(url=url, token=token, org=org)
point = Point("weather").tag("location", "adelaide").field("temperature", 26.6).time(datetime.now(datetime.UTC))
client.write_api(write_options=SYNCHRONOUS).write(bucket=bucket, org=org, record=point)

print("✅ 写入成功")