using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace CampusSurvival.Editor
{
    [InitializeOnLoad]
    public static class CampusProject
    {
        const string ScenePath = "Assets/Campus/Scenes/Campus.unity";
        static CampusProject()
        {
            EditorApplication.delayCall += () =>
            {
                if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling) return;
                Configure();
                if (!File.Exists(ScenePath)) CreateScene();
                var active = SceneManager.GetActiveScene();
                string key = "Campus.StartSceneOpened:" + Application.dataPath;
                if (!Application.isBatchMode && !SessionState.GetBool(key, false) && !active.isDirty)
                {
                    SessionState.SetBool(key, true);
                    if (active.path != ScenePath) EditorSceneManager.OpenScene(ScenePath);
                    PrepareScene();
                }
                else if (active.path == ScenePath) PrepareScene();
            };
        }
        static void Configure()
        {
            PlayerSettings.companyName = "CampusStudio";
            PlayerSettings.productName = "Campus Survival";
            PlayerSettings.defaultScreenWidth = 1440;
            PlayerSettings.defaultScreenHeight = 900;
            PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.runInBackground = false;
            var settingsAssets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");
            if (settingsAssets.Length > 0)
            {
                var settings = new SerializedObject(settingsAssets[0]);
                var input = settings.FindProperty("activeInputHandler");
                if (input != null && input.intValue != 0) { input.intValue = 0; settings.ApplyModifiedPropertiesWithoutUndo(); }
            }
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }
        static CampusApp PrepareScene()
        {
            var scene = SceneManager.GetActiveScene();
            var app = scene.GetRootGameObjects().SelectMany(x => x.GetComponentsInChildren<CampusApp>(true)).FirstOrDefault();
            if (app == null) app = new GameObject("Campus Survival").AddComponent<CampusApp>();
            app.gameObject.SetActive(true); app.enabled = true;
            app.RenderEditorPreview();
            EditorSceneManager.MarkSceneDirty(scene);
            return app;
        }
        static void CreateScene()
        {
            Directory.CreateDirectory("Assets/Campus/Scenes");
            var previousScene = SceneManager.GetActiveScene();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive);
            SceneManager.SetActiveScene(scene);
            PrepareScene();
            EditorSceneManager.SaveScene(scene, ScenePath);
            SceneManager.SetActiveScene(previousScene);
            EditorSceneManager.CloseScene(scene, true);
            AssetDatabase.Refresh();
        }
        [MenuItem("Campus/Open Game Scene")]
        public static void OpenScene()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) { Debug.LogWarning("먼저 Play를 종료해주세요."); return; }
            Configure();
            if (!File.Exists(ScenePath)) CreateScene();
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            EditorSceneManager.OpenScene(ScenePath);
            PrepareScene();
            EditorSceneManager.SaveScene(SceneManager.GetActiveScene());
            Debug.Log("Campus 시작 장면 준비 완료. Game 탭에서 배경과 대화 UI가 보이는지 확인한 뒤 Play를 누르세요.");
        }
        [MenuItem("Campus/Repair Startup Scene")]
        public static void RepairStartup() { OpenScene(); }

        [MenuItem("Campus/Check Current UI")]
        public static void CheckCurrentUi()
        {
            try
            {
                var app = UnityEngine.Object.FindFirstObjectByType<CampusApp>();
                if (app == null) throw new Exception("CampusApp이 없습니다. Campus → Open Game Scene을 선택해주세요.");
                var canvas = app.GetComponentsInChildren<Canvas>(true).FirstOrDefault(x => x.enabled && x.gameObject.activeInHierarchy);
                if (canvas == null) throw new Exception("활성 Canvas가 없습니다. Console의 첫 초기화 오류를 확인해주세요.");
                Canvas.ForceUpdateCanvases();
                var texts = canvas.GetComponentsInChildren<Text>().Where(x => x.gameObject.activeInHierarchy).ToArray();
                if (texts.Length < 4 || texts.Any(x => x.font == null)) throw new Exception("텍스트 또는 폰트 생성이 불완전합니다.");
                if (!canvas.GetComponentsInChildren<RawImage>().Any(x => x.texture != null)) throw new Exception("배경 이미지가 표시되지 않았습니다.");
                if (canvas.GetComponentsInChildren<Button>().Length < 3) throw new Exception("화면 이동/선택 버튼이 부족합니다.");
                var bounds = ((RectTransform)canvas.transform).rect;
                if (bounds.width <= 0 || bounds.height <= 0) throw new Exception("Canvas 크기가 0입니다.");
                Debug.Log("Campus UI 검사 통과: Canvas " + bounds.size + ", 텍스트 " + texts.Length + ", 버튼/배경/폰트 생성 확인. 실제 배치와 플레이 흐름은 Game 화면에서 검수해주세요.");
            }
            catch (Exception e) { Debug.LogError("Campus UI 검사 실패: " + e.Message); }
        }
        [MenuItem("Campus/Build Windows")]
        public static void BuildWindows()
        {
            Configure();
            if (!File.Exists(ScenePath)) CreateScene();
            Directory.CreateDirectory("Builds/Windows");
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath }, locationPathName = "Builds/Windows/CampusSurvival.exe",
                target = BuildTarget.StandaloneWindows64, options = BuildOptions.None
            });
            if (report.summary.result != BuildResult.Succeeded) throw new Exception("Windows 빌드 실패: " + report.summary.result);
            Debug.Log("Windows build: " + Path.GetFullPath("Builds/Windows/CampusSurvival.exe"));
        }
    }
}
