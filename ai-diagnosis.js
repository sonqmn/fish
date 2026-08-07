let modelPromise;
async function loadModel() {
  if (!modelPromise) modelPromise = (async () => {
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
    return getGenerativeModel(ai, {
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    });
  })();
  return modelPromise;
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
  const imageData = await fileToBase64(file);
  const model = await loadModel();
  const prompt = `당신은 양식 어류 건강을 보조 분석하는 AI입니다. 사진에서 직접 관찰되는 내용과 사용자 정보만 사용하세요. 확진처럼 단정하지 말고, 보이지 않는 아가미나 내부 장기의 상태를 추측하지 마세요. 응급 폐사나 전염성 질병 가능성이 있으면 전문가 상담을 우선 권고하세요.

사용자 추가 정보: ${notes || '추가 정보 없음'}

반드시 아래 키를 가진 JSON 하나만 한국어로 반환하세요.
{"species":"추정 어종 또는 어종 미상","suspicionScore":0부터100 사이 정수,"riskLevel":"양호 또는 주의 또는 위험","possibleDisease":"가능한 질병 후보 또는 판단 어려움","summary":"관찰 결과 요약","evidence":["사진에서 확인한 구체적인 시각 근거"],"actions":["즉시 할 수 있는 안전한 조치"],"caution":"사진 기반 AI 1차 소견과 한계를 설명하는 문장"}`;
  const response = await model.generateContent([
    prompt,
    { inlineData: { data: imageData, mimeType: file.type } }
  ]);
  const text = response.response.text().replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(text);
};
