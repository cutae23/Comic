export interface Character {
  name: string;
  visualDescription: string;
}

export interface Panel {
  panelNumber: number;
  sceneDescription: string;
  speaker: string;
  dialogue: string;
  narration: string;
  soundEffect: string;
  bgMusicMood: string;
  imagePrompt: string;
  
  // Client state fields
  imageUrl?: string;
  isGenerating?: boolean;
  isFailed?: boolean;
  isPlanB?: boolean;
  method?: string;
  errorMessage?: string;
  isCustomEdited?: boolean;
}

export interface ComicBook {
  id: string;
  title: string;
  description: string;
  genre: string;
  style: string;
  characters: Character[];
  panels: Panel[];
  createdAt: string;
}

export type ComicStyle = 'K-Webtoon' | 'Classic Comic' | 'Manga' | 'Noir Graphic Novel' | 'Cute Watercolor' | 'Retro Pixel';

export interface StylePreset {
  id: ComicStyle;
  name: string;
  description: string;
  promptAdditions: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'K-Webtoon',
    name: '트렌디 한국 웹툰 (Trendy K-Webtoon)',
    description: '깔끔한 선, 세련된 웹툰 채색 기법, 밝고 선명한 인물 중심의 연출',
    promptAdditions: 'digital webtoon style, detailed colors, clean line-art, modern manhwa, professional digital illustration, vibrant lighting, studio-grade coloring, 4k, trending on webtoon',
    bgGradient: 'from-blue-50 to-indigo-100',
    textColor: 'text-indigo-900',
    borderColor: 'border-indigo-400',
  },
  {
    id: 'Classic Comic',
    name: '클래식 미국 만화 (Classic US Comic)',
    description: '두꺼운 외곽선, 망점 채색(Ben-Day dots), 역동적이고 고전적인 히어로 코믹스 작화',
    promptAdditions: '1980s American comic book illustration style, vintage comic printing, halftone dots texture, bold black outlines, ink wash, dramatic retro action scene, ink bleed, marvel dc style cover',
    bgGradient: 'from-yellow-50 to-red-100',
    textColor: 'text-red-950',
    borderColor: 'border-red-500',
  },
  {
    id: 'Manga',
    name: '일본 감성 망가 (Classic Japanese Manga)',
    description: '흑백과 스크린톤 기법, 세밀한 감정 묘사와 드라마틱한 흑백 연출',
    promptAdditions: 'classic black and white manga page style, screentone texture, fine crosshatch lines, high contrast manga artwork, dramatic speed lines, beautiful emotion details, weekly shonen jump style',
    bgGradient: 'from-zinc-100 to-zinc-200',
    textColor: 'text-zinc-900',
    borderColor: 'border-zinc-800',
  },
  {
    id: 'Noir Graphic Novel',
    name: '다크 누아르 소설 (Dark Noir Detective)',
    description: '강렬한 흑백 대비, 깊은 그림자, 차가운 도시와 미스터리한 분위기',
    promptAdditions: 'neo-noir graphic Novel style, stark high contrast, heavy shadows, deep black ink sketch, dark moody cinematic masterpiece, cyberpunk neon highlights, sin city inspired, grit and mystery',
    bgGradient: 'from-slate-800 to-slate-950',
    textColor: 'text-slate-100',
    borderColor: 'border-slate-700',
  },
  {
    id: 'Cute Watercolor',
    name: '감성 수채화 동화 (Warm Watercolor Art)',
    description: '부드러운 연필 선과 은은하게 번지는 따뜻한 수채화 물감 감성',
    promptAdditions: 'gentle children\'s book watercolor illustration, soft pencil sketch lines, light pastel colors wash, warm cozy morning light, beautiful fairytale texture, emotional and lovely storybook style',
    bgGradient: 'from-pink-50 to-orange-100',
    textColor: 'text-orange-950',
    borderColor: 'border-orange-300',
  },
  {
    id: 'Retro Pixel',
    name: '레트로 픽셀 아트 (Retro 8/16-Bit Pixel)',
    description: '도트 감성의 게임 세계, 비비드한 컬러와 친근한 도트 픽셀 캐릭터',
    promptAdditions: 'pixel art style, 16-bit vintage video game graphic, vibrant retro game asset, cute pixel characters, clean digital dithering, nostalgic arcade look, hyper detailed pixel art',
    bgGradient: 'from-emerald-50 to-teal-150',
    textColor: 'text-teal-950',
    borderColor: 'border-teal-500',
  },
];

