using System;
using System.Collections.Generic;
using System.Globalization;

namespace CampusSurvival
{
    // Deterministic presentation math shared by the Unity renderer and portable checks.
    public struct VnBounds
    {
        public float x, y, width, height;
        public VnBounds(float x, float y, float width, float height) { this.x=x; this.y=y; this.width=width; this.height=height; }
        public float Right { get { return x+width; } }
        public float Top { get { return y+height; } }
    }
    public sealed class VnComposition
    {
        public float width, height;
        public bool compact;
        public VnBounds dialogue, choices, character, header;
        public static VnComposition Create(float width, float height, float cellAspect)
        {
            width=Math.Max(540,width); height=Math.Max(720,height);
            bool compact=width<1000;
            float margin=compact?22:Math.Min(88,width*.06f);
            float dialogueHeight=compact?256:232;
            float dialogueWidth=width-margin*2;
            float figureHeight=Math.Min(750,height-100),figureWidth=figureHeight*cellAspect;
            float centre=compact?width*.58f:width*.73f;
            return new VnComposition {
                width=width,height=height,compact=compact,
                header=new VnBounds(margin,height-82,width-margin*2,60),
                dialogue=new VnBounds(margin,28,dialogueWidth,dialogueHeight),
                choices=new VnBounds(margin,dialogueHeight+78,Math.Min(dialogueWidth,compact?dialogueWidth:width*.49f),240),
                character=new VnBounds(Math.Max(0,Math.Min(width-figureWidth,centre-figureWidth*.5f)),height-88-figureHeight,figureWidth,figureHeight)
            };
        }
    }
    public sealed class VnReader
    {
        public string Key { get; private set; } = "";
        public string FullText { get; private set; } = "";
        public int Visible { get; private set; }
        public int Count { get { return glyphs.Length; } }
        public bool Complete { get { return Visible>=Count; } }
        public float CompleteSeconds { get; private set; }
        string[] glyphs=new string[0];
        float fraction;
        int cachedVisible=-1;
        string cachedText="";
        public void Set(string key,string text,int restored=0,bool instantly=false)
        {
            if(Key==key && FullText==text)return;
            Key=key;FullText=text??"";var list=new List<string>();
            var iterator=StringInfo.GetTextElementEnumerator(FullText);
            while(iterator.MoveNext())list.Add((string)iterator.Current);
            glyphs=list.ToArray();cachedVisible=-1; Visible=instantly?Count:Math.Max(0,Math.Min(Count,restored));fraction=0;CompleteSeconds=0;
        }
        public void Tick(float seconds,float speed,bool paused)
        {
            if(paused||seconds<=0)return;
            if(Complete){CompleteSeconds+=seconds;return;}
            fraction+=Math.Min(.1f,seconds)*Math.Max(1,speed);
            int add=(int)fraction;fraction-=add;Visible=Math.Min(Count,Visible+add);
        }
        public void Finish(){Visible=Count;fraction=0;CompleteSeconds=0;}
        public string Text { get { if(cachedVisible!=Visible){cachedText=string.Join("",glyphs,0,Visible);cachedVisible=Visible;}return cachedText; } }
        public bool AutoAdvance(bool enabled,bool moreBeats,bool isMinigame)
        { return enabled&&moreBeats&&!isMinigame&&Complete&&CompleteSeconds>=1.05f; }
    }
}
