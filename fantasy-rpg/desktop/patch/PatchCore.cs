using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
[DataContract]
public class Manifest {
 [DataMember] public string product;
 [DataMember] public string version;
 [DataMember] public string sha256;
 [DataMember] public string minimumVersion;
}
public static class PatchCore {
 public static Manifest Read(string file){using(var stream=File.OpenRead(file))return (Manifest)new DataContractJsonSerializer(typeof(Manifest)).ReadObject(stream);}
 public static string Hash(string file){using(var input=File.OpenRead(file))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(input)).Replace("-", "").ToLowerInvariant();}
 public static string InstalledVersion(string folder){var file=Path.Combine(folder,"resources","desktop-version.json");return File.Exists(file)?Read(file).version:"0.1.0";}
 public static string Apply(string folder,string payload,Manifest manifest){
  if(manifest.product!="FantasyStory"||manifest.sha256==null||manifest.sha256.Length!=64)throw new Exception("올바른 패치 파일이 아닙니다.");
  var next=new Version(manifest.version);var current=new Version(InstalledVersion(folder));if(current<new Version(manifest.minimumVersion))throw new Exception("전체 앱을 먼저 설치해야 합니다.");if(current>next)throw new Exception("이미 더 최신 버전이 설치돼 있습니다.");
  if(Hash(payload)!=manifest.sha256)throw new Exception("패치 파일 검사 값이 다릅니다. 다시 다운로드해 주세요.");
  var resources=Path.Combine(folder,"resources");var target=Path.Combine(resources,"app.asar");
  if(!File.Exists(Path.Combine(folder,"FantasyStory.exe"))||!File.Exists(target)||!File.Exists(Path.Combine(resources,"codex-win32-x64","bin","codex.exe")))throw new Exception("이세계 기록 앱 폴더가 아닙니다.");
  var id=Guid.NewGuid().ToString("N");var temp=target+".new-"+id;var backup=target+".backup-"+id;var versionFile=Path.Combine(resources,"desktop-version.json");var versionTemp=versionFile+".new-"+id;var oldVersion=File.Exists(versionFile)?File.ReadAllText(versionFile,Encoding.UTF8):null;bool replaced=false;
  try{
   File.Copy(payload,temp,false);if(Hash(temp)!=manifest.sha256)throw new Exception("패치 복사를 확인하지 못했습니다.");
   File.Replace(temp,target,backup);replaced=true;
   File.WriteAllText(versionTemp,"{\"product\":\"FantasyStory\",\"version\":\""+manifest.version+"\"}",new UTF8Encoding(false));
   if(File.Exists(versionFile))File.Replace(versionTemp,versionFile,null);else File.Move(versionTemp,versionFile);
   return backup;
  }catch(Exception error){
   if(replaced){try{File.Copy(backup,target,true);if(oldVersion==null){if(File.Exists(versionFile))File.Delete(versionFile);}else File.WriteAllText(versionFile,oldVersion,Encoding.UTF8);}catch{throw new Exception(error.Message+"\n자동 복원에 실패했습니다. app.asar.backup 파일을 보존하고 문의해 주세요.");}}
   throw new Exception(error.Message+(replaced?"\n기존 버전으로 복원했습니다.":"\n설치 파일은 변경하지 않았습니다."));
  }finally{if(File.Exists(temp))File.Delete(temp);if(File.Exists(versionTemp))File.Delete(versionTemp);}
 }
}
