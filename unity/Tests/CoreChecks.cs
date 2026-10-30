using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using CampusSurvival;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

class CoreChecks
{
    static int count;
    static WorldData world;
    static readonly JsonSerializerOptions Json = new JsonSerializerOptions { IncludeFields = true };
    static void Check(string name, Action action)
    { try { action(); Console.WriteLine("PASS " + name); count++; } catch(Exception e) { Console.Error.WriteLine("FAIL " + name + "\n" + e); Environment.Exit(1); } }
    static void True(bool value) { if(!value) throw new Exception("Assertion failed"); }
    static void Reject(Action a) { bool rejected=false; try { a(); } catch(InvalidOperationException) { rejected=true; } True(rejected); }
    static CampusEngine Game(int minute=540, string loc="arts", string room="", int day=1)
    { var g=new CampusEngine(world); g.S.day=day; g.S.minute=minute; g.S.location=loc; g.S.room=room; return g; }
    static Actor Actor(CampusEngine g,string id="yeogyeong") { return g.S.actors.First(x=>x.id==id); }
    static CampusEngine Reload(CampusEngine g) { return new CampusEngine(world,JsonSerializer.Deserialize<CampusState>(JsonSerializer.Serialize(g.S,Json),Json)); }
    static void Main(string[] args)
    {
        world=JsonSerializer.Deserialize<WorldData>(File.ReadAllText(args[0]),Json);
        if(args.Length>=3&&args[1]=="--layout") {File.WriteAllText(args[2],JsonSerializer.Serialize(VnComposition.Create(1600,900,.5f),Json));return;}
        Check("Unity UI/editor C# syntax (not Unity API compilation)",()=>{
            string assets=Path.GetFullPath(Path.Combine(Path.GetDirectoryName(args[0]), "../.."));
            foreach(string file in Directory.GetFiles(assets,"*.cs",SearchOption.AllDirectories)) {
                var errors=CSharpSyntaxTree.ParseText(File.ReadAllText(file)).GetDiagnostics().Where(x=>x.Severity==DiagnosticSeverity.Error).ToArray();
                if(errors.Length>0)throw new Exception(file+"\n"+string.Join("\n",errors.Select(x=>x.ToString())));
            }
        });
        Check("shipped scene binds the enabled startup MonoBehaviour",()=>{
            string assets=Path.GetFullPath(Path.Combine(Path.GetDirectoryName(args[0]), "../.."));
            string runtime=File.ReadAllText(Path.Combine(assets,"Runtime/CampusApp.cs.meta"));
            string guid=runtime.Split('\n').First(x=>x.StartsWith("guid:")).Substring(6).Trim();
            string scene=File.ReadAllText(Path.Combine(assets,"Scenes/Campus.unity"));
            True(scene.Contains("m_Name: Campus Survival")&&scene.Contains("m_Enabled: 1")&&scene.Contains("guid: "+guid));
        });
        Check("build settings point to the shipped scene GUID",()=>{
            string assets=Path.GetFullPath(Path.Combine(Path.GetDirectoryName(args[0]), "../.."));
            string meta=File.ReadAllText(Path.Combine(assets,"Scenes/Campus.unity.meta"));
            string guid=meta.Split('\n').First(x=>x.StartsWith("guid:")).Substring(6).Trim();
            string settings=File.ReadAllText(Path.GetFullPath(Path.Combine(assets,"../../ProjectSettings/EditorBuildSettings.asset")));
            True(settings.Contains("path: Assets/Campus/Scenes/Campus.unity")&&settings.Contains("guid: "+guid));
        });
        Check("exported 15 locations and concrete arts rooms",()=>{ True(world.buildings.Length==15); True(world.buildings.First(x=>x.id=="arts").rooms.Any(x=>x.name.Contains("409"))); True(world.lessons.Length==24); });
        Check("cold start has no names, no club, 09:00",()=>{ var g=Game(); True(g.S.actors.All(x=>!x.named)); True(g.S.clubs.Count==0); True(g.S.minute==540); });
        Check("reading views consumes no clock or randomness",()=>{ var g=Game(); int seed=g.S.seed; for(int i=0;i<100;i++)g.View(); True(g.S.minute==540&&g.S.seed==seed); });
        Check("three short distinct actions batch time",()=>{ var g=Game(); g.Dispatch("look"); g.S.randomEvent=""; g.Dispatch("look"); True(g.S.minute==540); g.Dispatch("rooms"); g.Dispatch("room","band"); True(g.S.minute==540); g.Dispatch("travel"); g.Dispatch("visit","music"); True(g.S.minute==570); });
        Check("room-specific actual attendance",()=>{ var g=Game(570,"arts","band"); g.Dispatch("class","1:taei:ensemble"); g.Dispatch("classChoice","blend"); True(g.S.minute==660); True(g.S.attendance.Any(x=>x.id=="1:taei:ensemble"&&x.text.Contains("출석"))); });
        Check("wrong room cannot attend",()=>{ var g=Game(570,"arts","classes"); Reject(()=>g.Dispatch("class","1:taei:ensemble")); });
        Check("class skipping remains free, records absence",()=>{ var g=Game(570); g.Advance(90); True(g.S.attendance.Any(x=>x.text.Contains("결석"))); True(g.View().utilityActions.Any(x=>x.id=="travel")); });
        Check("late and partial class records",()=>{ foreach(var pair in new[]{(580,"지각"),(600,"부분 참석")}) { var g=Game(pair.Item1,"arts","band"); g.Dispatch("class","1:taei:ensemble"); g.Dispatch("classChoice","blend"); True(g.S.attendance.First().text.Contains(pair.Item2)); } });
        Check("NPC class and room privacy priority",()=>{ var g=Game(600,"creative","nursing"); True(g.Present().Any(x=>x.id=="yeogyeong")); True(!g.Available(Actor(g))); g.S.room="art"; True(!g.Present().Any()); });
        Check("NPCs move with passing time",()=>{ var g=Game(800,"hall"); string before=g.LocationOf(Actor(g)); bool moved=false; for(int i=0;i<6;i++){g.Advance(60); if(g.LocationOf(Actor(g))!=before)moved=true;} True(moved); });
        Check("first encounter does not expose name or seniority",()=>{ var g=Game(800,"hall"); g.Dispatch("encounter"); g.Dispatch("talk","yeogyeong"); True(!g.View().text.Contains("선배")); True(!g.View().title.Contains("차여경")); g.Dispatch("respond","introduce"); True(g.View().title=="차여경"); True(!Actor(g).seniorityKnown); });
        Check("saved dialogue does not reroll",()=>{ var g=Game(800,"hall"); g.Dispatch("encounter"); g.Dispatch("talk","yeogyeong"); g.Dispatch("respond","work"); var r=Reload(g); True(g.View().text==r.View().text&&g.S.seed==r.S.seed); });
        Check("same question can generate distinct replies without free relationship farming",()=>{ var g=Game(800,"hall"); g.Dispatch("encounter"); g.Dispatch("talk","yeogyeong"); g.Dispatch("respond","check"); int trust=Actor(g).trust; var first=g.S.narrative; g.Dispatch("respond","follow"); g.Dispatch("respond","follow"); True(g.S.narrative!=first); True(Actor(g).trust==trust); });
        Check("menu returns to exact dialogue",()=>{ var g=Game(800,"hall"); g.Dispatch("encounter"); g.Dispatch("talk","yeogyeong"); string line=g.S.narrative; g.OpenUtility("phone"); g.Dispatch("community"); g.Dispatch("phone"); g.Dispatch("back"); True(g.S.screen=="dialogue"&&g.S.narrative==line&&g.S.minute==800); });
        Check("phone community has no time cost and knowledge source",()=>{ var g=Game(); g.OpenUtility("phone"); g.Dispatch("community"); g.Dispatch("post","library-seats"); True(g.S.minute==540); True(g.S.knowledge.Last().text.Contains("미확인")); });
        Check("community evolves only on simulation time",()=>{ var g=Game(); int posts=g.S.feed.Count; for(int i=0;i<20;i++)g.View(); True(g.S.feed.Count==posts); g.Advance(60); True(g.S.feed.Count==posts+1); });
        Check("application cannot join instantly",()=>{ var g=Game(780,"hall","clubs"); g.OpenUtility("phone"); g.Dispatch("clubs"); g.Dispatch("apply","volunteer"); Reject(()=>g.Dispatch("join","volunteer")); g.Dispatch("back"); True(!g.View().actions.Any(x=>x.id=="interview")); });
        Check("in-person two-exchange interview and delayed acceptance",()=>{ var g=Game(780,"hall","clubs"); g.OpenUtility("phone"); g.Dispatch("clubs"); g.Dispatch("apply","volunteer"); g.Dispatch("back"); g.Advance(30); g.Dispatch("interview","volunteer"); g.Dispatch("interviewAnswer","honest"); True(g.S.minute==810); g=Reload(g); g.Dispatch("interviewAnswer","honest"); True(g.S.minute==830); True(g.S.clubs[0].status=="reviewing"); g.Advance(30); g.OpenUtility("phone"); g.Dispatch("clubs"); g.Dispatch("join","volunteer"); True(g.S.clubs[0].status=="accepted"); });
        Check("cafe payment, pickup and drink commit once",()=>{ var g=Game(800,"cafe"); g.Dispatch("counter"); g.Dispatch("drink","latte"); g.Dispatch("temperature","iced"); True(g.S.spent==0); g.Dispatch("pay"); True(g.S.spent==3800); Reject(()=>g.Dispatch("pay")); g=Reload(g); g.Dispatch("waitDrink"); g.Dispatch("collect"); Reject(()=>g.Dispatch("collect")); True(g.S.inventory.Count==1); g.Dispatch("consume"); True(g.S.inventory.Count==0); });
        Check("cancelled unpaid order costs nothing",()=>{ var g=Game(800,"cafe"); g.Dispatch("counter"); g.Dispatch("drink","tea"); g.Dispatch("temperature","hot"); g.Dispatch("cancelOrder"); True(g.S.spent==0&&g.S.order==null); });
        Check("offscreen supply changes NPC peers without player diary or names",()=>{ var g=Game(780,"music"); int entries=g.S.journal.Count; g.Advance(180); True(g.S.supply.resolved&&!g.S.supply.attended); True(g.S.peers[0].trust==4); True(g.S.actors.All(x=>!x.named)); True(g.S.journal.Count==entries); });
        Check("late supply uses actual remaining time and witnesses",()=>{ var g=Game(900,"hall"); g.Dispatch("supply"); g.Dispatch("supplyChoice","share"); g.Dispatch("supplyChoice","share"); g.Dispatch("supplyChoice","share"); True(g.S.minute==960); True(g.S.supply.finished); True(!g.S.supply.witnesses.Contains("soyul")); True(!Actor(g,"soyul").named); });
        Check("supply completion cannot duplicate relationship reward",()=>{ var g=Game(780,"hall"); g.Dispatch("supply"); for(int i=0;i<3;i++)g.Dispatch("supplyChoice","share"); int trust=Actor(g).trust; Reject(()=>g.Dispatch("supplyChoice","share")); True(Actor(g).trust==trust); });
        Check("known witness initiates next-day optional proposal",()=>{ var g=Game(780,"hall"); g.Dispatch("supply"); for(int i=0;i<3;i++)g.Dispatch("supplyChoice","share"); g.Dispatch("back"); g.Advance(60); g.Dispatch("home"); g.Dispatch("nextDay"); True(g.S.day==2&&g.S.minute==540); True(g.S.appointments.Count==1&&g.S.appointments[0].status=="offered"); });
        Check("meeting requires twenty actual minutes not just arrival",()=>{ var g=Game(810,"library",day:2); var p=Actor(g); p.named=true; p.trust=3; g.S.appointments.Add(new Appointment{id="test",person=p.id,day=2,minute=810,location="library",label="잠깐"}); g.OpenUtility("phone"); g.Dispatch("appointments"); g.Dispatch("accept","test"); g.Dispatch("back"); g.Dispatch("meeting","test"); g.Dispatch("meetingChoice","listen"); True(g.S.appointments[0].status=="pending"&&g.S.minute==820); g=Reload(g); g.Dispatch("meetingChoice","share"); True(g.S.appointments[0].status=="kept"&&g.S.minute==830); });
        Check("decline no penalty, missed accepted proposal penalized once",()=>{ var g=Game(800,"hall",day:2); var p=Actor(g); g.S.appointments.Add(new Appointment{id="m",person=p.id,day=2,minute=810,location="hall",label="약속",status="pending"}); g.Advance(60); int t=p.tension; g.Advance(15); True(t==1&&p.tension==1); });
        Check("high affection cannot override class or strong tension",()=>{ var g=Game(600,"creative"); var p=Actor(g); p.affection=99; True(!g.Available(p,20)); g.S.minute=800; g.S.location="hall"; p.tension=8; g.Dispatch("encounter"); g.Dispatch("talk",p.id); True(g.S.narrative.Contains("길게")); });
        foreach(string id in new[]{"basketball","cooking","carry"}) Check(id+" input survives reload, pauses in menus and commits duration once",()=>{
            string loc=id=="basketball"?"gym":id=="cooking"?"cafeteria":"hall"; string room=id=="basketball"?"court":id=="cooking"?"kitchen":"meeting";
            var g=Game(800,loc,room); g.Dispatch("activity",id); g.Dispatch("activityChoice","share"); g.Dispatch("miniStart"); g.AdvanceMini(100); int elapsed=g.S.activity.elapsedMs; g.OpenUtility("phone"); g.AdvanceMini(100); True(g.S.activity.elapsedMs==elapsed&&g.S.activity.phase==2); g=Reload(g); g.Dispatch("back"); g.Dispatch("miniStart");
            for(int i=0;i<3;i++){ for(int k=0;k<5;k++)g.AdvanceMini(100); g.Dispatch("miniHit"); }
            True(g.S.activity.phase==3); int before=g.S.minute; g.Dispatch("miniConfirm"); Reject(()=>g.Dispatch("miniConfirm")); True(g.S.minute>before); g.Dispatch("activityChoice","finish"); True(g.S.activity.status=="completed"); True(g.S.minute==800+(id=="cooking"?45:60)); });
        Check("mini assisted path does not claim timing input",()=>{ var g=Game(800,"gym","court"); g.Dispatch("activity","basketball"); g.Dispatch("activityChoice","share"); g.Dispatch("miniAssist"); True(g.S.activity.assisted&&g.S.activity.attempts==0); });
        Check("time cannot overflow into next day",()=>{ var g=Game(1315); Reject(()=>g.Advance(10)); True(g.S.minute==1315); });
        Check("three-day boundary has explicit completion",()=>{ var g=Game(1100,day:3); g.Dispatch("home"); g.Dispatch("nextDay"); True(g.S.ended&&g.S.day==3); True(g.View().text.Contains("아직 구현되지")); });
        Check("dialogue RNG cannot teleport NPCs",()=>{ var g=Game(800,"hall"); g.Dispatch("encounter"); g.Dispatch("talk","yeogyeong"); string loc=g.LocationOf(Actor(g)); g.Dispatch("respond","work"); g.Dispatch("respond","follow"); True(g.LocationOf(Actor(g))==loc); });
        Check("all authored lessons point to an existing room",()=>{ foreach(var c in world.lessons) True(world.buildings.Any(b=>b.id==c.location&&b.rooms.Any(r=>r.id==c.room))); });
        Check("NPC class fatigue updates only once and is private",()=>{ var g=Game(600); g.Advance(60); int fatigue=Actor(g).fatigue; int known=g.S.knowledge.Count; g.Advance(1); True(fatigue==1&&Actor(g).fatigue==fatigue&&g.S.knowledge.Count==known); });
        Check("last-minute short actions cannot overflow",()=>{ var g=Game(1315); g.S.pace.Add("a");g.S.pace.Add("b");g.Dispatch("look");True(g.S.minute==1320);True(g.View().actions.Count==1&&g.View().actions[0].id=="home"); });
        Check("new story memories stay with their actual participant",()=>{ var g=Game(810,"library",day:2); var p=Actor(g); p.named=true;p.trust=3; g.S.appointments.Add(new Appointment{id="f",kind="followup",person=p.id,day=2,minute=810,location="library",label="이야기",status="pending"});g.Dispatch("meeting","f");g.Dispatch("meetingChoice","listen");g.Dispatch("meetingChoice","share");True(p.memories.Contains("followup:shared"));True(!Actor(g,"soyul").memories.Any(x=>x.StartsWith("followup:"))); });
        Check("entire three-day attendance and home loop",()=>{ var g=Game(); for(int day=1;day<=3;day++){foreach(var c in g.Lessons().ToArray()){g.S.screen="place";g.S.location=c.location;g.S.room=c.room;if(g.S.minute<c.start)g.Advance(c.start-g.S.minute);g.Dispatch("class",c.Key);g.Dispatch("classChoice",c.choices[0].id);}g.Advance(1020-g.S.minute);g.Dispatch("home");g.Dispatch("nextDay");}True(g.S.ended);True(g.S.attendance.Count==6);True(g.S.attendance.All(x=>x.text.Contains("출석"))); });
        Check("a free NPC cannot appear in every room in the same building",()=>{ var g=Game(800,"hall","musicClub");True(!g.Present().Any());g.S.room="clubs";True(g.Present().Any(x=>x.id=="yeogyeong")); });
        Check("Taei portrait is visible on ordinary arrival, class and quiet screens",()=>{
            var g=Game();True(g.View().portrait=="taei");g.Dispatch("goClass","1:taei:ensemble");True(g.View().portrait=="taei");g.Dispatch("waitClass","1:taei:ensemble");g.Dispatch("class","1:taei:ensemble");True(g.View().portrait=="taei");
        });
        Check("real encounter shows an unnamed NPC illustration without disclosing identity",()=>{
            var g=Game(800,"hall");g.Dispatch("encounter");True(g.View().portrait==g.Present().First().id);True(!g.View().text.Contains("차여경"));g.Dispatch("talk","yeogyeong");True(g.View().portrait=="yeogyeong");
        });
        Check("no story screen has a hidden multi-page choice list",()=>{
            foreach(var b in world.buildings)foreach(int day in new[]{1,2,3})foreach(int minute in new[]{540,570,800,1020,1320}){
                var g=Game(minute,b.id,day:day);True(g.View().actions.Count<=3);foreach(var a in g.View().actions)True(!new[]{"rooms","travel","umbrella","wait"}.Contains(a.id));
            }
            var talk=Game(800,"hall");talk.Dispatch("encounter");talk.Dispatch("talk","yeogyeong");for(int step=0;step<4;step++){talk.S.dialogueStep=step;True(talk.View().actions.Count<=3);}
        });
        Check("moved scene actions stay accessible in the menu and show their result",()=>{
            var g=Game(800,"hall");g.S.playerStrain=4;int minute=g.S.minute;g.OpenUtility("menu");True(g.View().utilityActions.Any(x=>x.id=="rooms"));True(g.View().utilityActions.Any(x=>x.id=="wait"));True(g.S.minute==minute);g.Dispatch("rest");True(g.S.screen=="place"&&g.S.minute==minute+15&&g.S.playerStrain==2);
        });
        Check("asking about work learns information, sharing music discloses only to the listener",()=>{
            var g=Game(800,"hall");g.Dispatch("encounter");g.Dispatch("talk","yeogyeong");g.Dispatch("respond","work");True(g.S.knowledge.Any(x=>x.id=="conversation:yeogyeong:1:work"));True(!Actor(g).memories.Contains("song"));g.Dispatch("respond","share");True(Actor(g).memories.Contains("song"));True(!Actor(g,"soyul").memories.Contains("song"));
        });
        Check("consent and self-disclosure choices produce different relationship consequences",()=>{
            var a=Game(800,"hall");a.Dispatch("encounter");a.Dispatch("talk","yeogyeong");a.Dispatch("respond","check");
            var b=Game(800,"hall");b.Dispatch("encounter");b.Dispatch("talk","yeogyeong");b.Dispatch("respond","work");b.Dispatch("respond","share");
            True(Actor(a).trust==1&&Actor(b).trust==0);True(Actor(b).memories.Contains("song")&&!Actor(a).memories.Contains("song"));
        });
        Check("the same conversation choice cannot repeatedly farm trust",()=>{
            var g=Game(800,"hall");for(int i=0;i<2;i++){g.Dispatch("encounter");g.Dispatch("talk","yeogyeong");g.Dispatch("respond","check");g.Dispatch("back");}True(Actor(g).trust==1);
        });
        Check("a completed conversation stops offering endless identical followups",()=>{
            var g=Game(800,"hall");g.Dispatch("encounter");g.Dispatch("talk","yeogyeong");g.Dispatch("respond","introduce");g.Dispatch("respond","follow");g.Dispatch("respond","share");True(!g.View().actions.Concat(g.View().utilityActions).Any(x=>x.id=="respond"&&x.arg=="follow"));
        });
        Check("waiting for an actual upcoming class changes the scene at the right minute",()=>{
            var g=Game(540,"arts","band");g.Dispatch("waitClass","1:taei:ensemble");True(g.S.minute==570);True(g.View().actions.Any(x=>x.id=="class"));
        });
        Check("class interpretation choices preserve different learned notes",()=>{
            var a=Game(570,"arts","band");a.Dispatch("class","1:taei:ensemble");a.Dispatch("classChoice","blend");
            var b=Game(570,"arts","band");b.Dispatch("class","1:taei:ensemble");b.Dispatch("classChoice","phrase");
            True(a.S.knowledge.Any(x=>x.id=="lesson:1:taei:ensemble:blend"));True(!a.S.knowledge.Any(x=>x.id.EndsWith(":phrase")));True(b.S.knowledge.Any(x=>x.id=="lesson:1:taei:ensemble:phrase"));
        });
        Check("accumulated player strain changes physical timing outcomes",()=>{
            var rested=Game(800,"gym","court");var tired=Game(800,"gym","court");tired.S.playerStrain=5;
            foreach(var g in new[]{rested,tired}){g.Dispatch("activity","basketball");g.Dispatch("activityChoice","share");g.Dispatch("miniStart");for(int i=0;i<4;i++)g.AdvanceMini(100);g.Dispatch("miniHit");}
            True(rested.S.activity.hits>tired.S.activity.hits);
        });
        Check("ensemble class notes improve the matching later rehearsal approach",()=>{
            var learned=Game(800,"arts","band");var skipped=Game(800,"arts","band");learned.S.knowledge.Add(new Entry{id="lesson:1:taei:ensemble:blend",text="호흡 메모"});
            foreach(var g in new[]{learned,skipped}){g.Dispatch("activity","music");g.Dispatch("activityChoice","vocal");g.Dispatch("activityChoice","blend");}
            True(learned.S.activity.score>skipped.S.activity.score);
        });
        Check("visual-novel composition keeps sprite heads and dialogue inside the viewport",()=>{
            foreach(var size in new[]{(1600f,900f),(1280f,900f),(620f,900f),(540f,720f)}){
                var c=VnComposition.Create(size.Item1,size.Item2,.5f);
                foreach(var b in new[]{c.dialogue,c.choices,c.character,c.header})True(b.x>=0&&b.y>=0&&b.Right<=c.width+.01f&&b.Top<=c.height+.01f);
                True(c.character.Top<=c.header.y);True(c.choices.y>c.dialogue.Top);
            }
        });
        Check("typewriter respects grapheme boundaries and finishes without advancing game time",()=>{
            var g=Game();int seed=g.S.seed;var r=new VnReader();r.Set("one","가\u0301나");r.Tick(.1f,10,false);True(r.Visible==1&&r.Text=="가\u0301");r.Finish();True(r.Text=="가\u0301나"&&r.Complete);True(g.S.minute==540&&g.S.seed==seed);
        });
        Check("opening an overlay pauses typing and preserves the exact reading beat",()=>{
            var g=Game();g.S.beat=2;g.OpenUtility("phone");g.Dispatch("community");g.Dispatch("back");True(g.S.screen=="place"&&g.S.beat==2);
            var r=new VnReader();r.Set("a","읽던 문장");r.Tick(.1f,20,false);int count=r.Visible;r.Tick(10,20,true);True(r.Visible==count);r.Set("a","읽던 문장");True(r.Visible==count);
        });
        Check("AUTO stops at choices and never advances a minigame",()=>{
            var r=new VnReader();r.Set("a","끝",instantly:true);r.Tick(2,38,false);True(r.AutoAdvance(true,true,false));True(!r.AutoAdvance(true,false,false));True(!r.AutoAdvance(true,true,true));True(!r.AutoAdvance(false,true,false));
        });
        Check("saved reveal progress restores safely and clamps corrupt counts",()=>{
            var r=new VnReader();r.Set("a","다시 읽기",2);True(r.Visible==2);r.Set("b","짧음",999);True(r.Complete);r.Set("c","처음",-10);True(r.Visible==0);r.Set("same-a","가나",instantly:true);True(r.Text=="가나");r.Set("same-b","다라",instantly:true);True(r.Text=="다라");
            var g=Game();g.S.readingKey="a";g.S.revealedGlyphs=2;g.S.transcript.Add(new Entry{id="line",text="직접 읽은 문장"});var loaded=Reload(g);True(loaded.S.revealedGlyphs==2&&loaded.S.transcript.Count==1);
        });
        Check("utility-to-utility navigation cannot replace the original story return point",()=>{
            var g=Game(800,"hall");g.Dispatch("encounter");g.Dispatch("talk","yeogyeong");g.S.beat=1;g.OpenUtility("phone");g.Dispatch("community");g.OpenUtility("menu");g.Dispatch("back");True(g.S.screen=="dialogue"&&g.S.beat==1);
        });
        Check("standing sprite atlas retains alpha and native non-power-of-two proportions",()=>{
            string assets=Path.GetFullPath(Path.Combine(Path.GetDirectoryName(args[0]), "../.."));
            string path=Path.Combine(assets,"Resources/Art/StandSprites.png");byte[] bytes=File.ReadAllBytes(path);
            int w=(bytes[16]<<24)|(bytes[17]<<16)|(bytes[18]<<8)|bytes[19],h=(bytes[20]<<24)|(bytes[21]<<16)|(bytes[22]<<8)|bytes[23];
            True(w%4==0&&h%3==0&&bytes[25]==6);string meta=File.ReadAllText(path+".meta");True(meta.Contains("nPOTScale: 0")&&meta.Contains("alphaIsTransparency: 1"));
        });
        Console.WriteLine("Native C# checks passed: "+count);
    }
}
