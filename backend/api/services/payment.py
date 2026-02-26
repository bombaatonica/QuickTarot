import requests
from qrcode import make as generate_qr
from io import BytesIO
from base64 import b64encode
from datetime import datetime
from typing import Optional

class OasisPayService:
    def __init__(
        self,
        public_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        self.base_url = "https://app.oasyfy.com/api/v1"
        self.public_key = public_key
        self.secret_key = secret_key

    def _build_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.public_key:
            headers["X-Public-Key"] = self.public_key
        if self.secret_key:
            headers["X-Secret-Key"] = self.secret_key
        return headers

    def receive_pix(
        self,
        identifier: str,
        amount: float,
        client: dict,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Cria uma transação para receber Pix (OasisPay)."""
        url = f"{self.base_url}/gateway/pix/receive"

        payload = {
            "identifier": identifier,
            "amount": amount,
            "client": client,
        }
        if metadata is not None:
            payload["metadata"] = metadata

        response = requests.post(url, json=payload, headers=self._build_headers())
        response.raise_for_status()
        return response.json()

    def get_charge_status(self, charge_id: str) -> dict:
        """Mantido por compatibilidade (status via polling pode ser ajustado conforme doc de consultas)."""
        raise NotImplementedError("Status via polling não está configurado para o OasisPay")

    def generate_qr_code(self, payload: str) -> str:
        """Gera QR Code em base64"""
        qr = generate_qr(payload)
        buffered = BytesIO()
        qr.save(buffered, format="PNG")
        img_str = b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"