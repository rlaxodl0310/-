using System;
using System.IO;
class PatchCoreTests {
 static string Fixture(string root){var folder=Path.Combine(root,Guid.NewGuid().ToString("N"));Directory.CreateDirectory(Path.Combine(folder,"resources","codex-win32-x64","bin"));File.WriteAllText(Path.Combine(folder,"FantasyStory.exe"),"fixture");File.WriteAllText(Path.Combine(folder,"resources","codex-win32-x64","bin","codex.exe"),"keep-codex");File.WriteAllText(Path.Combine(folder,"resources","app.asar"),"old-game");File.WriteAllText(Path.Combine(folder,"saved-game.txt"),"keep-save");return folder;}
 static void Check(bool value,string message){if(!value)throw new Exception(message);}
 static int Main(){var root=Path.Combine(Path.GetTempPath(),"fantasy-patch-test-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);try{
  var payload=Path.Combine(root,"payload");File.WriteAllText(payload,"new-game");var m=new Manifest{product="FantasyStory",version="0.2.0",minimumVersion="0.1.0",sha256=PatchCore.Hash(payload)};
  var good=Fixture(root);var backup=PatchCore.Apply(good,payload,m);Check(File.ReadAllText(Path.Combine(good,"resources","app.asar"))=="new-game","update failed");Check(File.ReadAllText(backup)=="old-game","backup failed");Check(PatchCore.InstalledVersion(good)=="0.2.0","version failed");Check(File.ReadAllText(Path.Combine(good,"saved-game.txt"))=="keep-save","save changed");Check(File.ReadAllText(Path.Combine(good,"resources","codex-win32-x64","bin","codex.exe"))=="keep-codex","codex changed");
  var corrupt=Fixture(root);var bad=new Manifest{product=m.product,version=m.version,minimumVersion=m.minimumVersion,sha256=new String('0',64)};bool rejected=false;try{PatchCore.Apply(corrupt,payload,bad);}catch{rejected=true;}Check(rejected&&File.ReadAllText(Path.Combine(corrupt,"resources","app.asar"))=="old-game","corrupt payload changed installation");
  var rollback=Fixture(root);Directory.CreateDirectory(Path.Combine(rollback,"resources","desktop-version.json"));rejected=false;try{PatchCore.Apply(rollback,payload,m);}catch{rejected=true;}Check(rejected&&File.ReadAllText(Path.Combine(rollback,"resources","app.asar"))=="old-game","rollback failed");
  var newer=Fixture(root);File.WriteAllText(Path.Combine(newer,"resources","desktop-version.json"),"{\"version\":\"9.0.0\"}");rejected=false;try{PatchCore.Apply(newer,payload,m);}catch{rejected=true;}Check(rejected&&File.ReadAllText(Path.Combine(newer,"resources","app.asar"))=="old-game","downgrade accepted");
  Console.WriteLine("Patch tests passed: update, backup/version, save/runtime preservation, checksum rejection, rollback, downgrade rejection.");return 0;
 }catch(Exception error){Console.Error.WriteLine(error.Message);return 1;}finally{Directory.Delete(root,true);}}
}
