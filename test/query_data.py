import os
from influxdb_client import InfluxDBClient
from dotenv import load_dotenv

# ✅ 从项目根目录加载 .env 文件
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# ✅ 获取环境变量
url = os.getenv("INFLUXDB_URL")
token = os.getenv("INFLUXDB_TOKEN")
org = os.getenv("INFLUXDB_ORG")
bucket = os.getenv("INFLUXDB_BUCKET")

# ✅ 初始化查询客户端
client = InfluxDBClient(url=url, token=token, org=org)
query_api = client.query_api()

# ✅ 构造 Flux 查询语句
query = f'''
from(bucket: "{bucket}")
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == "weather")
'''

# ✅ 执行查询并输出结果
tables = query_api.query(query, org=org)

for table in tables:
    for record in table.records:
        print(f"🟢 时间：{record.get_time()}, 温度：{record.get_value()}，标签：{record.values.get('Location')}")