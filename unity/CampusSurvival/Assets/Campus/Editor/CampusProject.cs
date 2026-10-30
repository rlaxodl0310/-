using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

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
            // UGUI StandaloneInputModule + Input.GetKeyDown use the built-in Input Manager.
            var settingsAssets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");
            if (settingsAssets.Length > 0)
            {
                var settings = new SerializedObject(settingsAssets[0]);
                var input = settings.FindProperty("activeInputHandler");
                if (input != null && input.intValue != 0) { input.intValue = 0; settings.ApplyModifiedPropertiesWithoutUndo(); }
            }
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }
        static void CreateScene()
        {
            Directory.CreateDirectory("Assets/Campus/Scenes");
            // Never replace an unsaved user scene. Save and restore the current editor layout.
            var previous = EditorSceneManager.GetSceneManagerSetup();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorSceneManager.CloseScene(scene, true);
            if (previous.Length > 0 && !SceneManager.GetActiveScene().isLoaded) EditorSceneManager.RestoreSceneManagerSetup(previous);
            AssetDatabase.Refresh();
        }
        [MenuItem("Campus/Open Game Scene")]
        public static void OpenScene()
        {
            Configure();
            if (!File.Exists(ScenePath)) CreateScene();
            if (EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) EditorSceneManager.OpenScene(ScenePath);
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
            if (report.summary.result != BuildResult.Succeeded) throw new System.Exception("Windows 빌드 실패: " + report.summary.result);
            Debug.Log("Windows build: " + Path.GetFullPath("Builds/Windows/CampusSurvival.exe"));
        }
    }
}
