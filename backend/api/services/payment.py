import requests
from qrcode import make as generate_qr
from io import BytesIO
from base64 import b64encode
from datetime import datetime

class OasyfyService:
    def __init__(self, api_key: str, base_url: str = "https://api.oasyfy.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def create_pix_charge(self, amount: float, description: str) -> dict:
        """Cria uma cobrança Pix"""
        url = f"{self.base_url}/v1/pix/charges"
        payload = {
            "amount": amount,
            "description": description,
            "currency": "BRL",
            "payment_type": "PIX"
        }
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_charge_status(self, charge_id: str) -> dict:
        """Verifica status da cobrança"""
        url = f"{self.base_url}/v1/pix/charges/{charge_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def generate_qr_code(self, payload: str) -> str:
        """Gera QR Code em base64"""
        qr = generate_qr(payload)
        buffered = BytesIO()
        qr.save(buffered, format="PNG")
        img_str = b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"