import hashlib
import os
import time

from aiohttp import ClientRequest, ClientSession
from multidict import CIMultiDict
from yarl import URL

OVH_API_BASE_URL = "https://eu.api.ovh.com/1.0"


class OVHRequest(ClientRequest):
    OVH_APPLICATION_KEY = os.getenv("OVH_APPLICATION_KEY")
    OVH_APPLICATION_SECRET = os.getenv("OVH_APPLICATION_SECRET")
    OVH_CONSUMER_KEY = os.getenv("OVH_CONSUMER_KEY")

    def __init__(self, method: str, url: URL, **kwargs):
        url = url.with_query(kwargs.pop('params', url.query))
        now = str(int(time.time()))
        data = kwargs.get('data', '') or ''
        signature = hashlib.sha1()
        signature.update("+".join([
            self.OVH_APPLICATION_SECRET,
            self.OVH_CONSUMER_KEY,
            method.upper(),
            str(url),
            data if isinstance(data, str) else data._value.decode('utf-8'),
            now
        ]).encode('utf-8'))

        headers = CIMultiDict({
            "X-Ovh-Application": self.OVH_APPLICATION_KEY,
            "X-Ovh-Consumer": self.OVH_CONSUMER_KEY,
            "X-Ovh-Timestamp": now,
            "X-Ovh-Signature": "$1$" + signature.hexdigest()
        })

        if kwargs.get('headers', None) is not None:
            headers.update(kwargs.pop('headers'))

        super().__init__(method, url, headers=headers, **kwargs)


async def get_session() -> ClientSession:
    async with ClientSession(request_class=OVHRequest) as session:
        yield session
