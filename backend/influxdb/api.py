from datetime import datetime
import json
from ninja import Router, Schema
from django.contrib import auth
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django import forms
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest, StreamingHttpResponse
from django.shortcuts import get_list_or_404, get_object_or_404

from django.contrib.auth.models import User
from ninja import ModelSchema
from typing import List
import stat
import influxdb_client, os, time
from .models import Graph, UserDashboard

import pandas as pd
from .utils import try_get, prepare, delete_graph, update_default_graph, create_graph

router = Router()

url = "http://localhost:8086"
# token = '1VuKVunyaVg4bFFRfRbpE5C5LwD8sclg3UMBUROWwLHG2-BHkIL7YYjQVQVF8yFgTmzM7f9Hnd_iuqiSdEwFtQ=='
# org = "University of Adelaide"

@router.get('/bucket')
def get_buckets(request):
    """
    Get a list of all user buckets.

    Returns:
        A list of bucket names.
    """
    influx_token = request.headers.get('Influxtoken')
    influx_org = request.headers.get('Influxorg')
    if influx_token is None or influx_org is None:
        return HttpResponse("InfluxToken or InfluxOrg not found in request headers.", status=400)
    

    print(influx_token, influx_org)

    influx = influxdb_client.InfluxDBClient(url=url, token=influx_token, org=influx_org)

    buckets = influx.buckets_api().find_buckets().buckets
    results = []
    for bucket in buckets:
        if bucket.type == 'user':
            results.append(bucket.name)
    return results

@router.get('/measurement')
def get_measurements(request, bucket: str):
    """
    Get a list of all measurements in a bucket.

    Args:
        bucket (str): The name of the bucket to query.

    Returns:
        A list of measurement names.
    """
    influx_token = request.headers.get('InfluxToken')
    influx_org = request.headers.get('InfluxOrg')
    if influx_token is None or influx_org is None:
        return HttpResponse("InfluxToken or InfluxOrg not found in request headers.", status=400)
    
    influx = influxdb_client.InfluxDBClient(url=url, token=influx_token, org=influx_org)

    results = []
    query = f"""import \"regexp\"
        from(bucket: \"{bucket}\")
        |> range(start: -100y)
        |> filter(fn: (r) => true)
        |> keep(columns: [\"_measurement\"])
        |> group()
        |> distinct(column: \"_measurement\")
        |> sort()"""
    tables = influx.query_api().query(query)
    for table in tables:
        for record in table.records:
            results.append(record.values['_value'])
    return results

@router.get('/field')
def get_fields(request, bucket: str, measurement: str):
    """
    Get a list of all fields in a measurement.

    Args:
        bucket (str): The name of the bucket to query.
        measurement (str): The name of the measurement to query.

    Returns:
        A list of field names.
    """
    influx_token = request.headers.get('InfluxToken')
    influx_org = request.headers.get('InfluxOrg')
    if influx_token is None or influx_org is None:
        return HttpResponse("InfluxToken or InfluxOrg not found in request headers.", status=400)
    
    influx = influxdb_client.InfluxDBClient(url=url, token=influx_token, org=influx_org)

    result = []
    query = f"""import \"regexp\"
        from(bucket: \"{bucket}\")
        |> range(start: -100y)
        |> filter(fn: (r) => (r[\"_measurement\"] == \"{measurement}\"))
        |> keep(columns: [\"_field\"])
        |> group()
        |> distinct(column: \"_field\")
        |> sort()"""
    tables = influx.query_api().query(query)
    for table in tables:
        for column in table.columns:
            result.append({
                'bucket': bucket,
                'measurement': measurement,
                'data_type': column.data_type,
                'name': ''
            })
        for index in range(len(table.records)):
            result[index]['name'] = table.records[index]['_value']
    return result


def read_row(record) -> dict:
    """
    Convert a Flux record to a dictionary.

    Args:
        record (influxdb.ResultRow): The Flux record to convert.

    Returns:
        A dictionary representing the Flux record.
    """
    keys = ['_measurement','_field','_value','_start','_stop','_time']
    row = {}
    for key in keys:
        row[key] = str(record[key])
    return row