export interface SampleStoryPreset {
  id: string;
  title: string;
  genre: string;
  emoji: string;
  summary: string;
  content: string;
}

export const SAMPLE_STORIES: SampleStoryPreset[] = [
  {
    id: 'rabbit',
    title: '지혜로운 토끼와 사자의 지평선',
    genre: '우화 / 판타지',
    emoji: '🐰',
    summary: '동물들을 괴롭히는 난폭한 사자를 깊은 우물로 유인해 구하는 슬기로운 토끼 이야기의 현대적 판타지 각색',
    content: `깊고 푸른 숲속에는 동물들을 매일 괴롭히는 사나운 사자 '레오'가 있었습니다. 레오는 너무 강력해서 아무도 대적하지 못했습니다. 동물들은 두려움에 떨며 매일 한 마리씩 레오를 위한 세금을 내듯 번갈아 바쳐야 하는 비참한 규칙을 세웠습니다. 마침내 꾀가 많고 용기 있는 하얀 꼬리 토끼 '코코'의 차례가 다가왔습니다.
코코는 동물 친구들에게 말했습니다. "내가 우리 숲을 구해볼게, 걱정하지 마!"
토끼 코코는 사자 레오를 만나기 위해 길을 떠났으나, 잔꾀를 피워 아주 늦은 정오가 되어서야 거만하게 그 앞에 나타났습니다.
기다림에 지쳐 불같이 성을 내는 레오에게 코코는 머리를 조아리고 조용히 속삭였습니다. "대왕님, 정말 죄송합니다. 여기에 올 때 이미 더 멋진 대왕 토끼 세 마리와 함께 오고 있었는데, 오던 도중 저 깊은 강과 돌로 된 깊은 우물 속에 사는 거대한 검붉은 갈기를 가진 또 다른 세력의 왕이 나타나 그것들을 다 빼앗아 먹어 버렸습니다!"
레오는 격분했습니다. "이 숲에는 오직 나만이 진정한 유일무이한 황제다! 그 교만한 놈이 어디 있느냐? 당장 나를 데려가라!"
코코는 조용히 무서운 척 앞장섰습니다. 이윽고 그들은 무서울 정도로 깊고 조용해, 물속이 보이지 않는 원형 석조 우물가에 도달했습니다.
우물가에서 코코는 말했습니다. "대왕님, 저 우물 밑바닥 깊은 곳을 깊이 내려다보십시오. 그 교만한 가짜 사자가 부하들을 데리고 도사리고 있습니다."
사자 레온은 우물 난간을 딛고 우물 밑을 성나서 매섭게 쳐다보았습니다. 조용하고 맑은 물속에는 자신의 굳센 인상이 반사되어 노려보고 있었습니다.
자신의 반사된 상이 라이벌 사자인 줄 완벽히 착각한 레오는 그가 들고 있는 어마어마한 앞발을 휘두르며 무시무시한 포효를 내질렀습니다. 그러자 깊은 돌 우물 속에서도 똑같이 우렁차고 묵직한 메아리 소리가 흘러나왔습니다.
그 무섭고 거센 모욕적인 메아리에 참지 못한 사자 레오는, 분노가 머리끝까지 폭발하여 "당장 단판 승부를 내자!"라고 소리치며 깊고 급한 우물 아래로 온몸을 날려 힘껏 뛰어내렸습니다.
풍덩! 거대한 포말과 함께 사자는 깊고 시퍼런 우물안에서 갇혀버렸고, 벽이 너무 높고 가팔라 밖으로 절대 나오지 못하게 되었습니다.
토끼 코코는 우물가 난간 위에서 한숨을 돌리며 흐뭇한 눈빛으로 말했습니다. "자신의 분노와 미련함이 결국 스스로를 가두는 벽이 되는구나."
코코가 안전하게 초원으로 되돌아오자 온 숲속의 다람쥐, 사슴, 곰 친구들이 사방에서 몰려나와 코코의 이름을 소리 높여 부르고 춤을 추며 환호했습니다. 어두웠던 숲은 마침내 밝고 희망찬 평화의 햇살을 가득 가득 받게 되었습니다.`
  },
  {
    id: 'cyberpunk',
    title: '네온 시티의 배달원과 은빛 디바이스',
    genre: '사이언스 픽션 / 스릴러',
    emoji: '🏍️',
    summary: '2150년 네온사인 빛에 갇힌 기가 시티에서 한 택배 배달원이 거대 기업의 일급 비밀 데이터를 싣고 질주하는 사이버펑크 활극',
    content: `서기 2150년, 쉬지 않고 쏟아지는 찬 산성비와 하늘을 가린 홀로그램 고래 광고판으로 가득 찬 기가 네온 시티.
인공지능 로봇 배달 망이 마비되자, 유일하게 오토바이를 타는 베테랑 인간 라이더 '잭'은 거액을 약속받고 어두운 항구 배후지에서 작고 반짝이는 은빛 양자 디바이스를 수령했습니다.
디바이스를 가방에 구겨 넣은 순간, 헬멧의 HUD 화면 전체가 시뻘건 테러 위협 알람으로 점멸하기 시작했습니다. "기가 오라클 테크놀로지의 감시 드론 궤도가 변경되었습니다. 대상 추적 중."
잭은 전용 레이더 바이크의 엔진 가속 레버를 미친 듯이 당겨 네온 빛 고가도로 위로 진입했습니다. 그의 뒤쪽 어두운 검은 구름 틈사이로 사나운 붉은색 카메라 눈을 번뜩이며 벌 떼처럼 쐐기형 감시 드론들이 바짝 뒤쫓아 붙었습니다.
"이봐요! 목적지 전송 코드 오류가 떴어요, 어떻게 된 거야!" 잭이 비밀 무전기로 거래자에게 고함을 질렀습니다. 그러나 들려오는 것은 소름 끼치는 기계음과 노이즈뿐이었습니다. "거래 차단 완료. 라이더는 현장 사살하십시오."
순간 드론들의 주포에서 치명적인 고전압 파란색 EMP 플라스마 탄환들이 사정없이 도로 곳곳에 꽂혔고, 기가 시티 아스팔트 바닥은 처참하게 연기를 뿜으며 튀었습니다.
잭은 묘기로 가득 찬 급정거와 커브를 구사하며 추격을 따돌리기 위해 버려진 공중 철도 허브 터널 속으로 맹렬히 파고들어 질주했습니다.
터널 안에서 막다른 장벽에 부딪힌 순간, 잭은 결연한 듯 가방에서 은빛 양자 디바이스를 꺼내 공중에 던진 뒤 바이오 링크를 뇌에 직렬로 연결했습니다.
뇌 속으로 기가 오라클 사가 수십 년간 가둬 숨겨왔던 자유 가상현실 샌드박스의 거대한 비밀 코드가 폭풍처럼 쏟아져 입력되었습니다. 그와 동시에 드론들이 터널에 들이닥쳐 레이저를 조준했습니다.
데이터를 완전히 해독한 잭의 조종 키보드 터치 한 번에 추격 드론들의 내부 펌웨어가 일제히 리셋 신호를 받고 먹통이 되어 바닥으로 줄줄이 추락해 산산이 부서졌습니다.
홀로 무너지지 않은 기가 시티 외곽 고지대에 멈춰선 잭은 바이오 매트릭스 화면을 바라보며 나지막이 승리의 미소를 지었습니다. 그는 잿빛 도시 한가운데에 영원해 보였던 가짜 시스템 광고판 장벽들을 순식간에 날려 보내고 푸르고 아름다운 리얼타임 푸른 가상 하늘을 띄어 전 시민들에게 송출하기 시작했습니다.`
  },
  {
    id: 'baking',
    title: '숲속 베이커리 곰돌이의 마법 꿀빵',
    genre: '일상물 / 힐링',
    emoji: '🐻',
    summary: '말썽꾸러기 다람쥐들이 곰 아저씨네 숲속 베이커리에서 가장 귀중한 무지개 이스트를 건드리며 일어나는 향기로운 마법 대소동물 이야기',
    content: `아름답고 울창한 올리브 숲 언덕배기 위에는 언제나 고소하고 달달한 버터 향기가 감도는 '동글곰의 나무 오븐 베이커리'가 평화롭게 서 있었습니다.
거칠어 보이지만 마음만큼은 누구보다 부드러우며 노란 베이킹 앞치마를 상시 착용한 파티시에 곰벌 아저씨 '보리'가 이 작은 주방의 지배자였습니다.
어느 맑은 금요일 아침, 빵집의 단골 말썽꾸러기 아기 다람쥐 삼형제 '하나, 둘, 셋'이 부엌 도토리 창문을 조심스레 몰래 넘었습니다. 그들의 타겟은 가장 높은 선반에 보관되어 있던 금실로 묶인 전설의 '무지개 마법 이스트 가루'였습니다.
삼형제가 아슬아슬하게 선반 끝에 매달려 병을 건드린 순간, 투명한 유리병이 그만 미끄러져 보리가 고이 반죽하고 있던 엄청나게 커다란 밀가루 반죽 통 속으로 쏟아져 들어가 버렸습니다!
보리가 오븐 불을 확인하기 위해 주방으로 돌아왔을 때, 부엌 테이블 전체가 무지갯빛 오로라 거품처럼 부글부글 끊임없이 부풀어 오르고 있는 기묘하고 환상적인 반죽으로 뒤덮여 있었습니다.
다람쥐 삼형제는 밀가루 가루 통 뒤에 오들오들 숨어 무릎을 꿇고 눈물을 뚝뚝 흘리며 자기들의 짖궂은 장난을 즉시 실토했습니다.
보리 아저씨는 호통치는 대신 호탕하게 웃으며 귀여운 삼형제 머리를 가볍게 쓰다듬어 주었습니다. "에이 기왕 이렇게 터져버린 김에, 우리 숲속 동물들 역사상 가장 거대한 마법 빵 파티를 열어볼까!"
보리 아저씨와 다람쥐 삼형제는 일제히 합심하여 오로라 반죽에 달콤한 올리브 산 딸기와 별모양 노란 꿀 시럽을 골고루 듬뿍 얹어 아주 커다란 구이판 오븐에 정성껏 집어넣었습니다.
오븐 문이 열리자마자 형언할 수 없는 향기로운 핑크색 크림 구름과 은은한 별 가루들이 따뜻한 봄바람을 타고 창문을 지나 숲속 사방팔방으로 사뿐사뿐 퍼져 나갔습니다.
길을 지나가던 눈토끼 가문, 점잖은 부엉이 교수님, 심지어 무뚝뚝한 꼬마 멧돼지들까지 빵 굽는 달콤한 향기에 완전히 매료되어 군침을 크게 삼키며 빵집 앞마당에 소풍 돗자리를 펴고 줄을 지어 모여들었습니다.
수백 마리의 착한 동물 군중이 둥글게 모여 앉아 모락모락 김이 나는 거대한 오색찬란 달콤 무지개 꿀빵을 사이좋게 떼서 한 조각씩 나누어 행복하게 먹었습니다. 다람쥐 삼형제는 앞치마를 두르고 곰 보리 아저씨의 정식 초보 조수가 되어, 매일 행복하게 주방 도구를 열심히 닦고 온 마음으로 달콤함을 굽는 행복한 빵집 식구가 되었습니다.`
  }
];
