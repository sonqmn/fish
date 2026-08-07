let modelsPromise;
const diagnosisCache = new Map();
async function loadModels() {
  if (!modelsPromise) modelsPromise = (async () => {
    const [{ initializeApp, getApps, getApp }, { initializeAppCheck, ReCaptchaEnterpriseProvider }, { getAI, getGenerativeModel, GoogleAIBackend }, { firebaseConfig }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-check.js'),
      import('https://www.gstatic.com/firebasejs/12.1.0/firebase-ai.js'),
      import('./firebase-config.js')
    ]);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LdYUXktAAAAAGL52Ts9B8YNm8UkiqyWfFHhWwt7'),
      isTokenAutoRefreshEnabled: true
    });
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const options = generationConfig => ({ generationConfig });
    const generationConfig = { responseMimeType: 'application/json', temperature: 0.2 };
    return [
      getGenerativeModel(ai, { model: 'gemini-3.6-flash', ...options(generationConfig) }),
      getGenerativeModel(ai, { model: 'gemini-2.5-flash-lite', ...options(generationConfig) }),
      getGenerativeModel(ai, { model: 'gemini-2.5-flash', ...options(generationConfig) })
    ];
  })();
  return modelsPromise;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('사진을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

window.analyzeFishImage = async (file, notes = '') => {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일을 선택해주세요.');
  if (file.size > 10 * 1024 * 1024) throw new Error('사진 크기는 10MB 이하로 선택해주세요.');
  const cacheKey = `${file.name}:${file.size}:${file.lastModified}:${notes.trim()}`;
  if (diagnosisCache.has(cacheKey)) return diagnosisCache.get(cacheKey);
  const imageData = await fileToBase64(file);
  const models = await loadModels();
  const prompt = `당신은 양식 어류 건강을 보조 분석하는 AI입니다. 사진에서 직접 관찰되는 내용과 사용자 정보만 사용하세요. 확진처럼 단정하지 말고, 보이지 않는 아가미나 내부 장기의 상태를 추측하지 마세요. 응급 폐사나 전염성 질병 가능성이 있으면 전문가 상담을 우선 권고하세요.

주요 시각 후보를 비교하세요. 백점병은 체표와 지느러미의 소금알 같은 흰 점, 솔방울병은 복부 팽창과 비늘이 바깥으로 들린 모습, 수곰팡이병은 피부·상처·지느러미의 흰색 또는 회색 솜털 같은 병변이 특징입니다. 단, 사진에서 확인되지 않는 특징은 있다고 쓰지 마세요.

사용자 추가 정보: ${notes || '추가 정보 없음'}

반드시 아래 키를 가진 JSON 하나만 한국어로 반환하세요.
{"species":"추정 어종 또는 어종 미상","suspicionScore":0부터100 사이 정수,"riskLevel":"양호 또는 주의 또는 위험","possibleDisease":"가능한 질병 후보 또는 판단 어려움","affectedAreas":["사진에서 이상이 보이는 신체 부위"],"summary":"관찰 결과 요약","evidence":["사진에서 확인한 구체적인 시각 근거"],"actions":["즉시 할 수 있는 안전한 조치"],"caution":"사진 기반 AI 1차 소견과 한계를 설명하는 문장"}`;
  const request = [prompt, { inlineData: { data: imageData, mimeType: file.type } }];
  let response;
  let lastQuotaError;
  for (const model of models) {
    try {
      response = await model.generateContent(request);
      break;
    } catch (error) {
      const detail = String(error?.message || error);
      const quotaError = detail.includes('[429') || detail.toLowerCase().includes('quota');
      if (!quotaError) throw error;
      lastQuotaError = error;
    }
  }
  if (!response) {
    console.warn('All free Gemini model quotas were exhausted.', lastQuotaError);
    throw new Error('오늘 사용할 수 있는 Gemini 무료 분석 한도를 모두 사용했습니다. 미국 태평양 시간 자정(한국 시간 다음 날 오후 4시경)에 초기화됩니다.');
  }
  const text = response.response.text().replace(/^```json\s*|\s*```$/g, '').trim();
  const result = JSON.parse(text);
  diagnosisCache.set(cacheKey, result);
  return result;
};
