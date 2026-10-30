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
    public sealed class CampusApp : MonoBehaviour
    {
        CampusEngine game;
        Canvas canvas;
        RectTransform root;
        Font font;
        RawImage marker;
        string error = "";
        readonly Dictionary<string, Texture2D> art = new Dictionary<string, Texture2D>();
        readonly Color ink = new Color(0.89f, 0.92f, 0.90f), muted = new Color(0.61f, 0.72f, 0.72f), accent = new Color(0.56f, 0.84f, 0.77f);
        int lastWidth, lastHeight;
        float miniRemainder;
        bool saving, dirty, isError;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (FindFirstObjectByType<CampusApp>() != null) return;
            var go = new GameObject("Campus Survival");
            DontDestroyOnLoad(go);
            go.AddComponent<CampusApp>();
        }
        void Awake()
        {
            Application.targetFrameRate = 60;
            font = Resources.Load<Font>("Korean");
            if (font == null) font = Font.CreateDynamicFontFromOSFont(new[] { "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Arial" }, 24);
            var data = Resources.Load<TextAsset>("Data/world");
            if (data == null) { Debug.LogError("Data/world.json이 없습니다. Unity 프로젝트의 Assets 폴더를 확인해주세요."); enabled = false; return; }
            game = new CampusEngine(JsonUtility.FromJson<WorldData>(data.text), seed: Environment.TickCount);
            foreach (var key in new[] { "Campus", "Expressions", "Activities", "Cafe" }) art[key] = Resources.Load<Texture2D>("Art/" + key);
            if (EventSystem.current == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            EventSystem.current.sendNavigationEvents = false;
            var c = new GameObject("Canvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            c.transform.SetParent(transform, false);
            canvas = c.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = c.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.matchWidthOrHeight = 0.5f;
            root = c.GetComponent<RectTransform>();
            if (File.Exists(SavePath(0))) game.OpenUtility("menu");
            Draw();
        }
        void Update()
        {
            if (game == null || root == null) return;
            if (lastWidth != Screen.width || lastHeight != Screen.height) { Draw(); return; }
            var a = game.S.activity;
            if (game.S.screen == "activity" && a != null && a.phase == 1)
            {
                miniRemainder += Time.unscaledDeltaTime * 1000;
                int elapsed = Mathf.FloorToInt(miniRemainder); miniRemainder -= elapsed;
                game.AdvanceMini(elapsed);
                if (marker != null) { var rt = marker.rectTransform; rt.anchorMin = rt.anchorMax = new Vector2(game.MiniPosition, 0.5f); }
                if (Input.GetKeyDown(KeyCode.Space)) Act("miniHit");
            }
            else if (Input.GetKeyDown(KeyCode.Space) && !game.View().menu) AdvanceReading();
            if (Input.GetKeyDown(KeyCode.Escape)) { game.OpenUtility("menu"); Draw(); }
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
                if (game.S.inventory.Count > items) error = "획득 · " + game.S.inventory.Last().text;
                if (!new[] { "back", "phone", "menu", "community", "appointments", "clubs", "messages", "knowledge", "contacts", "inventory", "journal", "timetable", "travel", "rooms", "class", "counter", "encounter", "interview", "resumeActivity" }.Contains(id))
                { dirty = true; Save(0, false); }
            }
            catch (Exception e) { isError = true; error = e.Message; Debug.LogWarning(e.Message); }
            Draw();
        }
        void AdvanceReading()
        { var lines = Beats(game.View().text); if (game.S.beat < lines.Length - 1) { game.S.beat++; Draw(); } }
        string[] Beats(string text)
        {
            var result = new List<string>();
            foreach (string paragraph in (text ?? "").Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string rest = paragraph;
                while (rest.Length > 60)
                {
                    int end = rest.LastIndexOf(' ', 60, 30);
                    if (end < 30) end = 60;
                    result.Add(rest.Substring(0, end).Trim()); rest = rest.Substring(end).TrimStart();
                }
                if (rest.Length > 0) result.Add(rest);
            }
            return result.Count == 0 ? new[] { "…" } : result.ToArray();
        }
        RectTransform Box(string name, Transform parent, Color? color = null)
        {
            var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent, false);
            if (color.HasValue) go.AddComponent<Image>().color = color.Value;
            return go.GetComponent<RectTransform>();
        }
        void Stretch(RectTransform rt, float left = 0, float right = 0, float top = 0, float bottom = 0)
        { rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one; rt.offsetMin = new Vector2(left, bottom); rt.offsetMax = new Vector2(-right, -top); }
        void At(RectTransform rt, Vector2 min, Vector2 max, float left = 0, float right = 0, float top = 0, float bottom = 0)
        { rt.anchorMin = min; rt.anchorMax = max; rt.offsetMin = new Vector2(left, bottom); rt.offsetMax = new Vector2(-right, -top); }
        Text Label(Transform parent, string text, int size = 24, Color? color = null)
        {
            var go = new GameObject("Text", typeof(RectTransform), typeof(Text)); go.transform.SetParent(parent, false);
            var t = go.GetComponent<Text>(); t.font = font; t.text = text; t.fontSize = size; t.color = color ?? ink;
            t.supportRichText = false; t.raycastTarget = false; t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Overflow; t.lineSpacing = 1.25f;
            Stretch(t.rectTransform); return t;
        }
        Button Button(Transform parent, string label, Action clicked, int height = 62)
        {
            var rt = Box("Button", parent, new Color(0.10f, 0.18f, 0.20f, 0.95f));
            var element = rt.gameObject.AddComponent<LayoutElement>(); element.minHeight = height; element.preferredHeight = height;
            var b = rt.gameObject.AddComponent<Button>(); var colors = b.colors; colors.normalColor = Color.white; colors.highlightedColor = new Color(0.71f, 0.92f, 0.87f); colors.pressedColor = new Color(0.49f, 0.72f, 0.68f); b.colors = colors;
            var text = Label(rt, label, 21); text.alignment = TextAnchor.MiddleLeft; Stretch(text.rectTransform, 20, 16, 5, 5);
            b.onClick.AddListener(() => clicked()); return b;
        }
        void Column(RectTransform rt, int spacing = 10)
        { var g = rt.gameObject.AddComponent<VerticalLayoutGroup>(); g.spacing = spacing; g.childControlHeight = true; g.childControlWidth = true; g.childForceExpandHeight = false; g.childForceExpandWidth = true; }
        void FlexibleText(Transform parent, string text, int size, Color? color = null)
        {
            var t = Label(parent, text, size, color);
            t.gameObject.AddComponent<LayoutElement>().minHeight = size * 1.6f;
        }
        void Background(GameView view)
        {
            string key = view.art.StartsWith("Activities:") ? "Activities" : view.art;
            Texture2D texture; if (!art.TryGetValue(key, out texture) || texture == null) return;
            var surround = Box("Scene surround", root, new Color(0.025f, 0.06f, 0.08f)); Stretch(surround);
            var raw = Box("Scene art", root).gameObject.AddComponent<RawImage>(); raw.texture = texture; raw.raycastTarget = false; Stretch(raw.rectTransform);
            if (key == "Activities")
            {
                int panel = view.art.EndsWith("basketball") ? 0 : view.art.EndsWith("cooking") ? 1 : 2;
                raw.uvRect = new Rect(panel / 3f, 0, 1f / 3f, 1);
                // Keep the portrait CG complete, with a solid surround instead of stretching/cropping faces.
                float referenceHeight = canvas.GetComponent<CanvasScaler>().referenceResolution.y;
                raw.rectTransform.anchorMin = raw.rectTransform.anchorMax = new Vector2(0.5f, 1);
                raw.rectTransform.pivot = new Vector2(0.5f, 1);
                raw.rectTransform.anchoredPosition = Vector2.zero;
                raw.rectTransform.sizeDelta = new Vector2(referenceHeight * texture.width / 3f / texture.height, referenceHeight);

            }
            else
            {
                float source = (float)texture.width / texture.height, target = (float)Screen.width / Screen.height;
                if (source > target) { float w = target / source; raw.uvRect = new Rect((1 - w) * 0.5f, 0, w, 1); }
                else { float h = source / target; raw.uvRect = new Rect(0, (1 - h) * 0.5f, 1, h); }
            }
            var shade = Box("Scene shade", root, new Color(0.025f, 0.06f, 0.08f, view.menu ? 0.85f : 0.16f)); Stretch(shade);
        }
        void Header(GameView view)
        {
            var header = Box("Header", root, new Color(0.025f, 0.065f, 0.08f, 0.96f)); At(header, new Vector2(0, 1), Vector2.one, top: 0, bottom: -88);
            string title = "CAMPUS / " + game.S.day + "일차  " + CampusEngine.Clock(game.S.minute) + "  ·  " + game.Weather;
            var t = Label(header, title, 20, accent); At(t.rectTransform, Vector2.zero, Vector2.one, 24, 260, 20, 0);
            var phone = Button(header, "휴대폰", () => { game.OpenUtility("phone"); Draw(); }); At(phone.GetComponent<RectTransform>(), new Vector2(1, 0), Vector2.one, -244, 128, 16, 16);
            var menu = Button(header, "메뉴", () => { game.OpenUtility("menu"); Draw(); }); At(menu.GetComponent<RectTransform>(), new Vector2(1, 0), Vector2.one, -116, 16, 16, 16);
        }
        void Portrait(GameView view)
        {
            if (view.menu || string.IsNullOrEmpty(view.portrait) || !art.ContainsKey("Expressions")) return;
            int col = view.portrait == "seoyeon" ? 1 : view.portrait == "yeogyeong" ? 2 : view.portrait == "soyul" ? 3 : 0;
            var p = game.S.actors.FirstOrDefault(x => x.id == view.portrait);
            int row = p != null && p.tension >= 3 ? 2 : p != null && p.fatigue >= 3 ? 1 : 0;
            var raw = Box("Character", root).gameObject.AddComponent<RawImage>(); raw.texture = art["Expressions"]; raw.raycastTarget = false; raw.uvRect = new Rect(col / 4f, (2 - row) / 3f, 0.25f, 1f / 3f);
            // Atlas cells are square. Keep their native proportion at every aspect ratio.
            float availableWidth = root.rect.width > 0 ? root.rect.width : canvas.GetComponent<CanvasScaler>().referenceResolution.x;
            float size = Mathf.Min(lastWidth / (float)lastHeight < 1 ? 580 : 660, availableWidth * 0.85f);
            var rt = raw.rectTransform; rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.45f); rt.pivot = new Vector2(0.5f, 0); rt.anchoredPosition = new Vector2(0, -20); rt.sizeDelta = new Vector2(size, size);
        }
        void Draw()
        {
            if (root == null) return;
            foreach (Transform child in root) Destroy(child.gameObject);
            marker = null;
            lastWidth = Screen.width; lastHeight = Screen.height;
            float aspect = (float)Mathf.Max(1, Screen.width) / Mathf.Max(1, Screen.height);
            var scaler = canvas.GetComponent<CanvasScaler>(); scaler.referenceResolution = new Vector2(Mathf.Max(680, 900 * aspect), 900);
            var view = game.View(); Background(view); Portrait(view); Header(view);
            if (view.menu) DrawMenu(view); else DrawNovel(view);
            if (error != "")
            { var box = Box("Notice", root, isError ? new Color(0.20f, 0.10f, 0.10f, 0.98f) : new Color(0.05f, 0.23f, 0.23f, 0.98f)); At(box, new Vector2(0, 1), Vector2.one, 24, 24, 94, -152); var text = Label(box, error, 20); Stretch(text.rectTransform, 14, 14, 8, 8); }
        }
        void DrawNovel(GameView view)
        {
            var panel = Box("Dialogue panel", root, new Color(0.025f, 0.065f, 0.08f, 0.96f)); At(panel, Vector2.zero, new Vector2(1, 0), 20, 20, -408, 20);
            var title = Label(panel, view.title, 18, muted); At(title.rectTransform, new Vector2(0, 1), Vector2.one, 24, 24, 15, -45);
            var speaker = Label(panel, view.speaker ?? "김태이", 23, accent); At(speaker.rectTransform, new Vector2(0, 1), Vector2.one, 24, 24, 53, -92);
            string[] beats = Beats(view.text); game.S.beat = Mathf.Clamp(game.S.beat, 0, beats.Length - 1);
            var copy = Label(panel, beats[game.S.beat], 25); At(copy.rectTransform, new Vector2(0, 1), Vector2.one, 24, 24, 99, -202);
            if (game.S.screen == "activity" && game.S.activity != null && game.S.activity.step == 1 && game.S.activity.phase == 1) DrawMini(panel);
            var choices = Box("Choices", panel); At(choices, Vector2.zero, new Vector2(1, 0), 18, 18, -197, 14); Column(choices, 7);
            if (game.S.beat < beats.Length - 1) { Button(choices, "다음  ·  Space  " + (game.S.beat + 1) + "/" + beats.Length, AdvanceReading, 56); return; }
            int pageSize = view.actions.Count > 3 ? 2 : 3, pages = Math.Max(1, (view.actions.Count + pageSize - 1) / pageSize);
            game.S.choicePage = Mathf.Clamp(game.S.choicePage, 0, pages - 1);
            foreach (var action in view.actions.Skip(game.S.choicePage * pageSize).Take(pageSize)) { var a = action; Button(choices, a.label, () => Act(a.id, a.arg), 53); }
            if (pages > 1) Button(choices, "다른 선택을 생각해본다.  " + (game.S.choicePage + 1) + "/" + pages, () => { game.S.choicePage = (game.S.choicePage + 1) % pages; Draw(); }, 53);
        }
        void DrawMini(RectTransform panel)
        {
            var bar = Box("Timing lane", panel, new Color(0.16f, 0.25f, 0.27f)); At(bar, new Vector2(0, 1), Vector2.one, 32, 32, 171, -190);
            var target = Box("Timing target", bar, accent); At(target, new Vector2(0.40f, 0), new Vector2(0.60f, 1));
            marker = Box("Timing marker", bar).gameObject.AddComponent<RawImage>(); marker.color = Color.white; marker.raycastTarget = false; marker.rectTransform.anchorMin = marker.rectTransform.anchorMax = new Vector2(game.MiniPosition, 0.5f); marker.rectTransform.sizeDelta = new Vector2(7, 31);
        }
        void DrawMenu(GameView view)
        {
            var panel = Box("Utility panel", root, new Color(0.035f, 0.085f, 0.10f, 0.97f)); Stretch(panel, 20, 20, 106, 20);
            var title = Label(panel, view.title, 34, accent); At(title.rectTransform, new Vector2(0, 1), Vector2.one, 28, 28, 22, -76);
            var viewport = Box("Scroll viewport", panel, new Color(0, 0, 0, 0)); Stretch(viewport, 24, 24, 92, 20); viewport.gameObject.AddComponent<RectMask2D>();
            var scroll = viewport.gameObject.AddComponent<ScrollRect>(); scroll.horizontal = false; scroll.scrollSensitivity = 40; scroll.movementType = ScrollRect.MovementType.Clamped;
            var content = Box("Content", viewport); content.anchorMin = new Vector2(0, 1); content.anchorMax = Vector2.one; content.pivot = new Vector2(0.5f, 1); content.sizeDelta = Vector2.zero;
            Column(content, 12); var fitter = content.gameObject.AddComponent<ContentSizeFitter>(); fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize; scroll.content = content; scroll.viewport = viewport;
            FlexibleText(content, view.text, 22, muted);
            foreach (var action in view.actions) { var a = action; Button(content, a.label, () => Act(a.id, a.arg), 66); }
            if (game.S.screen == "menu")
            {
                FlexibleText(content, "저장 · 불러오기", 26, accent);
                for (int i = 0; i <= 3; i++)
                {
                    int slot = i;
                    if (i > 0) Button(content, "슬롯 " + i + "에 저장", () => Save(slot), 60);
                    if (File.Exists(SavePath(i))) Button(content, (i == 0 ? "자동 저장" : "슬롯 " + i) + " 불러오기 · " + SaveSummary(i), () => Load(slot), 60);
                }
                Button(content, "새 회차 시작 · 저장 슬롯은 유지", () => { game = new CampusEngine(game.World, seed: Environment.TickCount); dirty = true; error = "새 회차를 시작했습니다."; Draw(); }, 60);
            }
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
                if (notify) { isError = false; error = "슬롯 " + slot + "에 저장했습니다."; Draw(); }
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
                game = next; dirty = true; isError = false; error = "저장을 불러왔습니다."; Draw();
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
