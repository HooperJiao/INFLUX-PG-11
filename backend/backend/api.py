from django.contrib.auth.models import User
from users.api import router as users_router
from influxdb.api import router as influxdb_router

from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)
api.add_router("/user/", users_router, auth=JWTAuth())
api.add_router("/influx/", influxdb_router, auth=JWTAuth())