import json
import os
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))
url = os.environ['KMA_OCEAN_API_URL'].strip()


def scalar(value):
    return value if isinstance(value, (str, int, float)) else None


def walk_records(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_records(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_records(child)


def find_in_record(record, candidates):
    normalized = {str(key).lower().replace('_', ''): value for key, value in record.items()}
    for candidate in candidates:
        value = normalized.get(candidate.lower().replace('_', ''))
        if scalar(value) not in (None, '', '-', 'null', '미제공', '데이터없음'):
            return value
    return None


def parse_xml(text):
    root = ET.fromstring(text)
    records = []
    for element in root.iter():
        children = list(element)
        if children and all(not list(child) for child in children):
            records.append({child.tag.split('}')[-1]: (child.text or '').strip() for child in children})
    return records or [{root.tag.split('}')[-1]: (root.text or '').strip()}]


def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


try:
    request = urllib.request.Request(url, headers={'User-Agent': 'Ocean-Breathe/1.0', 'Accept': 'application/json, application/xml, text/xml'})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read().decode('utf-8', 'replace')
        content_type = response.headers.get('Content-Type', '')

    if 'json' in content_type.lower() or body.lstrip().startswith(('{', '[')):
        raw = json.loads(body)
        records = list(walk_records(raw))
    else:
        records = parse_xml(body)

    temp_keys = ['waterTemp', 'waterTemperature', 'waterTemper', 'seaTemp', 'seaSurfaceTemp', 'wtrTmp', 'wtemp', 'sst', 'tw', 'wt']
    station_keys = ['stationName', 'stnName', 'stnNm', 'obsName', 'obsPostName', 'mmsiNm', 'station']
    time_keys = ['observedAt', 'obsTime', 'tm', 'datetime', 'baseDate', 'dateTime']
    wind_keys = ['windSpeed', 'windSpd', 'ws']
    salinity_keys = ['salinity', 'salt']

    selected = next((record for record in records if find_in_record(record, temp_keys) is not None), None)
    if not selected:
        preview = body[:400].replace('\n', ' ')
        raise RuntimeError(f'응답에서 수온 항목을 찾지 못했습니다: {preview}')

    temperature = number(find_in_record(selected, temp_keys))
    if temperature is None:
        raise RuntimeError('수온 값이 숫자 형식이 아닙니다.')

    data = {
        'source': '기상청 해양종합관측자료',
        'station': find_in_record(selected, station_keys) or '기상청 해양 관측지점',
        'updatedAt': datetime.now(KST).isoformat(),
        'observedAt': find_in_record(selected, time_keys),
        'temperature': temperature,
        'salinity': number(find_in_record(selected, salinity_keys)),
        'windSpeed': number(find_in_record(selected, wind_keys)),
        'status': '공식 관측값 수집 완료'
    }
except urllib.error.HTTPError as error:
    detail = error.read().decode('utf-8', 'replace')[:500]
    data = {'source': '기상청 해양종합관측자료', 'updatedAt': datetime.now(KST).isoformat(), 'status': '관측값 수집 재시도 중', 'error': f'HTTP {error.code}: {detail}'}
except Exception as error:
    data = {'source': '기상청 해양종합관측자료', 'updatedAt': datetime.now(KST).isoformat(), 'status': '관측값 수집 재시도 중', 'error': str(error)}

Path('data').mkdir(exist_ok=True)
Path('data/latest.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
