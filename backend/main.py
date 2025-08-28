import os
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import influxdb_client
from influxdb_client.client.exceptions import InfluxDBError
import requests

import secrets, base64

# 生成 32 字节，并输出为 URL-safe base64 或 hex
key_bytes = secrets.token_bytes(32)
secret_b64 = base64.urlsafe_b64encode(key_bytes).decode()
secret_hex = key_bytes.hex()

print("base64:", secret_b64)
print("hex:", secret_hex)


# 配置 通过环境变量配置

INFLUX_URL = os.getenv("INFLUX_URL", "http://localhost:8086")
INFLUX_ORG = os.getenv("INFLUX_ORG", "Groupwork")
GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000")

# GRAFANA_API_TOKEN = os.getenv("", "") # This is the location for API token, but there is a security issue

SECRET_KEY = os.getenv("SECRET_KEY", "secret_b64")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# 允许在未登录状态下用 DEV_INFLUX_TOKEN 直接查询（仅开发时开启）
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
DEV_INFLUX_TOKEN = os.getenv("DEV_INFLUX_TOKEN", "")

app = FastAPI(title="Influx No-Code Backend")

# 允许前端跨域（在开发阶段允许全部来源，生产请缩小范围）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发时方便，生产替换为具体 origin 列表
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 把 frontend 目录挂载为静态资源，以便访问 index.html
# 要求项目结构： project/
#    backend/main.py
#    frontend/index.html
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


# Pydantic 模型
class LoginData(BaseModel):
    token: str

class FilterItem(BaseModel):
    field: str
    operator: str
    value: str

class QueryRequest(BaseModel):
    bucket: str
    measurement: str
    fields: List[str]
    start: Optional[str] = None
    stop: Optional[str] = None
    filters: List[FilterItem] = []


# JWT 辅助
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 认证依赖 从请求头解析 JWT，或在 DEV_MODE 下使用 DEV_INFLUX_TOKEN

def get_influx_token_from_request(request: Request) -> str:
    """
    返回实际用于连接 InfluxDB 的 token。
    优先：Authorization: Bearer <jwt> (JWT 的 sub 域保存 influx token)
    如果没有 Authorization 且 DEV_MODE=True，则返回 DEV_INFLUX_TOKEN（用于开发测试）
    """
    auth = request.headers.get("authorization")
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            jwt_token = parts[1]
            try:
                payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
                influx_token = payload.get("sub")
                if not influx_token:
                    raise HTTPException(status_code=401, detail="Invalid token payload")
                return influx_token
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Token expired")
            except jwt.PyJWTError:
                raise HTTPException(status_code=401, detail="Invalid token")
    # 没有 Authorization header
    if DEV_MODE and DEV_INFLUX_TOKEN:
        return DEV_INFLUX_TOKEN
    raise HTTPException(status_code=401, detail="Not authenticated (provide Bearer JWT)")


# 路由：登录 -> 验证 Influx token 并返回 JWT

@app.post("/api/login")
def login(data: LoginData):
    token = data.token
    # 验证 token 是否能访问 Influx（简单 ping 或列 buckets）
    try:
        client = influxdb_client.InfluxDBClient(url=INFLUX_URL, token=token, org=INFLUX_ORG)
        if not client.ping():
            raise HTTPException(status_code=401, detail="Invalid InfluxDB token (ping failed)")
    except InfluxDBError as e:
        raise HTTPException(status_code=401, detail=f"Invalid InfluxDB token: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Influx connection error: {e}")

    access_token = create_access_token(data={"sub": token}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}



# 路由：查询构建 -> 生成 Flux -> 执行并返回 JSON

