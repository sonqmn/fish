import json
import os
import csv
import io
import urllib.error
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))
url = os.environ['KMA_OCEAN_API_URL'].strip()


def observation_url(raw_url):
    """Turn the API Hub help/example URL into a live observation request."""
    parts = urllib.parse.urlsplit(raw_url)
    query = dict(urllib.parse.parse_qsl(parts.query, keep_blank_values=True))
    query.pop('help', None)
    if 'tm' in query:
        query['tm'] = datetime.now(KST).strftime('%Y%m%d%H%M')
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path, urllib.parse.urlencode(query), parts.fragment))


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


def parse_delimited(text):
    """Parse KMA API Hub CSV/TSV responses, including comment header lines."""
    lines = [line for line in text.splitlines() if line.strip() and not line.lstrip().startswith('#')]
    if not lines:
        return []
    sample = '\n'.join(lines[:5])
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',\t|')
    except csv.Error:
        dialect = csv.excel_tab if '\t' in lines[0] else csv.excel
    return list(csv.DictReader(io.StringIO('\n'.join(lines)), dialect=dialect))


def parse_kma_text(text):
    """Parse KMA API Hub whitespace tables whose column header begins with #."""
    comments = [line.lstrip()[1:].strip() for line in text.splitlines() if line.lstrip().startswith('#')]
    rows = [line.strip() for line in text.splitlines() if line.strip() and not line.lstrip().startswith('#')]
    header = next((line.split() for line in reversed(comments)
                   if ('STN' in line.upper() or 'TM' in line.upper())
                   and any(key in line.upper().split() for key in ('TW', 'WT', 'SST'))), None)
    if not header:
        return []
    return [dict(zip(header, row.split())) for row in rows if len(row.split()) >= len(header)]


def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


try:
    request = urllib.request.Request(observation_url(url), headers={'User-Agent': 'Ocean-Breathe/1.0', 'Accept': 'application/json, application/xml, text/plain, text/csv'})
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = response.read()
        content_type = response.headers.get('Content-Type', '')
        charset = response.headers.get_content_charset()
        try:
            body = payload.decode(charset or 'utf-8')
        except (UnicodeDecodeError, LookupError):
            body = payload.decode('euc-kr', 'replace')

    stripped = body.lstrip('\ufeff \t\r\n')
    if 'json' in content_type.lower() or stripped.startswith(('{', '[')):
        raw = json.loads(body)
        records = list(walk_records(raw))
    elif stripped.startswith('<'):
        records = parse_xml(body)
    else:
        records = parse_kma_text(body) or parse_delimited(body)

    temp_keys = ['waterTemp', 'waterTemperature', 'waterTemper', 'seaTemp', 'seaSurfaceTemp', 'wtrTmp', 'wtemp', 'sst', 'tw', 'wt', '수온', '해수온', '해수면수온']
    station_keys = ['stationName', 'stnName', 'stnNm', 'obsName', 'obsPostName', 'mmsiNm', 'station', '지점명', '관측지점', '지점']
    time_keys = ['observedAt', 'obsTime', 'tm', 'datetime', 'baseDate', 'dateTime', '관측시간', '일시', '시간']
    wind_keys = ['windSpeed', 'windSpd', 'ws', '풍속']
    salinity_keys = ['salinity', 'salt', '염분']

    selected = next((record for record in records if number(find_in_record(record, temp_keys)) is not None), None)
    if not selected:
        preview = body[:400].replace('\n', ' ')
        raise RuntimeError(f'응답에서 수온 항목을 찾지 못했습니다: {preview}')

    temperature = number(find_in_record(selected, temp_keys))

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
