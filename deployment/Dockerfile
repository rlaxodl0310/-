FROM python:3.12-slim
WORKDIR /game
COPY prototype ./prototype
COPY docs/assets ./docs/assets
EXPOSE 8000
CMD ["python3", "prototype/server.py", "--host", "0.0.0.0", "--port", "8000"]
