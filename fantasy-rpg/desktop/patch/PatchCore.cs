using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
[DataContract]
public class Manifest {
 [DataMember] public string product;
 [DataMember] public string version;
 [DataMember] public string sha256;
 [DataMember] public string minimumVersion;
}
[DataContract] public class AsarIndex { [DataMember] public Dictionary<string, AsarEntry> files; }
[DataContract] public class AsarEntry { [DataMember] public long size; [DataMember] public string offset; }
[DataContract] public class GamePackage { [DataMember] public string name; [DataMember] public string version; }
public static class PatchCore {
 public static Manifest Read(string file){using(var stream=File.OpenRead(file))return (Manifest)new DataContractJsonSerializer(typeof(Manifest)).ReadObject(stream);}
 public static string Hash(string file){using(var input=File.OpenRead(file))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(input)).Replace("-", "").ToLowerInvariant();}
 public static GamePackage Identity(string folder){var asar=Path.Combine(folder,"resources","app.asar");using(var stream=File.OpenRead(asar))using(var reader=new BinaryReader(stream)){if(stream.Length<16||reader.ReadUInt32()!=4)throw new Exception("app.asar 헤더가 올바르지 않습니다.");var header=reader.ReadUInt32();reader.ReadUInt32();var length=reader.ReadUInt32();if(header<8||header>16777216||length>header-8||length<2||8L+header>stream.Length)throw new Exception("app.asar 크기가 올바르지 않습니다.");var bytes=reader.ReadBytes((int)length);AsarIndex index;using(var json=new MemoryStream(bytes)){var serializer=new DataContractJsonSerializer(typeof(AsarIndex),new DataContractJsonSerializerSettings{UseSimpleDictionaryFormat=true});index=(AsarIndex)serializer.ReadObject(json);}AsarEntry entry;if(index.files==null||!index.files.TryGetValue("package.json",out entry)||entry.size<2||entry.size>131072)throw new Exception("게임 정보 파일이 없습니다.");long offset;if(!Int64.TryParse(entry.offset,out offset)||offset<0||offset>stream.Length-8L-header-entry.size)throw new Exception("게임 정보 위치가 잘못됐습니다.");stream.Position=8L+header+offset;using(var data=new MemoryStream(reader.ReadBytes((int)entry.size)))return (GamePackage)new DataContractJsonSerializer(typeof(GamePackage)).ReadObject(data);}}
 public static string InspectionError(string folder){try{if(!File.Exists(Path.Combine(folder,"FantasyStory.exe")))return "FantasyStory.exe를 찾지 못했습니다.";if(!File.Exists(Path.Combine(folder,"resources","app.asar")))return "resources\\app.asar가 없습니다. 앱 ZIP 전체를 압축 해제해 주세요.";var p=Identity(folder);if(p==null||p.name!="fantasy-story-desktop")return "다른 앱의 파일입니다. 이세계 기록 설치본을 선택해 주세요.";Version parsed;if(!Version.TryParse(p.version,out parsed))return "설치된 게임의 버전 정보가 잘못됐습니다.";return null;}catch(Exception e){return "게임 정보를 읽지 못했습니다: "+e.Message;}}
 public static string InstalledVersion(string folder){var problem=InspectionError(folder);if(problem!=null)throw new Exception(problem);var file=Path.Combine(folder,"resources","desktop-version.json");if(File.Exists(file)){var marker=Read(file);if(marker.product!="FantasyStory")throw new Exception("설치 버전 파일의 제품 정보가 다릅니다.");Version version;if(!Version.TryParse(marker.version,out version))throw new Exception("설치 버전 파일을 읽지 못했습니다.");return marker.version;}return Identity(folder).version;}
 public static string Apply(string folder,string payload,Manifest manifest){
  if(manifest.product!="FantasyStory"||manifest.sha256==null||manifest.sha256.Length!=64)throw new Exception("올바른 패치 파일이 아닙니다.");
  var next=new Version(manifest.version);var current=new Version(InstalledVersion(folder));if(current<new Version(manifest.minimumVersion))throw new Exception("전체 앱을 먼저 설치해야 합니다.");if(current>next)throw new Exception("이미 더 최신 버전이 설치돼 있습니다.");
  if(Hash(payload)!=manifest.sha256)throw new Exception("패치 파일 검사 값이 다릅니다. 다시 다운로드해 주세요.");
  var resources=Path.Combine(folder,"resources");var target=Path.Combine(resources,"app.asar");
  var problem=InspectionError(folder);if(problem!=null)throw new Exception(problem);
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
