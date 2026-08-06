import json, os, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path
key=os.environ['MARINE_WEATHER_API_KEY']
# 국립해양측위정보원 OPEN API 매뉴얼 기준: servicekey(소문자 k), dataType 1 또는 2
params={'servicekey':key,'resultType':'json','mmaf':'101','mmsi':'994401578','dataType':'1'}
url='http://marineweather.nmpnt.go.kr:8001/openWeatherNow.do?'+urllib.parse.urlencode(params)
try:
  with urllib.request.urlopen(url,timeout=25) as r: raw=json.loads(r.read().decode('utf-8'))
  result=raw.get('result',{})
  if result.get('status')!='OK': raise RuntimeError(result.get('message','공식 API 응답 오류'))
  record=(result.get('recordset') or [{}])[0]
  data={'source':'국립해양측위정보원 해양기상정보','station':record.get('MMSI_NM','부산 관측소'),'updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(),'temperature':record.get('WATER_TEMPER'),'salinity':record.get('SALINITY'),'windSpeed':record.get('WIND_SPEED'),'observedAt':record.get('DATETIME')}
except urllib.error.HTTPError as e:
  detail=e.read().decode('utf-8','replace')[:500]
  data={'source':'국립해양측위정보원 해양기상정보','updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(),'status':'관측값 수집 재시도 중','error':f'HTTP {e.code}: {detail}'}
except Exception as e:data={'source':'국립해양측위정보원 해양기상정보','updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(),'status':'관측값 수집 재시도 중','error':str(e)}
Path('data').mkdir(exist_ok=True);Path('data/latest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
