

## Start influx db

```shell
python3.9 -m venv myenv

pip install -r .\requirements.txt
python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# 将 SECRET_KEY 替换为上一步生成的密钥

.\myenv\Scripts\activate
cd backend
python .\manage.py runserver
```


```
cd frontend
npm run dev