@router.get('/query')
def get_table_data(request, sql: str):
    """
    Execute a Flux query and return the results as a list of dictionaries.

    Args:
        sql (str): The Flux query to execute.

    Returns:
        A list of dictionaries, each representing a row in the query results.
    """
    result = []
    influx_token = request.headers.get('InfluxToken')
    influx_org = request.headers.get('InfluxOrg')
    if influx_token is None or influx_org is None:
        return HttpResponse("InfluxToken or InfluxOrg not found in request headers.", status=400)
    
    influx = influxdb_client.InfluxDBClient(url=url, token=influx_token, org=influx_org)
    
    tables = influx.query_api().query(sql)
    for table in tables:
        for record in table.records:
            result.append(read_row(record))

            # Most return 100 lines.
            if len(result) > 100:
              return result
    return result


def package_table(request, sql: str) -> pd.DataFrame:
    """
    Execute a Flux query and return the results as a Pandas DataFrame.

    Args:
        sql (str): The Flux query to execute.

    Returns:
        A Pandas DataFrame representing the query results.
    """
    influx_token = request.headers.get('InfluxToken')
    influx_org = request.headers.get('InfluxOrg')
    if influx_token is None or influx_org is None:
        return HttpResponse("InfluxToken or InfluxOrg not found in request headers.", status=400)
    
    influx = influxdb_client.InfluxDBClient(url=url, token=influx_token, org=influx_org)

    result = []
    tables = influx.query_api().query(sql)
    for table in tables:
        for record in table.records:
            result.append(list(read_row(record).values()))
    columns = ["Measurement","Field","Value","Start","Stop","Time"]
    return pd.DataFrame(result, columns=columns)


def write_excel(df):
    """
    Write a Pandas DataFrame to an Excel file.

    Args:
        df (pd.DataFrame): The DataFrame to write to an Excel file.
    """
    # Create folder
    filename = "influx-" + datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    filepath = os.path.join(os.getcwd(), 'upload', 'export', f"{filename}.xlsx")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    os.chmod(os.path.dirname(filepath), 777)

    # Write data file
    with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
        df.to_excel(writer)

    return filepath, filename

def write_csv(df):
    """
    Write a Pandas DataFrame to an Excel file.

    Args:
        df (pd.DataFrame): The DataFrame to write to an Excel file.
    """
    # Create folder
    filename = "influx-" + datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    filepath = os.path.join(os.getcwd(), 'upload', 'export', f"{filename}.xlsx")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    os.chmod(os.path.dirname(filepath), 777)

    # Write data file
    df.to_csv(filepath, index=False)

    return filepath, filename

def write_txt(df):
    """
    Write a Pandas DataFrame to an Excel file.

    Args:
        df (pd.DataFrame): The DataFrame to write to an Excel file.
    """
    # Create folder
    filename = "influx-" + datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    filepath = os.path.join(os.getcwd(), 'upload', 'export', f"{filename}.xlsx")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    os.chmod(os.path.dirname(filepath), 777)

    # Write data file
    with open(filepath, 'w') as f:
        df_string = df.to_string(index=False)
        f.write(df_string)

    return filepath, filename

def read_file_block(filepath):
    """
    Read a file in blocks of 512 bytes.

    Args:
        filepath (str): The path to the file to read.

    Yields:
        bytes: A block of 512 bytes from the file.
    """
    with open(filepath, 'rb') as file:
        while True:
            block = file.read(512)
            if block:
                yield block
            else:
                break
    # remove local file
    os.remove(filepath)

@router.get('/download/excel')
def export_excel(request, sql: str):
    """
    Export the results of a Flux query to an Excel file and return the file as a response.

    Args:
        sql (str): The Flux query to execute.

    Returns:
        A StreamingHttpResponse object containing the Excel file.
    """

    # Package table
    df = package_table(request, sql)

    # Write excel to local
    filepath, filename = write_excel(df)

    # return the excel data as response
    response = StreamingHttpResponse(read_file_block(filepath))
    response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    response['Content-Disposition'] = f"attachment;filename=\"{filename}.xlsx\""
    return response

