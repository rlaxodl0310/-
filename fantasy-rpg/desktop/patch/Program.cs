using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
class Program {
 [STAThread]
 static int Main(){
  Application.EnableVisualStyles();
  try{
   var root=AppDomain.CurrentDomain.BaseDirectory;var manifest=PatchCore.Read(Path.Combine(root,"manifest.json"));var payload=Path.Combine(root,"app.asar");
   if(PatchCore.Hash(payload)!=manifest.sha256)throw new Exception("패치 파일 검사 값이 다릅니다. ZIP을 다시 내려받아 폴더 전체를 압축 해제해 주세요.");
   MessageBox.Show("게임을 저장하고 완전히 종료해 주세요.\n다음 화면에서 FantasyStory.exe가 있는 설치 폴더를 선택합니다.\n로그인 정보와 게임 저장은 유지됩니다.","이세계 기록 패치",MessageBoxButtons.OK,MessageBoxIcon.Information);
   string folder;using(var picker=new FolderBrowserDialog()){picker.Description="FantasyStory.exe가 있는 폴더를 선택하세요";picker.ShowNewFolderButton=false;if(picker.ShowDialog()!=DialogResult.OK)return 0;folder=Path.GetFullPath(picker.SelectedPath);}
   var exe=Path.Combine(folder,"FantasyStory.exe");
   foreach(var process in Process.GetProcessesByName("FantasyStory")){try{if(String.Equals(process.MainModule.FileName,exe,StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("게임이 아직 실행 중입니다. 완전히 종료하고 다시 시도해 주세요.");}catch(System.ComponentModel.Win32Exception){throw new InvalidOperationException("게임 실행 여부를 확인하지 못했습니다. 게임을 종료하고 다시 시도해 주세요.");}finally{process.Dispose();}}
   if(MessageBox.Show(PatchCore.InstalledVersion(folder)+" → "+manifest.version+" 버전으로 패치할까요?\n게임 파일만 교체하고 기존 파일은 백업합니다.","패치 확인",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return 0;
   var backup=PatchCore.Apply(folder,payload,manifest);
   if(MessageBox.Show("패치 완료: "+manifest.version+"\n기존 파일은 resources 폴더에 백업했습니다.\n지금 게임을 실행할까요?","이세계 기록",MessageBoxButtons.YesNo,MessageBoxIcon.Information)==DialogResult.Yes){try{Process.Start(new ProcessStartInfo(exe){WorkingDirectory=folder,UseShellExecute=true});}catch{MessageBox.Show("패치는 완료됐습니다. FantasyStory.exe를 직접 실행해 주세요.");}}
   return 0;
  }catch(Exception error){MessageBox.Show(error.Message,"패치하지 못했습니다",MessageBoxButtons.OK,MessageBoxIcon.Error);return 1;}
 }
}