@app.post("/api/query")
def query(request_body: QueryRequest, request: Request):
    influx_token = get_influx_token_from_request(request)

    # 生成 Flux（根据 request_body）
    flux_lines = []
    flux_lines.append(f'from(bucket: "{request_body.bucket}")')
    if request_body.start:
        stop = request_body.stop or "now()"
        # 前端可能传入 ISO 格式或 datetime-local, 把它包装为字符串
        flux_lines.append(f'  |> range(start: {json_str(request_body.start)}, stop: {json_str(stop)})')
    else:
        flux_lines.append('  |> range(start: -1h)')  # 默认过去1小时
    if request_body.measurement:
        flux_lines.append(f'  |> filter(fn: (r) => r._measurement == "{request_body.measurement}")')
    for f in request_body.fields:
        flux_lines.append(f'  |> filter(fn: (r) => r._field == "{f}")')
    for flt in request_body.filters:
        # 简单处理：所有值按字符串处理；更复杂可检测数字/布尔
        flux_lines.append(f'  |> filter(fn: (r) => r["{flt.field}"] {flt.operator} {json_str(flt.value)})')

    flux = "\n".join(flux_lines) + "\n"

    # 执行查询
    client = influxdb_client.InfluxDBClient(url=INFLUX_URL, token=influx_token, org=INFLUX_ORG)
    query_api = client.query_api()
    try:
        tables = query_api.query(org=INFLUX_ORG, query=flux)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"InfluxDB query failed: {e}")

    results = []
    for table in tables:
        for record in table.records:
            results.append({
                "time": record.get_time().isoformat() if record.get_time() else None,
                "field": record.get_field(),
                "value": record.get_value()
            })

    return {"flux": flux, "results": results}


# 接口（用于前端下拉填充）

@app.get("/api/buckets")
def list_buckets(request: Request):
    influx_token = get_influx_token_from_request(request)
    client = influxdb_client.InfluxDBClient(url=INFLUX_URL, token=influx_token, org=INFLUX_ORG)
    try:
        buckets = client.buckets_api().find_buckets().buckets
        names = [b.name for b in buckets]
    except Exception:
        names = []
    return names

@app.get("/api/measurements")
def list_measurements(bucket: str, request: Request):
    influx_token = get_influx_token_from_request(request)
    client = influxdb_client.InfluxDBClient(url=INFLUX_URL, token=influx_token, org=INFLUX_ORG)
    query_api = client.query_api()
    flux = f'from(bucket: "{bucket}") |> range(start: -1h) |> keep(columns: ["_measurement"]) |> group() |> distinct(column: "_measurement")'
    try:
        tables = query_api.query(org=INFLUX_ORG, query=flux)
        measurements = set()
        for table in tables:
            for rec in table.records:
                measurements.add(rec.get_value())
        return list(measurements)
    except Exception:
        return []

@app.get("/api/fields")
def list_fields(bucket: str, measurement: str, request: Request):
    influx_token = get_influx_token_from_request(request)
    client = influxdb_client.InfluxDBClient(url=INFLUX_URL, token=influx_token, org=INFLUX_ORG)
    query_api = client.query_api()
    flux = f'from(bucket: "{bucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "{measurement}") |> keep(columns: ["_field"]) |> distinct(column: "_field")'
    try:
        tables = query_api.query(org=INFLUX_ORG, query=flux)
        fields = set()
        for table in tables:
            for rec in table.records:
                fields.add(rec.get_value())
        return list(fields)
    except Exception:
        return []


# Grafana 示例 创建/更新 dashboard

@app.post("/api/grafana/dashboard")
def create_grafana_dashboard(dashboard: dict):
    if not GRAFANA_API_TOKEN:
        raise HTTPException(status_code=500, detail="Grafana API token not configured")
    url = f"{GRAFANA_URL.rstrip('/')}/api/dashboards/db"
    headers = {"Authorization": f"Bearer {GRAFANA_API_TOKEN}", "Content-Type": "application/json"}
    payload = {"dashboard": dashboard, "overwrite": True}
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=f"Grafana API error: {resp.text}")
    return resp.json()


# 工具
def json_str(s: Optional[str]) -> str:
    if s is None:
        return 'null'
    # 如果 s 看起来像 now() 或 Flux 表达式，直接返回；否则转义为字符串
    s = s.strip()
    if s.lower() == "now()" or s.startswith("duration("):
        return s
    # 如果 ISO 时间，包成 string
    return f'"{s}"'


# 错误处理
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