@router.get('/download/csv')
def export_csv(request, sql: str):
    """
    Export the results of a Flux query to an Excel file and return the file as a response.

    Args:
        sql (str): The Flux query to execute.

    Returns:
        A StreamingHttpResponse object containing the Excel file.
    """

    # Package table
    df = package_table(request, sql)

    # Write excel to local
    filepath, filename = write_csv(df)

    # return the excel data as response
    response = StreamingHttpResponse(read_file_block(filepath))
    response['Content-Type'] = 'text/csv'
    response['Content-Disposition'] = f"attachment;filename=\"{filename}.csv\""
    return response


@router.get('/download/txt')
def export_txt(request, sql: str):
    """
    Export the results of a Flux query to an Excel file and return the file as a response.

    Args:
        sql (str): The Flux query to execute.

    Returns:
        A StreamingHttpResponse object containing the Excel file.
    """

    # Package table
    df = package_table(request, sql)

    # Write excel to local
    filepath, filename = write_txt(df)

    # return the excel data as response
    response = StreamingHttpResponse(read_file_block(filepath))
    response['Content-Type'] = 'text/plain'
    response['Content-Disposition'] = f"attachment;filename=\"{filename}.txt\""
    return response

@router.get('/query/graph')
def get_graph_from_grafana(request, sql: str, graph_type: str, start: str = "now-5y", end: str = "now"):
    """
    Get a graph from Grafana based on a Flux query.

    Args:
        sql (str): The Flux query to execute.
        graph_type (str): The type of graph to create.
        start (str, optional): The start time of the graph. Defaults to "now-5y".
        end (str, optional): The end time of the graph. Defaults to "now".

    Returns:
        A URL to the Grafana graph.
    """

    # 1. Read config
    config = try_get(UserDashboard, user=request.user)
    if config is None:
        config = prepare(request.user)

    result = []
    # 2. Update the dashboard graph
    result = update_default_graph(sql, graph_type, start, end, config)
    if not result:
        return HttpResponseBadRequest(json.dumps({"message": "Get SQL graph from grafana failed."}))

    # 3. Return the new url
    return f"http://localhost:3000/d-solo/{config.default_dashboard_uid}/default?panelId=1"


class GraphConfig(Schema):
    title: str
    query: str
    range_start: str
    range_end: str
    limit: int

@router.post('/graph')
def save_graph_in_grafana(request, payload: GraphConfig):
    # Read config
    config = try_get(UserDashboard, user=request.user)
    if config is None:
        config = prepare(request.user)

    # Update graph
    panel_index = create_graph(payload.query, payload.title, payload.range_start, payload.range_end, config)
    if not panel_index:
        return HttpResponseBadRequest(json.dumps({"message": "Create graph to grafana failed."}))
    Graph.objects.create(
        user=request.user,
        dashboard_index=panel_index,
        title=payload.title,
        query=payload.query,
        range_start=payload.range_start,
        range_end=payload.range_end,
        limit=payload.limit
    )

    url = f"http://localhost:3000/d-solo/{config.custom_dashboard_uid}/default?panelId={panel_index}"
    return url

@router.get('/graph')
def get_graphs(request):
    # read config
    config = try_get(UserDashboard, user=request.user)
    if config is None:
        config = prepare(request.user)

    # read panels
    panels = get_list_or_404(Graph, user=request.user)

    # return the panels
    results = []
    for panel in panels:
        results.append({
            'id': panel.id,
            'title': panel.title,
            'dashboard_index': panel.dashboard_index,
            'query': panel.query,
            'range_start': panel.range_start,
            'range_end': panel.range_end,
            'limit': panel.limit,
            'created_at': panel.created_at,
            'url': f"http://localhost:3000/d-solo/{config.custom_dashboard_uid}/default?panelId={panel.dashboard_index}"
        })
    return results


@router.delete('/graph')
def remove_graph(request, id: int):
    config = try_get(UserDashboard, user=request.user)
    if config is None:
        config = prepare(request.user)

    panel = try_get(Graph, user=request.user, id=id)
    if panel is not None:
        dashboard_index = panel.dashboard_index
        delete_graph(dashboard_index, config)
        panel.delete()

        graphs = Graph.objects.filter(user=request.user,dashboard_index__gt=dashboard_index)
        for graph in graphs:
            graph.dashboard_index -= 1
            graph.save()

    return {"message": "Remove graph success!"}