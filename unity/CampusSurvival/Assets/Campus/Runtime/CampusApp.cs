using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace CampusSurvival
{
    // Native Unity UI. No browser, WebView, local server, API key or external model process.
    public sealed partial class CampusApp : MonoBehaviour
    {
        CampusEngine game;
        Canvas canvas;
        RectTransform root;
        Font font;
        RawImage marker;
        string error = "";
        readonly Dictionary<string, Texture2D> art = new Dictionary<string, Texture2D>();
        readonly Color ink = new Color(0.94f, 0.93f, 0.88f), muted = new Color(0.58f, 0.65f, 0.70f), accent = new Color(0.85f, 0.73f, 0.51f);
        int lastWidth, lastHeight;
        float miniRemainder;
        bool saving, dirty, isError;
        bool initializing;
        string startupError = "";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            var app = FindFirstObjectByType<CampusApp>();
            if (app == null)
            {
                var go = new GameObject("Campus Survival");
                app = go.AddComponent<CampusApp>();
            }
            app.EnsureStarted();
        }
        void Awake() { if (Application.isPlaying) EnsureStarted(); }
        public void EnsureStarted()
        {
            if (initializing || !previewMode && game != null && canvas != null && startupError == "") return;
            try
            {
                initializing = true;
                Initialize(false);
                startupError = "";
                Debug.Log("Campus 시작 완료 · Unity " + Application.unityVersion + " · 배경/대화 UI/선택지 생성", this);
                DontDestroyOnLoad(gameObject);
            }
            catch (Exception e)
            {
                startupError = e.ToString();
                if (canvas != null) canvas.enabled = false;
                Debug.LogException(e, this);
            }
            finally { initializing = false; }
        }
        // Editor preview uses exactly the same renderer; no disk reads, saves or gameplay callbacks run.
        public void RenderEditorPreview(string scenario = "arrival")
        {
            if (Application.isPlaying) throw new InvalidOperationException("Play 모드에서는 미리보기를 다시 만들 수 없습니다.");
            Initialize(true);
            PreviewScenario(scenario);
        }
        void Initialize(bool preview)
        {
            var previousCanvases = transform.Cast<Transform>().Where(x => x.name == "Canvas" || x.name == "Startup Preview").ToArray();
            Application.targetFrameRate = 60;
            font = Resources.Load<Font>("Korean");
            if (font == null) font = Font.CreateDynamicFontFromOSFont(new[] { "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Arial" }, 24);
            if (font == null) throw new InvalidOperationException("한글 폰트를 불러오지 못했습니다. Assets/Campus/Resources/Korean.ttf를 확인해주세요.");
            var data = Resources.Load<TextAsset>("Data/world");
            if (data == null) throw new InvalidOperationException("Data/world.json이 없습니다. ZIP의 CampusSurvival 폴더를 Unity Hub에서 직접 열어주세요.");
            game = new CampusEngine(JsonUtility.FromJson<WorldData>(data.text), seed: preview ? 197609 : Environment.TickCount);
            foreach (var key in new[] { "Campus", "Expressions", "Activities", "Cafe", "StandSprites" })
            {
                art[key] = Resources.Load<Texture2D>("Art/" + key);
                if (art[key] == null) throw new InvalidOperationException("배경/인물 이미지가 없습니다: Art/" + key);
            }
            if (!preview)
            {
                if (EventSystem.current == null)
                {
                    var events = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
                    events.transform.SetParent(transform, false);
                }
                EventSystem.current.sendNavigationEvents = false;
            }
            var c = new GameObject("Canvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            c.transform.SetParent(transform, false);
            canvas = c.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 20;
            var scaler = c.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.matchWidthOrHeight = 0.5f;
            root = c.GetComponent<RectTransform>();
            stageRoot = null; uiRoot = null; stageKey = ""; portraitKey = "";
            previewMode = preview; showTitle = !preview; page = ""; hideUi = false; reader = new VnReader();
            ReadPreferences();
            Draw();
            foreach (var old in previousCanvases) RemoveObject(old.gameObject);
        }
        void RemoveObject(GameObject target)
        { if (Application.isPlaying) { target.SetActive(false); Destroy(target); } else DestroyImmediate(target); }
        void OnGUI()
        {
            if (startupError == "") return;
            GUI.depth = -100;
            float width = Mathf.Min(Screen.width - 32, 1000), height = Mathf.Min(Screen.height - 32, 600);
            var rect = new Rect((Screen.width - width) / 2, (Screen.height - height) / 2, width, height);
            GUI.Box(rect, "Campus Survival · 시작 오류");
            var style = new GUIStyle(GUI.skin.label) { fontSize = 17, wordWrap = true };
            if (font != null) style.font = font;
            GUI.Label(new Rect(rect.x + 18, rect.y + 40, width - 36, height - 120), "게임 UI 초기화가 중단됐습니다. Console의 첫 빨간 오류와 아래 내용을 확인해주세요.\n\n" + startupError, style);
            if (GUI.Button(new Rect(rect.x + 18, rect.yMax - 60, width - 36, 40), "다시 시작")) EnsureStarted();
        }
        void Update()
        {
            if (game == null || root == null || startupError != "") return;
            if (lastWidth != Screen.width || lastHeight != Screen.height) { Draw(); return; }
            if (hideUi)
            {
                if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.H)) { hideUi=false;Draw(); }
                return;
            }
            TickPresentation();
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if(page!=""||game.View().menu){ClosePanel();return;}
                if(!showTitle)OpenPanel("menu");
                return;
            }
            if (showTitle || page != "") return;
            var a=game.S.activity;
            if (game.S.screen=="activity" && a!=null && a.phase==1)
            {
                miniRemainder+=Time.unscaledDeltaTime*1000;
                int elapsed=Mathf.FloorToInt(miniRemainder);miniRemainder-=elapsed;game.AdvanceMini(elapsed);
                if(marker!=null){var rt=marker.rectTransform;rt.anchorMin=rt.anchorMax=new Vector2(game.MiniPosition,.5f);}
                if(Input.GetKeyDown(KeyCode.Space))Act("miniHit");
            }
            else if(Input.GetKeyDown(KeyCode.Space) && !game.View().menu) AdvanceReading();
            if(Input.GetKeyDown(KeyCode.H) && !game.View().menu)HideInterface();
        }
        void OnApplicationFocus(bool focused)
        {
            if (!focused && game != null && game.S.activity != null && game.S.activity.phase == 1) { game.S.activity.phase = 2; if (dirty) Save(0, false); Draw(); }
        }
        void OnApplicationPause(bool paused) { if (paused && game != null) { if (game.S.activity != null && game.S.activity.phase == 1) game.S.activity.phase = 2; if (dirty) Save(0, false); } }
        void OnApplicationQuit() { if (game != null && dirty) Save(0, false); }
        void Act(string id, string arg = "")
        {
            try
            {
                int known = game.S.knowledge.Count, items = game.S.inventory.Count;
                game.Dispatch(id, arg); error = ""; isError = false;
                if (game.S.knowledge.Count > known) error = "새 정보 · " + game.S.knowledge.Last().text;
                if (error.Length > 68) error = error.Substring(0, 65) + "…";
                if (game.S.inventory.Count > items) error = "획득 · " + game.S.inventory.Last().text;
                if (!new[] { "back", "phone", "menu", "community", "appointments", "clubs", "messages", "knowledge", "contacts", "inventory", "journal", "timetable", "travel", "rooms", "class", "counter", "encounter", "interview", "resumeActivity" }.Contains(id))
                { dirty = true; Save(0, false); }
            }
            catch (Exception e) { isError = true; error = e.Message; Debug.LogWarning(e.Message); }
            noticeUntil=Time.unscaledTime+5;
            Draw();
        }
        void AdvanceReading()
        {
            if(showTitle||page!=""||game.View().menu)return;
            if(!reader.Complete){reader.Finish();UpdateReading();return;}
            var lines=Beats(game.View().text);
            if(game.S.beat<lines.Length-1){game.S.beat++;Draw();}
        }
        string SavePath(int slot) { return Path.Combine(Application.persistentDataPath, "campus-slot-" + slot + ".json"); }
        void Save(int slot, bool notify = true)
        {
            if (saving) return;
            saving = true;
            try
            {
                string path = SavePath(slot), temp = path + ".tmp";
                Directory.CreateDirectory(Application.persistentDataPath);
                File.WriteAllText(temp, JsonUtility.ToJson(game.S, true));
                if (File.Exists(path)) File.Replace(temp, path, path + ".bak"); else File.Move(temp, path);
                if (notify) { isError = false; error = "슬롯 " + slot + "에 저장했습니다."; noticeUntil=Time.unscaledTime+5; Draw(); }
            }
            catch (Exception e) { isError = true; error = "저장하지 못했습니다: " + e.Message; Debug.LogWarning(error); if (notify) Draw(); }
            finally { saving = false; }
        }
        void Load(int slot)
        {
            try
            {
                var state = JsonUtility.FromJson<CampusState>(File.ReadAllText(SavePath(slot)));
                var next = new CampusEngine(game.World, state);
                if (next.S.activity != null && next.S.activity.phase == 1) next.S.activity.phase = 2;
                game = next; showTitle=false;page="";reader=new VnReader();dirty = true; isError = false; error = "저장을 불러왔습니다."; Draw();
            }
            catch (Exception e) { isError = true; error = "불러오지 못했습니다. 현재 진행은 유지됩니다: " + e.Message; Draw(); }
        }
        string SaveSummary(int slot)
        {
            try { var s = JsonUtility.FromJson<CampusState>(File.ReadAllText(SavePath(slot))); return s.day + "일차 " + CampusEngine.Clock(s.minute) + " · " + game.PlaceName(s.location); }
            catch { return "읽을 수 없는 저장"; }
        }
    }
}
