import json
from django.http import HttpResponseBadRequest
from django.contrib.auth.models import User
import requests

from .models import UserDashboard


host = "http://localhost:3000"
datasource_name = "InfluxDB-m418"
headers = {
    'Content-type': 'application/json',
    'Authorization': 'Bearer glsa_q5V5U6avupwpr6mGVYQQ9hyNRH9kDu2u_22621679'
}

def try_get(model, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        return None

def get_url(url: str):
    try:
        response = requests.get(url, headers=headers)
        return response.json()
    except json.JSONDecodeError:
        print('Invalid JSON format')
    except KeyError:
        print('Invalid key')
    return None


def post_url(url: str, json):
    try:
        response = requests.post(url, headers=headers, json=json)
        return response.json()

    except json.JSONDecodeError:
        print('Invalid JSON format')
        return None
    except KeyError:
        print('Invalid key')
        return None


def get_dashboards() -> list:
    url = host + '/api/search?limit=1000'
    results = get_url(url)
    if results:
        results = list(filter(lambda d: d["type"] == "dash-db", results))
    return results

def get_dashboard(uid: str):
    url = host + f"/api/dashboards/uid/{uid}"
    result = get_url(url)
    if result:
        return result
    return None


def get_ds_uid() -> str:
    url = host + f"/api/datasources"
    result = get_url(url)
    if result:
        for source in result:
            if source['name'] == datasource_name:
                return source['uid']
    return None


def update_default_graph(sql: str, graph_type:str, start: str, end:str, config):

    version = board_version(config.default_dashboard_uid)
    if version is None:
        return HttpResponseBadRequest(
            json.dumps({"message": "Get graph from grafana failed: Not found default dashboard."})
        )

    base_config = {
        "dashboard": {
            "annotations": {
                "list": [
                    {
                    "builtIn": 1,
                    "datasource": {
                        "type": "grafana",
                        "uid": "-- Grafana --"
                    },
                    "enable": True,
                    "hide": True,
                    "iconColor": "rgba(0, 211, 255, 1)",
                    "name": "Annotations & Alerts",
                    "type": "dashboard"
                    }
                ]
            },
            "editable": True,
            "fiscalYearStartMonth": 0,
            "graphTooltip": 0,
            "id": config.default_dashboard_id,
            "links": [
                {
                    "asDropdown": True,
                    "icon": "external link",
                    "includeVars": True,
                    "keepTime": True,
                    "tags": [],
                    "targetBlank": True,
                    "title": "New link",
                    "tooltip": "",
                    "type": "dashboards",
                    "url": ""
                }
            ],
            "liveNow": True,
            "panels": [
                {
                    "datasource": {
                        "type": "influxdb",
                        "uid": config.datasource_uid
                    },
                    "targets": [{"query": sql}],
                    "title": "default",
                    "type": graph_type
                }
            ],
            "refresh": False,
            "schemaVersion": 38,
            "style": "dark",
            "tags": [],
            "templating": {
            "list": []
            },
            "time": {
                "from": start,
                "to": end
            },
            "timepicker": {},
            "timezone": "",
            "title": "default",
            "uid": config.default_dashboard_uid,
            "version": version,
            "weekStart": ""
        },
        "message": "",
        "overwrite": False,
        "folderUid": config.folder_uid
    }

    if graph_type == "piechart":
         base_config["dashboard"]["panels"][0] = {
            "datasource": {
                "type": "influxdb",
                "uid": config.datasource_uid
            },
            "targets": [{"query": sql}],
            "title": "default",
            "type": graph_type,
            "fieldConfig":{
                "defaults": {
                "color": {
                    "mode": "palette-classic"
                },
                "custom": {
                    "hideFrom": {
                    "legend": False,
                    "tooltip": False,
                    "viz": False
                    }
                },
                "mappings": []
                },
                "overrides": []
            },
            "gridPos": {
                "h": 10,
                "w": 8,
                "x": 0,
                "y": 0
            },
            "id": 1,
            "options": {
                "displayLabels": [
                    "percent"
                ],
                "legend": {
                "displayMode": "list",
                "placement": "right",
                "showLegend": True,
                "values": []
                },
                "pieType": "pie",
                "reduceOptions": {
                "calcs": [
                    "lastNotNull"
                ],
                "fields": "",
                "values": False
                },
                "tooltip": {
                "mode": "single",
                "sort": "none"
                }
            }
        }

    elif graph_type == "barchart":
        base_config["dashboard"]["panels"][0] = {
            "datasource": {
                "type": "influxdb",
                "uid": config.datasource_uid
            },
            "targets": [{"query": sql}],
            "title": "default",
            "type": graph_type,
            "fieldConfig": {
                "defaults": {
                "color": {
                    "mode": "palette-classic"
                },
                "custom": {
                    "axisCenteredZero": False,
                    "axisColorMode": "text",
                    "axisLabel": "",
                    "axisPlacement": "auto",
                    "fillOpacity": 80,
                    "gradientMode": "none",
                    "hideFrom": {
                    "legend": False,
                    "tooltip": False,
                    "viz": False
                    },
                    "lineWidth": 1,
                    "scaleDistribution": {
                    "type": "linear"
                    },
                    "thresholdsStyle": {
                    "mode": "off"
                    }
                },
                "mappings": [],
                "thresholds": {
                    "mode": "absolute",
                    "steps": [
                    {
                        "color": "green",
                        "value": None
                    },
                    {
                        "color": "red",
                        "value": 80
                    }
                    ]
                }
                },
                "overrides": []
            },
            "gridPos": {
                "h": 12,
                "w": 10,
                "x": 0,
                "y": 0
            },
            "id": 1,
            "options": {
                "barRadius": 0,
                "barWidth": 0.97,
                "fullHighlight": False,
                "groupWidth": 0.7,
                "legend": {
                "calcs": [],
                "displayMode": "list",
                "placement": "bottom",
                "showLegend": True
                },
                "orientation": "auto",
                "showValue": "auto",
                "stacking": "none",
                "tooltip": {
                "mode": "single",
                "sort": "none"
                },
                "xTickLabelRotation": 0,
                "xTickLabelSpacing": 0
            }
        }


    url = host + '/api/dashboards/db'
    return post_url(url, base_config)

def find_folder(name: str):
    url = host + f"/api/search?query={name}"
    results = get_url(url)
    if len(results) > 0:
        for folder in results:
            if folder['type'] == "dash-folder":
                return folder
    return None

def create_folder(name: str):
    return post_url(host + f"/api/folders", {"title": name})


def generate_dashboard(folder_uid: str, dashboard: str):

    url = host + f"/api/dashboards/db"
    data = {
        "dashboard": {
            "id": None,
            "uid": None,
            "title": dashboard,
            "tags": [ "templated" ],
            "timezone": "browser",
            "schemaVersion": 38,
            "refresh": "25s"
        },
        "folderUid": folder_uid,
        "message": "create dashboard",
        "overwrite": False
    }

    return post_url(url, data)


def read_2_dashboards(uid, name):
    default = None
    custom = None
    dashboards = get_dashboards()
    if dashboards is not None and len(dashboards) > 0:
        for item in dashboards:
            if item['title'] == 'default' and item['type'] == 'dash-db' and item['folderTitle'] == name:
                default = item
            if item['title'] == 'custom' and item['type'] == 'dash-db' and item['folderTitle'] == name:
                custom = item

    if default is None:
        default = generate_dashboard(uid, 'default')
    if custom is None:
        custom = generate_dashboard(uid, 'custom')
    
    return default, custom


def prepare(user: User):
    """
    Create and initialize Grafana dashboards and folders for the given user.

    Args:
        user (User): The user to create dashboards and folders for.

    Returns:
        A UserDashboard object representing the user's dashboards and folders.
    """

    # Find or create the user's folder.
    folder_name = f"user_{user.id}"
    folder = find_folder(folder_name)
    if folder is None or 'message' in folder:
        folder = create_folder(folder_name)
    if folder is None:
        return None

    # Find or create the user's default and custom dashboards.
    default, custom = read_2_dashboards(folder['uid'], folder_name)
    
    datasource_uid = get_ds_uid()
    if datasource_uid is None:
        return HttpResponseBadRequest(json.dumps({"message": "Not found datasource uid."}))

    config = UserDashboard.objects.create(
        user=user,
        folder_uid=folder['uid'],
        custom_dashboard_id=custom['id'],
        custom_dashboard_uid=custom['uid'],
        default_dashboard_id=default['id'],
        default_dashboard_uid=default['uid'],
        datasource_uid=datasource_uid
    )
    return config

def board_version(uid: str):
    default_meta = get_dashboard(uid)
    if default_meta is None or "meta" not in default_meta:
        return None
    return default_meta['meta']['version']

def create_graph(sql: str, title: str, start: str, end:str, config):
    # 1. Read version
    custom = get_dashboard(config.custom_dashboard_uid)
    if custom is None:
        return HttpResponseBadRequest(json.dumps({"message": "Get sql graph failed: not found custom dashboard meta."}))
    
    # 2. Read current panel num
    dashboard = custom['dashboard']

    if 'panels' in dashboard:
        panels = dashboard['panels']
    else:
        panels = []
    panel_num = len(panels)
    panels.append({
        "datasource": {
            "type": "influxdb",
            "uid": config.datasource_uid
        },
        "targets": [{"query": sql}],
        "title": title,
        "type": "timeseries"
    })
    dashboard['panels'] = panels

    data = {
        "dashboard": dashboard,
        "message": "",
        "overwrite": False,
        "folderUid": config.folder_uid
    }
    url = host + '/api/dashboards/db'
    try:
        response = requests.post(url, headers=headers, json=data)
        return panel_num+1

    except json.JSONDecodeError:
        print('Invalid JSON format')
        return None
    except KeyError:
        print('Invalid key')
        return None


def delete_graph(dashboard_index: int, config):
    # 1. Read version
    custom = get_dashboard(config.custom_dashboard_uid)
    if custom is None:
        return None
    
    # 2. Read current panel num
    dashboard = custom['dashboard']
    print(dashboard)

    if 'panels' in dashboard:
        panels = dashboard['panels']
    else:
        return None
    del panels[dashboard_index-1]
    dashboard['panels'] = panels
    data = {
        "dashboard": dashboard,
        "message": "",
        "overwrite": False,
        "folderUid": config.folder_uid
    }
    url = host + '/api/dashboards/db'
    try:
        response = requests.post(url, headers=headers, json=data)
        return True

    except json.JSONDecodeError:
        print('Invalid JSON format')
        return None
    except KeyError:
        print('Invalid key')
        return None


