FROM python:3.11-alpine

LABEL description="fadeup-backend"

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh && adduser -D -u 1000 appuser && chown -R appuser:appuser /usr/src/app
USER appuser

ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
