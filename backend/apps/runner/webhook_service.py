import time
import logging
import httpx
from typing import Dict, Any, Tuple
from .models import WebhookEvent

logger = logging.getLogger(__name__)

class WebhookService:
    @staticmethod
    def ingest_webhook(
        source: str,
        event: str,
        path: str,
        method: str,
        headers: Dict[str, str],
        payload: Any
    ) -> WebhookEvent:
        """Stores captured inbound webhook for developer inspection."""
        wh_id = f"wh-{int(time.time() * 1000)}"
        timestamp = time.strftime('%H:%M:%S')

        return WebhookEvent.objects.create(
            webhook_id=wh_id,
            source=source,
            event=event or 'event.custom',
            timestamp=timestamp,
            method=method,
            path=path,
            headers=headers,
            payload=payload,
            status_code=200,
            replayed_count=0
        )

    @staticmethod
    def replay_webhook(webhook_id: str, target_override_url: str = '') -> Tuple[bool, int, float, str]:
        """
        Replays a previously captured webhook payload to local dev services.
        """
        try:
            wh = WebhookEvent.objects.get(webhook_id=webhook_id)
        except WebhookEvent.DoesNotExist:
            return False, 404, 0.0, f"Webhook '{webhook_id}' not found."

        target_url = target_override_url or f"http://127.0.0.1:8000{wh.path}"

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.request(
                    method=wh.method,
                    url=target_url,
                    headers=wh.headers,
                    json=wh.payload
                )
                elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)

                wh.replayed_count += 1
                wh.save()
                return True, res.status_code, elapsed_ms, "Webhook replayed successfully."
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
            wh.replayed_count += 1
            wh.save()
            return False, 500, elapsed_ms, f"Replay failed: {str(e)}"
