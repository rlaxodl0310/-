using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

namespace CampusSurvival
{
    public sealed partial class CampusApp
    {
        RectTransform stageRoot,uiRoot,portraitRoot,choicesRoot,noticeRoot;
        Text dialogueText,readingHint;
        VnReader reader=new VnReader();
        VnComposition composition;
        string stageKey="",portraitKey="",page="",travelQuery="",floorFilter="전체";
        bool previewMode,showTitle,hideUi,autoRead,reduceMotion,clickSound,choicesShown;
        float textSpeed=38,noticeUntil;
        GameView currentView;
        string[] currentBeats = new[]{"…"};
        readonly Color navy=new Color(.045f,.065f,.095f,.97f),card=new Color(.085f,.115f,.15f,.96f);
        readonly Color paper=new Color(.95f,.94f,.90f),darkInk=new Color(.14f,.19f,.22f);
        AudioSource uiAudio;
        AudioClip clickClip;
        void ReadPreferences()
        {textSpeed=Mathf.Clamp(PlayerPrefs.GetFloat("campus.vn.speed",38),18,90);reduceMotion=PlayerPrefs.GetInt("campus.vn.reduceMotion",0)==1;clickSound=PlayerPrefs.GetInt("campus.vn.clickSound",0)==1;}
        void SavePreferences()
        {PlayerPrefs.SetFloat("campus.vn.speed",textSpeed);PlayerPrefs.SetInt("campus.vn.reduceMotion",reduceMotion?1:0);PlayerPrefs.SetInt("campus.vn.clickSound",clickSound?1:0);PlayerPrefs.Save();}
        string[] Beats(string text)
        {
            var result=new List<string>();
            foreach(var paragraph in (text??"").Split(new[]{'\n'},StringSplitOptions.RemoveEmptyEntries))
            {
                string rest=paragraph;int limit=60; // Stable chunks preserve saves across window resizing.
                while(rest.Length>limit){int end=rest.LastIndexOf(' ',limit,Math.Min(24,limit));if(end<limit-24)end=limit;result.Add(rest.Substring(0,end).Trim());rest=rest.Substring(end).TrimStart();}
                if(rest.Length>0)result.Add(rest);
            }
            return result.Count==0?new[]{"…"}:result.ToArray();
        }
        RectTransform Box(string name,Transform parent,Color? color=null)
        {
            var go=new GameObject(name,typeof(RectTransform));go.layer=5;go.transform.SetParent(parent,false);
            if(color.HasValue)go.AddComponent<Image>().color=color.Value;
            return go.GetComponent<RectTransform>();
        }
        void Stretch(RectTransform rt,float left=0,float right=0,float top=0,float bottom=0)
        {rt.anchorMin=Vector2.zero;rt.anchorMax=Vector2.one;rt.offsetMin=new Vector2(left,bottom);rt.offsetMax=new Vector2(-right,-top);}
        void At(RectTransform rt,Vector2 min,Vector2 max,float left=0,float right=0,float top=0,float bottom=0)
        {rt.anchorMin=min;rt.anchorMax=max;rt.offsetMin=new Vector2(left,bottom);rt.offsetMax=new Vector2(-right,-top);}
        void Place(RectTransform rt,VnBounds bounds)
        {rt.anchorMin=rt.anchorMax=Vector2.zero;rt.pivot=Vector2.zero;rt.anchoredPosition=new Vector2(bounds.x,bounds.y);rt.sizeDelta=new Vector2(bounds.width,bounds.height);}
        Text Label(Transform parent,string text,int size=24,Color? color=null)
        {
            var rt=Box("Text",parent);var t=rt.gameObject.AddComponent<Text>();t.font=font;t.text=text;t.fontSize=size;t.color=color??ink;t.supportRichText=false;t.raycastTarget=false;
            t.horizontalOverflow=HorizontalWrapMode.Wrap;t.verticalOverflow=VerticalWrapMode.Overflow;t.lineSpacing=1.30f;Stretch(rt);return t;
        }
        void Rule(Transform parent,Color color,float top=0)
        {var rt=Box("Hairline",parent,color);At(rt,new Vector2(0,1),Vector2.one,top:top,bottom:-top-1);rt.GetComponent<Image>().raycastTarget=false;}
        Button Button(Transform parent,string label,Action clicked,int height=58,bool light=false)
        {
            var rt=Box("Action · "+label,parent,light?new Color(.89f,.89f,.85f):card);var layout=rt.gameObject.AddComponent<LayoutElement>();layout.minHeight=height;layout.preferredHeight=height;
            var b=rt.gameObject.AddComponent<Button>();b.transition=UnityEngine.UI.Selectable.Transition.None;
            var t=Label(rt,label,height<=44?16:21,light?darkInk:ink);t.alignment=TextAnchor.MiddleLeft;Stretch(t.rectTransform,height<=44?10:22,height<=44?8:18,5,5);
            var motion=rt.gameObject.AddComponent<VnUiMotion>();motion.reducedMotion=reduceMotion;motion.ButtonStyle(rt.GetComponent<Image>(),t,light?new Color(.89f,.89f,.85f):card,light?new Color(.80f,.83f,.81f):new Color(.16f,.20f,.23f));
            b.onClick.AddListener(()=>{PlayClick();clicked();});return b;
        }
        void Entry(RectTransform rt,float delay=0,float offset=12,float duration=.25f)
        {(rt.GetComponent<VnUiMotion>()??rt.gameObject.AddComponent<VnUiMotion>()).Enter(delay,duration,new Vector2(offset,0),reduceMotion||previewMode);}
        void Column(RectTransform rt,int spacing=12)
        {var group=rt.gameObject.AddComponent<VerticalLayoutGroup>();group.spacing=spacing;group.childControlHeight=true;group.childControlWidth=true;group.childForceExpandHeight=false;group.childForceExpandWidth=true;}
        Text Flow(Transform parent,string text,int size=22,Color? color=null)
        {var t=Label(parent,text,size,color);t.gameObject.AddComponent<LayoutElement>().minHeight=size*1.6f;return t;}
        RectTransform Block(Transform parent,int height,Color? color=null)
        {var rt=Box("Card",parent,color??card);rt.gameObject.AddComponent<LayoutElement>().preferredHeight=height;return rt;}
        void PlayClick()
        {
            if(!clickSound||previewMode||!Application.isPlaying)return;
            if(uiAudio==null){uiAudio=GetComponent<AudioSource>()??gameObject.AddComponent<AudioSource>();uiAudio.playOnAwake=false;uiAudio.volume=.12f;}
            if(clickClip==null){int n=1600;var samples=new float[n];for(int i=0;i<n;i++)samples[i]=(float)(Math.Sin(i*2*Math.PI*720/44100)*.15*(1-i/(float)n));clickClip=AudioClip.Create("UI tap",n,1,44100,false);clickClip.SetData(samples,0);}
            uiAudio.PlayOneShot(clickClip);
        }
        void OpenPanel(string screen)
        {page="";autoRead=false;game.OpenUtility(screen);Draw();}
        void OpenPage(string name)
        {if(!showTitle)game.OpenUtility("menu");page=name;autoRead=false;if(game.S.activity!=null&&game.S.activity.phase==1)game.S.activity.phase=2;Draw();}
        void ClosePanel()
        {
            if(showTitle){page="";Draw();return;}
            if(page!=""){page="";Draw();return;}
            Act("back");
        }
        void HideInterface()
        {hideUi=true;if(game.S.activity!=null&&game.S.activity.phase==1)game.S.activity.phase=2;if(uiRoot!=null)uiRoot.gameObject.SetActive(false);}
        bool MiniRunning {get{return game.S.screen=="activity"&&game.S.activity!=null&&game.S.activity.phase==1;}}
        void Draw()
        {
            if(root==null)return;
            lastWidth=Screen.width;lastHeight=Screen.height;
            float aspect=Mathf.Max(1,Screen.width)/(float)Mathf.Max(1,Screen.height);
            var scaler=canvas.GetComponent<CanvasScaler>();scaler.referenceResolution=new Vector2(Mathf.Max(620,900*aspect),900);
            composition=VnComposition.Create(scaler.referenceResolution.x,900,art["StandSprites"].width/4f/(art["StandSprites"].height/3f));
            if(stageRoot==null){stageRoot=Box("Persistent stage",root);Stretch(stageRoot);}
            currentView=game.View();RefreshStage(currentView);
            if(uiRoot!=null)RemoveObject(uiRoot.gameObject);
            uiRoot=Box("Interface",root);Stretch(uiRoot);uiRoot.gameObject.SetActive(!hideUi);choicesRoot=null;dialogueText=null;readingHint=null;marker=null;noticeRoot=null;
            if(showTitle&&page=="")DrawTitle();
            else if(page=="settings")DrawSettings();
            else if(page=="saves")DrawSaves();
            else if(page=="backlog")DrawBacklog();
            else if(currentView.menu)DrawMenu(currentView);
            else {Header(currentView);DrawNovel(currentView);}
            if(error!=""&&(isError||Time.unscaledTime<noticeUntil))DrawNotice();
        }
        void RefreshStage(GameView view)
        {
            string wanted=showTitle?"Campus":view.art;
            if(view.menu&&stageKey!="")wanted=stageKey.Split('|')[0];
            string key=wanted+"|"+game.S.day+"|"+(game.S.minute>=1080?"evening":"day")+"|"+game.S.location+"|"+composition.width+"x"+composition.height;
            if(key!=stageKey)
            {
                foreach(var child in stageRoot.Cast<Transform>().ToArray())RemoveObject(child.gameObject);portraitRoot=null;portraitKey="";stageKey=key;
                string asset=wanted.StartsWith("Activities:")?"Activities":wanted;
                var back=Box("Scene backdrop",stageRoot,new Color(.025f,.04f,.06f));Stretch(back);
                var raw=Box("Scene art",back).gameObject.AddComponent<RawImage>();raw.texture=art[asset];raw.raycastTarget=false;Stretch(raw.rectTransform);
                float target=composition.width/composition.height;
                if(asset=="Activities")
                {
                    int panel=wanted.EndsWith("basketball")?0:wanted.EndsWith("cooking")?1:2;raw.uvRect=new Rect(panel/3f,0,1f/3f,1);
                    var bounds=new VnBounds((composition.width-450)*.5f,0,450,900);Place(raw.rectTransform,bounds);
                }
                else
                {
                    float source=art[asset].width/(float)art[asset].height;
                    if(source>target){float w=target/source;raw.uvRect=new Rect((1-w)*.5f,0,w,1);}else{float h=source/target;raw.uvRect=new Rect(0,(1-h)*.5f,1,h);}
                }
                var tint=Box("Time and weather tint",back,game.S.minute>=1080?new Color(.02f,.035f,.11f,.45f):game.S.day==2?new Color(.06f,.10f,.17f,.18f):new Color(.025f,.035f,.055f,.06f));Stretch(tint);tint.GetComponent<Image>().raycastTarget=false;
                Entry(back,0,0,.40f);
            }
            string person=showTitle?"":view.portrait;
            if(view.menu)return;
            var actor=game.S.actors.FirstOrDefault(x=>x.id==person);
            int row=actor!=null&&actor.tension>=3?2:actor!=null&&actor.fatigue>=3||person=="taei"&&game.S.playerStrain>=3?1:0;
            if(view.text!=null&&(view.text.Contains("걱정")||view.text.Contains("피곤")))row=1;
            string wantedPortrait=person+":"+row;
            if(wantedPortrait==portraitKey)return;
            bool samePerson=portraitKey.StartsWith(person+":");portraitKey=wantedPortrait;
            if(portraitRoot!=null)
            {
                var old=portraitRoot;
                if(Application.isPlaying&&!reduceMotion)(old.GetComponent<VnUiMotion>()??old.gameObject.AddComponent<VnUiMotion>()).Leave(.18f,false);else RemoveObject(old.gameObject);
                portraitRoot=null;
            }
            if(string.IsNullOrEmpty(person))return;
            portraitRoot=Box("Character · "+person,stageRoot);Place(portraitRoot,composition.character);
            int col=person=="seoyeon"?1:person=="yeogyeong"?2:person=="soyul"?3:0;
            var rawPortrait=Box("Transparent character sprite",portraitRoot).gameObject.AddComponent<RawImage>();rawPortrait.texture=art["StandSprites"];rawPortrait.raycastTarget=false;
            float insetX=.5f/art["StandSprites"].width,insetY=.5f/art["StandSprites"].height;
            rawPortrait.uvRect=new Rect(col/4f+insetX,(2-row)/3f+insetY,.25f-insetX*2,1f/3f-insetY*2);Stretch(rawPortrait.rectTransform);
            Entry(portraitRoot,0,samePerson?0:26,samePerson ? .18f : .32f);
        }
        void Header(GameView view)
        {
            var header=Box("Scene HUD",uiRoot,new Color(.025f,.04f,.065f,.75f));Place(header,composition.header);Rule(header,new Color(accent.r,accent.g,accent.b,.26f),59);
            var meta=Label(header,"DAY "+game.S.day.ToString("00")+"   /   "+CampusEngine.Clock(game.S.minute)+(composition.compact?"":"   ·   "+game.Weather),16,accent);At(meta.rectTransform,Vector2.zero,Vector2.one,18,380,8,0);
            string location=composition.compact?game.PlaceName(game.S.location)+(game.S.room==""?"":" / "+game.RoomName(game.S.location,game.S.room).Split(' ')[0]):view.title;
            var place=Label(header,location,composition.compact?17:19);At(place.rectTransform,Vector2.zero,Vector2.one,18,380,31,0);
            var travel=Button(header,"이동",()=>{game.OpenUtility("menu");Act("travel");},40);At(travel.GetComponent<RectTransform>(),new Vector2(1,0),Vector2.one,-344,234,9,9);
            var phone=Button(header,"휴대폰",()=>OpenPanel("phone"),40);At(phone.GetComponent<RectTransform>(),new Vector2(1,0),Vector2.one,-226,116,9,9);
            var menu=Button(header,"메뉴",()=>OpenPanel("menu"),40);At(menu.GetComponent<RectTransform>(),new Vector2(1,0),Vector2.one,-108,8,9,9);
        }
        void DrawNovel(GameView view)
        {
            var panel=Box("Dialogue panel",uiRoot,navy);Place(panel,composition.dialogue);Rule(panel,new Color(accent.r,accent.g,accent.b,.8f));
            var chip=Box("Speaker nameplate",panel,new Color(.10f,.14f,.18f,.99f));At(chip,new Vector2(0,1),new Vector2(0,1),24,-218,-16,-24);
            var speaker=Label(chip,view.speaker??"김태이",21,accent);speaker.alignment=TextAnchor.MiddleLeft;Stretch(speaker.rectTransform,18,10,2,2);
            var lines=Beats(view.text);currentBeats=lines;game.S.beat=Mathf.Clamp(game.S.beat,0,lines.Length-1);
            string key=game.S.day+":"+game.S.minute+":"+game.S.screen+":"+game.S.person+":"+game.S.dialogueStep+":"+game.S.focus+":"+game.S.beat+":"+lines[game.S.beat];
            bool restore=game.S.readingKey==key;
            reader.Set(key,lines[game.S.beat],restore?game.S.revealedGlyphs:0,previewMode||MiniRunning);
            dialogueText=Label(panel,reader.Text,composition.compact?24:27);At(dialogueText.rectTransform,Vector2.zero,Vector2.one,30,30,48,66);
            var click=Box("Click to continue",panel,new Color(0,0,0,0));Stretch(click,22,22,40,58);click.gameObject.AddComponent<Button>().onClick.AddListener(AdvanceReading);
            readingHint=Label(panel,"",15,muted);At(readingHint.rectTransform,Vector2.zero,Vector2.one,30,380,composition.dialogue.height-40,8);
            var quick=Box("Reading controls",panel);At(quick,new Vector2(1,0),new Vector2(1,0),-364,16,-45,8);
            string[] labels={"기록",autoRead?"AUTO ON":"AUTO","UI 숨김","저장"};
            Action[] callbacks={()=>OpenPage("backlog"),()=>{autoRead=!autoRead;Draw();},()=>HideInterface(),()=>OpenPage("saves")};
            for(int i=0;i<labels.Length;i++){int index=i;var button=Button(quick,labels[i],callbacks[index],32);At(button.GetComponent<RectTransform>(),new Vector2(i/4f,0),new Vector2((i+1)/4f,1),0,6,0,0);button.GetComponentInChildren<Text>().fontSize=14;}
            choicesRoot=Box("Story choices",uiRoot);Place(choicesRoot,composition.choices);Column(choicesRoot,12);
            int number=0;
            foreach(var action in view.actions.Take(3))
            {var a=action;var b=Button(choicesRoot,(++number).ToString("00")+"    "+a.label,()=>Act(a.id,a.arg),66);var line=Box("Choice accent",b.transform,new Color(accent.r,accent.g,accent.b,.7f));At(line,Vector2.zero,new Vector2(0,1),0,-2,14,14);}
            choicesShown=false;choicesRoot.gameObject.SetActive(false);
            if(MiniRunning)DrawMini(panel);
            UpdateReading();
        }
        void UpdateReading()
        {
            if(dialogueText==null||currentView==null)return;
            dialogueText.text=reader.Text;game.S.readingKey=reader.Key;game.S.revealedGlyphs=reader.Visible;
            var lines=currentBeats;bool last=game.S.beat>=lines.Length-1;
            if(readingHint!=null)readingHint.text=reader.Complete?(last?"어떻게 할까":"클릭 또는 Space로 계속   ▾"):"클릭하면 문장을 끝까지 읽습니다";
            if(reader.Complete)
            {
                if(!previewMode&&!game.S.transcript.Any(x=>x.id==reader.Key))game.S.transcript.Add(new Entry{id=reader.Key,text=(currentView.speaker??"김태이")+"\n"+reader.FullText,day=game.S.day,minute=game.S.minute});
                if(last&&!choicesShown&&choicesRoot!=null)
                {choicesShown=true;choicesRoot.gameObject.SetActive(true);LayoutRebuilder.ForceRebuildLayoutImmediate(choicesRoot);int i=0;foreach(Transform child in choicesRoot)Entry((RectTransform)child,.06f*i++,16,.22f);}
            }
        }
        void TickPresentation()
        {
            bool paused=showTitle||page!=""||currentView==null||currentView.menu;
            reader.Tick(Time.unscaledDeltaTime,textSpeed,paused||MiniRunning);if(!paused)UpdateReading();
            if(!paused&&reader.AutoAdvance(autoRead,game.S.beat<currentBeats.Length-1,MiniRunning))AdvanceReading();
            if(noticeRoot!=null&&!isError&&Time.unscaledTime>=noticeUntil){RemoveObject(noticeRoot.gameObject);noticeRoot=null;}
        }
        void DrawMini(RectTransform panel)
        {
            var bar=Box("Timing lane",panel,new Color(.19f,.25f,.29f));At(bar,Vector2.zero,new Vector2(1,0),30,30,-56,46);
            var target=Box("Timing target",bar,new Color(.74f,.67f,.45f));At(target,new Vector2(.4f,0),new Vector2(.6f,1));
            marker=Box("Timing marker",bar).gameObject.AddComponent<RawImage>();marker.color=Color.white;marker.raycastTarget=false;marker.rectTransform.anchorMin=marker.rectTransform.anchorMax=new Vector2(game.MiniPosition,.5f);marker.rectTransform.sizeDelta=new Vector2(5,26);
        }
        void DrawNotice()
        {noticeRoot=Box("Notice",uiRoot,isError?new Color(.29f,.09f,.10f,.98f):new Color(.08f,.15f,.19f,.98f));Place(noticeRoot,new VnBounds(composition.width*.5f-Mathf.Min(320,composition.width*.45f),composition.height-154,Mathf.Min(640,composition.width*.9f),52));var t=Label(noticeRoot,error,17,isError?ink:accent);Stretch(t.rectTransform,18,18,10,4);Entry(noticeRoot,0,0,.18f);}
        RectTransform MenuShell(string title,string subtitle,bool phone=false)
        {
            var shade=Box("Utility dimmer",uiRoot,new Color(.015f,.025f,.045f,.78f));Stretch(shade);
            float width=phone?Mathf.Min(500,composition.width-48):Mathf.Min(1160,composition.width-64);
            float height=phone?Mathf.Min(760,composition.height-90):composition.height-112;
            var panel=Box(phone?"Phone device":"Menu panel",uiRoot,phone?paper:navy);Place(panel,new VnBounds((composition.width-width)*.5f,(composition.height-height)*.5f,width,height));
            Rule(panel,phone?new Color(.45f,.51f,.49f):accent);
            var overline=Label(panel,phone?"CAMPUS / MOBILE":"CAMPUS / LIFE",13,phone?new Color(.40f,.48f,.46f):accent);At(overline.rectTransform,new Vector2(0,1),Vector2.one,28,80,22,-46);
            int titleSize=title.Length>20?22:32;
            float titleHeight=Mathf.Max(46,Mathf.Ceil(title.Length*titleSize*.85f/(width-106))*titleSize*1.3f);
            float subtitleTop=52+titleHeight+5,contentTop=Mathf.Max(160,subtitleTop+57);
            var name=Label(panel,title,titleSize,phone?darkInk:ink);At(name.rectTransform,new Vector2(0,1),Vector2.one,28,78,52,-52-titleHeight);
            var caption=Label(panel,subtitle,16,phone?new Color(.40f,.47f,.46f):muted);At(caption.rectTransform,new Vector2(0,1),Vector2.one,28,28,subtitleTop,-contentTop+10);
            var close=Button(panel,"닫기",ClosePanel,40,phone);At(close.GetComponent<RectTransform>(),new Vector2(1,1),Vector2.one,-92,18,18,-58);close.GetComponentInChildren<Text>().fontSize=16;
            var viewport=Box("Scroll viewport",panel,new Color(0,0,0,0));Stretch(viewport,28,28,contentTop,24);viewport.gameObject.AddComponent<RectMask2D>();
            var scroll=viewport.gameObject.AddComponent<ScrollRect>();scroll.horizontal=false;scroll.scrollSensitivity=40;scroll.movementType=ScrollRect.MovementType.Clamped;
            var content=Box("Content",viewport);content.anchorMin=new Vector2(0,1);content.anchorMax=Vector2.one;content.pivot=new Vector2(.5f,1);content.sizeDelta=Vector2.zero;
            Column(content,14);content.gameObject.AddComponent<ContentSizeFitter>().verticalFit=ContentSizeFitter.FitMode.PreferredSize;scroll.content=content;scroll.viewport=viewport;
            Entry(panel,0,0,.20f);return content;
        }
        void Section(Transform parent,string text,bool light=false)
        {Flow(parent,text,17,light?new Color(.41f,.48f,.46f):accent);}
        RectTransform Grid(Transform parent,int count,float width,int columns=2,int height=104)
        {
            var grid=Box("Card grid",parent);var layout=grid.gameObject.AddComponent<GridLayoutGroup>();layout.constraint=GridLayoutGroup.Constraint.FixedColumnCount;layout.constraintCount=columns;layout.spacing=new Vector2(12,12);layout.cellSize=new Vector2((width-(columns-1)*12)/columns,height);
            grid.gameObject.AddComponent<LayoutElement>().preferredHeight=((count+columns-1)/columns)*(height+12)-12;return grid;
        }
        void DrawMenu(GameView view)
        {
            string screen=game.S.screen;
            bool phone=new[]{"phone","community","post","messages","appointments","clubs"}.Contains(screen);
            var content=MenuShell(view.title,phone?game.S.day+"일차  "+CampusEngine.Clock(game.S.minute)+"   ·   "+game.Weather:"장면은 잠시 멈춰 있습니다. 편하게 확인하세요.",phone);
            float width=(phone?Mathf.Min(500,composition.width-48):Mathf.Min(1160,composition.width-64))-56;
            if(screen=="phone")
            {
                var clock=Block(content,115,new Color(.86f,.87f,.83f));var time=Label(clock,CampusEngine.Clock(game.S.minute),48,darkInk);At(time.rectTransform,Vector2.zero,Vector2.one,22,20,14,0);
                var sub=Label(clock,"오늘도, 각자의 하루가 흐른다.",16,new Color(.36f,.44f,.43f));At(sub.rectTransform,Vector2.zero,Vector2.one,24,20,78,0);
                var apps=view.actions.Where(x=>x.id!="back").ToList();var grid=Grid(content,apps.Count,width,2,112);
                foreach(var action in apps){var a=action;var button=Button(grid,a.label,()=>Act(a.id,a.arg),112,true);button.GetComponentInChildren<Text>().fontSize=19;}
                Section(content,"메뉴를 읽는 동안에는 시간이 지나지 않습니다.",true);
            }
            else if(screen=="menu")
            {
                var next=game.Lessons().FirstOrDefault(x=>x.end>game.S.minute);
                Section(content,"지금의 하루");
                Flow(content,next==null?"오늘 남은 수업은 없습니다.":CampusEngine.Clock(next.start)+"   "+next.name+"\n"+game.PlaceName(next.location)+" · "+game.RoomName(next.location,next.room),24);
                var navigation=view.actions.Where(x=>x.id!="back").ToList();var grid=Grid(content,navigation.Count,width,composition.compact?2:3,82);
                foreach(var a0 in navigation){var a=a0;Button(grid,a.label,()=>Act(a.id,a.arg),82);}
                if(view.utilityActions.Count>0){Section(content,"이 장소에서 할 수 있는 일");foreach(var a0 in view.utilityActions){var a=a0;Button(content,a.label,()=>Act(a.id,a.arg));}}
                Section(content,"태이의 상태 · "+game.Condition);
                var tools=Grid(content,3,width,composition.compact?2:3,64);Button(tools,"저장 · 불러오기",()=>OpenPage("saves"),64);Button(tools,"읽은 대화",()=>OpenPage("backlog"),64);Button(tools,"설정",()=>OpenPage("settings"),64);
            }
            else if(screen=="status")
            {
                Section(content,"김태이 · 몸과 마음"); Flow(content,game.Condition,23);
                StatusMeter(content,"스태미나",game.Stamina,"운동과 작업으로 소모 · 휴식으로 회복",new Color(.42f,.72f,.64f));
                StatusMeter(content,"배고픔",game.S.hunger,"시간이 지나면 증가 · 식사로 해소",new Color(.85f,.67f,.39f));
                StatusMeter(content,"목마름",game.S.thirst,"시간이 지나면 증가 · 물과 음료로 해소",new Color(.45f,.68f,.83f));
                StatusMeter(content,"공포감",game.S.fear,"직접 확인한 이상징후로 증가 · 휴식으로 완화",new Color(.69f,.57f,.78f));
                Flow(content,"스태미나는 높을수록, 나머지는 낮을수록 편안합니다. 지금의 수치는 생존 시스템 시제품이며, 0이 되거나 가득 찬다고 즉시 사망하지 않습니다.",18,muted);
            }
            else if(screen=="travel"||screen=="rooms")DrawTravel(content,view,width,screen=="rooms");
            else if(screen=="community")
            {
                Section(content,"익명글은 확인되지 않은 이야기일 수 있습니다.",true);
                foreach(var a0 in view.actions.Where(x=>x.id=="post"))
                {
                    var a=a0;var post=game.World.posts.Concat(game.S.feed).First(x=>x.id==a.arg);var b=Button(content,post.board+"  /  "+post.day+"일차\n"+post.title,()=>Act(a.id,a.arg),108,true);b.GetComponentInChildren<Text>().fontSize=19;
                }
                var home=view.actions.FirstOrDefault(x=>x.id=="phone");if(home!=null)Button(content,"휴대폰 홈",()=>Act(home.id),52,true);
            }
            else if(screen=="post")
            {
                Flow(content,view.text,21,darkInk);
                foreach(var a0 in view.actions.Where(x=>x.id!="back")){var a=a0;Button(content,a.label,()=>Act(a.id,a.arg),58,true);}
            }
            else if(screen=="contacts")DrawContacts(content,width);
            else if(screen=="timetable")
            {
                foreach(var c in game.Lessons())
                {
                    var frame=Block(content,156);var time=Label(frame,CampusEngine.Clock(c.start)+" — "+CampusEngine.Clock(c.end),17,accent);At(time.rectTransform,Vector2.zero,Vector2.one,20,20,16,0);
                    var label=Label(frame,c.name+"\n"+game.PlaceName(c.location)+" · "+game.RoomName(c.location,c.room),23);At(label.rectTransform,Vector2.zero,Vector2.one,20,20,45,0);
                    var action=view.actions.FirstOrDefault(x=>x.id=="goClass"&&x.arg==c.Key);
                    if(action!=null){var a=action;var b=Button(frame,"강의실로",()=>Act(a.id,a.arg),40);At(b.GetComponent<RectTransform>(),new Vector2(1,0),new Vector2(1,0),-160,16,-58,14);}
                    var record=game.S.attendance.FirstOrDefault(x=>x.id==c.Key);if(record!=null){var r=Label(frame,record.text,16,muted);At(r.rectTransform,Vector2.zero,Vector2.one,20,180,118,0);}
                }
            }
            else if(screen=="appointments")
            {
                if(game.S.appointments.Count==0)Flow(content,"아직 정해둔 약속은 없습니다.",22,darkInk);
                foreach(var a in game.S.appointments)
                {
                    Flow(content,a.day+"일차 "+CampusEngine.Clock(a.minute)+"  /  "+CampusEngine.Status(a.status)+"\n"+a.label+"\n"+game.PlaceName(a.location),21,darkInk);
                    foreach(var cmd0 in view.actions.Where(x=>x.arg==a.id)){var cmd=cmd0;Button(content,cmd.label,()=>Act(cmd.id,cmd.arg),54,true);}
                    Section(content,"실제로 함께 시간을 보내야 약속이 이행됩니다.",true);
                }
            }
            else if(screen=="knowledge"||screen=="inventory"||screen=="journal"||screen=="messages")
            {
                var entries=screen=="knowledge"?game.S.knowledge:screen=="inventory"?game.S.inventory:screen=="messages"?game.S.messages:game.S.journal;
                if(entries.Count==0)Flow(content,"아직 기록이 없습니다.",22,phone?darkInk:muted);
                foreach(var entry in entries.AsEnumerable().Reverse())
                {Section(content,entry.day+"일차  "+CampusEngine.Clock(entry.minute),phone);Flow(content,entry.text,21,phone?darkInk:ink);}
            }
            else
            {
                Flow(content,view.text,21,phone?darkInk:muted);
                foreach(var a0 in view.actions.Where(x=>x.id!="back")){var a=a0;Button(content,a.label,()=>Act(a.id,a.arg),62,phone);}
            }
        }
        void StatusMeter(RectTransform content,string title,int value,string hint,Color color)
        {
            var frame=Block(content,124);var text=Label(frame,title+"   "+value+" / 100",24,color);At(text.rectTransform,Vector2.zero,Vector2.one,20,20,12,0);
            var note=Label(frame,hint,17,muted);At(note.rectTransform,Vector2.zero,Vector2.one,20,20,49,0);
            var track=new GameObject("Status track",typeof(RectTransform),typeof(Image));track.transform.SetParent(frame,false);track.GetComponent<Image>().color=new Color(.17f,.23f,.27f);
            var rt=track.GetComponent<RectTransform>();At(rt,Vector2.zero,Vector2.one,20,20,88,20);
            var fill=new GameObject("Status fill",typeof(RectTransform),typeof(Image));fill.transform.SetParent(track.transform,false);fill.GetComponent<Image>().color=color;
            var fr=fill.GetComponent<RectTransform>();fr.anchorMin=Vector2.zero;fr.anchorMax=new Vector2(value/100f,1);fr.offsetMin=fr.offsetMax=Vector2.zero;
        }
        void DrawTravel(RectTransform content,GameView view,float width,bool rooms)
        {
            Section(content,rooms?"층별 안내 · 호실은 게임용 배치입니다.":"현재 위치  /  "+game.PlaceName(game.S.location));
            var search=Block(content,52,new Color(.12f,.16f,.20f));var field=search.gameObject.AddComponent<InputField>();
            var text=Label(search,"",21);text.supportRichText=false;text.alignment=TextAnchor.MiddleLeft;Stretch(text.rectTransform,18,18,8,8);field.textComponent=text;
            var hint=Label(search,rooms?"호실 이름으로 찾기":"건물 이름으로 찾기",20,muted);Stretch(hint.rectTransform,18,18,8,8);field.placeholder=hint;field.text=travelQuery;
            if(rooms)
            {
                var roomData=game.World.buildings.First(x=>x.id==game.S.location).rooms;
                var floors=new[]{"전체"}.Concat(roomData.Select(x=>NormalizeFloor(x.floor)).Distinct()).ToArray();
                var tabs=Grid(content,floors.Length,width,Math.Min(5,composition.compact?3:floors.Length),44);
                foreach(string floor0 in floors){string floor=floor0;Button(tabs,floor==floorFilter?"· "+floor:floor,()=>{floorFilter=floor;Draw();},44);}
            }
            var results=Box("Search results",content);Column(results,10);results.gameObject.AddComponent<ContentSizeFitter>().verticalFit=ContentSizeFitter.FitMode.PreferredSize;
            Action rebuild=()=>
            {
                foreach(var child in results.Cast<Transform>().ToArray())RemoveObject(child.gameObject);
                var actions=view.actions.Where(x=>x.id==(rooms?"room":"visit")).Where(x=>x.label.IndexOf(travelQuery,StringComparison.OrdinalIgnoreCase)>=0);
                if(rooms&&floorFilter!="전체")actions=actions.Where(x=>NormalizeFloor(game.World.buildings.First(b=>b.id==game.S.location).rooms.First(r=>r.id==x.arg).floor)==floorFilter);
                var list=actions.ToList();if(list.Count==0){Flow(results,"일치하는 곳이 없습니다.",22,muted);return;}
                int columns=composition.compact?2:3;var grid=Grid(results,list.Count,width,columns,90);
                foreach(var a0 in list){var a=a0;Button(grid,a.label,()=>{travelQuery="";floorFilter="전체";Act(a.id,a.arg);},90);}
            };
            field.onValueChanged.AddListener(value=>{travelQuery=value;rebuild();});rebuild();
            Button(content,"장면으로 돌아가기",()=>Act("back"),54);
        }
        static string NormalizeFloor(string floor)
        {if(string.IsNullOrEmpty(floor))return "안내";int at=floor.IndexOf('층');return at>=0?floor.Substring(0,at+1):floor;}
        void DrawContacts(RectTransform content,float width)
        {
            var people=game.S.actors.Where(x=>x.met).ToArray();if(people.Length==0){Flow(content,"아직 인사를 나눈 사람이 없습니다.",22,muted);return;}
            foreach(var actor in people)
            {
                var frame=Block(content,166);var photo=Box("Contact portrait",frame).gameObject.AddComponent<RawImage>();photo.texture=art["StandSprites"];photo.raycastTarget=false;
                int col=actor.id=="seoyeon"?1:actor.id=="yeogyeong"?2:3;photo.uvRect=new Rect(col/4f,2f/3f+1f/6f,.25f,1f/6f);At(photo.rectTransform,Vector2.zero,new Vector2(0,1),10,-142,4,4);
                var name=Label(frame,game.Name(actor),26,accent);At(name.rectTransform,Vector2.zero,Vector2.one,164,20,24,0);
                var relation=Label(frame,(actor.named?"이름을 나눈 사이":"아직 이름을 모른다")+"\n"+(actor.tension>=3?"말을 조심스레 고르는 사이":actor.trust>=3?"함께 맡긴 일이 있다":"천천히 알아가는 중"),19,muted);At(relation.rectTransform,Vector2.zero,Vector2.one,164,20,72,0);
            }
        }
        void DrawTitle()
        {
            var tint=Box("Title shade",uiRoot,new Color(.025f,.04f,.07f,.66f));Stretch(tint);
            float left=composition.compact?42:composition.width*.10f;
            var hero=Box("Title copy",uiRoot);Place(hero,new VnBounds(left,180,composition.width-left*2,550));
            var overline=Label(hero,"C A M P U S   /   S U R V I V A L",18,accent);At(overline.rectTransform,new Vector2(0,1),Vector2.one,0,0,0,-42);
            var title=Label(hero,"아직,\n평범한 하루",composition.compact?60:78);At(title.rectTransform,new Vector2(0,1),Vector2.one,0,0,64,-280);
            var tagline=Label(hero,"함께 보낸 시간이, 선택의 이유가 된다.",20,muted);At(tagline.rectTransform,new Vector2(0,1),Vector2.one,0,0,292,-334);
            var options=Box("Title navigation",hero);At(options,Vector2.zero,new Vector2(0,0),0,-Mathf.Min(400,composition.width-100),-192,-20);Column(options,12);
            Button(options,"새 이야기 시작",()=>{game=new CampusEngine(game.World,seed:Environment.TickCount);showTitle=false;page="";reader=new VnReader();error="";dirty=true;Draw();},54);
            if(File.Exists(SavePath(0)))Button(options,"이어하기",()=>Load(0),54);
            Button(options,"저장 불러오기",()=>{page="saves";Draw();},54);Button(options,"설정",()=>{page="settings";Draw();},54);
            Entry(hero,0,0,.5f);
        }
        void DrawSaves()
        {
            var content=MenuShell("기억을 남기는 곳","자동 저장과 세 개의 수동 슬롯 · 이전 저장은 백업 파일로 남습니다.");
            for(int i=0;i<=3;i++)
            {
                int slot=i;bool exists=File.Exists(SavePath(slot));Section(content,slot==0?"AUTO SAVE":"SLOT "+slot.ToString("00"));
                Flow(content,exists?SaveSummary(slot):"아직 남겨둔 이야기가 없습니다.",24,exists?ink:muted);
                if(!showTitle&&slot>0)Button(content,"현재 이야기를 이 슬롯에 저장",()=>Save(slot),54);
                var button=Button(content,exists?"이 이야기 불러오기":"비어 있는 슬롯",()=>Load(slot),54);button.interactable=exists;
            }
        }
        void DrawBacklog()
        {
            var content=MenuShell("지나간 대화","실제로 읽은 문장만 남습니다. 기록 확인에는 시간이 흐르지 않습니다.");
            if(game.S.transcript.Count==0){Flow(content,"아직 끝까지 읽은 문장이 없습니다.",23,muted);return;}
            foreach(var line in game.S.transcript.AsEnumerable().Reverse())
            {Section(content,line.day+"일차  "+CampusEngine.Clock(line.minute));Flow(content,line.text,24);}
        }
        void DrawSettings()
        {
            var content=MenuShell("읽는 속도, 나의 리듬","읽기 설정은 이 컴퓨터에 저장됩니다.");
            Section(content,"대사 표시 속도");Flow(content,"느리게                        빠르게",18,muted);
            var sliderBox=Block(content,44,new Color(.13f,.18f,.22f));var slider=sliderBox.gameObject.AddComponent<Slider>();slider.minValue=18;slider.maxValue=90;
            var fill=Box("Speed fill",sliderBox,accent);Stretch(fill);slider.fillRect=fill;var handle=Box("Speed handle",sliderBox,paper);handle.sizeDelta=new Vector2(12,44);slider.handleRect=handle;slider.targetGraphic=handle.GetComponent<Image>();slider.value=textSpeed;
            slider.onValueChanged.AddListener(value=>{textSpeed=value;SavePreferences();});
            var preview=Block(content,110);var sample=Label(preview,"오늘은 어떤 이야기가 기다리고 있을까.",25);Stretch(sample.rectTransform,22,22,24,12);
            Button(content,reduceMotion?"화면 움직임 줄이기 · 켜짐":"화면 움직임 줄이기 · 꺼짐",()=>{reduceMotion=!reduceMotion;SavePreferences();Draw();});
            Button(content,clickSound?"버튼 효과음 · 켜짐":"버튼 효과음 · 꺼짐",()=>{clickSound=!clickSound;SavePreferences();Draw();});
            Flow(content,"Space/클릭: 문장 완성 → 다음 문장\nAUTO: 문장 사이만 자동 진행, 선택은 직접\nH: UI 숨기기 · Esc: 메뉴",19,muted);
        }
        void PreviewScenario(string scenario)
        {
            if(scenario=="arrival")return;
            if(scenario=="conversation"||scenario=="choices")
            {
                game.S.minute=810;game.S.location="hall";game.S.room="clubs";var p=game.S.actors.First(x=>x.id=="yeogyeong");p.met=p.named=true;p.trust=3;
                game.S.person=p.id;game.S.screen="dialogue";game.S.speaker=p.name;game.S.dialogueStep=1;
                game.S.narrative="빨리 끝내는 것도 좋지만, 나중에 다시 확인해야 하면 더 오래 걸리잖아요.\n이번에는 서로 어디까지 할 수 있는지 먼저 이야기해볼까요?";
            }
            else if(scenario=="phone")game.OpenUtility("phone");
            else if(scenario=="cafe"){game.S.location="cafe";game.S.screen="cafe";}
            Draw();
        }
    }
}
